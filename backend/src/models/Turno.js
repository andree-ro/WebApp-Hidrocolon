// backend/src/models/Turno.js
// Modelo completo para gestiÃ³n de turnos del Sistema Hidrocolon
// Incluye: apertura con conteo, cierre con cuadre, validaciones y cÃ¡lculos

const { pool } = require('../config/database');

class Turno {
    
    // ============================================================================
    // ABRIR TURNO COMPLETO (con conteo de billetes y monedas)
    // ============================================================================
    static async abrirCompleto(datos) {
        let connection;
        try {
            connection = await pool.getConnection();
            
            // Validar que no haya un turno abierto
            const [turnoAbierto] = await connection.execute(
                'SELECT id FROM turnos WHERE estado = ? LIMIT 1',
                ['abierto']
            );

            if (turnoAbierto.length > 0) {
                throw new Error('Ya existe un turno abierto. Debe cerrar el turno actual antes de abrir uno nuevo.');
            }

            // Calcular total de billetes
            const totalBilletes = this.calcularTotalBilletes(datos.efectivo_billetes || {});
            
            // Calcular total de monedas
            const totalMonedas = this.calcularTotalMonedas(datos.efectivo_monedas || {});
            
            // Total efectivo inicial
            const efectivoInicialTotal = totalBilletes + totalMonedas;

            // Insertar turno
            const [result] = await connection.execute(
                `INSERT INTO turnos (
                    usuario_id, 
                    efectivo_billetes, 
                    efectivo_monedas,
                    efectivo_inicial,
                    efectivo_inicial_total,
                    estado,
                    fecha_apertura
                ) VALUES (?, ?, ?, ?, ?, 'abierto', NOW())`,
                [
                    datos.usuario_id,
                    JSON.stringify(datos.efectivo_billetes || {}),
                    JSON.stringify(datos.efectivo_monedas || {}),
                    efectivoInicialTotal, // Para compatibilidad con cÃ³digo anterior
                    efectivoInicialTotal
                ]
            );

            console.log(`âœ… Turno ${result.insertId} abierto exitosamente con Q${efectivoInicialTotal.toFixed(2)}`);
            
            return await this.obtenerPorId(result.insertId);

        } catch (error) {
            console.error('âŒ Error abriendo turno:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    // ============================================================================
    // CERRAR TURNO COMPLETO (con cuadre automÃ¡tico)
    // ============================================================================
    static async cerrarCompleto(turnoId, datosCierre) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. Obtener datos del turno
            const turno = await this.obtenerPorId(turnoId);
            if (!turno) {
                throw new Error('Turno no encontrado');
            }

            if (turno.estado === 'cerrado') {
                throw new Error('El turno ya estÃ¡ cerrado');
            }

            // 2. Calcular totales del turno desde ventas
            const totalesVentas = await this.calcularTotalesVentas(turnoId, connection);

            // 3. Obtener totales de registros manuales
            const totalesVouchers = await this.obtenerTotalVouchers(turnoId, connection);
            const totalesTransferencias = await this.obtenerTotalTransferencias(turnoId, connection);
            const totalesGastos = await this.obtenerTotalGastos(turnoId, connection);

            // 4. Calcular efectivo final contado
            const totalBilletesFinal = this.calcularTotalBilletes(datosCierre.efectivo_final_billetes || {});
            const totalMonedasFinal = this.calcularTotalMonedas(datosCierre.efectivo_final_monedas || {});
            const efectivoFinalTotal = totalBilletesFinal + totalMonedasFinal;

            // 5. Calcular impuestos
            const impuestos = this.calcularImpuestos(totalesVentas);

            // 6. Calcular ventas netas
            const ventasNetas = totalesVentas.total - 
                                impuestos.efectivo - 
                                impuestos.tarjeta - 
                                impuestos.transferencia - 
                                impuestos.depositos;

            // 7. Calcular efectivo esperado
            const efectivoEsperado = parseFloat(turno.efectivo_inicial_total) + 
                                    totalesVentas.efectivo - 
                                    totalesGastos - 
                                    (datosCierre.total_comisiones_pagadas || 0);

            // 8. Calcular total a depositar
            // Total a depositar = Ventas netas - Gastos - Comisiones pagadas
            // NO se restan vouchers ni transferencias (son formas de pago, no salidas de dinero)
            const totalADepositar = ventasNetas - 
                                   totalesGastos - 
                                   (datosCierre.total_comisiones_pagadas || 0);

            // 9. Calcular diferencias
            const diferencias = {
                efectivo: efectivoFinalTotal - efectivoEsperado,
                vouchers: totalesVouchers - totalesVentas.tarjeta,
                transferencias: totalesTransferencias - totalesVentas.transferencia
            };

            // 10. Validar si requiere autorizaciÃ³n
            const requiereAutorizacion = Math.abs(diferencias.efectivo) > 0.50 || 
                                        Math.abs(diferencias.vouchers) > 0.50 || 
                                        Math.abs(diferencias.transferencias) > 0.50;

            if (requiereAutorizacion && !datosCierre.autorizado_por) {
                throw new Error('El cierre presenta diferencias y requiere autorizaciÃ³n de un administrador');
            }

            // 11. Actualizar turno con todos los datos
            await connection.execute(
                `UPDATE turnos SET
                    efectivo_final_billetes = ?,
                    efectivo_final_monedas = ?,
                    efectivo_final = ?,
                    efectivo_final_total = ?,
                    venta_total = ?,
                    ventas_efectivo = ?,
                    ventas_tarjeta = ?,
                    ventas_transferencia = ?,
                    total_gastos = ?,
                    total_comisiones_pagadas = ?,
                    total_vouchers = ?,
                    total_transferencias = ?,
                    total_depositos = ?,
                    impuesto_efectivo = ?,
                    impuesto_tarjeta = ?,
                    impuesto_transferencia = ?,
                    impuesto_depositos = ?,
                    ventas_netas = ?,
                    total_a_depositar = ?,
                    efectivo_esperado = ?,
                    diferencia_efectivo = ?,
                    diferencia_vouchers = ?,
                    diferencia_transferencias = ?,
                    requiere_autorizacion = ?,
                    autorizado_por = ?,
                    justificacion_diferencias = ?,
                    fecha_autorizacion = ?,
                    estado = 'cerrado',
                    fecha_cierre = NOW(),
                    observaciones = ?
                WHERE id = ?`,
                [
                    JSON.stringify(datosCierre.efectivo_final_billetes || {}),
                    JSON.stringify(datosCierre.efectivo_final_monedas || {}),
                    efectivoFinalTotal, // Para compatibilidad
                    efectivoFinalTotal,
                    totalesVentas.total,
                    totalesVentas.efectivo,
                    totalesVentas.tarjeta,
                    totalesVentas.transferencia,
                    totalesGastos,
                    datosCierre.total_comisiones_pagadas || 0,
                    totalesVouchers,
                    totalesTransferencias,
                    0, // total_depositos (por implementar)
                    impuestos.efectivo,
                    impuestos.tarjeta,
                    impuestos.transferencia,
                    impuestos.depositos,
                    ventasNetas,
                    totalADepositar,
                    efectivoEsperado,
                    diferencias.efectivo,
                    diferencias.vouchers,
                    diferencias.transferencias,
                    requiereAutorizacion,
                    datosCierre.autorizado_por || null,
                    datosCierre.justificacion_diferencias || null,
                    requiereAutorizacion && datosCierre.autorizado_por ? new Date() : null,
                    datosCierre.observaciones || null,
                    turnoId
                ]
            );

            await connection.commit();

            console.log(`âœ… Turno ${turnoId} cerrado exitosamente`);
            console.log(`   ðŸ’° Efectivo esperado: Q${efectivoEsperado.toFixed(2)}`);
            console.log(`   ðŸ’µ Efectivo contado: Q${efectivoFinalTotal.toFixed(2)}`);
            console.log(`   ðŸ“Š Diferencia: Q${diferencias.efectivo.toFixed(2)}`);

            return await this.obtenerPorId(turnoId);

        } catch (error) {
            if (connection) await connection.rollback();
            console.error('âŒ Error cerrando turno:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    // ============================================================================
    // OBTENER TURNO ACTIVO
    // ============================================================================
    static async obtenerActivo() {
        try {
            const [turnos] = await pool.execute(
                `SELECT t.*, u.nombres, u.apellidos 
                 FROM turnos t
                 INNER JOIN usuarios u ON t.usuario_id = u.id
                 WHERE t.estado = 'abierto'
                 LIMIT 1`
            );

            if (turnos.length === 0) {
                return null;
            }

            return this.formatearTurno(turnos[0]);

        } catch (error) {
            console.error('âŒ Error obteniendo turno activo:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER TURNO POR ID
    // ============================================================================
    static async obtenerPorId(id) {
        try {
            const [turnos] = await pool.execute(
                `SELECT t.*, 
                        u.nombres, u.apellidos,
                        ua.nombres as autorizado_nombres,
                        ua.apellidos as autorizado_apellidos
                 FROM turnos t
                 INNER JOIN usuarios u ON t.usuario_id = u.id
                 LEFT JOIN usuarios ua ON t.autorizado_por = ua.id
                 WHERE t.id = ?`,
                [id]
            );

            if (turnos.length === 0) {
                return null;
            }

            return this.formatearTurno(turnos[0]);

        } catch (error) {
            console.error('âŒ Error obteniendo turno por ID:', error);
            throw error;
        }
    }

    // ============================================================================
    // LISTAR TURNOS CON FILTROS
    // ============================================================================
    static async listar(filtros = {}) {
        try {
            let query = `
                SELECT t.*, 
                       u.nombres, u.apellidos
                FROM turnos t
                INNER JOIN usuarios u ON t.usuario_id = u.id
                WHERE 1=1
            `;
            const params = [];

            // Filtro por estado
            if (filtros.estado) {
                query += ' AND t.estado = ?';
                params.push(filtros.estado);
            }

            // Filtro por fecha
            if (filtros.fecha_inicio && filtros.fecha_fin) {
                query += ' AND DATE(t.fecha_apertura) BETWEEN ? AND ?';
                params.push(filtros.fecha_inicio, filtros.fecha_fin);
            }

            // Filtro por usuario
            if (filtros.usuario_id) {
                query += ' AND t.usuario_id = ?';
                params.push(filtros.usuario_id);
            }

            query += ' ORDER BY t.fecha_apertura DESC';

            // PaginaciÃ³n
            if (filtros.limit) {
                query += ' LIMIT ?';
                params.push(parseInt(filtros.limit));
                
                if (filtros.offset) {
                    query += ' OFFSET ?';
                    params.push(parseInt(filtros.offset));
                }
            }

            const [turnos] = await pool.execute(query, params);

            return turnos.map(t => this.formatearTurno(t));

        } catch (error) {
            console.error('âŒ Error listando turnos:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER RESUMEN DEL TURNO ACTUAL (para dashboard)
    // ============================================================================
    static async obtenerResumen(turnoId) {
        try {
            const turno = await this.obtenerPorId(turnoId);
            if (!turno) {
                throw new Error('Turno no encontrado');
            }

            // Obtener totales en tiempo real
            const totalesVentas = await this.calcularTotalesVentas(turnoId);
            const totalesGastos = await this.obtenerTotalGastos(turnoId);
            const totalesVouchers = await this.obtenerTotalVouchers(turnoId);
            const totalesTransferencias = await this.obtenerTotalTransferencias(turnoId);

            // âœ… OBTENER LISTAS COMPLETAS
            const listaGastos = await this.obtenerListaGastos(turnoId);
            const listaVouchers = await this.obtenerListaVouchers(turnoId);
            const listaTransferencias = await this.obtenerListaTransferencias(turnoId);

            // Calcular impuestos
            const impuestos = this.calcularImpuestos(totalesVentas);

            // Calcular efectivo actual
            const efectivoActual = parseFloat(turno.efectivo_inicial_total) + 
                                totalesVentas.efectivo - 
                                totalesGastos;

            return {
                turno: {
                    id: turno.id,
                    usuario: `${turno.nombres} ${turno.apellidos}`,
                    estado: turno.estado,
                    fecha_apertura: turno.fecha_apertura,
                    efectivo_inicial_total: parseFloat(turno.efectivo_inicial_total),
                    efectivo_actual: efectivoActual
                },
                ventas: {
                    total: totalesVentas.total,
                    efectivo: totalesVentas.efectivo,
                    tarjeta: totalesVentas.tarjeta,
                    transferencia: totalesVentas.transferencia,
                    cantidad: totalesVentas.cantidad
                },
                impuestos: {
                    efectivo: impuestos.efectivo,
                    tarjeta: impuestos.tarjeta,
                    transferencia: impuestos.transferencia,
                    depositos: impuestos.depositos
                },
                gastos: listaGastos,                    // âœ… LISTA COMPLETA
                vouchers: listaVouchers,                // âœ… LISTA COMPLETA
                transferencias: listaTransferencias     // âœ… LISTA COMPLETA
            };

        } catch (error) {
            console.error('âŒ Error obteniendo resumen:', error);
            throw error;
        }
    }

    // ============================================================================
    // CALCULAR TOTALES DE VENTAS DEL TURNO
    // ============================================================================
    static async calcularTotalesVentas(turnoId, connection = null) {
        try {
            const conn = connection || pool;
            
            const [result] = await conn.execute(
                `SELECT 
                    COUNT(*) as cantidad,
                    COALESCE(SUM(total), 0) as total,
                    COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) as efectivo,
                    COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END), 0) as tarjeta,
                    COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) as transferencia,
                    COALESCE(SUM(CASE WHEN metodo_pago = 'mixto' THEN efectivo_recibido ELSE 0 END), 0) as mixto_efectivo,
                    COALESCE(SUM(CASE WHEN metodo_pago = 'mixto' THEN tarjeta_monto ELSE 0 END), 0) as mixto_tarjeta,
                    COALESCE(SUM(CASE WHEN metodo_pago = 'mixto' THEN transferencia_monto ELSE 0 END), 0) as mixto_transferencia
                 FROM ventas
                 WHERE turno_id = ?`,
                [turnoId]
            );

            const totales = result[0];

            // Sumar ventas mixtas a sus respectivos mÃ©todos
            return {
                cantidad: parseInt(totales.cantidad),
                total: parseFloat(totales.total),
                efectivo: parseFloat(totales.efectivo) + parseFloat(totales.mixto_efectivo),
                tarjeta: parseFloat(totales.tarjeta) + parseFloat(totales.mixto_tarjeta),
                transferencia: parseFloat(totales.transferencia) + parseFloat(totales.mixto_transferencia)
            };

        } catch (error) {
            console.error('âŒ Error calculando totales de ventas:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER TOTAL DE VOUCHERS
    // ============================================================================
    static async obtenerTotalVouchers(turnoId, connection = null) {
        try {
            const conn = connection || pool;
            
            const [result] = await conn.execute(
                'SELECT COALESCE(SUM(monto), 0) as total FROM vouchers_tarjeta WHERE turno_id = ?',
                [turnoId]
            );

            return parseFloat(result[0].total);

        } catch (error) {
            console.error('âŒ Error obteniendo total vouchers:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER TOTAL DE TRANSFERENCIAS
    // ============================================================================
    static async obtenerTotalTransferencias(turnoId, connection = null) {
        try {
            const conn = connection || pool;
            
            const [result] = await conn.execute(
                'SELECT COALESCE(SUM(monto), 0) as total FROM transferencias WHERE turno_id = ?',
                [turnoId]
            );

            return parseFloat(result[0].total);

        } catch (error) {
            console.error('âŒ Error obteniendo total transferencias:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER TOTAL DE GASTOS
    // ============================================================================
    static async obtenerTotalGastos(turnoId, connection = null) {
        try {
            const conn = connection || pool;
            
            const [result] = await conn.execute(
                'SELECT COALESCE(SUM(monto), 0) as total FROM gastos WHERE turno_id = ?',
                [turnoId]
            );

            return parseFloat(result[0].total);

        } catch (error) {
            console.error('âŒ Error obteniendo total gastos:', error);
            throw error;
        }
    }





    // ============================================================================
    // OBTENER LISTA DE GASTOS DEL TURNO
    // ============================================================================
    static async obtenerListaGastos(turnoId, connection = null) {
        try {
            const conn = connection || pool;
            
            const [gastos] = await conn.execute(
                `SELECT 
                    id,
                    turno_id,
                    tipo_gasto as categoria,
                    descripcion,
                    monto,
                    fecha_creacion
                FROM gastos
                WHERE turno_id = ?
                ORDER BY fecha_creacion DESC`,
                [turnoId]
            );

            return gastos;

        } catch (error) {
            console.error('âŒ Error obteniendo lista de gastos:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER LISTA DE VOUCHERS DEL TURNO
    // ============================================================================
    static async obtenerListaVouchers(turnoId, connection = null) {
        try {
            const conn = connection || pool;
            
            const [vouchers] = await conn.execute(
                `SELECT 
                    id,
                    turno_id,
                    numero_voucher,
                    paciente_nombre,
                    monto,
                    fecha_creacion
                FROM vouchers_tarjeta
                WHERE turno_id = ?
                ORDER BY fecha_creacion DESC`,
                [turnoId]
            );

            return vouchers;

        } catch (error) {
            console.error('âŒ Error obteniendo lista de vouchers:', error);
            throw error;
        }
    }

    // ============================================================================
    // OBTENER LISTA DE TRANSFERENCIAS DEL TURNO
    // ============================================================================
    static async obtenerListaTransferencias(turnoId, connection = null) {
        try {
            const conn = connection || pool;
            
            const [transferencias] = await conn.execute(
                `SELECT 
                    id,
                    turno_id,
                    numero_boleta,
                    paciente_nombre,
                    monto,
                    fecha_creacion
                FROM transferencias
                WHERE turno_id = ?
                ORDER BY fecha_creacion DESC`,
                [turnoId]
            );

            return transferencias;

        } catch (error) {
            console.error('âŒ Error obteniendo lista de transferencias:', error);
            throw error;
        }
    }






    // ============================================================================
    // CALCULAR IMPUESTOS
    // ============================================================================
    static calcularImpuestos(totalesVentas) {
        // EFECTIVO/TRANSFERENCIA/DEPÃ“SITOS: 16% directo
        const impuestoEfectivo = totalesVentas.efectivo * 0.16;
        const impuestoTransferencia = totalesVentas.transferencia * 0.16;
        
        // TARJETA: Doble impuesto
        // 1. ComisiÃ³n bancaria 6%
        const comisionBancaria = totalesVentas.tarjeta * 0.06;
        // 2. Impuesto 16% sobre el restante (despuÃ©s de comisiÃ³n)
        const montoRestante = totalesVentas.tarjeta - comisionBancaria;
        const impuestoSobreRestante = montoRestante * 0.16;
        // 3. Total impuesto tarjeta = comisiÃ³n + impuesto
        const impuestoTarjeta = comisionBancaria + impuestoSobreRestante;
        
        return {
            efectivo: impuestoEfectivo,
            tarjeta: impuestoTarjeta,
            transferencia: impuestoTransferencia,
            depositos: 0, // Por implementar
            // Detalle para debugging/reportes
            detalle_tarjeta: {
                comision_bancaria: comisionBancaria,
                impuesto_sobre_restante: impuestoSobreRestante,
                total: impuestoTarjeta
            }
        };
    }

    // ============================================================================
    // CALCULAR TOTAL DE BILLETES
    // ============================================================================
    static calcularTotalBilletes(billetes) {
        const denominaciones = {
            '200': 200,
            '100': 100,
            '50': 50,
            '20': 20,
            '10': 10,
            '5': 5,
            '1': 1
        };

        let total = 0;
        for (const [denominacion, cantidad] of Object.entries(billetes)) {
            total += (denominaciones[denominacion] || 0) * (parseInt(cantidad) || 0);
        }

        return total;
    }

    // ============================================================================
    // CALCULAR TOTAL DE MONEDAS
    // ============================================================================
    static calcularTotalMonedas(monedas) {
        const denominaciones = {
            '1': 1.00,
            '0.50': 0.50,
            '0.25': 0.25,
            '0.10': 0.10,
            '0.05': 0.05
        };

        let total = 0;
        for (const [denominacion, cantidad] of Object.entries(monedas)) {
            total += (denominaciones[denominacion] || 0) * (parseInt(cantidad) || 0);
        }

        return total;
    }

    // ============================================================================
    // FORMATEAR TURNO (convertir JSON strings)
    // ============================================================================
    static formatearTurno(turno) {
        return {
            ...turno,
            efectivo_billetes: typeof turno.efectivo_billetes === 'string' 
                ? JSON.parse(turno.efectivo_billetes) 
                : turno.efectivo_billetes,
            efectivo_monedas: typeof turno.efectivo_monedas === 'string'
                ? JSON.parse(turno.efectivo_monedas)
                : turno.efectivo_monedas,
            efectivo_final_billetes: typeof turno.efectivo_final_billetes === 'string'
                ? JSON.parse(turno.efectivo_final_billetes)
                : turno.efectivo_final_billetes,
            efectivo_final_monedas: typeof turno.efectivo_final_monedas === 'string'
                ? JSON.parse(turno.efectivo_final_monedas)
                : turno.efectivo_final_monedas,
            // Convertir a nÃºmeros
            efectivo_inicial_total: parseFloat(turno.efectivo_inicial_total || 0),
            efectivo_final_total: parseFloat(turno.efectivo_final_total || 0),
            venta_total: parseFloat(turno.venta_total || 0),
            ventas_netas: parseFloat(turno.ventas_netas || 0),
            total_a_depositar: parseFloat(turno.total_a_depositar || 0)
        };
    }
}

module.exports = Turno;