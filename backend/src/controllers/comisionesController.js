// backend/src/controllers/comisionesController.js
const PagoComision = require('../models/PagoComision');
const Doctora = require('../models/Doctora');
const { pool } = require('../config/database');

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
// GENERAR PDF SIN REGISTRAR EN BD (PARA PERÍODOS SIN VENTAS)
// ============================================================================
const generarPDFSinRegistro = async (req, res) => {
    try {
        const { doctora_nombre, fecha_inicio, fecha_fin, observaciones } = req.body;

        console.log(`📄 Generando PDF sin registro para ${doctora_nombre}`);

        // Preparar datos para el PDF con ventas vacías
        const datosPDF = {
            doctora_nombre,
            fecha_inicio,
            fecha_fin,
            ventas_agrupadas: [], // Sin ventas
            monto_total: 0,
            observaciones: observaciones || 'No hubo ventas en este período'
        };

        // Generar PDF usando el generador
        const pdfGenerator = require('../utils/pdfGenerator');
        const pdfBuffer = await pdfGenerator.generarPDFComisiones(datosPDF);

        // Enviar PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Comisiones_${doctora_nombre.replace(/\s/g, '_')}_${fecha_inicio}_${fecha_fin}.pdf`);
        res.send(pdfBuffer);

        console.log('✅ PDF sin registro generado exitosamente');

    } catch (error) {
        console.error('❌ Error generando PDF sin registro:', error);
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


// ============================================================================
// GET /api/comisiones/doctora/:doctora_id/ventas-agrupadas
// Obtener ventas agrupadas por día y producto para generar reporte
// ============================================================================
const obtenerVentasAgrupadasParaReporte = async (req, res) => {
    try {
        const { doctora_id } = req.params;
        const { fecha_inicio, fecha_fin } = req.query;

        // Validaciones
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Las fechas de inicio y fin son requeridas'
            });
        }

        // Validar que fecha_inicio sea menor o igual a fecha_fin
        if (new Date(fecha_inicio) > new Date(fecha_fin)) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de inicio debe ser menor o igual a la fecha fin'
            });
        }

        // Obtener información de la doctora
        const [doctora] = await pool.execute(
            `SELECT id, nombre, activo
            FROM doctoras
            WHERE id = ?`,
            [doctora_id]
        );

        if (doctora.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Doctora no encontrada'
            });
        }

        // Validar si ya existe un pago en este rango
        const validacionPago = await PagoComision.validarPagoDuplicado(
            doctora_id,
            fecha_inicio,
            fecha_fin
        );

        // Obtener ventas agrupadas
        const ventasAgrupadas = await PagoComision.obtenerVentasAgrupadasPorDiaYProducto(
            doctora_id,
            fecha_inicio,
            fecha_fin
        );

        res.json({
            success: true,
            data: {
                doctora: {
                    id: doctora[0].id,
                    nombre_completo: doctora[0].nombre,
                    activo: doctora[0].activo
                },
                periodo: {
                    fecha_inicio,
                    fecha_fin
                },
                ventas_agrupadas: ventasAgrupadas,
                validacion_pago: validacionPago
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo ventas agrupadas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ventas agrupadas',
            error: error.message
        });
    }
};


// ============================================================================
// POST /api/comisiones/pagar-con-rango
// Registrar pago de comisiones con rango de fechas y generar PDF
// ============================================================================
const pagarComisionesConRango = async (req, res) => {
    try {
        const {
            doctora_id,
            fecha_inicio,
            fecha_fin,
            turno_id,
            observaciones,
            autorizado_por_admin
        } = req.body;

        const usuario_registro_id = req.user.id;

        // Validaciones
        if (!doctora_id) {
            return res.status(400).json({
                success: false,
                message: 'El ID de la doctora es requerido'
            });
        }

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Las fechas de inicio y fin son requeridas'
            });
        }

        // Verificar que haya un turno abierto (si se requiere)
        if (!turno_id) {
            const [turnoActivo] = await pool.execute(
                `SELECT id FROM turnos WHERE estado = 'abierto' LIMIT 1`
            );

            if (turnoActivo.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay turno abierto actualmente. Debe abrir un turno primero.'
                });
            }
        }

        // Si no es admin y ya existe un pago, rechazar
        if (!autorizado_por_admin) {
            const validacion = await PagoComision.validarPagoDuplicado(
                doctora_id,
                fecha_inicio,
                fecha_fin
            );

            if (validacion.existe_pago) {
                return res.status(409).json({
                    success: false,
                    message: validacion.mensaje || 'Ya existe un pago en este rango',
                    requiere_autorizacion: true,
                    detalles: validacion.detalles
                });
            }
        }

        // Registrar el pago
        const resultado = await PagoComision.registrarPagoConRango({
            doctora_id,
            fecha_inicio,
            fecha_fin,
            turno_id,
            observaciones,
            usuario_registro_id,
            autorizado_por_admin: autorizado_por_admin || false
        });

        // Obtener datos completos para el PDF
        const datosParaPDF = await prepararDatosParaPDF(
            doctora_id,
            fecha_inicio,
            fecha_fin,
            resultado.ventas_agrupadas
        );

        res.status(201).json({
            success: true,
            message: 'Pago de comisiones registrado exitosamente',
            data: {
                pago_id: resultado.pago_id,
                monto_total: resultado.monto_total,
                fecha_inicio: resultado.fecha_inicio,
                fecha_fin: resultado.fecha_fin,
                pdf_data: datosParaPDF // Datos listos para generar PDF en frontend
            }
        });

    } catch (error) {
        console.error('❌ Error pagando comisiones con rango:', error);
        
        if (error.message.includes('Ya existe un pago')) {
            return res.status(409).json({
                success: false,
                message: error.message,
                requiere_autorizacion: true
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al registrar pago de comisiones',
            error: error.message
        });
    }
};

// ============================================================================
// FUNCIÓN AUXILIAR: Preparar datos para PDF
// ============================================================================
async function prepararDatosParaPDF(doctoraId, fechaInicio, fechaFin, ventasAgrupadas) {
    try {
        // Obtener datos de la doctora
        const [doctora] = await pool.execute(
            `SELECT nombre FROM doctoras WHERE id = ?`,
            [doctoraId]
        );

        if (doctora.length === 0) {
            throw new Error('Doctora no encontrada');
        }

        const nombreDoctora = doctora[0].nombre;

        // Formatear fechas para el PDF
        const fechaInicioObj = new Date(fechaInicio);
        const fechaFinObj = new Date(fechaFin);

        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                       'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        
        const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

        // Preparar columnas de fechas con formato "martes 14-oct"
        const columnasFechas = ventasAgrupadas.fechas.map(fecha => {
            const f = new Date(fecha + 'T12:00:00'); // Usar mediodía para evitar problemas de zona horaria
            const diaSemana = dias[f.getUTCDay()];
            const dia = f.getUTCDate();
            const mesCompleto = meses[f.getUTCMonth()];
            const mes = mesCompleto ? mesCompleto.substring(0, 3) : 'mes';
            
            return {
                fecha: fecha,
                label: `${diaSemana} ${dia}-${mes}`,
                dia: dia,
                mes: mes,
                dia_semana: diaSemana
            };
        });
        
        // Convertir monto a letras (función básica, mejorar si es necesario)
        const montoEnLetras = numeroALetras(ventasAgrupadas.totales.total_comisiones);

        // Fecha de hoy para el documento
        const hoy = new Date();
        const diaHoy = dias[hoy.getDay()];
        const fechaCompleta = `${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;

        return {
            // Encabezado
            titulo: 'HIDROCOLON XELA - VIMESA',
            subtitulo: 'PAGO•A2•K70 DE COMISIONES',
            
            // Período
            periodo_texto: `DEL ${fechaInicioObj.getDate()} AL ${fechaFinObj.getDate()} DE ${meses[fechaFinObj.getMonth()].toUpperCase()} DEL AÑO ${fechaFinObj.getFullYear()}`,
            doctora: `DRA. ${nombreDoctora.toUpperCase()}`,
            
            // Columnas de fechas
            columnas_fechas: columnasFechas,
            
            // Productos con ventas por día
            productos: ventasAgrupadas.productos,
            
            // Totales
            totales: ventasAgrupadas.totales,
            
            // Texto legal
            texto_recibo: `RECIBI DE VIMESA LA CANTIDAD DE ${montoEnLetras.toUpperCase()} (Q.${ventasAgrupadas.totales.total_comisiones.toFixed(2)}), EN CONCEPTO DE COMISIONES POR VENTAS REALIZADAS DEL ${fechaInicioObj.getDate()} DE ${meses[fechaInicioObj.getMonth()].toUpperCase()} AL ${fechaFinObj.getDate()} DE ${meses[fechaFinObj.getMonth()].toUpperCase()} DE ACUERDO AL DETALLE SIGUIENTE:`,
            
            // Resumen
            resumen_texto: `COMISIONES DEL ${fechaInicioObj.getDate()} AL ${fechaFinObj.getDate()} DE ${meses[fechaFinObj.getMonth()].toUpperCase()}`,
            resumen_monto: ventasAgrupadas.totales.total_comisiones,
            
            // Pie de página
            lugar_fecha: `Quetzaltenango, ${diaHoy}, ${fechaCompleta}`
        };

    } catch (error) {
        console.error('❌ Error preparando datos para PDF:', error);
        throw error;
    }
}

// ============================================================================
// FUNCIÓN AUXILIAR: Convertir número a letras (simplificada)
// ============================================================================
function numeroALetras(num) {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    
    const especiales = {
        10: 'DIEZ', 11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE',
        15: 'QUINCE', 16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE'
    };

    if (num === 0) return 'CERO';
    
    let entero = Math.floor(num);
    let decimales = Math.round((num - entero) * 100);
    
    let resultado = '';
    
    // Miles
    if (entero >= 1000) {
        let miles = Math.floor(entero / 1000);
        if (miles === 1) {
            resultado += 'MIL ';
        } else {
            resultado += convertirCentenas(miles) + ' MIL ';
        }
        entero = entero % 1000;
    }
    
    // Centenas, decenas y unidades
    resultado += convertirCentenas(entero);
    
    resultado += ' QUETZALES';
    
    if (decimales > 0) {
        resultado += ` CON ${decimales}/100`;
    } else {
        resultado += ' EXACTOS';
    }
    
    return resultado.trim();
}

function convertirCentenas(num) {
    const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    const especiales = {
        10: 'DIEZ', 11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE',
        15: 'QUINCE', 16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE'
    };
    
    if (num === 0) return '';
    if (num === 100) return 'CIEN';
    
    let resultado = '';
    
    // Centenas
    if (num >= 100) {
        resultado += centenas[Math.floor(num / 100)] + ' ';
        num = num % 100;
    }
    
    // Decenas especiales (10-19)
    if (num >= 10 && num <= 19) {
        resultado += especiales[num];
        return resultado.trim();
    }
    
    // Decenas
    if (num >= 20) {
        resultado += decenas[Math.floor(num / 10)];
        num = num % 10;
        if (num > 0) {
            resultado += ' Y ';
        }
    }
    
    // Unidades
    if (num > 0 && num < 10) {
        resultado += unidades[num];
    }
    
    return resultado.trim();
}


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
    verificarComisionesAcumuladas,
    obtenerVentasAgrupadasParaReporte,
    pagarComisionesConRango,
    generarPDFSinRegistro,
};