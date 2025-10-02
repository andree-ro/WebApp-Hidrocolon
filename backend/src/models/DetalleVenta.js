// backend/src/models/DetalleVenta.js
// Modelo para gestión de detalle de ventas del Sistema Hidrocolon

const { pool } = require('../config/database');

class DetalleVenta {
    // ============================================================================
    // OBTENER DETALLE POR VENTA_ID
    // ============================================================================
    static async findByVentaId(venta_id) {
        try {
            const [detalle] = await pool.execute(
                `SELECT * FROM detalle_ventas 
                 WHERE venta_id = ?
                 ORDER BY id ASC`,
                [venta_id]
            );

            return detalle;

        } catch (error) {
            throw error;
        }
    }

    // ============================================================================
    // OBTENER PRODUCTOS MÁS VENDIDOS
    // ============================================================================
    static async getProductosMasVendidos(options = {}) {
        try {
            const limit = parseInt(options.limit) || 10;
            let whereConditions = ['1=1'];
            let queryParams = [];

            // Filtro por tipo de producto
            if (options.tipo_producto) {
                whereConditions.push('dv.tipo_producto = ?');
                queryParams.push(options.tipo_producto);
            }

            // Filtro por rango de fechas
            if (options.fecha_inicio && options.fecha_fin) {
                whereConditions.push('DATE(v.fecha_creacion) BETWEEN ? AND ?');
                queryParams.push(options.fecha_inicio, options.fecha_fin);
            }

            const whereClause = whereConditions.join(' AND ');
            queryParams.push(limit);

            const [productos] = await pool.execute(
                `SELECT 
                    dv.producto_id,
                    dv.producto_nombre,
                    dv.tipo_producto,
                    SUM(dv.cantidad) as total_vendido,
                    COUNT(DISTINCT dv.venta_id) as num_ventas,
                    SUM(dv.precio_total) as ingresos_totales,
                    AVG(dv.precio_unitario) as precio_promedio
                 FROM detalle_ventas dv
                 INNER JOIN ventas v ON dv.venta_id = v.id
                 WHERE ${whereClause}
                 GROUP BY dv.producto_id, dv.producto_nombre, dv.tipo_producto
                 ORDER BY total_vendido DESC
                 LIMIT ?`,
                queryParams
            );

            return productos;

        } catch (error) {
            throw error;
        }
    }

    // ============================================================================
    // OBTENER VENTAS DE UN PRODUCTO ESPECÍFICO
    // ============================================================================
    static async getVentasPorProducto(producto_id, tipo_producto, options = {}) {
        try {
            const page = parseInt(options.page) || 1;
            const limit = parseInt(options.limit) || 20;
            const offset = (page - 1) * limit;

            let whereConditions = [
                'dv.producto_id = ?',
                'dv.tipo_producto = ?'
            ];
            let queryParams = [producto_id, tipo_producto];

            // Filtro por rango de fechas
            if (options.fecha_inicio && options.fecha_fin) {
                whereConditions.push('DATE(v.fecha_creacion) BETWEEN ? AND ?');
                queryParams.push(options.fecha_inicio, options.fecha_fin);
            }

            const whereClause = whereConditions.join(' AND ');

            // Contar total
            const [countResult] = await pool.execute(
                `SELECT COUNT(*) as total 
                 FROM detalle_ventas dv
                 INNER JOIN ventas v ON dv.venta_id = v.id
                 WHERE ${whereClause}`,
                queryParams
            );

            const total = countResult[0].total;

            // Obtener ventas
            const [ventas] = await pool.execute(
                `SELECT 
                    v.id,
                    v.numero_factura,
                    v.fecha_creacion,
                    v.total as total_venta,
                    dv.cantidad,
                    dv.precio_unitario,
                    dv.precio_total,
                    u.nombres as vendedor_nombres,
                    u.apellidos as vendedor_apellidos
                 FROM detalle_ventas dv
                 INNER JOIN ventas v ON dv.venta_id = v.id
                 LEFT JOIN usuarios u ON v.usuario_vendedor_id = u.id
                 WHERE ${whereClause}
                 ORDER BY v.fecha_creacion DESC
                 LIMIT ? OFFSET ?`,
                [...queryParams, limit, offset]
            );

            return {
                ventas,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            throw error;
        }
    }

    // ============================================================================
    // OBTENER COMISIONES POR VENDEDOR
    // ============================================================================
    static async getComisionesPorVendedor(options = {}) {
        try {
            let whereConditions = ['1=1'];
            let queryParams = [];

            // Filtro por vendedor específico
            if (options.vendedor_id) {
                whereConditions.push('v.usuario_vendedor_id = ?');
                queryParams.push(options.vendedor_id);
            }

            // Filtro por rango de fechas
            if (options.fecha_inicio && options.fecha_fin) {
                whereConditions.push('DATE(v.fecha_creacion) BETWEEN ? AND ?');
                queryParams.push(options.fecha_inicio, options.fecha_fin);
            }

            // Filtro por turno
            if (options.turno_id) {
                whereConditions.push('v.turno_id = ?');
                queryParams.push(options.turno_id);
            }

            const whereClause = whereConditions.join(' AND ');

            const [comisiones] = await pool.execute(
                `SELECT 
                    v.usuario_vendedor_id,
                    u.nombres as vendedor_nombres,
                    u.apellidos as vendedor_apellidos,
                    COUNT(DISTINCT v.id) as num_ventas,
                    SUM(v.total) as total_vendido,
                    SUM(dv.monto_comision) as total_comisiones
                 FROM ventas v
                 INNER JOIN detalle_ventas dv ON v.id = dv.venta_id
                 LEFT JOIN usuarios u ON v.usuario_vendedor_id = u.id
                 WHERE ${whereClause}
                 GROUP BY v.usuario_vendedor_id, u.nombres, u.apellidos
                 ORDER BY total_comisiones DESC`,
                queryParams
            );

            return comisiones;

        } catch (error) {
            throw error;
        }
    }

    // ============================================================================
    // OBTENER RESUMEN DE VENTAS POR TIPO DE PRODUCTO
    // ============================================================================
    static async getResumenPorTipoProducto(options = {}) {
        try {
            let whereConditions = ['1=1'];
            let queryParams = [];

            // Filtro por rango de fechas
            if (options.fecha_inicio && options.fecha_fin) {
                whereConditions.push('DATE(v.fecha_creacion) BETWEEN ? AND ?');
                queryParams.push(options.fecha_inicio, options.fecha_fin);
            }

            // Filtro por turno
            if (options.turno_id) {
                whereConditions.push('v.turno_id = ?');
                queryParams.push(options.turno_id);
            }

            const whereClause = whereConditions.join(' AND ');

            const [resumen] = await pool.execute(
                `SELECT 
                    dv.tipo_producto,
                    COUNT(DISTINCT dv.producto_id) as productos_unicos,
                    SUM(dv.cantidad) as total_cantidad,
                    SUM(dv.precio_total) as total_ingresos,
                    AVG(dv.precio_unitario) as precio_promedio
                 FROM detalle_ventas dv
                 INNER JOIN ventas v ON dv.venta_id = v.id
                 WHERE ${whereClause}
                 GROUP BY dv.tipo_producto
                 ORDER BY total_ingresos DESC`,
                queryParams
            );

            return resumen;

        } catch (error) {
            throw error;
        }
    }

    // ============================================================================
    // OBTENER HISTORIAL DE COMPRAS DE UN PACIENTE
    // ============================================================================
    static async getHistorialPaciente(paciente_id, options = {}) {
        try {
            const page = parseInt(options.page) || 1;
            const limit = parseInt(options.limit) || 20;
            const offset = (page - 1) * limit;

            // Contar total
            const [countResult] = await pool.execute(
                `SELECT COUNT(DISTINCT v.id) as total 
                 FROM ventas v
                 WHERE v.paciente_id = ?`,
                [paciente_id]
            );

            const total = countResult[0].total;

            // Obtener ventas del paciente con detalle
            const [ventas] = await pool.execute(
                `SELECT 
                    v.id,
                    v.numero_factura,
                    v.fecha_creacion,
                    v.metodo_pago,
                    v.total,
                    GROUP_CONCAT(
                        CONCAT(dv.producto_nombre, ' (x', dv.cantidad, ')')
                        SEPARATOR ', '
                    ) as productos
                 FROM ventas v
                 LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
                 WHERE v.paciente_id = ?
                 GROUP BY v.id
                 ORDER BY v.fecha_creacion DESC
                 LIMIT ? OFFSET ?`,
                [paciente_id, limit, offset]
            );

            // Obtener estadísticas del paciente
            const [stats] = await pool.execute(
                `SELECT 
                    COUNT(DISTINCT v.id) as total_compras,
                    SUM(v.total) as total_gastado,
                    AVG(v.total) as ticket_promedio,
                    MAX(v.fecha_creacion) as ultima_compra
                 FROM ventas v
                 WHERE v.paciente_id = ?`,
                [paciente_id]
            );

            // Productos más comprados por el paciente
            const [productos_favoritos] = await pool.execute(
                `SELECT 
                    dv.producto_nombre,
                    dv.tipo_producto,
                    SUM(dv.cantidad) as total_comprado,
                    COUNT(DISTINCT v.id) as num_compras
                 FROM ventas v
                 INNER JOIN detalle_ventas dv ON v.id = dv.venta_id
                 WHERE v.paciente_id = ?
                 GROUP BY dv.producto_id, dv.producto_nombre, dv.tipo_producto
                 ORDER BY total_comprado DESC
                 LIMIT 5`,
                [paciente_id]
            );

            return {
                ventas,
                estadisticas: stats[0],
                productos_favoritos,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            throw error;
        }
    }
}

module.exports = DetalleVenta;