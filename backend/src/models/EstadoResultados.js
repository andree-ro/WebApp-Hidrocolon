// backend/src/models/EstadoResultados.js
// Modelo para gestión del Estado de Resultados del Sistema Hidrocolon

const { pool } = require('../config/database');

class EstadoResultados {
    // ============================================================================
    // OBTENER ESTADO DE RESULTADOS COMPLETO
    // ============================================================================
    static async obtenerEstadoResultados(fechaInicio, fechaFin) {
        try {
            console.log(`📊 Generando Estado de Resultados: ${fechaInicio} a ${fechaFin}`);

            // 1. INGRESOS
            const ingresos = await this.calcularIngresos(fechaInicio, fechaFin);

            // 2. COSTOS DE OPERACIÓN
            const costosOperacion = await this.calcularCostosOperacion(fechaInicio, fechaFin);

            // 3. GANANCIA BRUTA
            const gananciaBruta = ingresos.total_ingresos - costosOperacion.total_costos;

            // 4. GASTOS DE OPERACIÓN
            const gastosOperacion = await this.calcularGastosOperacion(fechaInicio, fechaFin);

            // 5. GANANCIA/PÉRDIDA EN OPERACIÓN
            const gananciaPerdidaOperacion = gananciaBruta - gastosOperacion.total_gastos;

            // 6. OTROS GASTOS Y PRODUCTOS FINANCIEROS
            const otrosGastos = await this.calcularOtrosGastos(fechaInicio, fechaFin);

            // 7. UTILIDAD DEL EJERCICIO
            const utilidadEjercicio = gananciaPerdidaOperacion - otrosGastos.total_otros_gastos;

            return {
                periodo: {
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin
                },
                ingresos,
                costos_operacion: costosOperacion,
                ganancia_bruta: parseFloat(gananciaBruta.toFixed(2)),
                gastos_operacion: gastosOperacion,
                ganancia_perdida_operacion: parseFloat(gananciaPerdidaOperacion.toFixed(2)),
                otros_gastos: otrosGastos,
                utilidad_ejercicio: parseFloat(utilidadEjercicio.toFixed(2))
            };

        } catch (error) {
            console.error('❌ Error generando estado de resultados:', error);
            throw error;
        }
    }

    // ============================================================================
    // CALCULAR INGRESOS (Ventas + Servicios)
    // ============================================================================
    static async calcularIngresos(fechaInicio, fechaFin) {
        try {
            // VENTAS por doctora (tipo_producto = 'medicamento')
            const [ventas] = await pool.execute(
                `SELECT 
                    COALESCE(d.nombre, 'Clínica') as nombre_doctora,
                    COALESCE(dv.doctora_id, 0) as doctora_id,
                    SUM(dv.precio_total) as total_ventas
                 FROM detalle_ventas dv
                 INNER JOIN ventas v ON dv.venta_id = v.id
                 LEFT JOIN doctoras d ON dv.doctora_id = d.id
                 WHERE dv.tipo_producto = 'medicamento'
                 AND DATE(v.fecha_creacion) BETWEEN ? AND ?
                 AND (v.observaciones IS NULL OR v.observaciones NOT LIKE '%ANULADA:%')
                 GROUP BY dv.doctora_id, d.nombre
                 ORDER BY dv.doctora_id`,
                [fechaInicio, fechaFin]
            );

            // SERVICIOS por doctora (tipo_producto = 'servicio')
            const [servicios] = await pool.execute(
                `SELECT 
                    COALESCE(d.nombre, 'Clínica') as nombre_doctora,
                    COALESCE(dv.doctora_id, 0) as doctora_id,
                    SUM(dv.precio_total) as total_servicios
                 FROM detalle_ventas dv
                 INNER JOIN ventas v ON dv.venta_id = v.id
                 LEFT JOIN doctoras d ON dv.doctora_id = d.id
                 WHERE dv.tipo_producto = 'servicio'
                 AND DATE(v.fecha_creacion) BETWEEN ? AND ?
                 AND (v.observaciones IS NULL OR v.observaciones NOT LIKE '%ANULADA:%')
                 GROUP BY dv.doctora_id, d.nombre
                 ORDER BY dv.doctora_id`,
                [fechaInicio, fechaFin]
            );

            const totalVentas = ventas.reduce((sum, v) => sum + parseFloat(v.total_ventas), 0);
            const totalServicios = servicios.reduce((sum, s) => sum + parseFloat(s.total_servicios), 0);

            return {
                ventas: ventas.map(v => ({
                    doctora_id: v.doctora_id,
                    nombre_doctora: v.nombre_doctora,
                    total: parseFloat(v.total_ventas)
                })),
                total_ventas: parseFloat(totalVentas.toFixed(2)),
                servicios: servicios.map(s => ({
                    doctora_id: s.doctora_id,
                    nombre_doctora: s.nombre_doctora,
                    total: parseFloat(s.total_servicios)
                })),
                total_servicios: parseFloat(totalServicios.toFixed(2)),
                total_ingresos: parseFloat((totalVentas + totalServicios).toFixed(2))
            };

        } catch (error) {
            console.error('❌ Error calculando ingresos:', error);
            throw error;
        }
    }

    // ============================================================================
    // CALCULAR COSTOS DE OPERACIÓN
    // ============================================================================
    static async calcularCostosOperacion(fechaInicio, fechaFin) {
        try {
            // COMISIONES PAGADAS por doctora
            const [comisiones] = await pool.execute(
                `SELECT 
                    d.id as doctora_id,
                    d.nombre as nombre_doctora,
                    SUM(pc.monto_total) as total_comisiones
                 FROM pagos_comisiones pc
                 INNER JOIN doctoras d ON pc.doctora_id = d.id
                 WHERE DATE(pc.fecha_pago) BETWEEN ? AND ?
                 AND pc.estado = 'pagado'
                 GROUP BY d.id, d.nombre
                 ORDER BY d.id`,
                [fechaInicio, fechaFin]
            );

            // GASTOS EN CLÍNICA (de la tabla gastos)
            const [gastosClinica] = await pool.execute(
                `SELECT SUM(monto) as total_gastos_clinica
                 FROM gastos g
                 INNER JOIN turnos t ON g.turno_id = t.id
                 WHERE DATE(g.fecha_creacion) BETWEEN ? AND ?`,
                [fechaInicio, fechaFin]
            );

            // CONCEPTOS MANUALES de tipo 'costo_operacion'
            const [conceptosManuales] = await pool.execute(
                `SELECT id, nombre, monto, tipo
                FROM conceptos_estado_resultados
                WHERE tipo = 'costo_operacion'
                AND periodo_inicio <= ? AND periodo_fin >= ?
                ORDER BY nombre`,
                [fechaFin, fechaInicio]
            );

            const totalComisiones = comisiones.reduce((sum, c) => sum + parseFloat(c.total_comisiones || 0), 0);
            const totalGastosClinica = parseFloat(gastosClinica[0].total_gastos_clinica || 0);
            const totalConceptosManuales = conceptosManuales.reduce((sum, c) => sum + parseFloat(c.monto), 0);

            return {
                comisiones: comisiones.map(c => ({
                    doctora_id: c.doctora_id,
                    nombre_doctora: c.nombre_doctora,
                    total: parseFloat(c.total_comisiones)
                })),
                total_comisiones: parseFloat(totalComisiones.toFixed(2)),
                gastos_clinica: parseFloat(totalGastosClinica.toFixed(2)),
                conceptos_manuales: conceptosManuales.map(c => ({
                    id: c.id,
                    nombre: c.nombre,
                    monto: parseFloat(c.monto),
                    tipo: c.tipo
                })),
                total_conceptos_manuales: parseFloat(totalConceptosManuales.toFixed(2)),
                total_costos: parseFloat((totalComisiones + totalGastosClinica + totalConceptosManuales).toFixed(2))
            };

        } catch (error) {
            console.error('❌ Error calculando costos de operación:', error);
            throw error;
        }
    }

    // ============================================================================
    // CALCULAR GASTOS DE OPERACIÓN (todos manuales)
    // ============================================================================
    static async calcularGastosOperacion(fechaInicio, fechaFin) {
        try {
            const [conceptos] = await pool.execute(
                `SELECT id, nombre, monto, tipo
                FROM conceptos_estado_resultados
                WHERE tipo = 'gasto_operacion'
                AND periodo_inicio <= ? AND periodo_fin >= ?
                ORDER BY nombre`,
                [fechaFin, fechaInicio]
            );

            const totalGastos = conceptos.reduce((sum, c) => sum + parseFloat(c.monto), 0);

            return {
                conceptos: conceptos.map(c => ({
                    id: c.id,
                    nombre: c.nombre,
                    monto: parseFloat(c.monto),
                    tipo: c.tipo
                })),
                total_gastos: parseFloat(totalGastos.toFixed(2))
            };

        } catch (error) {
            console.error('❌ Error calculando gastos de operación:', error);
            throw error;
        }
    }

    // ============================================================================
    // CALCULAR OTROS GASTOS Y PRODUCTOS FINANCIEROS
    // ============================================================================
    static async calcularOtrosGastos(fechaInicio, fechaFin) {
        try {
            // IMPUESTOS (calculado automáticamente basado en ventas por método de pago)
            const [ventasPorMetodo] = await pool.execute(
                `SELECT 
                    SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as total_efectivo,
                    SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) as total_tarjeta,
                    SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END) as total_transferencia,
                    SUM(CASE WHEN metodo_pago = 'deposito' THEN total ELSE 0 END) as total_deposito,
                    SUM(CASE WHEN metodo_pago = 'mixto' THEN efectivo_recibido ELSE 0 END) as total_mixto_efectivo,
                    SUM(CASE WHEN metodo_pago = 'mixto' THEN tarjeta_monto ELSE 0 END) as total_mixto_tarjeta,
                    SUM(CASE WHEN metodo_pago = 'mixto' THEN transferencia_monto ELSE 0 END) as total_mixto_transferencia,
                    SUM(CASE WHEN metodo_pago = 'mixto' THEN deposito_monto ELSE 0 END) as total_mixto_deposito
                 FROM ventas
                 WHERE DATE(fecha_creacion) BETWEEN ? AND ?`,
                [fechaInicio, fechaFin]
            );

            // Calcular totales por método incluyendo mixtos
            const totalesVentas = {
                efectivo: parseFloat(ventasPorMetodo[0].total_efectivo || 0) + parseFloat(ventasPorMetodo[0].total_mixto_efectivo || 0),
                tarjeta: parseFloat(ventasPorMetodo[0].total_tarjeta || 0) + parseFloat(ventasPorMetodo[0].total_mixto_tarjeta || 0),
                transferencia: parseFloat(ventasPorMetodo[0].total_transferencia || 0) + parseFloat(ventasPorMetodo[0].total_mixto_transferencia || 0),
                deposito: parseFloat(ventasPorMetodo[0].total_deposito || 0) + parseFloat(ventasPorMetodo[0].total_mixto_deposito || 0)
            };

            // Calcular impuestos según método de pago
            // EFECTIVO/TRANSFERENCIA/DEPÓSITO: 16% directo
            const impuestoEfectivo = totalesVentas.efectivo * 0.16;
            const impuestoTransferencia = totalesVentas.transferencia * 0.16;
            const impuestoDepositos = totalesVentas.deposito * 0.16;

            // TARJETA: Doble impuesto (6% comisión + 16% sobre restante)
            const comisionBancaria = totalesVentas.tarjeta * 0.06;
            const montoRestante = totalesVentas.tarjeta - comisionBancaria;
            const impuestoSobreRestante = montoRestante * 0.16;
            const impuestoTarjeta = comisionBancaria + impuestoSobreRestante;

            const totalImpuestos = impuestoEfectivo + impuestoTarjeta + impuestoTransferencia + impuestoDepositos;

            // CONCEPTOS MANUALES de tipo 'otro_gasto'
            const [conceptosManuales] = await pool.execute(
                `SELECT id, nombre, monto, tipo
                FROM conceptos_estado_resultados
                WHERE tipo = 'otro_gasto'
                AND periodo_inicio <= ? AND periodo_fin >= ?
                ORDER BY nombre`,
                [fechaFin, fechaInicio]
            );

            const totalConceptosManuales = conceptosManuales.reduce((sum, c) => sum + parseFloat(c.monto), 0);

            return {
                impuestos: parseFloat(totalImpuestos.toFixed(2)),
                detalle_impuestos: {
                    efectivo: parseFloat(impuestoEfectivo.toFixed(2)),
                    tarjeta: parseFloat(impuestoTarjeta.toFixed(2)),
                    tarjeta_detalle: {
                        comision_bancaria: parseFloat(comisionBancaria.toFixed(2)),
                        impuesto_sobre_restante: parseFloat(impuestoSobreRestante.toFixed(2))
                    },
                    transferencia: parseFloat(impuestoTransferencia.toFixed(2)),
                    depositos: parseFloat(impuestoDepositos.toFixed(2))
                },
                conceptos_manuales: conceptosManuales.map(c => ({
                    id: c.id,
                    nombre: c.nombre,
                    monto: parseFloat(c.monto),
                    tipo: c.tipo
                })),
                total_conceptos_manuales: parseFloat(totalConceptosManuales.toFixed(2)),
                total_otros_gastos: parseFloat((totalImpuestos + totalConceptosManuales).toFixed(2))
            };

        } catch (error) {
            console.error('❌ Error calculando otros gastos:', error);
            throw error;
        }
    }
// ============================================================================
    // DETALLE DE VENTAS POR DOCTORA
    // ============================================================================
    static async detalleVentasPorDoctora(fechaInicio, fechaFin, doctoraId) {
        try {
            const esCli = doctoraId == 0;
            const [ventas] = await pool.execute(
                `SELECT 
                    v.id as venta_id,
                    v.fecha_creacion,
                    v.metodo_pago,
                    p.nombres as paciente_nombre,
                    p.apellidos as paciente_apellido,
                    dv.nombre_producto,
                    dv.cantidad,
                    dv.precio_unitario,
                    dv.precio_total
                 FROM detalle_ventas dv
                 INNER JOIN ventas v ON dv.venta_id = v.id
                 LEFT JOIN pacientes p ON v.paciente_id = p.id
                 WHERE dv.tipo_producto = 'medicamento'
                 AND DATE(v.fecha_creacion) BETWEEN ? AND ?
                 AND (v.observaciones IS NULL OR v.observaciones NOT LIKE '%ANULADA:%')
                 AND ${esCli ? 'dv.doctora_id IS NULL' : 'dv.doctora_id = ?'}
                 ORDER BY v.fecha_creacion DESC`,
                esCli ? [fechaInicio, fechaFin] : [fechaInicio, fechaFin, doctoraId]
            );

            const total = ventas.reduce((sum, v) => sum + parseFloat(v.precio_total), 0);

            return {
                ventas: ventas.map(v => ({
                    venta_id: v.venta_id,
                    fecha: v.fecha_creacion,
                    paciente: v.paciente_nombre ? `${v.paciente_nombre} ${v.paciente_apellido}` : 'Sin paciente',
                    producto: v.nombre_producto,
                    cantidad: v.cantidad,
                    precio_unitario: parseFloat(v.precio_unitario),
                    precio_total: parseFloat(v.precio_total),
                    metodo_pago: v.metodo_pago
                })),
                total: parseFloat(total.toFixed(2)),
                cantidad: ventas.length
            };
        } catch (error) {
            console.error('❌ Error obteniendo detalle de ventas:', error);
            throw error;
        }
    }

    // ============================================================================
    // DETALLE DE SERVICIOS POR DOCTORA
    // ============================================================================
    static async detalleServiciosPorDoctora(fechaInicio, fechaFin, doctoraId) {
        try {
            const esCli = doctoraId == 0;
            const [servicios] = await pool.execute(
                `SELECT 
                    v.id as venta_id,
                    v.fecha_creacion,
                    v.metodo_pago,
                    p.nombres as paciente_nombre,
                    p.apellidos as paciente_apellido,
                    dv.nombre_producto,
                    dv.cantidad,
                    dv.precio_unitario,
                    dv.precio_total
                 FROM detalle_ventas dv
                 INNER JOIN ventas v ON dv.venta_id = v.id
                 LEFT JOIN pacientes p ON v.paciente_id = p.id
                 WHERE dv.tipo_producto = 'servicio'
                 AND DATE(v.fecha_creacion) BETWEEN ? AND ?
                 AND (v.observaciones IS NULL OR v.observaciones NOT LIKE '%ANULADA:%')
                 AND ${esCli ? 'dv.doctora_id IS NULL' : 'dv.doctora_id = ?'}
                 ORDER BY v.fecha_creacion DESC`,
                esCli ? [fechaInicio, fechaFin] : [fechaInicio, fechaFin, doctoraId]
            );

            const total = servicios.reduce((sum, s) => sum + parseFloat(s.precio_total), 0);

            return {
                servicios: servicios.map(s => ({
                    venta_id: s.venta_id,
                    fecha: s.fecha_creacion,
                    paciente: s.paciente_nombre ? `${s.paciente_nombre} ${s.paciente_apellido}` : 'Sin paciente',
                    servicio: s.nombre_producto,
                    cantidad: s.cantidad,
                    precio_unitario: parseFloat(s.precio_unitario),
                    precio_total: parseFloat(s.precio_total),
                    metodo_pago: s.metodo_pago
                })),
                total: parseFloat(total.toFixed(2)),
                cantidad: servicios.length
            };
        } catch (error) {
            console.error('❌ Error obteniendo detalle de servicios:', error);
            throw error;
        }
    }

    // ============================================================================
    // DETALLE DE COMISIONES POR DOCTORA
    // ============================================================================
    static async detalleComisionesPorDoctora(fechaInicio, fechaFin, doctoraId) {
        try {
            const [comisiones] = await pool.execute(
                `SELECT 
                    pc.id,
                    pc.fecha_pago,
                    pc.monto_total,
                    pc.periodo_inicio,
                    pc.periodo_fin,
                    pc.observaciones,
                    d.nombre as nombre_doctora
                 FROM pagos_comisiones pc
                 INNER JOIN doctoras d ON pc.doctora_id = d.id
                 WHERE DATE(pc.fecha_pago) BETWEEN ? AND ?
                 AND pc.estado = 'pagado'
                 AND pc.doctora_id = ?
                 ORDER BY pc.fecha_pago DESC`,
                [fechaInicio, fechaFin, doctoraId]
            );

            const total = comisiones.reduce((sum, c) => sum + parseFloat(c.monto_total), 0);

            return {
                comisiones: comisiones.map(c => ({
                    id: c.id,
                    fecha: c.fecha_pago,
                    monto: parseFloat(c.monto_total),
                    periodo_inicio: c.periodo_inicio,
                    periodo_fin: c.periodo_fin,
                    observaciones: c.observaciones,
                    doctora: c.nombre_doctora
                })),
                total: parseFloat(total.toFixed(2)),
                cantidad: comisiones.length
            };
        } catch (error) {
            console.error('❌ Error obteniendo detalle de comisiones:', error);
            throw error;
        }
    }
}

class ConceptoEstadoResultados {
    // ============================================================================
    // CREAR CONCEPTO
    // ============================================================================
    static async crear(datos) {
        try {
            const [result] = await pool.execute(
                `INSERT INTO conceptos_estado_resultados 
                 (tipo, nombre, monto, periodo_inicio, periodo_fin, descripcion, usuario_registro_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    datos.tipo,
                    datos.nombre,
                    datos.monto,
                    datos.periodo_inicio,
                    datos.periodo_fin,
                    datos.descripcion || null,
                    datos.usuario_registro_id
                ]
            );

            console.log(`✅ Concepto creado: ${datos.nombre} - Q${datos.monto}`);

            return {
                success: true,
                id: result.insertId,
                message: 'Concepto creado exitosamente'
            };

        } catch (error) {
            console.error('❌ Error creando concepto:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER CONCEPTO POR ID
    // ============================================================================
    static async obtenerPorId(id) {
        try {
            const [conceptos] = await pool.execute(
                `SELECT c.*, u.nombres, u.apellidos
                 FROM conceptos_estado_resultados c
                 LEFT JOIN usuarios u ON c.usuario_registro_id = u.id
                 WHERE c.id = ?`,
                [id]
            );

            return conceptos.length > 0 ? conceptos[0] : null;

        } catch (error) {
            console.error('❌ Error obteniendo concepto:', error);
            throw error;
        }
    }

    // ============================================================================
    // LISTAR CONCEPTOS
    // ============================================================================
    static async listar(filtros = {}) {
        try {
            let query = `
                SELECT c.*, u.nombres, u.apellidos
                FROM conceptos_estado_resultados c
                LEFT JOIN usuarios u ON c.usuario_registro_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (filtros.tipo) {
                query += ' AND c.tipo = ?';
                params.push(filtros.tipo);
            }

            if (filtros.periodo_inicio && filtros.periodo_fin) {
                query += ' AND c.periodo_inicio <= ? AND c.periodo_fin >= ?';
                params.push(filtros.periodo_fin, filtros.periodo_inicio);
            }

            query += ' ORDER BY c.tipo, c.nombre';

            const [conceptos] = await pool.execute(query, params);

            return conceptos;

        } catch (error) {
            console.error('❌ Error listando conceptos:', error);
            throw error;
        }
    }

    // ============================================================================
    // ACTUALIZAR CONCEPTO
    // ============================================================================
    static async actualizar(id, datos) {
        try {
            const updates = [];
            const params = [];

            if (datos.nombre !== undefined) {
                updates.push('nombre = ?');
                params.push(datos.nombre);
            }
            if (datos.monto !== undefined) {
                updates.push('monto = ?');
                params.push(parseFloat(datos.monto));
            }
            if (datos.descripcion !== undefined) {
                updates.push('descripcion = ?');
                params.push(datos.descripcion);
            }
            if (datos.periodo_inicio !== undefined) {
                updates.push('periodo_inicio = ?');
                params.push(datos.periodo_inicio);
            }
            if (datos.periodo_fin !== undefined) {
                updates.push('periodo_fin = ?');
                params.push(datos.periodo_fin);
            }

            if (updates.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            params.push(id);

            await pool.execute(
                `UPDATE conceptos_estado_resultados SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            console.log(`✅ Concepto ${id} actualizado`);

            return {
                success: true,
                message: 'Concepto actualizado exitosamente'
            };

        } catch (error) {
            console.error('❌ Error actualizando concepto:', error);
            throw error;
        }
    }

    // ============================================================================
    // ELIMINAR CONCEPTO
    // ============================================================================
    static async eliminar(id) {
        try {
            await pool.execute('DELETE FROM conceptos_estado_resultados WHERE id = ?', [id]);

            console.log(`✅ Concepto ${id} eliminado`);

            return {
                success: true,
                message: 'Concepto eliminado exitosamente'
            };

        } catch (error) {
            console.error('❌ Error eliminando concepto:', error);
            throw error;
        }
    }
}

module.exports = { EstadoResultados, ConceptoEstadoResultados };