// backend/src/models/PagoComision.js
const { pool } = require('../config/database');

class PagoComision {
    // ============================================================================
    // OBTENER COMISIONES PENDIENTES POR DOCTORA
    // ============================================================================
    static async obtenerComisionesPendientes(doctoraId, fechaCorte = null) {
        try {
            console.log(`💰 Calculando comisiones pendientes para doctora ID: ${doctoraId}`);

            // Si no se especifica fecha de corte, usar la fecha actual
            const fechaLimite = fechaCorte || new Date().toISOString().split('T')[0];

            // Obtener todas las ventas con comisión de esta doctora que NO han sido pagadas
            const [detalles] = await pool.execute(
                `SELECT 
                    dv.id as detalle_venta_id,
                    dv.venta_id,
                    dv.producto_nombre,
                    dv.cantidad,
                    dv.precio_total as monto_venta,
                    dv.porcentaje_comision,
                    dv.monto_comision,
                    v.fecha_creacion as fecha_venta,
                    v.numero_factura
                FROM detalle_ventas dv
                INNER JOIN ventas v ON dv.venta_id = v.id
                WHERE dv.doctora_id = ?
                AND dv.pago_comision_id IS NULL
                AND DATE(v.fecha_creacion) <= ?
                AND dv.monto_comision > 0
                ORDER BY v.fecha_creacion ASC`,
                [doctoraId, fechaLimite]
            );

            // Calcular totales
            const montoTotal = detalles.reduce((sum, d) => sum + parseFloat(d.monto_comision), 0);
            const cantidadVentas = new Set(detalles.map(d => d.venta_id)).size;

            console.log(`✅ Comisiones pendientes calculadas: Q${montoTotal.toFixed(2)}`);

            return {
                detalles,
                resumen: {
                    doctora_id: doctoraId,
                    fecha_corte: fechaLimite,
                    monto_total: parseFloat(montoTotal.toFixed(2)),
                    cantidad_ventas: cantidadVentas,
                    cantidad_items: detalles.length
                }
            };

        } catch (error) {
            console.error('❌ Error obteniendo comisiones pendientes:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER COMISIONES PENDIENTES DE TODAS LAS DOCTORAS
    // ============================================================================
    static async obtenerTodasComisionesPendientes(fechaCorte = null) {
        try {
            console.log('💰 Obteniendo comisiones pendientes de todas las doctoras...');

            const fechaLimite = fechaCorte || new Date().toISOString().split('T')[0];

            const [doctoras] = await pool.execute(
                `SELECT 
                    d.id,
                    d.nombre,
                    COUNT(DISTINCT dv.venta_id) as cantidad_ventas,
                    COALESCE(SUM(dv.monto_comision), 0) as monto_pendiente,
                    MIN(v.fecha_creacion) as fecha_primera_venta,
                    MAX(v.fecha_creacion) as fecha_ultima_venta
                FROM doctoras d
                LEFT JOIN detalle_ventas dv ON d.id = dv.doctora_id 
                    AND dv.pago_comision_id IS NULL 
                    AND dv.monto_comision > 0
                LEFT JOIN ventas v ON dv.venta_id = v.id 
                    AND DATE(v.fecha_creacion) <= ?
                WHERE d.activo = 1
                GROUP BY d.id, d.nombre
                HAVING monto_pendiente > 0
                ORDER BY monto_pendiente DESC`,
                [fechaLimite]
            );

            console.log(`✅ ${doctoras.length} doctoras con comisiones pendientes`);

            return doctoras.map(d => ({
                doctora_id: d.id,
                doctora_nombre: d.nombre,
                monto_pendiente: parseFloat(d.monto_pendiente),
                cantidad_ventas: d.cantidad_ventas,
                fecha_primera_venta: d.fecha_primera_venta,
                fecha_ultima_venta: d.fecha_ultima_venta
            }));

        } catch (error) {
            console.error('❌ Error obteniendo todas las comisiones pendientes:', error);
            throw error;
        }
    }

    // ============================================================================
    // REGISTRAR PAGO DE COMISIONES
    // ============================================================================
    static async registrarPago(datos) {
        let connection;
        
        try {
            console.log(`💳 Registrando pago de comisiones para doctora ID: ${datos.doctora_id}`);

            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Validaciones
            if (!datos.doctora_id) {
                throw new Error('El ID de la doctora es requerido');
            }
            if (!datos.fecha_corte) {
                throw new Error('La fecha de corte es requerida');
            }
            if (!datos.usuario_registro_id) {
                throw new Error('El ID del usuario es requerido');
            }

            // Obtener comisiones pendientes hasta la fecha de corte
            const comisionesPendientes = await this.obtenerComisionesPendientes(
                datos.doctora_id, 
                datos.fecha_corte
            );

            if (comisionesPendientes.detalles.length === 0) {
                throw new Error('No hay comisiones pendientes para esta doctora');
            }

            const montoTotal = comisionesPendientes.resumen.monto_total;
            const cantidadVentas = comisionesPendientes.resumen.cantidad_ventas;

            // Determinar estado del pago
            let estado = 'pagado';
            if (datos.efectivo_disponible === false) {
                estado = 'acumulado';
            }

            // Insertar registro de pago
            const [resultPago] = await connection.execute(
                `INSERT INTO pagos_comisiones (
                    doctora_id,
                    fecha_corte,
                    fecha_pago,
                    monto_total,
                    cantidad_ventas,
                    efectivo_disponible,
                    estado,
                    observaciones,
                    turno_id,
                    usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    datos.doctora_id,
                    datos.fecha_corte,
                    datos.fecha_pago || new Date().toISOString().split('T')[0],
                    montoTotal,
                    cantidadVentas,
                    datos.efectivo_disponible !== false,
                    estado,
                    datos.observaciones || null,
                    datos.turno_id || null,
                    datos.usuario_registro_id
                ]
            );

            const pagoComisionId = resultPago.insertId;

            // Insertar detalle de cada venta incluida en el pago
            for (const detalle of comisionesPendientes.detalles) {
                await connection.execute(
                    `INSERT INTO detalle_pagos_comisiones (
                        pago_comision_id,
                        venta_id,
                        detalle_venta_id,
                        producto_nombre,
                        cantidad,
                        monto_venta,
                        porcentaje_comision,
                        monto_comision,
                        fecha_venta
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        pagoComisionId,
                        detalle.venta_id,
                        detalle.detalle_venta_id,
                        detalle.producto_nombre,
                        detalle.cantidad,
                        detalle.monto_venta,
                        detalle.porcentaje_comision,
                        detalle.monto_comision,
                        detalle.fecha_venta
                    ]
                );

                // Marcar el detalle de venta como pagado
                await connection.execute(
                    `UPDATE detalle_ventas 
                     SET pago_comision_id = ?
                     WHERE id = ?`,
                    [pagoComisionId, detalle.detalle_venta_id]
                );
            }

            // Si hay turno asociado, actualizar el total de comisiones pagadas
            if (datos.turno_id && estado === 'pagado') {
                await connection.execute(
                    `UPDATE turnos 
                     SET total_comisiones_pagadas = total_comisiones_pagadas + ?
                     WHERE id = ?`,
                    [montoTotal, datos.turno_id]
                );
            }

            await connection.commit();

            console.log(`✅ Pago de comisiones registrado exitosamente (ID: ${pagoComisionId})`);

            // Obtener el pago completo creado
            const pagoCreado = await this.obtenerPorId(pagoComisionId);

            return {
                success: true,
                pago_id: pagoComisionId,
                monto_total: montoTotal,
                cantidad_ventas: cantidadVentas,
                estado: estado,
                data: pagoCreado
            };

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('❌ Error registrando pago de comisiones:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    // ============================================================================
    // OBTENER PAGO POR ID
    // ============================================================================
    static async obtenerPorId(id) {
        try {
            console.log(`🔍 Obteniendo pago de comisión ID: ${id}`);

            const [pagos] = await pool.execute(
                `SELECT 
                    pc.*,
                    d.nombre as doctora_nombre,
                    u.nombres as usuario_nombres,
                    u.apellidos as usuario_apellidos
                FROM pagos_comisiones pc
                INNER JOIN doctoras d ON pc.doctora_id = d.id
                INNER JOIN usuarios u ON pc.usuario_registro_id = u.id
                WHERE pc.id = ?`,
                [id]
            );

            if (pagos.length === 0) {
                return null;
            }

            const pago = pagos[0];

            // Obtener detalle del pago
            const [detalles] = await pool.execute(
                `SELECT * FROM detalle_pagos_comisiones
                 WHERE pago_comision_id = ?
                 ORDER BY fecha_venta ASC`,
                [id]
            );

            pago.detalles = detalles;

            console.log(`✅ Pago obtenido: Q${pago.monto_total}`);

            return pago;

        } catch (error) {
            console.error(`❌ Error obteniendo pago ID ${id}:`, error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER HISTORIAL DE PAGOS
    // ============================================================================
    static async obtenerHistorial(filtros = {}) {
        try {
            console.log('📋 Obteniendo historial de pagos de comisiones...');

            let whereConditions = ['1=1'];
            let queryParams = [];

            // Filtros
            if (filtros.doctora_id) {
                whereConditions.push('pc.doctora_id = ?');
                queryParams.push(filtros.doctora_id);
            }

            if (filtros.estado) {
                whereConditions.push('pc.estado = ?');
                queryParams.push(filtros.estado);
            }

            if (filtros.fecha_inicio && filtros.fecha_fin) {
                whereConditions.push('DATE(pc.fecha_pago) BETWEEN ? AND ?');
                queryParams.push(filtros.fecha_inicio, filtros.fecha_fin);
            }

            if (filtros.turno_id) {
                whereConditions.push('pc.turno_id = ?');
                queryParams.push(filtros.turno_id);
            }

            const whereClause = whereConditions.join(' AND ');

            const [pagos] = await pool.execute(
                `SELECT 
                    pc.*,
                    d.nombre as doctora_nombre,
                    u.nombres as usuario_nombres,
                    u.apellidos as usuario_apellidos
                FROM pagos_comisiones pc
                INNER JOIN doctoras d ON pc.doctora_id = d.id
                INNER JOIN usuarios u ON pc.usuario_registro_id = u.id
                WHERE ${whereClause}
                ORDER BY pc.fecha_pago DESC, pc.id DESC`,
                queryParams
            );

            console.log(`✅ ${pagos.length} pagos encontrados en el historial`);

            return pagos;

        } catch (error) {
            console.error('❌ Error obteniendo historial de pagos:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER ESTADÍSTICAS DE COMISIONES
    // ============================================================================
    static async obtenerEstadisticas(filtros = {}) {
        try {
            console.log('📊 Obteniendo estadísticas de comisiones...');

            let whereConditions = ['1=1'];
            let queryParams = [];

            if (filtros.fecha_inicio && filtros.fecha_fin) {
                whereConditions.push('DATE(pc.fecha_pago) BETWEEN ? AND ?');
                queryParams.push(filtros.fecha_inicio, filtros.fecha_fin);
            }

            const whereClause = whereConditions.join(' AND ');

            const [stats] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_pagos,
                    COUNT(DISTINCT pc.doctora_id) as doctoras_con_pagos,
                    SUM(pc.monto_total) as monto_total_pagado,
                    SUM(CASE WHEN pc.estado = 'pagado' THEN pc.monto_total ELSE 0 END) as monto_efectivo_pagado,
                    SUM(CASE WHEN pc.estado = 'acumulado' THEN pc.monto_total ELSE 0 END) as monto_acumulado,
                    AVG(pc.monto_total) as promedio_por_pago,
                    SUM(pc.cantidad_ventas) as total_ventas_incluidas
                FROM pagos_comisiones pc
                WHERE ${whereClause}`,
                queryParams
            );

            console.log('✅ Estadísticas calculadas');

            return {
                total_pagos: stats[0].total_pagos,
                doctoras_con_pagos: stats[0].doctoras_con_pagos,
                monto_total_pagado: parseFloat(stats[0].monto_total_pagado || 0),
                monto_efectivo_pagado: parseFloat(stats[0].monto_efectivo_pagado || 0),
                monto_acumulado: parseFloat(stats[0].monto_acumulado || 0),
                promedio_por_pago: parseFloat(stats[0].promedio_por_pago || 0),
                total_ventas_incluidas: stats[0].total_ventas_incluidas
            };

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw error;
        }
    }

    // ============================================================================
    // MARCAR PDF COMO GENERADO
    // ============================================================================
    static async marcarPDFGenerado(id, pdfUrl = null) {
        try {
            console.log(`📄 Marcando PDF como generado para pago ID: ${id}`);

            await pool.execute(
                `UPDATE pagos_comisiones 
                 SET pdf_generado = TRUE, 
                     pdf_url = ?,
                     fecha_actualizacion = NOW()
                 WHERE id = ?`,
                [pdfUrl, id]
            );

            console.log('✅ PDF marcado como generado');

            return { success: true };

        } catch (error) {
            console.error('❌ Error marcando PDF como generado:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER DATOS PARA PDF
    // ============================================================================
    static async obtenerDatosParaPDF(id) {
        try {
            console.log(`📄 Obteniendo datos para generar PDF del pago ID: ${id}`);

            const pago = await this.obtenerPorId(id);

            if (!pago) {
                throw new Error('Pago no encontrado');
            }

            // Formatear datos para el PDF
            const datosPDF = {
                // Encabezado
                empresa: 'HIDROCOLON - VIMESA',
                titulo: 'PAGO DE COMISIONES',
                
                // Información del pago
                doctora_nombre: pago.doctora_nombre,
                fecha_pago: pago.fecha_pago,
                fecha_corte: pago.fecha_corte,
                numero_pago: `PC-${String(pago.id).padStart(6, '0')}`,
                
                // Totales
                monto_total: parseFloat(pago.monto_total),
                cantidad_ventas: pago.cantidad_ventas,
                cantidad_items: pago.detalles.length,
                
                // Detalle de ventas
                detalles: pago.detalles.map(d => ({
                    fecha: d.fecha_venta,
                    producto: d.producto_nombre,
                    cantidad: d.cantidad,
                    monto_venta: parseFloat(d.monto_venta),
                    porcentaje: parseFloat(d.porcentaje_comision),
                    comision: parseFloat(d.monto_comision)
                })),
                
                // Información adicional
                estado: pago.estado,
                efectivo_disponible: pago.efectivo_disponible,
                observaciones: pago.observaciones,
                usuario_registro: `${pago.usuario_nombres} ${pago.usuario_apellidos}`
            };

            console.log('✅ Datos para PDF preparados');

            return datosPDF;

        } catch (error) {
            console.error('❌ Error obteniendo datos para PDF:', error);
            throw error;
        }
    }

    // ============================================================================
    // ANULAR PAGO DE COMISIONES
    // ============================================================================
    static async anularPago(id, usuarioId, motivo) {
        let connection;
        
        try {
            console.log(`🗑️ Anulando pago de comisiones ID: ${id}`);

            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Obtener el pago
            const pago = await this.obtenerPorId(id);
            
            if (!pago) {
                throw new Error('Pago no encontrado');
            }

            if (pago.estado === 'anulado') {
                throw new Error('El pago ya está anulado');
            }

            // Desmarcar todos los detalles de venta asociados
            await connection.execute(
                `UPDATE detalle_ventas 
                 SET pago_comision_id = NULL
                 WHERE pago_comision_id = ?`,
                [id]
            );

            // Si el pago estaba asociado a un turno, revertir el monto
            if (pago.turno_id && pago.estado === 'pagado') {
                await connection.execute(
                    `UPDATE turnos 
                     SET total_comisiones_pagadas = total_comisiones_pagadas - ?
                     WHERE id = ?`,
                    [pago.monto_total, pago.turno_id]
                );
            }

            // Marcar el pago como anulado
            await connection.execute(
                `UPDATE pagos_comisiones 
                 SET estado = 'anulado',
                     observaciones = CONCAT(COALESCE(observaciones, ''), ' | ANULADO: ', ?, ' por usuario ID: ', ?),
                     fecha_actualizacion = NOW()
                 WHERE id = ?`,
                [motivo, usuarioId, id]
            );

            await connection.commit();

            console.log('✅ Pago anulado exitosamente');

            return {
                success: true,
                message: 'Pago anulado exitosamente'
            };

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('❌ Error anulando pago:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}

module.exports = PagoComision;