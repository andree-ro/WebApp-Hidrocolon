// backend/src/models/Venta.js
// Modelo para gestión de ventas del Sistema Hidrocolon

const { pool } = require('../config/database');

class Venta {
    // ============================================================================
    // CREAR NUEVA VENTA
    // ============================================================================
    static async create(ventaData) {
        let connection;
        
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. Generar número de factura automático
            const [lastVenta] = await connection.query(
                `SELECT numero_factura FROM ventas 
                 ORDER BY id DESC LIMIT 1`
            );

            let numeroFactura;
            if (lastVenta.length > 0) {
                // Extraer número y incrementar
                const lastNum = parseInt(lastVenta[0].numero_factura.split('-')[2]);
                const newNum = (lastNum + 1).toString().padStart(4, '0');
                numeroFactura = `VEN-${new Date().getFullYear()}-${newNum}`;
            } else {
                numeroFactura = `VEN-${new Date().getFullYear()}-0001`;
            }

            // 2. Insertar venta (cabecera)
            const [result] = await connection.query(
                `INSERT INTO ventas (
                    numero_factura, turno_id, paciente_id, usuario_vendedor_id,
                    metodo_pago, subtotal, descuento, total,
                    efectivo_recibido, efectivo_cambio,
                    tarjeta_monto, transferencia_monto, deposito_monto,
                    cliente_nombre, cliente_telefono, cliente_nit, cliente_direccion,
                    observaciones
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    numeroFactura,
                    ventaData.turno_id,
                    ventaData.paciente_id || null,
                    ventaData.usuario_vendedor_id,
                    ventaData.metodo_pago,
                    ventaData.subtotal,
                    ventaData.descuento || 0,
                    ventaData.total,
                    ventaData.efectivo_recibido || 0,
                    ventaData.efectivo_cambio || 0,
                    ventaData.tarjeta_monto || 0,
                    ventaData.transferencia_monto || 0,
                    ventaData.deposito_monto || 0,
                    ventaData.cliente_nombre,
                    ventaData.cliente_telefono || null,
                    ventaData.cliente_nit || 'CF',
                    ventaData.cliente_direccion || null,
                    ventaData.observaciones || null
                ]
            );

            const venta_id = result.insertId;

            // 3. Insertar detalle de productos
            for (const item of ventaData.detalle) {
                await connection.query(
                    `INSERT INTO detalle_ventas (
                        venta_id, tipo_producto, producto_id, producto_nombre,
                        cantidad, precio_unitario, precio_total,
                        porcentaje_comision, monto_comision, doctora_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        venta_id,
                        item.tipo_producto,
                        item.producto_id,
                        item.producto_nombre,
                        item.cantidad,
                        item.precio_unitario,
                        item.precio_total,
                        item.porcentaje_comision || 0,
                        item.monto_comision || 0,
                        item.doctora_id || null  // ← NUEVO CAMPO
                    ]
                );

                // 4. Actualizar inventario según tipo de producto
                if (item.tipo_producto === 'medicamento') {
                    await connection.query(
                         `UPDATE medicamentos
                         SET existencias = existencias - ?
                         WHERE id = ?`,
                        [item.cantidad, item.producto_id]
                    );

                    // 5. Registrar movimiento de inventario
                    const [medicamentoActual] = await connection.query(
                        'SELECT existencias FROM medicamentos WHERE id = ?',
                        [item.producto_id]
                    );
                    
                    const stockAnterior = medicamentoActual[0].existencias + item.cantidad;
                    const stockNuevo = medicamentoActual[0].existencias;
                    
                    await connection.query(
                        `INSERT INTO movimientos_inventario 
                         (tipo_producto, producto_id, tipo_movimiento, cantidad_anterior, 
                          cantidad_movimiento, cantidad_nueva, motivo, usuario_id)
                         VALUES ('medicamento', ?, 'salida', ?, ?, ?, ?, ?)`,
                        [
                            item.producto_id,
                            stockAnterior,
                            item.cantidad,
                            stockNuevo,
                            `Venta ${numeroFactura}`,
                            ventaData.usuario_vendedor_id
                        ]
                    );

                    // 6. Descontar extras vinculados si el medicamento los requiere
                    const [medicamento] = await connection.query(
                        `SELECT requiere_extras FROM medicamentos WHERE id = ?`,
                        [item.producto_id]
                    );

                    if (medicamento.length > 0 && medicamento[0].requiere_extras) {
                        const [extras] = await connection.query(
                            `SELECT extra_id, cantidad_requerida 
                             FROM medicamentos_extras 
                             WHERE medicamento_id = ?`,
                            [item.producto_id]
                        );

                        for (const extra of extras) {
                            const cantidadTotal = extra.cantidad_requerida * item.cantidad;
                            await connection.query(
                                `UPDATE extras 
                                 SET existencias = existencias - ? 
                                 WHERE id = ?`,
                                [cantidadTotal, extra.extra_id]
                            );
                        }
                    }
                } else if (item.tipo_producto === 'servicio') {
                    const [servicio] = await connection.query(
                        `SELECT requiere_extras FROM servicios WHERE id = ?`,
                        [item.producto_id]
                    );

                    if (servicio.length > 0 && servicio[0].requiere_extras) {
                        const [extrasServicio] = await connection.query(
                            `SELECT extra_id, cantidad_requerida
                             FROM servicios_extras
                             WHERE servicio_id = ?`,
                            [item.producto_id]
                        );

                        for (const extra of extrasServicio) {
                            const cantidadTotal = extra.cantidad_requerida * item.cantidad;
                            await connection.query(
                                `UPDATE extras
                                 SET existencias = existencias - ?
                                 WHERE id = ?`,
                                [cantidadTotal, extra.extra_id]
                            );
                        }
                    }                    
                }
            }

            // 7. Actualizar totales del turno
            await this.actualizarTotalesTurno(connection, ventaData);

            await connection.commit();

            return {
                success: true,
                venta_id,
                numero_factura: numeroFactura,
                message: 'Venta registrada exitosamente'
            };

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    // ============================================================================
    // ACTUALIZAR TOTALES DEL TURNO
    // ============================================================================
    static async actualizarTotalesTurno(connection, ventaData) {
        const { turno_id, metodo_pago, total, tarjeta_monto, transferencia_monto } = ventaData;

        let updateQuery = '';
        let updateValue = 0;

        switch (metodo_pago) {
            case 'efectivo':
                updateQuery = 'total_ventas_efectivo = total_ventas_efectivo + ?';
                updateValue = total;
                break;
            case 'tarjeta':
                updateQuery = 'total_ventas_tarjeta = total_ventas_tarjeta + ?';
                updateValue = total;
                break;
            case 'transferencia':
                updateQuery = 'total_ventas_transferencia = total_ventas_transferencia + ?';
                updateValue = total;
                break;
            case 'mixto':
                // Para pago mixto, actualizar efectivo y tarjeta
                const efectivoMonto = total - (tarjeta_monto + (transferencia_monto || 0));
                await connection.query(
                    `UPDATE turnos 
                     SET total_ventas_efectivo = total_ventas_efectivo + ?,
                         total_ventas_tarjeta = total_ventas_tarjeta + ?,
                         total_ventas_transferencia = total_ventas_transferencia + ?
                     WHERE id = ?`,
                    [efectivoMonto, tarjeta_monto, transferencia_monto || 0, turno_id]
                );
                return;
        }

        if (updateQuery) {
            await connection.query(
                `UPDATE turnos SET ${updateQuery} WHERE id = ?`,
                [updateValue, turno_id]
            );
        }

        // Actualizar total de comisiones del turno
        const totalComisiones = ventaData.detalle.reduce(
            (sum, item) => sum + (item.monto_comision || 0), 
            0
        );
        
        await connection.query(
            `UPDATE turnos 
             SET total_comisiones = total_comisiones + ? 
             WHERE id = ?`,
            [totalComisiones, turno_id]
        );
    }

    // ============================================================================
    // OBTENER VENTA POR ID
    // ============================================================================
    static async findById(id) {
        try {
            // Obtener cabecera de la venta
            const [ventas] = await pool.execute(
                `SELECT v.*, 
                        u.nombres as vendedor_nombres,
                        u.apellidos as vendedor_apellidos,
                        p.nombres as paciente_nombres,
                        p.apellidos as paciente_apellidos
                 FROM ventas v
                 LEFT JOIN usuarios u ON v.usuario_vendedor_id = u.id
                 LEFT JOIN pacientes p ON v.paciente_id = p.id
                 WHERE v.id = ?`,
                [id]
            );

            if (ventas.length === 0) {
                return null;
            }

            // Obtener detalle de productos con nombre de doctora
            const [detalle] = await pool.execute(
                `SELECT dv.*, d.nombre as doctora_nombre
                 FROM detalle_ventas dv
                 LEFT JOIN doctoras d ON dv.doctora_id = d.id
                 WHERE dv.venta_id = ?`,
                [id]
            );

            return {
                ...ventas[0],
                detalle
            };

        } catch (error) {
            throw error;
        }
    }

    // ============================================================================
    // LISTAR VENTAS CON FILTROS Y PAGINACIÓN
    // ============================================================================
    static async findAll(options = {}) {
        try {
            const page = parseInt(options.page) || 1;
            const limit = parseInt(options.limit) || 20;
            const offset = (page - 1) * limit;

            let whereConditions = ['1=1'];
            let queryParams = [];

            // Filtro por fecha
            if (options.fecha_inicio && options.fecha_fin) {
                whereConditions.push('DATE(v.fecha_creacion) BETWEEN ? AND ?');
                queryParams.push(options.fecha_inicio, options.fecha_fin);
            }

            // Filtro por método de pago
            if (options.metodo_pago) {
                whereConditions.push('v.metodo_pago = ?');
                queryParams.push(options.metodo_pago);
            }

            // Filtro por turno
            if (options.turno_id) {
                whereConditions.push('v.turno_id = ?');
                queryParams.push(parseInt(options.turno_id));
            }

            // Filtro por vendedor
            if (options.vendedor_id) {
                whereConditions.push('v.usuario_vendedor_id = ?');
                queryParams.push(parseInt(options.vendedor_id));
            }

            // Filtro por número de factura
            if (options.numero_factura) {
                whereConditions.push('v.numero_factura LIKE ?');
                queryParams.push(`%${options.numero_factura}%`);
            }

            const whereClause = whereConditions.join(' AND ');

            // Contar total de registros
            const [countResult] = await pool.execute(
                `SELECT COUNT(*) as total FROM ventas v WHERE ${whereClause}`,
                queryParams
            );

            const total = countResult[0].total;

            // Obtener ventas con paginación
            // IMPORTANTE: LIMIT y OFFSET se concatenan directamente (no como parámetros)
            const selectQuery = `
                SELECT v.*,
                    u.nombres as vendedor_nombres,
                    u.apellidos as vendedor_apellidos,
                    p.nombres as paciente_nombres,
                    p.apellidos as paciente_apellidos
                FROM ventas v
                LEFT JOIN usuarios u ON v.usuario_vendedor_id = u.id
                LEFT JOIN pacientes p ON v.paciente_id = p.id
                WHERE ${whereClause}
                ORDER BY v.fecha_creacion DESC
                LIMIT ${limit} OFFSET ${offset}`;
            
            const [ventas] = await pool.execute(selectQuery, queryParams);

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
            console.error('❌ Error en findAll:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER ESTADÍSTICAS DE VENTAS
    // ============================================================================
    static async getEstadisticas(filters = {}) {
        try {
            let whereConditions = ['1=1'];
            let queryParams = [];

            if (filters.fecha_inicio && filters.fecha_fin) {
                whereConditions.push('DATE(fecha_creacion) BETWEEN ? AND ?');
                queryParams.push(filters.fecha_inicio, filters.fecha_fin);
            }

            if (filters.turno_id) {
                whereConditions.push('turno_id = ?');
                queryParams.push(filters.turno_id);
            }

            const whereClause = whereConditions.join(' AND ');

            const [stats] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_ventas,
                    SUM(total) as monto_total,
                    SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as total_efectivo,
                    SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) as total_tarjeta,
                    SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END) as total_transferencia,
                    SUM(CASE WHEN metodo_pago = 'mixto' THEN total ELSE 0 END) as total_mixto,
                    AVG(total) as ticket_promedio
                 FROM ventas
                 WHERE ${whereClause}`,
                queryParams
            );

            return stats[0];

        } catch (error) {
            throw error;
        }
    }

    // ============================================================================
    // ANULAR VENTA (Soft delete con reversa de inventario)
    // ============================================================================
    static async anular(id, usuario_id, motivo) {
        let connection;
        
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. Obtener venta y su detalle
            const venta = await this.findById(id);
            
            if (!venta) {
                throw new Error('Venta no encontrada');
            }

            // 2. Revertir inventario
            for (const item of venta.detalle) {
                if (item.tipo_producto === 'medicamento') {
                    // Primero obtener stock actual para el movimiento
                    const [medicamentoActual] = await connection.query(
                        'SELECT existencias FROM medicamentos WHERE id = ?',
                        [item.producto_id]
                    );
                    
                    const stockAnterior = medicamentoActual[0].existencias;
                    const stockNuevo = stockAnterior + item.cantidad;
                    
                    // Actualizar stock
                    await connection.query(
                        `UPDATE medicamentos 
                        SET existencias = existencias + ? 
                        WHERE id = ?`,
                        [item.cantidad, item.producto_id]
                    );

                    // Registrar movimiento con todos los valores correctos
                    await connection.query(
                        `INSERT INTO movimientos_inventario 
                        (tipo_producto, producto_id, tipo_movimiento, cantidad_anterior, 
                        cantidad_movimiento, cantidad_nueva, motivo, usuario_id)
                        VALUES ('medicamento', ?, 'entrada', ?, ?, ?, ?, ?)`,
                        [
                            item.producto_id,
                            stockAnterior,
                            item.cantidad,
                            stockNuevo,
                            `Anulación venta ${venta.numero_factura}: ${motivo}`,
                            usuario_id
                        ]
                    );
                }
            }

            // 3. Revertir totales del turno
            const updateFields = [];
            const updateValues = [];

            if (venta.metodo_pago === 'efectivo') {
                updateFields.push('total_ventas_efectivo = total_ventas_efectivo - ?');
                updateValues.push(venta.total);
            } else if (venta.metodo_pago === 'tarjeta') {
                updateFields.push('total_ventas_tarjeta = total_ventas_tarjeta - ?');
                updateValues.push(venta.total);
            } else if (venta.metodo_pago === 'transferencia') {
                updateFields.push('total_ventas_transferencia = total_ventas_transferencia - ?');
                updateValues.push(venta.total);
            } else if (venta.metodo_pago === 'mixto') {
                const efectivoMonto = venta.total - (venta.tarjeta_monto + venta.transferencia_monto);
                updateFields.push('total_ventas_efectivo = total_ventas_efectivo - ?');
                updateFields.push('total_ventas_tarjeta = total_ventas_tarjeta - ?');
                updateFields.push('total_ventas_transferencia = total_ventas_transferencia - ?');
                updateValues.push(efectivoMonto, venta.tarjeta_monto, venta.transferencia_monto);
            }

            // Revertir comisiones
            const totalComisiones = venta.detalle.reduce(
                (sum, item) => sum + (parseFloat(item.monto_comision) || 0), 
                0
            );
            updateFields.push('total_comisiones = total_comisiones - ?');
            updateValues.push(totalComisiones);

            if (updateFields.length > 0) {
                updateValues.push(venta.turno_id);
                await connection.query(
                    `UPDATE turnos SET ${updateFields.join(', ')} WHERE id = ?`,
                    updateValues
                );
            }

            // 4. Marcar venta como anulada (agregar campo en observaciones)
            await connection.query(
                `UPDATE ventas 
                SET observaciones = CONCAT(COALESCE(observaciones, ''), ' | ANULADA: ', ?)
                WHERE id = ?`,
                [motivo, id]
            );

            await connection.commit();

            return {
                success: true,
                message: 'Venta anulada exitosamente'
            };

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}

module.exports = Venta;