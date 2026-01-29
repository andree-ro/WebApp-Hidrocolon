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

                    // 5. Registrar movimiento en historial de inventario
                    const [medicamentoActual] = await connection.query(
                        'SELECT existencias, nombre FROM medicamentos WHERE id = ?',
                        [item.producto_id]
                    );
                    
                    const stockAnterior = medicamentoActual[0].existencias + item.cantidad;
                    const stockNuevo = medicamentoActual[0].existencias;
                    
                    await connection.query(
                        `INSERT INTO historial_inventario 
                         (tipo_producto, producto_id, producto_nombre, tipo_movimiento, 
                          cantidad_anterior, cantidad_movimiento, cantidad_nueva, 
                          motivo, venta_id, usuario_id, fecha_movimiento)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                        [
                            'medicamento',
                            item.producto_id,
                            medicamentoActual[0].nombre,
                            'salida',
                            stockAnterior,
                            -item.cantidad,  // Negativo porque es salida
                            stockNuevo,
                            `Venta ${numeroFactura}`,
                            venta_id,
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

            // ============================================================================
            // 8. REGISTRAR AUTOMÁTICAMENTE VOUCHERS/TRANSFERENCIAS/DEPÓSITOS
            // ============================================================================
            
            // 8.1 REGISTRAR VOUCHER DE TARJETA (si aplica)
            if ((ventaData.metodo_pago === 'tarjeta' || ventaData.metodo_pago === 'mixto') && 
                ventaData.tarjeta_monto > 0 && 
                ventaData.voucher_numero) {
                
                await connection.query(
                    `INSERT INTO vouchers_tarjeta (turno_id, numero_voucher, paciente_nombre, monto, venta_id)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        ventaData.turno_id,
                        ventaData.voucher_numero.trim(),
                        ventaData.cliente_nombre.trim(),
                        ventaData.tarjeta_monto,
                        venta_id
                    ]
                );
                
                console.log(`✅ Voucher registrado: ${ventaData.voucher_numero} - Q${ventaData.tarjeta_monto}`);
            }

            // 8.2 REGISTRAR TRANSFERENCIA BANCARIA (si aplica)
            if ((ventaData.metodo_pago === 'transferencia' || ventaData.metodo_pago === 'mixto') && 
                ventaData.transferencia_monto > 0 && 
                ventaData.transferencia_numero) {
                
                await connection.query(
                    `INSERT INTO transferencias (turno_id, numero_boleta, paciente_nombre, monto, venta_id)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        ventaData.turno_id,
                        ventaData.transferencia_numero.trim(),
                        ventaData.cliente_nombre.trim(),
                        ventaData.transferencia_monto,
                        venta_id
                    ]
                );
                
                console.log(`✅ Transferencia registrada: ${ventaData.transferencia_numero} - Q${ventaData.transferencia_monto}`);
            }

            // 8.3 REGISTRAR DEPÓSITO BANCARIO (si aplica)
            if ((ventaData.metodo_pago === 'deposito' || ventaData.metodo_pago === 'mixto') && 
                ventaData.deposito_monto > 0 && 
                ventaData.deposito_numero) {
                
                await connection.query(
                    `INSERT INTO depositos (turno_id, numero_deposito, paciente_nombre, monto, venta_id)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        ventaData.turno_id,
                        ventaData.deposito_numero.trim(),
                        ventaData.cliente_nombre.trim(),
                        ventaData.deposito_monto,
                        venta_id
                    ]
                );
                
                console.log(`✅ Depósito registrado: ${ventaData.deposito_numero} - Q${ventaData.deposito_monto}`);
            }

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
        const { turno_id, metodo_pago, total, tarjeta_monto, transferencia_monto, deposito_monto } = ventaData;

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
            case 'deposito':
                updateQuery = 'total_ventas_deposito = total_ventas_deposito + ?';
                updateValue = total;
                break;
            case 'mixto':
                // Para pago mixto, actualizar efectivo, tarjeta, transferencia y deposito
                const efectivoMonto = total - (tarjeta_monto + (transferencia_monto || 0) + (ventaData.deposito_monto || 0));
                await connection.query(
                    `UPDATE turnos 
                     SET total_ventas_efectivo = total_ventas_efectivo + ?,
                         total_ventas_tarjeta = total_ventas_tarjeta + ?,
                         total_ventas_transferencia = total_ventas_transferencia + ?,
                         total_ventas_deposito = total_ventas_deposito + ?
                     WHERE id = ?`,
                    [
                        efectivoMonto, 
                        tarjeta_monto, 
                        transferencia_monto || 0,
                        ventaData.deposito_monto || 0,
                        turno_id
                    ]
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
    // ANULAR VENTA (Soft delete con reversa de inventario Y EXTRAS)
    // ============================================================================
    static async anular(id, usuario_id, motivo, usuario_autorizador_id) {
        let connection;
        
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. Obtener venta y su detalle
            const venta = await this.findById(id);
            
            if (!venta) {
                throw new Error('Venta no encontrada');
            }

            // Validar que la venta no esté ya anulada
            if (venta.observaciones && venta.observaciones.includes('ANULADA:')) {
                throw new Error('Esta venta ya fue anulada anteriormente');
            }

            // 2. Revertir inventario de productos Y sus extras vinculados
            for (const item of venta.detalle) {
                if (item.tipo_producto === 'medicamento') {
                    // 2.1 REVERTIR MEDICAMENTO
                    const [medicamentoActual] = await connection.query(
                        'SELECT existencias, requiere_extras FROM medicamentos WHERE id = ?',
                        [item.producto_id]
                    );
                    
                    if (medicamentoActual.length === 0) {
                        console.warn(`⚠️ Medicamento ID ${item.producto_id} no encontrado`);
                        continue;
                    }

                    const stockAnterior = medicamentoActual[0].existencias;
                    const stockNuevo = stockAnterior + item.cantidad;
                    
                    // Actualizar stock del medicamento
                    await connection.query(
                        `UPDATE medicamentos 
                        SET existencias = existencias + ? 
                        WHERE id = ?`,
                        [item.cantidad, item.producto_id]
                    );

                    // Registrar movimiento de inventario del medicamento
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

                    // 2.2 REVERTIR EXTRAS VINCULADOS AL MEDICAMENTO
                    if (medicamentoActual[0].requiere_extras) {
                        const [extras] = await connection.query(
                            `SELECT extra_id, cantidad_requerida 
                             FROM medicamentos_extras 
                             WHERE medicamento_id = ?`,
                            [item.producto_id]
                        );

                        for (const extra of extras) {
                            const cantidadTotalExtra = extra.cantidad_requerida * item.cantidad;
                            
                            // Obtener stock actual del extra
                            const [extraActual] = await connection.query(
                                'SELECT existencias FROM extras WHERE id = ?',
                                [extra.extra_id]
                            );

                            if (extraActual.length > 0) {
                                const stockAnteriorExtra = extraActual[0].existencias;
                                const stockNuevoExtra = stockAnteriorExtra + cantidadTotalExtra;

                                // Devolver el extra al inventario
                                await connection.query(
                                    `UPDATE extras 
                                     SET existencias = existencias + ? 
                                     WHERE id = ?`,
                                    [cantidadTotalExtra, extra.extra_id]
                                );

                                console.log(`✅ Extra ID ${extra.extra_id}: +${cantidadTotalExtra} unidades (${stockAnteriorExtra} → ${stockNuevoExtra})`);
                            }
                        }
                    }

                } else if (item.tipo_producto === 'servicio') {
                    // 2.3 REVERTIR EXTRAS VINCULADOS AL SERVICIO
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
                            const cantidadTotalExtra = extra.cantidad_requerida * item.cantidad;
                            
                            // Obtener stock actual del extra
                            const [extraActual] = await connection.query(
                                'SELECT existencias FROM extras WHERE id = ?',
                                [extra.extra_id]
                            );

                            if (extraActual.length > 0) {
                                const stockAnteriorExtra = extraActual[0].existencias;
                                const stockNuevoExtra = stockAnteriorExtra + cantidadTotalExtra;

                                // Devolver el extra al inventario
                                await connection.query(
                                    `UPDATE extras
                                     SET existencias = existencias + ?
                                     WHERE id = ?`,
                                    [cantidadTotalExtra, extra.extra_id]
                                );

                                console.log(`✅ Extra ID ${extra.extra_id}: +${cantidadTotalExtra} unidades (${stockAnteriorExtra} → ${stockNuevoExtra})`);
                            }
                        }
                    }
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
            } else if (venta.metodo_pago === 'deposito') {
                updateFields.push('total_ventas_deposito = total_ventas_deposito - ?');
                updateValues.push(venta.total);
            } else if (venta.metodo_pago === 'mixto') {
                const efectivoMonto = venta.efectivo_recibido || 0;
                const tarjetaMonto = venta.tarjeta_monto || 0;
                const transferenciaMonto = venta.transferencia_monto || 0;
                const depositoMonto = venta.deposito_monto || 0;

                if (efectivoMonto > 0) {
                    updateFields.push('total_ventas_efectivo = total_ventas_efectivo - ?');
                    updateValues.push(efectivoMonto);
                }
                if (tarjetaMonto > 0) {
                    updateFields.push('total_ventas_tarjeta = total_ventas_tarjeta - ?');
                    updateValues.push(tarjetaMonto);
                }
                if (transferenciaMonto > 0) {
                    updateFields.push('total_ventas_transferencia = total_ventas_transferencia - ?');
                    updateValues.push(transferenciaMonto);
                }
                if (depositoMonto > 0) {
                    updateFields.push('total_ventas_deposito = total_ventas_deposito - ?');
                    updateValues.push(depositoMonto);
                }
            }

            // Revertir comisiones
            const totalComisiones = venta.detalle.reduce(
                (sum, item) => sum + (parseFloat(item.monto_comision) || 0), 
                0
            );
            
            if (totalComisiones > 0) {
                updateFields.push('total_comisiones = total_comisiones - ?');
                updateValues.push(totalComisiones);
            }

            if (updateFields.length > 0) {
                updateValues.push(venta.turno_id);
                await connection.query(
                    `UPDATE turnos SET ${updateFields.join(', ')} WHERE id = ?`,
                    updateValues
                );
            }

            // ============================================================================
            // 3.5 ELIMINAR VOUCHERS/TRANSFERENCIAS/DEPÓSITOS ASOCIADOS A LA VENTA
            // ============================================================================
            
            // Eliminar vouchers de tarjeta
            const [vouchersEliminados] = await connection.query(
                'DELETE FROM vouchers_tarjeta WHERE venta_id = ?',
                [id]
            );
            if (vouchersEliminados.affectedRows > 0) {
                console.log(`✅ ${vouchersEliminados.affectedRows} voucher(s) de tarjeta eliminado(s)`);
            }

            // Eliminar transferencias bancarias
            const [transferenciasEliminadas] = await connection.query(
                'DELETE FROM transferencias WHERE venta_id = ?',
                [id]
            );
            if (transferenciasEliminadas.affectedRows > 0) {
                console.log(`✅ ${transferenciasEliminadas.affectedRows} transferencia(s) eliminada(s)`);
            }

            // Eliminar depósitos bancarios
            const [depositosEliminados] = await connection.query(
                'DELETE FROM depositos WHERE venta_id = ?',
                [id]
            );
            if (depositosEliminados.affectedRows > 0) {
                console.log(`✅ ${depositosEliminados.affectedRows} depósito(s) eliminado(s)`);
            }

            // ============================================================================
            // 3.6 ELIMINAR REGISTRO EN LIBRO DE BANCOS
            // ============================================================================
            const [libroBancosEliminado] = await connection.query(
                `DELETE FROM libro_bancos 
                 WHERE clasificacion = 'Ventas' 
                 AND descripcion LIKE ?`,
                [`%${venta.numero_factura}%`]
            );
            if (libroBancosEliminado.affectedRows > 0) {
                console.log(`✅ Registro eliminado del libro de bancos`);
                
                // Recalcular saldos desde la operación anterior
                const [operaciones] = await connection.query(`
                    SELECT id, ingreso, egreso
                    FROM libro_bancos
                    ORDER BY fecha ASC, id ASC
                `);
                
                // Obtener saldo inicial
                const [saldoInicial] = await connection.query(`
                    SELECT saldo_inicial FROM saldo_inicial_bancos WHERE activo = 1 LIMIT 1
                `);
                
                let saldoActual = parseFloat(saldoInicial[0].saldo_inicial);
                
                // Recalcular todos los saldos
                for (const operacion of operaciones) {
                    saldoActual = saldoActual + parseFloat(operacion.ingreso) - parseFloat(operacion.egreso);
                    
                    await connection.query(`
                        UPDATE libro_bancos 
                        SET saldo_bancos = ?
                        WHERE id = ?
                    `, [saldoActual, operacion.id]);
                }
                
                console.log(`✅ Saldos recalculados en libro de bancos`);
            }

            // 4. Marcar venta como anulada con información de autorización
            const [autorizador] = await connection.query(
                'SELECT nombres, apellidos FROM usuarios WHERE id = ?',
                [usuario_autorizador_id]
            );

            const nombreAutorizador = autorizador.length > 0 
                ? `${autorizador[0].nombres} ${autorizador[0].apellidos}` 
                : 'Desconocido';

            await connection.query(
                `UPDATE ventas 
                SET observaciones = CONCAT(
                    COALESCE(observaciones, ''), 
                    ' | ANULADA: ', ?, 
                    ' | Autorizado por: ', ?,
                    ' | Fecha: ', NOW()
                )
                WHERE id = ?`,
                [motivo, nombreAutorizador, id]
            );

            await connection.commit();

            console.log(`✅ Venta ${venta.numero_factura} anulada exitosamente`);
            console.log(`   📦 Inventario revertido (medicamentos + extras)`);
            console.log(`   💰 Totales del turno actualizados`);
            console.log(`   👤 Autorizado por: ${nombreAutorizador}`);

            return {
                success: true,
                message: 'Venta anulada exitosamente',
                venta_numero: venta.numero_factura
            };

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('❌ Error anulando venta:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}

module.exports = Venta;