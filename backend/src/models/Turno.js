// backend/src/models/Turno.js
// Modelo completo para gestiÃƒÂ³n de turnos del Sistema Hidrocolon
// Incluye: apertura con conteo, cierre con cuadre, validaciones y cÃƒÂ¡lculos

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
                    efectivoInicialTotal, // Para compatibilidad con cÃƒÂ³digo anterior
                    efectivoInicialTotal
                ]
            );

            console.log(`Ã¢Å“â€¦ Turno ${result.insertId} abierto exitosamente con Q${efectivoInicialTotal.toFixed(2)}`);
            
            return await this.obtenerPorId(result.insertId);

        } catch (error) {
            console.error('Ã¢ÂÅ’ Error abriendo turno:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    // ============================================================================
    // CERRAR TURNO COMPLETO (con cuadre automÃƒÂ¡tico)
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
                throw new Error('El turno ya estÃƒÂ¡ cerrado');
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
                        parseFloat(turno.total_comisiones_pagadas || 0);

            // 8. Calcular total a depositar
            // Total a depositar = Total Real - Ingresos Tarjeta - Gastos - Comisiones
            const totalADepositar = totalesVentas.total - 
                       totalesVentas.tarjeta - 
                       totalesGastos - 
                       parseFloat(turno.total_comisiones_pagadas || 0);

            // 9. Calcular diferencias
            const diferencias = {
                efectivo: efectivoFinalTotal - efectivoEsperado,
                vouchers: totalesVouchers - totalesVentas.tarjeta,
                transferencias: totalesTransferencias - totalesVentas.transferencia
            };

            // 10. Validar si requiere autorizaciÃƒÂ³n
            const requiereAutorizacion = Math.abs(diferencias.efectivo) > 0.50 || 
                                        Math.abs(diferencias.vouchers) > 0.50 || 
                                        Math.abs(diferencias.transferencias) > 0.50;

            if (requiereAutorizacion && !datosCierre.autorizado_por) {
                throw new Error('El cierre presenta diferencias y requiere autorizaciÃƒÂ³n de un administrador');
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
                    parseFloat(turno.total_comisiones_pagadas || 0),
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

            console.log(`Turno ${turnoId} cerrado exitosamente`);
            console.log(`   Efectivo esperado: Q${efectivoEsperado.toFixed(2)}`);
            console.log(`   Efectivo contado: Q${efectivoFinalTotal.toFixed(2)}`);
            console.log(`   Diferencia: Q${diferencias.efectivo.toFixed(2)}`);

            return await this.obtenerPorId(turnoId);

        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error cerrando turno:', error);
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
            console.error('Ã¢ÂÅ’ Error obteniendo turno activo:', error);
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
            console.error('Ã¢ÂÅ’ Error obteniendo turno por ID:', error);
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

            // PaginaciÃƒÂ³n
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
            console.error('Ã¢ÂÅ’ Error listando turnos:', error);
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

            // ✅ Usar el campo total_comisiones_pagadas del turno (ya está actualizado)
            const totalComisionesPagadas = parseFloat(turno.total_comisiones_pagadas || 0);

            // OBTENER LISTAS COMPLETAS
            const listaGastos = await this.obtenerListaGastos(turnoId);
            const listaVouchers = await this.obtenerListaVouchers(turnoId);
            const listaTransferencias = await this.obtenerListaTransferencias(turnoId);
            const listaDepositos = await this.obtenerListaDepositos(turnoId);

            // Calcular impuestos
            const impuestos = this.calcularImpuestos(totalesVentas);

            // Calcular efectivo actual
            const efectivoActual = parseFloat(turno.efectivo_inicial_total) + 
                                totalesVentas.efectivo - 
                                totalesGastos -
                                totalComisionesPagadas;

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
                    deposito: totalesVentas.deposito,
                    cantidad: totalesVentas.cantidad
                },
                comision_bancaria: impuestos.detalle_tarjeta.comision_bancaria,
                impuestos: {
                    efectivo: impuestos.efectivo,
                    tarjeta: impuestos.detalle_tarjeta.impuesto_sobre_restante,
                    transferencia: impuestos.transferencia,
                    depositos: impuestos.depositos
                },
                gastos: listaGastos,                    // Ã¢Å“â€¦ LISTA COMPLETA
                vouchers: listaVouchers,                // Ã¢Å“â€¦ LISTA COMPLETA
                transferencias: listaTransferencias,     // Ã¢Å“â€¦ LISTA COMPLETA
                depositos: listaDepositos,              // ✅ LISTA COMPLETA
                total_depositos: await this.obtenerTotalDepositos(turnoId),
                ventas_deposito: totalesVentas.deposito,
                total_comisiones_pagadas: totalComisionesPagadas
            };

        } catch (error) {
            console.error('Ã¢ÂÅ’ Error obteniendo resumen:', error);
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
                    COALESCE(SUM(CASE WHEN metodo_pago = 'mixto' THEN (efectivo_recibido - efectivo_cambio) ELSE 0 END), 0) as mixto_efectivo,
                    COALESCE(SUM(CASE WHEN metodo_pago = 'mixto' THEN tarjeta_monto ELSE 0 END), 0) as mixto_tarjeta,
                    COALESCE(SUM(CASE WHEN metodo_pago = 'mixto' THEN transferencia_monto ELSE 0 END), 0) as mixto_transferencia,
                    COALESCE(SUM(CASE WHEN metodo_pago = 'deposito' THEN total ELSE 0 END), 0) as deposito,
                    COALESCE(SUM(CASE WHEN metodo_pago = 'mixto' THEN deposito_monto ELSE 0 END), 0) as mixto_deposito
                 FROM ventas
                 WHERE turno_id = ? 
                 AND (observaciones IS NULL OR observaciones NOT LIKE '%ANULADA:%')`,
                [turnoId]
            );

            const totales = result[0];

            // Sumar ventas mixtas a sus respectivos mÃƒÂ©todos
            return {
                cantidad: parseInt(totales.cantidad),
                total: parseFloat(totales.total),
                efectivo: parseFloat(totales.efectivo) + parseFloat(totales.mixto_efectivo),
                tarjeta: parseFloat(totales.tarjeta) + parseFloat(totales.mixto_tarjeta),
                transferencia: parseFloat(totales.transferencia) + parseFloat(totales.mixto_transferencia),
                deposito: parseFloat(totales.deposito) + parseFloat(totales.mixto_deposito)
            };

        } catch (error) {
            console.error('Ã¢ÂÅ’ Error calculando totales de ventas:', error);
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
            console.error('Ã¢ÂÅ’ Error obteniendo total vouchers:', error);
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
            console.error('Ã¢ÂÅ’ Error obteniendo total transferencias:', error);
            throw error;
        }
    }


    // ============================================================================
    // OBTENER TOTAL DE DEPÓSITOS
    // ============================================================================
    static async obtenerTotalDepositos(turnoId, connection = null) {
        try {
            const conn = connection || pool;
            
            const [result] = await conn.execute(
                'SELECT COALESCE(SUM(monto), 0) as total FROM depositos WHERE turno_id = ?',
                [turnoId]
            );

            return parseFloat(result[0].total);

        } catch (error) {
            console.error('❌ Error obteniendo total depósitos:', error);
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
            console.error('Ã¢ÂÅ’ Error obteniendo total gastos:', error);
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
            console.error('Ã¢ÂÅ’ Error obteniendo lista de gastos:', error);
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
            console.error('Ã¢ÂÅ’ Error obteniendo lista de vouchers:', error);
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
            console.error('Ã¢ÂÅ’ Error obteniendo lista de transferencias:', error);
            throw error;
        }
    }



    // ============================================================================
    // OBTENER LISTA DE DEPÓSITOS DEL TURNO
    // ============================================================================
    static async obtenerListaDepositos(turnoId, connection = null) {
        try {
            const conn = connection || pool;
            
            const [depositos] = await conn.execute(
                `SELECT 
                    id,
                    turno_id,
                    numero_deposito,
                    paciente_nombre,
                    monto,
                    fecha_creacion
                FROM depositos
                WHERE turno_id = ?
                ORDER BY fecha_creacion DESC`,
                [turnoId]
            );

            return depositos;

        } catch (error) {
            console.error('❌ Error obteniendo lista de depósitos:', error);
            throw error;
        }
    }



    // ============================================================================
    // OBTENER LISTA DE PRODUCTOS VENDIDOS DEL TURNO
    // ============================================================================
    static async obtenerProductosVendidos(turnoId, connection = null) {
        try {
            const conn = connection || pool;
            
            const [productos] = await conn.execute(
                `SELECT 
                    v.id as venta_id,
                    v.metodo_pago,
                    v.total as venta_total,
                    v.fecha_creacion,
                    dv.producto_nombre,
                    dv.cantidad,
                    dv.precio_unitario,
                    dv.precio_total,
                    CASE 
                        WHEN v.metodo_pago = 'efectivo' THEN dv.precio_total
                        WHEN v.metodo_pago = 'mixto' THEN (v.total - COALESCE(v.tarjeta_monto, 0) - COALESCE(v.transferencia_monto, 0) - COALESCE(v.deposito_monto, 0)) * (dv.precio_total / v.total)
                        ELSE 0 
                    END as efectivo_producto,
                    CASE 
                        WHEN v.metodo_pago = 'tarjeta' THEN dv.precio_total
                        WHEN v.metodo_pago = 'mixto' THEN COALESCE(v.tarjeta_monto, 0) * (dv.precio_total / v.total)
                        ELSE 0 
                    END as tarjeta_producto,
                    CASE 
                        WHEN v.metodo_pago = 'transferencia' THEN dv.precio_total
                        WHEN v.metodo_pago = 'mixto' THEN COALESCE(v.transferencia_monto, 0) * (dv.precio_total / v.total)
                        ELSE 0 
                    END as transferencia_producto,
                    CASE 
                        WHEN v.metodo_pago = 'deposito' THEN dv.precio_total
                        WHEN v.metodo_pago = 'mixto' THEN COALESCE(v.deposito_monto, 0) * (dv.precio_total / v.total)
                        ELSE 0 
                    END as deposito_producto,
                    u.nombres,
                    u.apellidos
                FROM ventas v
                INNER JOIN detalle_ventas dv ON v.id = dv.venta_id
                INNER JOIN usuarios u ON v.usuario_vendedor_id = u.id
                WHERE v.turno_id = ?
                ORDER BY v.id ASC, dv.id ASC`,
                [turnoId]
            );

            return productos;

        } catch (error) {
            console.error('❌ Error obteniendo productos vendidos:', error);
            throw error;
        }
    }



    // ============================================================================
    // CALCULAR IMPUESTOS
    // ============================================================================
    static calcularImpuestos(totalesVentas) {
        // EFECTIVO/TRANSFERENCIA/DEPÃƒâ€œSITOS: 16% directo
        const impuestoEfectivo = totalesVentas.efectivo * 0.16;
        const impuestoTransferencia = totalesVentas.transferencia * 0.16;
        const impuestoDepositos = (totalesVentas.deposito || 0) * 0.16;
        
        // TARJETA: Doble impuesto
        // 1. ComisiÃƒÂ³n bancaria 6%
        const comisionBancaria = totalesVentas.tarjeta * 0.06;
        // 2. Impuesto 16% sobre el restante (despuÃƒÂ©s de comisiÃƒÂ³n)
        const montoRestante = totalesVentas.tarjeta - comisionBancaria;
        const impuestoSobreRestante = montoRestante * 0.16;
        // 3. Total impuesto tarjeta = comisiÃƒÂ³n + impuesto
        const impuestoTarjeta = comisionBancaria + impuestoSobreRestante;
        
        return {
            efectivo: impuestoEfectivo,
            tarjeta: impuestoTarjeta,
            transferencia: impuestoTransferencia,
            depositos: impuestoDepositos,
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
            const denormString = String(denominacion);
            const valor = denominaciones[denormString] || 0;
            const cantidadNum = parseInt(cantidad) || 0;
            
            if (cantidadNum > 0) {
                console.log(`💵 Billete Q${denormString}: ${cantidadNum} × ${valor} = Q${valor * cantidadNum}`);
            }
            
            total += valor * cantidadNum;
        }

        console.log(`💵 Total billetes calculado: Q${total.toFixed(2)}`);
        return total;
    }

    // ============================================================================
    // CALCULAR TOTAL DE MONEDAS
    // ============================================================================
    static calcularTotalMonedas(monedas) {
        const denominaciones = {
            '1': 1.00,
            '0.5': 0.50,
            '0.50': 0.50,
            '0.25': 0.25,
            '0.10': 0.10,
            '0.1': 0.10,
            '0.05': 0.05
        };

        let total = 0;
        for (const [denominacion, cantidad] of Object.entries(monedas)) {
            // Normalizar la clave: convertir a string y asegurar que funcione con ambos formatos
            const denormString = String(denominacion);
            const valor = denominaciones[denormString] || 0;
            const cantidadNum = parseInt(cantidad) || 0;
            
            if (cantidadNum > 0) {
                console.log(`💰 Moneda Q${denormString}: ${cantidadNum} × ${valor} = Q${valor * cantidadNum}`);
            }
            
            total += valor * cantidadNum;
        }

        console.log(`💵 Total monedas calculado: Q${total.toFixed(2)}`);
        return total;
    }

    // ============================================================================

    // ============================================================================
    // OBTENER DATOS COMPLETOS PARA REPORTE DE CIERRE PDF
    // ============================================================================
    static async obtenerDatosReporte(turnoId) {
        try {
            console.log(`📊 Obteniendo datos completos para reporte del turno ${turnoId}`);
            
            // 1. Obtener información básica del turno
            const turno = await this.obtenerPorId(turnoId);
            if (!turno) {
                throw new Error('Turno no encontrado');
            }
            
            if (turno.estado !== 'cerrado') {
                throw new Error('Solo se pueden generar reportes de turnos cerrados');
            }
            
            // 2. Obtener totales de ventas
            const totalesVentas = await this.calcularTotalesVentas(turnoId);
            
            // 3. Obtener gastos, vouchers y transferencias
            const listaGastos = await this.obtenerListaGastos(turnoId);
            const listaVouchers = await this.obtenerListaVouchers(turnoId);
            const listaTransferencias = await this.obtenerListaTransferencias(turnoId);
            const listaProductos = await this.obtenerProductosVendidos(turnoId);
            
            // Calcular totales
            const totalGastos = listaGastos.reduce((sum, g) => sum + parseFloat(g.monto), 0);
            const totalVouchers = listaVouchers.reduce((sum, v) => sum + parseFloat(v.monto), 0);
            const totalTransferencias = listaTransferencias.reduce((sum, t) => sum + parseFloat(t.monto), 0);
            
            // 4. Calcular impuestos
            const impuestoEfectivo = totalesVentas.efectivo * 0.16;
            const ventaNetaEfectivo = totalesVentas.efectivo - impuestoEfectivo;
            
            const comisionTarjeta = totalesVentas.tarjeta * 0.06;
            const restanteTarjeta = totalesVentas.tarjeta - comisionTarjeta;
            const impuestoTarjeta = restanteTarjeta * 0.16;
            const impuestoTotalTarjeta = comisionTarjeta + impuestoTarjeta;
            const ventaNetaTarjeta = totalesVentas.tarjeta - impuestoTotalTarjeta;
            
            const impuestoTransferencia = totalesVentas.transferencia * 0.16;
            const ventaNetaTransferencia = totalesVentas.transferencia - impuestoTransferencia;
            
            const impuestoDepositos = (totalesVentas.deposito || 0) * 0.16;
            const ventaNetaDepositos = (totalesVentas.deposito || 0) - impuestoDepositos;
            
            const totalImpuestos = impuestoEfectivo + impuestoTotalTarjeta + impuestoTransferencia + impuestoDepositos;
            const totalVentasNetas = ventaNetaEfectivo + ventaNetaTarjeta + ventaNetaTransferencia + ventaNetaDepositos;
            
            // 5. Calcular total a depositar
            // Total a depositar = Total Real - Ingresos Tarjeta - Gastos - Comisiones
            const totalADepositar = totalesVentas.total - totalesVentas.tarjeta - totalGastos - (turno.total_comisiones_pagadas || 0);
            
            // 6. Calcular movimientos de efectivo
            const efectivoEsperado = parseFloat(turno.efectivo_inicial_total) + 
                                    totalesVentas.efectivo - 
                                    totalGastos - 
                                    (turno.total_comisiones_pagadas || 0);
            
            const efectivoContado = parseFloat(turno.efectivo_final_total);
            const diferenciaEfectivo = efectivoContado - efectivoEsperado;
            
            let estadoEfectivo = 'CUADRADO';
            if (diferenciaEfectivo > 0.50) {
                estadoEfectivo = 'SOBRANTE';
            } else if (diferenciaEfectivo < -0.50) {
                estadoEfectivo = 'FALTANTE';
            }
            
            // 7. Calcular duración del turno
            const fechaApertura = new Date(turno.fecha_apertura);
            const fechaCierre = new Date(turno.fecha_cierre);
            const duracionMs = fechaCierre - fechaApertura;
            const duracionHoras = Math.floor(duracionMs / (1000 * 60 * 60));
            const duracionMinutos = Math.floor((duracionMs % (1000 * 60 * 60)) / (1000 * 60));
            
            // 8. Construir objeto de datos para el PDF
            const datosReporte = {
                turno: {
                    id: turno.id,
                    usuario_nombre: `${turno.nombres} ${turno.apellidos}`,
                    estado: turno.estado,
                    fecha_apertura: turno.fecha_apertura,
                    fecha_cierre: turno.fecha_cierre,
                    duracion_horas: duracionHoras,
                    duracion_minutos: duracionMinutos
                },
                resumen_ventas: {
                    venta_total: totalesVentas.total,
                    ventas_efectivo: totalesVentas.efectivo,
                    ventas_tarjeta: totalesVentas.tarjeta,
                    ventas_transferencia: totalesVentas.transferencia,
                    ventas_deposito: totalesVentas.deposito || 0
                },
                efectivo_inicial: {
                    billetes: turno.efectivo_billetes || {},
                    monedas: turno.efectivo_monedas || {},
                    total: parseFloat(turno.efectivo_inicial_total)
                },
                movimientos_efectivo: {
                    efectivo_inicial: parseFloat(turno.efectivo_inicial_total),
                    ventas_efectivo: totalesVentas.efectivo,
                    gastos: totalGastos,
                    comisiones_pagadas: turno.total_comisiones_pagadas || 0,
                    efectivo_esperado: efectivoEsperado
                },
                efectivo_final: {
                    billetes: turno.efectivo_final_billetes || {},
                    monedas: turno.efectivo_final_monedas || {},
                    total: efectivoContado
                },
                diferencias: {
                    efectivo: diferenciaEfectivo,
                    estado_efectivo: estadoEfectivo
                },
                vouchers: listaVouchers.map(v => ({
                    id: v.id,
                    numero_voucher: v.numero_voucher,
                    paciente_nombre: v.paciente_nombre,
                    monto: parseFloat(v.monto),
                    fecha: v.fecha_creacion
                })),
                vouchers_resumen: {
                    ventas_tarjeta: totalesVentas.tarjeta,
                    total_vouchers: totalVouchers,
                    diferencia: totalesVentas.tarjeta - totalVouchers,
                    estado: Math.abs(totalesVentas.tarjeta - totalVouchers) < 0.01 ? 'CUADRADO' : 'DESCUADRADO'
                },
                transferencias: listaTransferencias.map(t => ({
                    id: t.id,
                    numero_boleta: t.numero_boleta,
                    paciente_nombre: t.paciente_nombre,
                    monto: parseFloat(t.monto),
                    fecha: t.fecha_creacion
                })),
                transferencias_resumen: {
                    ventas_transferencia: totalesVentas.transferencia,
                    total_transferencias: totalTransferencias,
                    diferencia: totalesVentas.transferencia - totalTransferencias,
                    estado: Math.abs(totalesVentas.transferencia - totalTransferencias) < 0.01 ? 'CUADRADO' : 'DESCUADRADO'
                },
                gastos: listaGastos.map(g => ({
                    id: g.id,
                    categoria: g.categoria,
                    descripcion: g.descripcion,
                    monto: parseFloat(g.monto),
                    fecha: g.fecha_creacion
                })),
                gastos_resumen: {
                    total: totalGastos
                },

                productos_vendidos: listaProductos.map(p => ({
                    venta_id: p.venta_id,
                    producto_nombre: p.producto_nombre,
                    cantidad: parseFloat(p.cantidad),
                    precio_unitario: parseFloat(p.precio_unitario),
                    precio_total: parseFloat(p.precio_total),
                    efectivo: parseFloat(p.efectivo_producto),
                    tarjeta: parseFloat(p.tarjeta_producto),
                    transferencia: parseFloat(p.transferencia_producto),
                    deposito: parseFloat(p.deposito_producto || 0),
                    usuario: `${p.nombres} ${p.apellidos}`,
                    fecha: p.fecha_creacion
                })),

                impuestos: {
                    efectivo: {
                        ventas: totalesVentas.efectivo,
                        impuesto: impuestoEfectivo,
                        venta_neta: ventaNetaEfectivo
                    },
                    tarjeta: {
                        ventas: totalesVentas.tarjeta,
                        comision: comisionTarjeta,
                        impuesto_restante: impuestoTarjeta,
                        impuesto_total: impuestoTotalTarjeta,
                        venta_neta: ventaNetaTarjeta
                    },
                    transferencia: {
                        ventas: totalesVentas.transferencia,
                        impuesto: impuestoTransferencia,
                        venta_neta: ventaNetaTransferencia
                    },
                    depositos: {
                        ventas: totalesVentas.deposito || 0,
                        impuesto: impuestoDepositos,
                        venta_neta: ventaNetaDepositos
                    },
                    total_impuestos: totalImpuestos,
                    total_ventas_netas: totalVentasNetas
                },
                deposito: {
                    ventas_netas: totalVentasNetas,
                    gastos: totalGastos,
                    comisiones: turno.total_comisiones_pagadas || 0,
                    total_a_depositar: totalADepositar
                },
                autorizacion: {
                    requiere: turno.autorizado_por ? true : false,
                    autorizado_por: turno.autorizado_por ? `${turno.autorizado_nombres} ${turno.autorizado_apellidos}` : null,
                    fecha_autorizacion: turno.fecha_autorizacion,
                    justificacion: turno.justificacion_diferencias
                }
            };
            
            console.log('✅ Datos del reporte obtenidos exitosamente');
            return datosReporte;
            
        } catch (error) {
            console.error('❌ Error obteniendo datos del reporte:', error);
            throw error;
        }
    }

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
            // Convertir a nÃƒÂºmeros
            efectivo_inicial_total: parseFloat(turno.efectivo_inicial_total || 0),
            efectivo_final_total: parseFloat(turno.efectivo_final_total || 0),
            venta_total: parseFloat(turno.venta_total || 0),
            ventas_netas: parseFloat(turno.ventas_netas || 0),
            total_a_depositar: parseFloat(turno.total_a_depositar || 0)
        };
    }
}

module.exports = Turno;