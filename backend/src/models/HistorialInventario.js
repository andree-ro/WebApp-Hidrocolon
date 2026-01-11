// src/models/HistorialInventario.js
const mysql = require('mysql2/promise');

class HistorialInventario {
    constructor() {
        this.dbConfig = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            charset: 'utf8mb4',
            timezone: 'Z'
        };
    }

    async getConnection() {
        try {
            const connection = await mysql.createConnection(this.dbConfig);
            return connection;
        } catch (error) {
            console.error('❌ Error conectando a la base de datos:', error.message);
            throw new Error('Error de conexión a la base de datos');
        }
    }

    /**
     * Registrar un movimiento de inventario
     */
    async registrarMovimiento(data) {
        const connection = await this.getConnection();
        try {
            console.log('📝 Registrando movimiento de inventario:', data);

            const query = `
                INSERT INTO historial_inventario (
                    tipo_producto,
                    producto_id,
                    producto_nombre,
                    tipo_movimiento,
                    cantidad_anterior,
                    cantidad_movimiento,
                    cantidad_nueva,
                    motivo,
                    detalle,
                    venta_id,
                    proveedor,
                    numero_documento,
                    costo_unitario,
                    usuario_id,
                    fecha_movimiento
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                data.tipo_producto,
                data.producto_id,
                data.producto_nombre,
                data.tipo_movimiento,
                data.cantidad_anterior,
                data.cantidad_movimiento,
                data.cantidad_nueva,
                data.motivo || null,
                data.detalle || null,
                data.venta_id || null,
                data.proveedor || null,
                data.numero_documento || null,
                data.costo_unitario || null,
                data.usuario_id,
                data.fecha_movimiento || new Date()
            ];

            const [result] = await connection.execute(query, params);

            console.log('✅ Movimiento registrado exitosamente, ID:', result.insertId);

            return {
                id: result.insertId,
                ...data
            };
        } catch (error) {
            console.error('❌ Error registrando movimiento:', error);
            throw new Error('Error registrando movimiento en historial');
        } finally {
            await connection.end();
        }
    }

    /**
     * Obtener historial completo con filtros
     */
    async obtenerHistorial(filtros = {}) {
        const connection = await this.getConnection();
        try {
            let query = `
                SELECT 
                    h.*,
                    u.nombres as usuario_nombres,
                    u.apellidos as usuario_apellidos
                FROM historial_inventario h
                LEFT JOIN usuarios u ON h.usuario_id = u.id
                WHERE 1=1
            `;

            const params = [];

            // Filtro por tipo de producto
            if (filtros.tipo_producto) {
                query += ` AND h.tipo_producto = ?`;
                params.push(filtros.tipo_producto);
            }

            // Filtro por producto específico
            if (filtros.producto_id) {
                query += ` AND h.producto_id = ?`;
                params.push(filtros.producto_id);
            }

            // Filtro por tipo de movimiento
            if (filtros.tipo_movimiento) {
                query += ` AND h.tipo_movimiento = ?`;
                params.push(filtros.tipo_movimiento);
            }

            // Filtro por rango de fechas
            if (filtros.fecha_inicio) {
                query += ` AND h.fecha_movimiento >= ?`;
                params.push(filtros.fecha_inicio);
            }

            if (filtros.fecha_fin) {
                query += ` AND h.fecha_movimiento <= ?`;
                params.push(filtros.fecha_fin);
            }

            // Filtro por usuario
            if (filtros.usuario_id) {
                query += ` AND h.usuario_id = ?`;
                params.push(filtros.usuario_id);
            }

            // Filtro por búsqueda de texto
            if (filtros.search && filtros.search.trim()) {
                query += ` AND (h.producto_nombre LIKE ? OR h.motivo LIKE ? OR h.detalle LIKE ?)`;
                const searchParam = `%${filtros.search.trim()}%`;
                params.push(searchParam, searchParam, searchParam);
            }

            // Ordenamiento
            query += ` ORDER BY h.fecha_movimiento DESC, h.id DESC`;

            // Paginación
            if (filtros.limit && filtros.limit > 0) {
                const limitValue = parseInt(filtros.limit);
                const offsetValue = parseInt(filtros.offset) || 0;
                query += ` LIMIT ${offsetValue}, ${limitValue}`;
            }

            console.log('🔍 Consultando historial con filtros:', filtros);

            const [rows] = await connection.execute(query, params);

            console.log(`✅ ${rows.length} registros encontrados en historial`);

            return rows;
        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            throw new Error('Error obteniendo historial de inventario');
        } finally {
            await connection.end();
        }
    }

    /**
     * Obtener historial de un producto específico
     */
    async obtenerHistorialProducto(tipo_producto, producto_id) {
        const connection = await this.getConnection();
        try {
            const query = `
                SELECT 
                    h.*,
                    u.nombres as usuario_nombres,
                    u.apellidos as usuario_apellidos
                FROM historial_inventario h
                LEFT JOIN usuarios u ON h.usuario_id = u.id
                WHERE h.tipo_producto = ? AND h.producto_id = ?
                ORDER BY h.fecha_movimiento DESC, h.id DESC
            `;

            const [rows] = await connection.execute(query, [tipo_producto, producto_id]);

            console.log(`✅ ${rows.length} movimientos encontrados para producto ${producto_id}`);

            return rows;
        } catch (error) {
            console.error('❌ Error obteniendo historial del producto:', error);
            throw new Error('Error obteniendo historial del producto');
        } finally {
            await connection.end();
        }
    }

    /**
     * Obtener estadísticas del historial
     */
    async obtenerEstadisticas(filtros = {}) {
        const connection = await this.getConnection();
        try {
            let whereClause = 'WHERE 1=1';
            const params = [];

            if (filtros.fecha_inicio) {
                whereClause += ` AND fecha_movimiento >= ?`;
                params.push(filtros.fecha_inicio);
            }

            if (filtros.fecha_fin) {
                whereClause += ` AND fecha_movimiento <= ?`;
                params.push(filtros.fecha_fin);
            }

            const query = `
                SELECT 
                    COUNT(*) as total_movimientos,
                    SUM(CASE WHEN tipo_movimiento = 'entrada' THEN 1 ELSE 0 END) as total_entradas,
                    SUM(CASE WHEN tipo_movimiento = 'salida' THEN 1 ELSE 0 END) as total_salidas,
                    SUM(CASE WHEN tipo_movimiento = 'vencimiento' THEN 1 ELSE 0 END) as total_vencimientos,
                    SUM(CASE WHEN tipo_movimiento = 'devolucion' THEN 1 ELSE 0 END) as total_devoluciones,
                    SUM(CASE WHEN tipo_movimiento = 'ajuste' THEN 1 ELSE 0 END) as total_ajustes,
                    SUM(CASE WHEN tipo_movimiento = 'entrada' THEN cantidad_movimiento ELSE 0 END) as unidades_entradas,
                    SUM(CASE WHEN tipo_movimiento IN ('salida', 'vencimiento', 'devolucion') THEN ABS(cantidad_movimiento) ELSE 0 END) as unidades_salidas
                FROM historial_inventario
                ${whereClause}
            `;

            const [stats] = await connection.execute(query, params);

            console.log('📊 Estadísticas calculadas:', stats[0]);

            return stats[0];
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw new Error('Error obteniendo estadísticas del historial');
        } finally {
            await connection.end();
        }
    }
}

// Exportar instancia única
module.exports = new HistorialInventario();