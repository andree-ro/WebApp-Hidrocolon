// backend/src/controllers/turnosController.js
// Controlador expandido para gestión completa de turnos del Sistema Hidrocolon

const Turno = require('../models/Turno');

// ============================================================================
// ABRIR TURNO COMPLETO (con conteo de billetes y monedas)
// ============================================================================
const abrirTurnoCompleto = async (req, res) => {
    try {
        const { 
            usuario_id, 
            efectivo_billetes, 
            efectivo_monedas 
        } = req.body;

        // Validaciones
        if (!usuario_id) {
            return res.status(400).json({
                success: false,
                message: 'El campo usuario_id es requerido'
            });
        }

        if (!efectivo_billetes || typeof efectivo_billetes !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar el conteo de billetes en formato JSON: {"200": 5, "100": 10, ...}'
            });
        }

        if (!efectivo_monedas || typeof efectivo_monedas !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar el conteo de monedas en formato JSON: {"1": 20, "0.50": 15, ...}'
            });
        }

        // Abrir turno
        const turno = await Turno.abrirCompleto({
            usuario_id,
            efectivo_billetes,
            efectivo_monedas
        });

        res.status(201).json({
            success: true,
            message: 'Turno abierto exitosamente',
            data: turno
        });

    } catch (error) {
        console.error('❌ Error abriendo turno:', error);
        
        if (error.message.includes('Ya existe un turno abierto')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al abrir el turno',
            error: error.message
        });
    }
};

// ============================================================================
// CERRAR TURNO COMPLETO (con cuadre automático)
// ============================================================================
const cerrarTurnoCompleto = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            efectivo_final_billetes,
            efectivo_final_monedas,
            total_comisiones_pagadas,
            observaciones,
            autorizado_por,
            justificacion_diferencias
        } = req.body;

        // Validaciones
        if (!efectivo_final_billetes || typeof efectivo_final_billetes !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar el conteo final de billetes'
            });
        }

        if (!efectivo_final_monedas || typeof efectivo_final_monedas !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar el conteo final de monedas'
            });
        }

        // Cerrar turno
        const turno = await Turno.cerrarCompleto(id, {
            efectivo_final_billetes,
            efectivo_final_monedas,
            total_comisiones_pagadas: total_comisiones_pagadas || 0,
            observaciones,
            autorizado_por,
            justificacion_diferencias
        });

        res.json({
            success: true,
            message: 'Turno cerrado exitosamente',
            data: turno
        });

    } catch (error) {
        console.error('❌ Error cerrando turno:', error);

        if (error.message.includes('requiere autorización')) {
            return res.status(400).json({
                success: false,
                message: error.message,
                requiere_autorizacion: true
            });
        }

        if (error.message.includes('no encontrado') || error.message.includes('ya está cerrado')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al cerrar el turno',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER TURNO ACTIVO
// ============================================================================
const obtenerTurnoActivo = async (req, res) => {
    try {
        const turno = await Turno.obtenerActivo();

        if (!turno) {
            return res.status(404).json({
                success: false,
                message: 'No hay ningún turno abierto actualmente',
                data: null
            });
        }

        res.json({
            success: true,
            data: turno
        });

    } catch (error) {
        console.error('❌ Error obteniendo turno activo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el turno activo',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER TURNO POR ID
// ============================================================================
const obtenerTurnoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const turno = await Turno.obtenerPorId(id);

        if (!turno) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'
            });
        }

        res.json({
            success: true,
            data: turno
        });

    } catch (error) {
        console.error('❌ Error obteniendo turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el turno',
            error: error.message
        });
    }
};

// ============================================================================
// LISTAR TURNOS CON FILTROS
// ============================================================================
const listarTurnos = async (req, res) => {
    try {
        const { 
            estado, 
            fecha_inicio, 
            fecha_fin, 
            usuario_id,
            limit,
            offset 
        } = req.query;

        const turnos = await Turno.listar({
            estado,
            fecha_inicio,
            fecha_fin,
            usuario_id,
            limit: limit || 50,
            offset: offset || 0
        });

        res.json({
            success: true,
            data: turnos,
            total: turnos.length
        });

    } catch (error) {
        console.error('❌ Error listando turnos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al listar turnos',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER RESUMEN DEL TURNO ACTUAL (Dashboard)
// ============================================================================
const obtenerResumenTurno = async (req, res) => {
    try {
        const { id } = req.params;

        const resumen = await Turno.obtenerResumen(id);

        res.json({
            success: true,
            data: resumen
        });

    } catch (error) {
        console.error('❌ Error obteniendo resumen:', error);
        
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen del turno',
            error: error.message
        });
    }
};

// ============================================================================
// VALIDAR DATOS DE APERTURA (Helper para frontend)
// ============================================================================
const validarDatosApertura = async (req, res) => {
    try {
        const { efectivo_billetes, efectivo_monedas } = req.body;

        // Calcular totales
        const totalBilletes = Turno.calcularTotalBilletes(efectivo_billetes || {});
        const totalMonedas = Turno.calcularTotalMonedas(efectivo_monedas || {});
        const totalEfectivo = totalBilletes + totalMonedas;

        res.json({
            success: true,
            data: {
                total_billetes: totalBilletes,
                total_monedas: totalMonedas,
                total_efectivo: totalEfectivo,
                desglose_billetes: efectivo_billetes,
                desglose_monedas: efectivo_monedas
            }
        });

    } catch (error) {
        console.error('❌ Error validando datos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al validar datos de apertura',
            error: error.message
        });
    }
};

// ============================================================================
// CALCULAR CUADRE PREVIO AL CIERRE (Preview)
// ============================================================================
const calcularCuadrePrevio = async (req, res) => {
    try {
        const { id } = req.params;
        const { efectivo_final_billetes, efectivo_final_monedas } = req.body;

        // Obtener datos del turno
        const turno = await Turno.obtenerPorId(id);
        if (!turno) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'
            });
        }

        // Calcular totales del turno
        const totalesVentas = await Turno.calcularTotalesVentas(id);
        const totalesGastos = await Turno.obtenerTotalGastos(id);
        const totalesVouchers = await Turno.obtenerTotalVouchers(id);
        const totalesTransferencias = await Turno.obtenerTotalTransferencias(id);

        // Calcular efectivo final contado
        const totalBilletesFinal = Turno.calcularTotalBilletes(efectivo_final_billetes || {});
        const totalMonedasFinal = Turno.calcularTotalMonedas(efectivo_final_monedas || {});
        const efectivoFinalTotal = totalBilletesFinal + totalMonedasFinal;

        // Calcular efectivo esperado
        const efectivoEsperado = parseFloat(turno.efectivo_inicial_total) + 
                                totalesVentas.efectivo - 
                                totalesGastos;

        // Calcular diferencias
        const diferencias = {
            efectivo: efectivoFinalTotal - efectivoEsperado,
            vouchers: totalesVouchers - totalesVentas.tarjeta,
            transferencias: totalesTransferencias - totalesVentas.transferencia
        };

        // Verificar si requiere autorización
        const requiereAutorizacion = Math.abs(diferencias.efectivo) > 0.50 || 
                                    Math.abs(diferencias.vouchers) > 0.50 || 
                                    Math.abs(diferencias.transferencias) > 0.50;

        res.json({
            success: true,
            data: {
                efectivo_inicial: parseFloat(turno.efectivo_inicial_total),
                efectivo_esperado: efectivoEsperado,
                efectivo_contado: efectivoFinalTotal,
                ventas_totales: totalesVentas.total,
                ventas_efectivo: totalesVentas.efectivo,
                ventas_tarjeta: totalesVentas.tarjeta,
                ventas_transferencia: totalesVentas.transferencia,
                total_gastos: totalesGastos,
                total_vouchers: totalesVouchers,
                total_transferencias: totalesTransferencias,
                diferencias: diferencias,
                requiere_autorizacion: requiereAutorizacion,
                puede_cerrar: !requiereAutorizacion,
                alertas: {
                    efectivo: Math.abs(diferencias.efectivo) > 0.50 
                        ? `Diferencia de Q${Math.abs(diferencias.efectivo).toFixed(2)} en efectivo` 
                        : null,
                    vouchers: Math.abs(diferencias.vouchers) > 0.50 
                        ? `Diferencia de Q${Math.abs(diferencias.vouchers).toFixed(2)} en vouchers` 
                        : null,
                    transferencias: Math.abs(diferencias.transferencias) > 0.50 
                        ? `Diferencia de Q${Math.abs(diferencias.transferencias).toFixed(2)} en transferencias` 
                        : null
                }
            }
        });

    } catch (error) {
        console.error('❌ Error calculando cuadre:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calcular cuadre previo',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER ESTADÍSTICAS GENERALES DE TURNOS
// ============================================================================
const obtenerEstadisticas = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        let query = `
            SELECT 
                COUNT(*) as total_turnos,
                COUNT(CASE WHEN estado = 'abierto' THEN 1 END) as turnos_abiertos,
                COUNT(CASE WHEN estado = 'cerrado' THEN 1 END) as turnos_cerrados,
                COALESCE(SUM(venta_total), 0) as ventas_totales,
                COALESCE(AVG(venta_total), 0) as venta_promedio,
                COALESCE(SUM(total_gastos), 0) as gastos_totales,
                COALESCE(SUM(total_a_depositar), 0) as total_depositado
            FROM turnos
            WHERE 1=1
        `;

        const params = [];

        if (fecha_inicio && fecha_fin) {
            query += ' AND DATE(fecha_apertura) BETWEEN ? AND ?';
            params.push(fecha_inicio, fecha_fin);
        }

        const { pool } = require('../config/database');
        const [stats] = await pool.execute(query, params);

        res.json({
            success: true,
            data: stats[0]
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

module.exports = {
    abrirTurnoCompleto,
    cerrarTurnoCompleto,
    obtenerTurnoActivo,
    obtenerTurnoPorId,
    listarTurnos,
    obtenerResumenTurno,
    validarDatosApertura,
    calcularCuadrePrevio,
    obtenerEstadisticas
};