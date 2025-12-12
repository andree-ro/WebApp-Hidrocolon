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
// CERRAR TURNO COMPLETO (con cuadre automático y generación de PDF)
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

        console.log(`✅ Turno ${id} cerrado exitosamente`);

        // Generar PDF automáticamente
        try {
            console.log(`📄 Generando PDF del reporte para turno ${id}...`);
            
            const datosReporte = await Turno.obtenerDatosReporte(id);
            const ComprobanteGenerator = require('../utils/pdfGenerator');
            const pdfBuffer = await ComprobanteGenerator.generarReporteCierre(datosReporte);
            
            console.log(`✅ PDF generado exitosamente para turno ${id}`);

            // Convertir buffer a base64 para enviar en JSON
            const pdfBase64 = pdfBuffer.toString('base64');

            res.json({
                success: true,
                message: 'Turno cerrado exitosamente',
                data: turno,
                pdf: {
                    disponible: true,
                    base64: pdfBase64,
                    filename: `reporte_cierre_turno_${id}.pdf`
                }
            });

        } catch (pdfError) {
            console.error('⚠️ Error generando PDF (turno cerrado correctamente):', pdfError);
            
            // El turno ya está cerrado, solo fallamos en el PDF
            res.json({
                success: true,
                message: 'Turno cerrado exitosamente (PDF no disponible)',
                data: turno,
                pdf: {
                    disponible: false,
                    error: 'No se pudo generar el PDF automáticamente. Puede descargarlo desde el historial de turnos.'
                }
            });
        }

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
// CALCULAR CUADRE PREVIO AL CIERRE (Preview) - ✅ CORREGIDO
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
        const totalesDepositos = await Turno.obtenerTotalDepositos(id);
        const totalComisionesPagadas = parseFloat(turno.total_comisiones_pagadas || 0);

        // Calcular efectivo final contado
        const totalBilletesFinal = Turno.calcularTotalBilletes(efectivo_final_billetes || {});
        const totalMonedasFinal = Turno.calcularTotalMonedas(efectivo_final_monedas || {});
        const efectivoFinalTotal = totalBilletesFinal + totalMonedasFinal;

        // Calcular efectivo esperado
        const efectivoEsperado = parseFloat(turno.efectivo_inicial_total) + 
                        totalesVentas.efectivo - 
                        totalesGastos -
                        totalComisionesPagadas;
        // Calcular duración del turno
        const fechaApertura = new Date(turno.fecha_apertura);
        const fechaActual = new Date();
        const duracionMs = fechaActual - fechaApertura;
        const duracionHoras = Math.floor(duracionMs / (1000 * 60 * 60));
        const duracionMinutos = Math.floor((duracionMs % (1000 * 60 * 60)) / (1000 * 60));
        const duracion = `${duracionHoras}h ${duracionMinutos}m`;
        // ✅ CALCULAR IMPUESTOS
        const impuestos = Turno.calcularImpuestos(totalesVentas);
        
        // ✅ CALCULAR VENTAS NETAS
        const ventasNetas = totalesVentas.total - 
                           impuestos.efectivo - 
                           impuestos.tarjeta - 
                           impuestos.transferencia - 
                           impuestos.depositos;
        
        // ✅ CALCULAR TOTAL A DEPOSITAR (con fórmula corregida)
        const totalADepositar = ventasNetas - totalesGastos - totalComisionesPagadas;

        // Calcular diferencias
        const diferencias = {
            efectivo: efectivoFinalTotal - efectivoEsperado,
            vouchers: totalesVouchers - totalesVentas.tarjeta,
            transferencias: totalesTransferencias - totalesVentas.transferencia,
            depositos: totalesDepositos - totalesVentas.deposito
        };

        // Verificar si requiere autorización
        const requiereAutorizacion = Math.abs(diferencias.efectivo) > 0.50 || 
                                    Math.abs(diferencias.vouchers) > 0.50 || 
                                    Math.abs(diferencias.transferencias) > 0.50 || 
                                    Math.abs(diferencias.depositos) > 0.50;;

        res.json({
            success: true,
            data: {
                efectivo_inicial: parseFloat(turno.efectivo_inicial_total),
                efectivo_esperado: efectivoEsperado,
                efectivo_contado: efectivoFinalTotal,
                duracion: duracion,
                // ✅ AMBOS NOMBRES PARA COMPATIBILIDAD
                venta_total: totalesVentas.total,
                ventas_totales: totalesVentas.total,
                ventas_efectivo: totalesVentas.efectivo,
                ventas_tarjeta: totalesVentas.tarjeta,
                ventas_transferencia: totalesVentas.transferencia,
                ventas_deposito: totalesVentas.deposito,
                // ✅ IMPUESTOS DESGLOSADOS
                impuesto_efectivo: impuestos.efectivo,
                impuesto_tarjeta: impuestos.tarjeta,
                impuesto_transferencia: impuestos.transferencia,
                impuesto_depositos: impuestos.depositos,
                total_impuestos: impuestos.efectivo + impuestos.tarjeta + impuestos.transferencia + impuestos.depositos,
                // ✅ VENTAS NETAS Y TOTAL A DEPOSITAR
                ventas_netas: ventasNetas,
                total_a_depositar: totalADepositar,
                total_gastos: totalesGastos,
                total_comisiones_pagadas: totalComisionesPagadas,
                total_vouchers: totalesVouchers,
                total_transferencias: totalesTransferencias,
                total_depositos: totalesDepositos,
                diferencias: diferencias,
                diferencia_efectivo: diferencias.efectivo,
                diferencia_vouchers: diferencias.vouchers,
                diferencia_transferencias: diferencias.transferencias,
                diferencia_depositos: diferencias.depositos,
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
                        : null,
                    depositos: Math.abs(diferencias.depositos || 0) > 0.50 
                        ? `Diferencia de Q${Math.abs(diferencias.depositos || 0).toFixed(2)} en depósitos` 
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



// ============================================================================
// OBTENER DATOS COMPLETOS PARA REPORTE DE CIERRE PDF
// ============================================================================
const obtenerDatosReporte = async (req, res) => {
    try {
        const turnoId = parseInt(req.params.id);
        const usuarioActual = req.user;

        console.log(`📊 Obteniendo datos para reporte del turno ${turnoId}`);

        // Validar que el turno exista
        const turno = await Turno.obtenerPorId(turnoId);
        
        if (!turno) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'
            });
        }

        // Validar permisos: solo el usuario del turno o un admin pueden ver el reporte
        if (turno.usuario_id !== usuarioActual.id && usuarioActual.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para ver el reporte de este turno'
            });
        }

        // Validar que el turno esté cerrado
        if (turno.estado !== 'cerrado') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden generar reportes de turnos cerrados'
            });
        }

        // Obtener datos completos del reporte
        const datosReporte = await Turno.obtenerDatosReporte(turnoId);

        console.log(`✅ Datos del reporte obtenidos exitosamente para turno ${turnoId}`);

        res.json({
            success: true,
            data: datosReporte
        });

    } catch (error) {
        console.error('❌ Error obteniendo datos del reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener datos del reporte',
            error: error.message
        });
    }
};




// ============================================================================
// GENERAR PDF DE REPORTE DE CIERRE
// ============================================================================
const generarPDFReporte = async (req, res) => {
    try {
        const turnoId = parseInt(req.params.id);
        const usuarioActual = req.user;

        console.log(`📄 Generando PDF del reporte para turno ${turnoId}`);

        // Validar que el turno exista
        const turno = await Turno.obtenerPorId(turnoId);
        
        if (!turno) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'
            });
        }

        // Validar permisos
        if (turno.usuario_id !== usuarioActual.id && usuarioActual.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para generar el reporte de este turno'
            });
        }

        // Validar que el turno esté cerrado
        if (turno.estado !== 'cerrado') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden generar reportes de turnos cerrados'
            });
        }

        // Obtener datos completos del reporte
        const datosReporte = await Turno.obtenerDatosReporte(turnoId);

        // Generar PDF
        const ComprobanteGenerator = require('../utils/pdfGenerator');
        const pdfBuffer = await ComprobanteGenerator.generarReporteCierre(datosReporte);

        console.log(`✅ PDF del reporte generado exitosamente para turno ${turnoId}`);

        // Enviar PDF como descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=reporte_cierre_turno_${turnoId}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('❌ Error generando PDF del reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar PDF del reporte',
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
    obtenerEstadisticas,
    obtenerDatosReporte,
    generarPDFReporte,
};