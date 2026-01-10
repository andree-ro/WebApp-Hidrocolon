// backend/src/models/PagoComision.js
const { pool } = require('../config/database');

class PagoComision {
    // ============================================================================
    // OBTENER COMISIONES PENDIENTES POR DOCTORA
    // ============================================================================
    static async obtenerComisionesPendientes(doctoraId, fechaCorte = null) {
        try {
            console.log(`ðŸ’° Calculando comisiones pendientes para doctora ID: ${doctoraId}`);

            // Si no se especifica fecha de corte, usar la fecha actual
            const fechaLimite = fechaCorte || new Date().toISOString().split('T')[0];

            // Obtener todas las ventas con comisiÃ³n de esta doctora que NO han sido pagadas
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
            const montoTotal = Math.round(detalles.reduce((sum, d) => sum + parseFloat(d.monto_comision), 0));
            const cantidadVentas = new Set(detalles.map(d => d.venta_id)).size;

            console.log(`âœ… Comisiones pendientes calculadas: Q${montoTotal.toFixed(2)}`);

            return {
                detalles,
                resumen: {
                    doctora_id: doctoraId,
                    fecha_corte: fechaLimite,
                    monto_total: montoTotal,
                    cantidad_ventas: cantidadVentas,
                    cantidad_items: detalles.length
                }
            };

        } catch (error) {
            console.error('âŒ Error obteniendo comisiones pendientes:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER COMISIONES PENDIENTES DE TODAS LAS DOCTORAS
    // ============================================================================
    static async obtenerTodasComisionesPendientes(fechaCorte = null) {
        try {
            console.log('ðŸ’° Obteniendo comisiones pendientes de todas las doctoras...');

            const fechaLimite = fechaCorte || new Date().toISOString().split('T')[0];

            const [doctoras] = await pool.execute(
                `SELECT 
                    d.id,
                    d.nombre,
                    COUNT(DISTINCT dv.venta_id) as cantidad_ventas,
                    COALESCE(SUM(dv.monto_comision), 0) as monto_pendiente,
                    DATE(MIN(CONVERT_TZ(v.fecha_creacion, '+00:00', '-06:00'))) as fecha_primera_venta,
                    DATE(MAX(CONVERT_TZ(v.fecha_creacion, '+00:00', '-06:00'))) as fecha_ultima_venta
                FROM doctoras d
                INNER JOIN detalle_ventas dv ON d.id = dv.doctora_id 
                    AND dv.doctora_id IS NOT NULL 
                    AND dv.pago_comision_id IS NULL 
                    AND dv.monto_comision > 0
                INNER JOIN ventas v ON dv.venta_id = v.id 
                    AND DATE(v.fecha_creacion) <= ?
                WHERE d.activo = 1
                GROUP BY d.id, d.nombre
                HAVING monto_pendiente > 0
                ORDER BY monto_pendiente DESC`,
                [fechaLimite]
            );

            console.log(`âœ… ${doctoras.length} doctoras con comisiones pendientes`);

            return doctoras.map(d => ({
                doctora_id: d.id,
                doctora_nombre: d.nombre,
                monto_pendiente: Math.round(parseFloat(d.monto_pendiente)),
                cantidad_ventas: d.cantidad_ventas,
                fecha_primera_venta: d.fecha_primera_venta,
                fecha_ultima_venta: d.fecha_ultima_venta
            }));

        } catch (error) {
            console.error('âŒ Error obteniendo todas las comisiones pendientes:', error);
            throw error;
        }
    }

    // ============================================================================
    // REGISTRAR PAGO DE COMISIONES
    // ============================================================================
    static async registrarPago(datos) {
        let connection;
        
        try {
            console.log(`ðŸ’³ Registrando pago de comisiones para doctora ID: ${datos.doctora_id}`);

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

            const montoTotal = Math.round(comisionesPendientes.resumen.monto_total);
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

            console.log(`âœ… Pago de comisiones registrado exitosamente (ID: ${pagoComisionId})`);

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
            console.error('âŒ Error registrando pago de comisiones:', error);
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
            console.log(`ðŸ” Obteniendo pago de comisiÃ³n ID: ${id}`);

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

            console.log(`âœ… Pago obtenido: Q${pago.monto_total}`);

            return pago;

        } catch (error) {
            console.error(`âŒ Error obteniendo pago ID ${id}:`, error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER HISTORIAL DE PAGOS
    // ============================================================================
    static async obtenerHistorial(filtros = {}) {
        try {
            console.log('ðŸ“‹ Obteniendo historial de pagos de comisiones...');

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

            console.log(`âœ… ${pagos.length} pagos encontrados en el historial`);

            return pagos;

        } catch (error) {
            console.error('âŒ Error obteniendo historial de pagos:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER ESTADÃSTICAS DE COMISIONES
    // ============================================================================
    static async obtenerEstadisticas(filtros = {}) {
        try {
            console.log('ðŸ“Š Obteniendo estadÃ­sticas de comisiones...');

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

            console.log('âœ… EstadÃ­sticas calculadas');

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
            console.error('âŒ Error obteniendo estadÃ­sticas:', error);
            throw error;
        }
    }

    // ============================================================================
    // MARCAR PDF COMO GENERADO
    // ============================================================================
    static async marcarPDFGenerado(id, pdfUrl = null) {
        try {
            console.log(`ðŸ“„ Marcando PDF como generado para pago ID: ${id}`);

            await pool.execute(
                `UPDATE pagos_comisiones 
                 SET pdf_generado = TRUE, 
                     pdf_url = ?,
                     fecha_actualizacion = NOW()
                 WHERE id = ?`,
                [pdfUrl, id]
            );

            console.log('âœ… PDF marcado como generado');

            return { success: true };

        } catch (error) {
            console.error('âŒ Error marcando PDF como generado:', error);
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

            // Obtener ventas agrupadas por producto
            const [ventasAgrupadas] = await pool.execute(`
                SELECT 
                    dv.producto_id,
                    dv.producto_nombre,
                    dv.tipo_producto,
                    SUM(dv.cantidad) as cantidad_total,
                    AVG(dv.precio_unitario) as precio_promedio,
                    dv.porcentaje_comision as comision_porcentaje,
                    SUM(dv.monto_comision) as total_comision
                FROM detalle_ventas dv
                INNER JOIN detalle_pagos_comisiones pcd ON pcd.detalle_venta_id = dv.id
                WHERE pcd.pago_comision_id = ?
                GROUP BY dv.producto_id, dv.producto_nombre, dv.tipo_producto, dv.porcentaje_comision
                ORDER BY dv.producto_nombre
            `, [id]);

            // ✅ USAR EL RANGO GUARDADO EN LA BD (fecha_inicio y fecha_corte)
            const fechaInicio = pago.fecha_inicio || pago.fecha_corte;
            const fechaFin = pago.fecha_corte;

            console.log('📅 Rango de fechas del pago:', { fechaInicio, fechaFin });

            // Formatear datos para el PDF
            const datosPDF = {
                // IDs
                pago_id: pago.id,
                turno_id: pago.turno_id,
                
                // Información del pago
                doctora_nombre: pago.doctora_nombre,
                fecha_pago: pago.fecha_pago,
                fecha_corte: pago.fecha_corte,
                fecha_inicio: fechaInicio, // ✅ Rango seleccionado por el usuario
                fecha_fin: fechaFin,       // ✅ Rango seleccionado por el usuario
                
                // Totales
                monto_total: parseFloat(pago.monto_total),
                cantidad_ventas: pago.cantidad_ventas,
                
                // Ventas agrupadas (para el PDF)
                ventas_agrupadas: ventasAgrupadas.map(v => ({
                    producto_id: v.producto_id,
                    producto_nombre: v.producto_nombre,
                    tipo_producto: v.tipo_producto,
                    cantidad_total: parseInt(v.cantidad_total),
                    precio_promedio: parseFloat(v.precio_promedio),
                    comision_porcentaje: parseFloat(v.comision_porcentaje),
                    total_comision: parseFloat(v.total_comision)
                })),
                
                // Información adicional
                observaciones: pago.observaciones,
                usuario_registro: `${pago.usuario_nombres} ${pago.usuario_apellidos}`
            };

            console.log('✅ Datos para PDF preparados:', {
                pago_id: datosPDF.pago_id,
                productos: datosPDF.ventas_agrupadas.length,
                monto: datosPDF.monto_total
            });

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
            console.log(`ðŸ—‘ï¸ Anulando pago de comisiones ID: ${id}`);

            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Obtener el pago
            const pago = await this.obtenerPorId(id);
            
            if (!pago) {
                throw new Error('Pago no encontrado');
            }

            if (pago.estado === 'anulado') {
                throw new Error('El pago ya estÃ¡ anulado');
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

            console.log('âœ… Pago anulado exitosamente');

            return {
                success: true,
                message: 'Pago anulado exitosamente'
            };

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('âŒ Error anulando pago:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

// ============================================================================
    // OBTENER VENTAS AGRUPADAS POR DÍA Y PRODUCTO (PARA REPORTE)
    // ============================================================================
    static async obtenerVentasAgrupadasPorDiaYProducto(doctoraId, fechaInicio, fechaFin) {
        try {
            console.log(`📊 Obteniendo ventas agrupadas para doctora ID: ${doctoraId}`);
            console.log(`   Rango: ${fechaInicio} a ${fechaFin}`);

            // Obtener todas las ventas del período
            const [ventas] = await pool.execute(
                `SELECT 
                    dv.producto_nombre,
                    dv.precio_unitario,
                    dv.porcentaje_comision,
                    dv.cantidad,
                    dv.monto_comision,
                    DATE(CONVERT_TZ(v.fecha_creacion, '+00:00', '-06:00')) as fecha_venta,
                    DAYNAME(CONVERT_TZ(v.fecha_creacion, '+00:00', '-06:00')) as dia_semana,
                    DAY(CONVERT_TZ(v.fecha_creacion, '+00:00', '-06:00')) as dia_mes,
                    MONTH(CONVERT_TZ(v.fecha_creacion, '+00:00', '-06:00')) as mes,
                    dv.pago_comision_id
                FROM detalle_ventas dv
                INNER JOIN ventas v ON dv.venta_id = v.id
                WHERE dv.doctora_id = ?
                AND DATE(CONVERT_TZ(v.fecha_creacion, '+00:00', '-06:00')) >= ? 
                AND DATE(CONVERT_TZ(v.fecha_creacion, '+00:00', '-06:00')) <= ?
                AND dv.monto_comision > 0
                AND dv.pago_comision_id IS NULL
                ORDER BY dv.producto_nombre, v.fecha_creacion`,
                [doctoraId, fechaInicio, fechaFin]
            );

            if (ventas.length === 0) {
                return {
                    productos: [],
                    fechas: [],
                    totales: {
                        total_ventas: 0,
                        total_comisiones: 0
                    },
                    tiene_pagos_previos: false
                };
            }

            // Verificar si alguna venta ya fue pagada
            const tiene_pagos_previos = ventas.some(v => v.pago_comision_id !== null);

            // Obtener fechas únicas ordenadas
            const fechasUnicas = [...new Set(ventas.map(v => v.fecha_venta))].sort();
            
            // Agrupar por producto
            const productosMap = new Map();
            
            ventas.forEach(venta => {
                const key = venta.producto_nombre;
                
                if (!productosMap.has(key)) {
                    productosMap.set(key, {
                        nombre: venta.producto_nombre,
                        precio: parseFloat(venta.precio_unitario),
                        porcentaje_comision: parseFloat(venta.porcentaje_comision),
                        ventas_por_dia: {},
                        total_cantidad: 0
                    });
                }
                
                const producto = productosMap.get(key);
                const fechaKey = new Date(venta.fecha_venta).toISOString().split('T')[0];
                
                if (!producto.ventas_por_dia[fechaKey]) {
                    producto.ventas_por_dia[fechaKey] = {
                        cantidad: 0,
                        dia_semana: venta.dia_semana,
                        dia_mes: venta.dia_mes,
                        mes: venta.mes
                    };
                }
                
                producto.ventas_por_dia[fechaKey].cantidad += venta.cantidad;
                producto.total_cantidad += venta.cantidad;
            });

            // Convertir Map a Array y calcular totales
            const productos = Array.from(productosMap.values()).map(prod => {
                const total_ventas = prod.total_cantidad * prod.precio;
                const total_comision = (total_ventas * prod.porcentaje_comision) / 100;
                
                return {
                    ...prod,
                    total_ventas: parseFloat(total_ventas.toFixed(2)),
                    total_comision: parseFloat(total_comision.toFixed(2))
                };
            });

            // Calcular totales generales
            const totales = {
                total_ventas: productos.reduce((sum, p) => sum + p.total_ventas, 0),
                total_comisiones: productos.reduce((sum, p) => sum + p.total_comision, 0)
            };

            console.log(`✅ Ventas agrupadas: ${productos.length} productos, ${fechasUnicas.length} días`);

            return {
                productos,
                fechas: fechasUnicas,
                totales: {
                    total_ventas: parseFloat(totales.total_ventas.toFixed(2)),
                    total_comisiones: parseFloat(totales.total_comisiones.toFixed(2))
                },
                tiene_pagos_previos
            };

        } catch (error) {
            console.error('❌ Error obteniendo ventas agrupadas:', error);
            throw error;
        }
    }

    // ============================================================================
    // VALIDAR SI YA EXISTE UN PAGO EN EL RANGO DE FECHAS
    // ============================================================================
    static async validarPagoDuplicado(doctoraId, fechaInicio, fechaFin) {
        try {
            // Verificar si hay ventas en el rango que ya tienen pago_comision_id
            const [ventasPagadas] = await pool.execute(
                `SELECT 
                    DATE(v.fecha_creacion) as fecha_venta,
                    dv.producto_nombre,
                    dv.monto_comision,
                    pc.id as pago_id,
                    pc.fecha_pago,
                    CONCAT(u.nombres, ' ', u.apellidos) as usuario_registro
                FROM detalle_ventas dv
                INNER JOIN ventas v ON dv.venta_id = v.id
                LEFT JOIN pagos_comisiones pc ON dv.pago_comision_id = pc.id
                LEFT JOIN usuarios u ON pc.usuario_registro_id = u.id
                WHERE dv.doctora_id = ?
                AND DATE(v.fecha_creacion) BETWEEN ? AND ?
                AND dv.pago_comision_id IS NOT NULL
                AND pc.estado != 'anulado'
                ORDER BY v.fecha_creacion ASC
                LIMIT 10`,
                [doctoraId, fechaInicio, fechaFin]
            );

            if (ventasPagadas.length > 0) {
                // Obtener el rango de fechas que ya están pagadas
                const fechasPagadas = ventasPagadas.map(v => v.fecha_venta);
                const primeraFechaPagada = fechasPagadas[0];
                const ultimaFechaPagada = fechasPagadas[fechasPagadas.length - 1];
                
                return {
                    existe_pago: true,
                    pago: ventasPagadas[0],
                    detalles: {
                        cantidad_ventas_pagadas: ventasPagadas.length,
                        primera_fecha_pagada: primeraFechaPagada,
                        ultima_fecha_pagada: ultimaFechaPagada,
                        ventas_pagadas: ventasPagadas
                    },
                    mensaje: `Ya existen ventas pagadas en este rango. Se encontraron ${ventasPagadas.length} ventas pagadas entre ${primeraFechaPagada} y ${ultimaFechaPagada}. Pago ID: ${ventasPagadas[0].pago_id}, registrado el ${ventasPagadas[0].fecha_pago}.`
                };
            }

            return {
                existe_pago: false,
                pago: null,
                mensaje: 'No hay ventas pagadas en este rango'
            };

        } catch (error) {
            console.error('❌ Error validando pago duplicado:', error);
            throw error;
        }
    }

    


// ============================================================================
    // REGISTRAR PAGO CON RANGO DE FECHAS (NUEVO FORMATO)
    // ============================================================================
    static async registrarPagoConRango(datos) {
        let connection;
        
        try {
            console.log(`💳 Registrando pago de comisiones con rango de fechas`);
            console.log(`   Doctora ID: ${datos.doctora_id}`);
            console.log(`   Rango: ${datos.fecha_inicio} a ${datos.fecha_fin}`);

            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Validaciones
            if (!datos.doctora_id) throw new Error('El ID de la doctora es requerido');
            if (!datos.fecha_inicio) throw new Error('La fecha de inicio es requerida');
            if (!datos.fecha_fin) throw new Error('La fecha de fin es requerida');
            if (!datos.usuario_registro_id) throw new Error('El ID del usuario es requerido');

            // Validar que no exista un pago previo (a menos que tenga autorización)
            if (!datos.autorizado_por_admin) {
                const validacion = await this.validarPagoDuplicado(
                    datos.doctora_id,
                    datos.fecha_inicio,
                    datos.fecha_fin
                );

                if (validacion.existe_pago) {
                    throw new Error(
                        `Ya existe un pago registrado para este período. ` +
                        `Pago ID: ${validacion.pago.id}, Fecha: ${validacion.pago.fecha_pago}. ` +
                        `Se requiere autorización de administrador.`
                    );
                }
            }

            // Obtener ventas agrupadas
            const ventasAgrupadas = await this.obtenerVentasAgrupadasPorDiaYProducto(
                datos.doctora_id,
                datos.fecha_inicio,
                datos.fecha_fin
            );

            if (ventasAgrupadas.productos.length === 0) {
                throw new Error('No hay ventas en el rango de fechas seleccionado');
            }

            const montoTotal = ventasAgrupadas.totales.total_comisiones;

            // Insertar registro de pago
            const [resultPago] = await connection.execute(
                `INSERT INTO pagos_comisiones (
                    doctora_id,
                    fecha_inicio,
                    fecha_corte,
                    fecha_pago,
                    monto_total,
                    cantidad_ventas,
                    efectivo_disponible,
                    estado,
                    observaciones,
                    turno_id,
                    usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    datos.doctora_id,
                    datos.fecha_inicio, // ← NUEVO: fecha de inicio del rango
                    datos.fecha_fin, // fecha_corte es el fin del rango
                    new Date().toISOString().split('T')[0], // fecha_pago es hoy
                    montoTotal,
                    ventasAgrupadas.productos.reduce((sum, p) => sum + p.total_cantidad, 0),
                    true, // siempre es true porque se paga inmediatamente
                    'pagado',
                    datos.observaciones || null, // ← CAMBIADO: ya no genera observación automática
                    datos.turno_id || null,
                    datos.usuario_registro_id
                ]
            );

            const pagoComisionId = resultPago.insertId;

            // ✅ INSERTAR DETALLES EN detalle_pagos_comisiones
            console.log('📝 Insertando detalles en detalle_pagos_comisiones...');
            
            const [detallesVentas] = await connection.execute(
                `SELECT 
                    dv.id as detalle_venta_id,
                    dv.venta_id,
                    v.fecha_creacion as fecha_venta,
                    dv.producto_nombre,
                    dv.cantidad,
                    dv.precio_total as monto_venta,
                    dv.porcentaje_comision,
                    dv.monto_comision
                FROM detalle_ventas dv
                INNER JOIN ventas v ON dv.venta_id = v.id
                WHERE dv.doctora_id = ?
                AND DATE(CONVERT_TZ(v.fecha_creacion, '+00:00', '-06:00')) >= ? 
                AND DATE(CONVERT_TZ(v.fecha_creacion, '+00:00', '-06:00')) <= ?
                AND dv.monto_comision > 0
                AND dv.pago_comision_id IS NULL`,
                [datos.doctora_id, datos.fecha_inicio, datos.fecha_fin]
            );

            console.log(`📝 ${detallesVentas.length} detalles encontrados para insertar`);

            // Insertar cada detalle
            for (const detalle of detallesVentas) {
                await connection.execute(
                    `INSERT INTO detalle_pagos_comisiones (
                        pago_comision_id,
                        detalle_venta_id,
                        venta_id,
                        fecha_venta,
                        producto_nombre,
                        cantidad,
                        monto_venta,
                        porcentaje_comision,
                        monto_comision
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        pagoComisionId,
                        detalle.detalle_venta_id,
                        detalle.venta_id,
                        detalle.fecha_venta,
                        detalle.producto_nombre,
                        detalle.cantidad,
                        detalle.monto_venta,
                        detalle.porcentaje_comision,
                        detalle.monto_comision
                    ]
                );
            }

            console.log(`✅ ${detallesVentas.length} detalles insertados en detalle_pagos_comisiones`);

            // Marcar todas las ventas como pagadas
            await connection.execute(
                `UPDATE detalle_ventas dv
                INNER JOIN ventas v ON dv.venta_id = v.id
                SET dv.pago_comision_id = ?
                WHERE dv.doctora_id = ?
                AND DATE(CONVERT_TZ(v.fecha_creacion, '+00:00', '-06:00')) >= ? 
                AND DATE(CONVERT_TZ(v.fecha_creacion, '+00:00', '-06:00')) <= ?
                AND dv.monto_comision > 0
                AND dv.pago_comision_id IS NULL`,
                [pagoComisionId, datos.doctora_id, datos.fecha_inicio, datos.fecha_fin]
            );

            // Si hay turno asociado, actualizar totales
            if (datos.turno_id) {
                await connection.execute(
                    `UPDATE turnos 
                    SET total_comisiones_pagadas = total_comisiones_pagadas + ?
                    WHERE id = ?`,
                    [montoTotal, datos.turno_id]
                );
            }

            await connection.commit();

            console.log(`✅ Pago registrado exitosamente - ID: ${pagoComisionId}`);

            return {
                pago_id: pagoComisionId,
                monto_total: montoTotal,
                fecha_inicio: datos.fecha_inicio,
                fecha_fin: datos.fecha_fin,
                ventas_agrupadas: ventasAgrupadas
            };

        } catch (error) {
            if (connection) await connection.rollback();
            console.error('❌ Error registrando pago con rango:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }
}

module.exports = PagoComision;