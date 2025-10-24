// backend/src/controllers/comisionesController.js
const PagoComision = require('../models/PagoComision');
const Doctora = require('../models/Doctora');

// ============================================================================
// OBTENER DASHBOARD DE COMISIONES PENDIENTES
// ============================================================================
const obtenerDashboard = async (req, res) => {
    try {
        const { fecha_corte } = req.query;

        console.log('📊 Obteniendo dashboard de comisiones...');

        // Obtener todas las comisiones pendientes
        const comisionesPendientes = await PagoComision.obtenerTodasComisionesPendientes(fecha_corte);

        // Calcular totales generales
        const totalGeneral = comisionesPendientes.reduce((sum, d) => sum + d.monto_pendiente, 0);
        const totalDoctoras = comisionesPendientes.length;

        res.json({
            success: true,
            data: {
                resumen: {
                    total_doctoras: totalDoctoras,
                    monto_total_pendiente: parseFloat(totalGeneral.toFixed(2)),
                    fecha_corte: fecha_corte || new Date().toISOString().split('T')[0]
                },
                doctoras: comisionesPendientes
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener dashboard de comisiones',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER DETALLE DE COMISIONES DE UNA DOCTORA
// ============================================================================
const obtenerDetalleComisionesDoctora = async (req, res) => {
    try {
        const { doctora_id } = req.params;
        const { fecha_corte } = req.query;

        console.log(`🔍 Obteniendo detalle de comisiones para doctora ID: ${doctora_id}`);

        // Validar que la doctora existe
        const doctora = await Doctora.findById(doctora_id);
        if (!doctora) {
            return res.status(404).json({
                success: false,
                message: 'Doctora no encontrada'
            });
        }

        // Obtener comisiones pendientes
        const comisiones = await PagoComision.obtenerComisionesPendientes(doctora_id, fecha_corte);

        // Agrupar por fecha para el modal
        const porFecha = {};
        comisiones.detalles.forEach(detalle => {
            const fecha = new Date(detalle.fecha_venta).toISOString().split('T')[0];
            if (!porFecha[fecha]) {
                porFecha[fecha] = {
                    fecha: fecha,
                    cantidad_items: 0,
                    monto_total: 0,
                    items: []
                };
            }
            porFecha[fecha].cantidad_items++;
            porFecha[fecha].monto_total += parseFloat(detalle.monto_comision);
            porFecha[fecha].items.push(detalle);
        });

        const resumenPorFecha = Object.values(porFecha).sort((a, b) => 
            new Date(a.fecha) - new Date(b.fecha)
        );

        res.json({
            success: true,
            data: {
                doctora: {
                    id: doctora.id,
                    nombre: doctora.nombre
                },
                resumen: comisiones.resumen,
                por_fecha: resumenPorFecha,
                detalles: comisiones.detalles
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo detalle de comisiones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener detalle de comisiones',
            error: error.message
        });
    }
};

// ============================================================================
// REGISTRAR PAGO DE COMISIONES
// ============================================================================
const registrarPago = async (req, res) => {
    try {
        const {
            doctora_id,
            fecha_corte,
            fecha_pago,
            efectivo_disponible,
            observaciones,
            turno_id
        } = req.body;

        const usuario_registro_id = req.user.id; // Del middleware de autenticación

        console.log('💳 Registrando pago de comisiones...');

        // Validaciones
        if (!doctora_id) {
            return res.status(400).json({
                success: false,
                message: 'Debe especificar la doctora'
            });
        }

        if (!fecha_corte) {
            return res.status(400).json({
                success: false,
                message: 'Debe especificar la fecha de corte'
            });
        }

        // Validar que la fecha de corte no sea futura
        const hoy = new Date().toISOString().split('T')[0];
        if (fecha_corte > hoy) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de corte no puede ser futura'
            });
        }

        // Validar que la doctora existe
        const doctora = await Doctora.findById(doctora_id);
        if (!doctora) {
            return res.status(404).json({
                success: false,
                message: 'Doctora no encontrada'
            });
        }

        if (!doctora.activo) {
            return res.status(400).json({
                success: false,
                message: 'La doctora no está activa en el sistema'
            });
        }

        // Verificar que hay comisiones pendientes
        const comisionesPendientes = await PagoComision.obtenerComisionesPendientes(
            doctora_id,
            fecha_corte
        );

        if (comisionesPendientes.detalles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay comisiones pendientes para pagar a esta doctora'
            });
        }

        // Registrar el pago
        const resultado = await PagoComision.registrarPago({
            doctora_id,
            fecha_corte,
            fecha_pago: fecha_pago || hoy,
            efectivo_disponible: efectivo_disponible !== false,
            observaciones,
            turno_id,
            usuario_registro_id
        });

        res.status(201).json({
            success: true,
            message: 'Pago de comisiones registrado exitosamente',
            data: {
                pago_id: resultado.pago_id,
                doctora: doctora.nombre,
                monto_total: resultado.monto_total,
                cantidad_ventas: resultado.cantidad_ventas,
                estado: resultado.estado,
                requiere_pdf: true
            }
        });

    } catch (error) {
        console.error('❌ Error registrando pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar pago de comisiones',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER HISTORIAL DE PAGOS
// ============================================================================
const obtenerHistorial = async (req, res) => {
    try {
        const {
            doctora_id,
            estado,
            fecha_inicio,
            fecha_fin,
            turno_id
        } = req.query;

        console.log('📋 Obteniendo historial de pagos...');

        const filtros = {};
        if (doctora_id) filtros.doctora_id = doctora_id;
        if (estado) filtros.estado = estado;
        if (fecha_inicio && fecha_fin) {
            filtros.fecha_inicio = fecha_inicio;
            filtros.fecha_fin = fecha_fin;
        }
        if (turno_id) filtros.turno_id = turno_id;

        const historial = await PagoComision.obtenerHistorial(filtros);

        // Enriquecer con información adicional
        const historialEnriquecido = historial.map(pago => ({
            ...pago,
            monto_total: parseFloat(pago.monto_total),
            efectivo_disponible: Boolean(pago.efectivo_disponible),
            pdf_generado: Boolean(pago.pdf_generado),
            puede_anular: pago.estado !== 'anulado'
        }));

        res.json({
            success: true,
            data: historialEnriquecido
        });

    } catch (error) {
        console.error('❌ Error obteniendo historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de pagos',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER PAGO POR ID
// ============================================================================
const obtenerPagoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🔍 Obteniendo pago ID: ${id}`);

        const pago = await PagoComision.obtenerPorId(id);

        if (!pago) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado'
            });
        }

        res.json({
            success: true,
            data: pago
        });

    } catch (error) {
        console.error('❌ Error obteniendo pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pago',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER ESTADÍSTICAS DE COMISIONES
// ============================================================================
const obtenerEstadisticas = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        console.log('📊 Calculando estadísticas de comisiones...');

        const filtros = {};
        if (fecha_inicio && fecha_fin) {
            filtros.fecha_inicio = fecha_inicio;
            filtros.fecha_fin = fecha_fin;
        }

        const estadisticas = await PagoComision.obtenerEstadisticas(filtros);

        // Calcular métricas adicionales
        const porcentajeEfectivo = estadisticas.monto_total_pagado > 0
            ? (estadisticas.monto_efectivo_pagado / estadisticas.monto_total_pagado) * 100
            : 0;

        const porcentajeAcumulado = estadisticas.monto_total_pagado > 0
            ? (estadisticas.monto_acumulado / estadisticas.monto_total_pagado) * 100
            : 0;

        res.json({
            success: true,
            data: {
                ...estadisticas,
                porcentaje_efectivo_pagado: parseFloat(porcentajeEfectivo.toFixed(2)),
                porcentaje_acumulado: parseFloat(porcentajeAcumulado.toFixed(2))
            }
        });

    } catch (error) {
        console.error('❌ Error calculando estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calcular estadísticas',
            error: error.message
        });
    }
};

// ============================================================================
// ANULAR PAGO DE COMISIONES
// ============================================================================
const anularPago = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        const usuario_id = req.user.id;

        console.log(`🗑️ Anulando pago ID: ${id}`);

        // Validaciones
        if (!motivo || motivo.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar un motivo para anular el pago'
            });
        }

        // Verificar que el pago existe
        const pago = await PagoComision.obtenerPorId(id);
        if (!pago) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado'
            });
        }

        if (pago.estado === 'anulado') {
            return res.status(400).json({
                success: false,
                message: 'El pago ya está anulado'
            });
        }

        // Anular el pago
        await PagoComision.anularPago(id, usuario_id, motivo);

        res.json({
            success: true,
            message: 'Pago anulado correctamente',
            data: {
                pago_id: id,
                doctora: pago.doctora_nombre,
                monto_revertido: parseFloat(pago.monto_total)
            }
        });

    } catch (error) {
        console.error('❌ Error anulando pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al anular pago',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER DATOS PARA GENERAR PDF
// ============================================================================
const obtenerDatosParaPDF = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`📄 Obteniendo datos para PDF del pago ID: ${id}`);

        const datosPDF = await PagoComision.obtenerDatosParaPDF(id);

        res.json({
            success: true,
            data: datosPDF
        });

    } catch (error) {
        console.error('❌ Error obteniendo datos para PDF:', error);
        
        if (error.message === 'Pago no encontrado') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener datos para PDF',
            error: error.message
        });
    }
};

// ============================================================================
// GENERAR PDF DE COMISIONES
// ============================================================================
const generarPDF = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`📄 Generando PDF del pago ID: ${id}`);

        // Obtener datos para el PDF
        const datosPDF = await PagoComision.obtenerDatosParaPDF(id);

        // Generar PDF usando el generador
        const pdfGenerator = require('../utils/pdfGenerator');
        const pdfBuffer = await pdfGenerator.generarPDFComisiones(datosPDF);

        // Marcar como generado
        await PagoComision.marcarPDFGenerado(id);

        // Enviar PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=comisiones_${datosPDF.numero_pago}_${datosPDF.doctora_nombre.replace(/\s/g, '_')}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        
        if (error.message === 'Pago no encontrado') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al generar PDF',
            error: error.message
        });
    }
};

// ============================================================================
// VERIFICAR COMISIONES ACUMULADAS
// ============================================================================
const verificarComisionesAcumuladas = async (req, res) => {
    try {
        const { doctora_id } = req.params;

        console.log(`🔍 Verificando comisiones acumuladas para doctora ID: ${doctora_id}`);

        const pagosAcumulados = await PagoComision.obtenerHistorial({
            doctora_id: doctora_id,
            estado: 'acumulado'
        });

        const montoAcumulado = pagosAcumulados.reduce((sum, p) => sum + parseFloat(p.monto_total), 0);

        res.json({
            success: true,
            data: {
                tiene_acumuladas: pagosAcumulados.length > 0,
                cantidad_pagos: pagosAcumulados.length,
                monto_total_acumulado: parseFloat(montoAcumulado.toFixed(2)),
                pagos: pagosAcumulados
            }
        });

    } catch (error) {
        console.error('❌ Error verificando comisiones acumuladas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar comisiones acumuladas',
            error: error.message
        });
    }
};

module.exports = {
    obtenerDashboard,
    obtenerDetalleComisionesDoctora,
    registrarPago,
    obtenerHistorial,
    obtenerPagoPorId,
    obtenerEstadisticas,
    anularPago,
    obtenerDatosParaPDF,
    generarPDF,
    verificarComisionesAcumuladas
};