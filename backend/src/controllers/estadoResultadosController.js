// backend/src/controllers/estadoResultadosController.js
// Controlador para gestión del Estado de Resultados del Sistema Hidrocolon

const { EstadoResultados, ConceptoEstadoResultados } = require('../models/EstadoResultados');

// ============================================================================
// OBTENER ESTADO DE RESULTADOS COMPLETO
// ============================================================================
const obtenerEstadoResultados = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        // Validaciones
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren fecha_inicio y fecha_fin'
            });
        }

        // Validar que fecha_inicio sea menor o igual a fecha_fin
        if (new Date(fecha_inicio) > new Date(fecha_fin)) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de inicio debe ser menor o igual a la fecha de fin'
            });
        }

        console.log(`📊 Generando Estado de Resultados: ${fecha_inicio} - ${fecha_fin}`);

        const estadoResultados = await EstadoResultados.obtenerEstadoResultados(
            fecha_inicio,
            fecha_fin
        );

        res.json({
            success: true,
            data: estadoResultados
        });

    } catch (error) {
        console.error('❌ Error obteniendo estado de resultados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar estado de resultados',
            error: error.message
        });
    }
};

// ============================================================================
// CREAR CONCEPTO PERSONALIZADO
// ============================================================================
const crearConcepto = async (req, res) => {
    try {
        const {
            tipo,
            nombre,
            monto,
            periodo_inicio,
            periodo_fin,
            descripcion
        } = req.body;

        // Validaciones
        if (!tipo || !nombre || monto === undefined || !periodo_inicio || !periodo_fin) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: tipo, nombre, monto, periodo_inicio, periodo_fin'
            });
        }

        // Validar tipo
        const tiposValidos = ['costo_operacion', 'gasto_operacion', 'otro_gasto'];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({
                success: false,
                message: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}`
            });
        }

        // Validar monto
        const montoNumerico = parseFloat(monto);
        if (isNaN(montoNumerico) || montoNumerico < 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser un número válido mayor o igual a 0'
            });
        }

        // Validar fechas
        if (new Date(periodo_inicio) > new Date(periodo_fin)) {
            return res.status(400).json({
                success: false,
                message: 'El período de inicio debe ser menor o igual al período de fin'
            });
        }

        const datosConcepto = {
            tipo,
            nombre: nombre.trim(),
            monto: montoNumerico,
            periodo_inicio,
            periodo_fin,
            descripcion: descripcion ? descripcion.trim() : null,
            usuario_registro_id: req.user.id
        };

        const resultado = await ConceptoEstadoResultados.crear(datosConcepto);

        // Obtener concepto creado
        const conceptoCreado = await ConceptoEstadoResultados.obtenerPorId(resultado.id);

        res.status(201).json({
            success: true,
            data: conceptoCreado,
            message: 'Concepto creado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error creando concepto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear concepto',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER CONCEPTO POR ID
// ============================================================================
const obtenerConcepto = async (req, res) => {
    try {
        const { id } = req.params;

        const concepto = await ConceptoEstadoResultados.obtenerPorId(id);

        if (!concepto) {
            return res.status(404).json({
                success: false,
                message: 'Concepto no encontrado'
            });
        }

        res.json({
            success: true,
            data: concepto
        });

    } catch (error) {
        console.error('❌ Error obteniendo concepto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener concepto',
            error: error.message
        });
    }
};

// ============================================================================
// LISTAR CONCEPTOS
// ============================================================================
const listarConceptos = async (req, res) => {
    try {
        const {
            tipo,
            periodo_inicio,
            periodo_fin
        } = req.query;

        // Validar tipo si se proporciona
        if (tipo) {
            const tiposValidos = ['costo_operacion', 'gasto_operacion', 'otro_gasto'];
            if (!tiposValidos.includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}`
                });
            }
        }

        const filtros = {
            tipo,
            periodo_inicio,
            periodo_fin
        };

        const conceptos = await ConceptoEstadoResultados.listar(filtros);

        res.json({
            success: true,
            data: conceptos,
            total: conceptos.length
        });

    } catch (error) {
        console.error('❌ Error listando conceptos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al listar conceptos',
            error: error.message
        });
    }
};

// ============================================================================
// ACTUALIZAR CONCEPTO
// ============================================================================
const actualizarConcepto = async (req, res) => {
    try {
        const { id } = req.params;
        const datosActualizacion = { ...req.body };

        // Validar monto si se proporciona
        if (datosActualizacion.monto !== undefined) {
            const montoNumerico = parseFloat(datosActualizacion.monto);
            if (isNaN(montoNumerico) || montoNumerico < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El monto debe ser un número válido mayor o igual a 0'
                });
            }
            datosActualizacion.monto = montoNumerico;
        }

        // Validar fechas si se proporcionan ambas
        if (datosActualizacion.periodo_inicio && datosActualizacion.periodo_fin) {
            if (new Date(datosActualizacion.periodo_inicio) > new Date(datosActualizacion.periodo_fin)) {
                return res.status(400).json({
                    success: false,
                    message: 'El período de inicio debe ser menor o igual al período de fin'
                });
            }
        }

        const resultado = await ConceptoEstadoResultados.actualizar(id, datosActualizacion);

        // Obtener concepto actualizado
        const conceptoActualizado = await ConceptoEstadoResultados.obtenerPorId(id);

        res.json({
            success: true,
            data: conceptoActualizado,
            message: 'Concepto actualizado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error actualizando concepto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar concepto',
            error: error.message
        });
    }
};

// ============================================================================
// ELIMINAR CONCEPTO
// ============================================================================
const eliminarConcepto = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que existe
        const concepto = await ConceptoEstadoResultados.obtenerPorId(id);
        if (!concepto) {
            return res.status(404).json({
                success: false,
                message: 'Concepto no encontrado'
            });
        }

        const resultado = await ConceptoEstadoResultados.eliminar(id);

        res.json(resultado);

    } catch (error) {
        console.error('❌ Error eliminando concepto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar concepto',
            error: error.message
        });
    }
};

// ============================================================================
// EXPORTAR A PDF
// ============================================================================
const exportarPDF = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren fecha_inicio y fecha_fin'
            });
        }

        console.log('📄 Generando PDF de Estado de Resultados');

        // Obtener datos del estado de resultados
        const estadoResultados = await EstadoResultados.obtenerEstadoResultados(fecha_inicio, fecha_fin);

        // Generar PDF usando PDFDocument
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ 
            size: 'LETTER',
            margins: { top: 40, bottom: 40, left: 40, right: 40 }
        });

        // Configurar respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=estado-resultados-${Date.now()}.pdf`);
        doc.pipe(res);

        // ============================================================================
        // ENCABEZADO
        // ============================================================================
        doc.fontSize(16).font('Helvetica-Bold').text('VIMESA CENTRAL ZONA 3', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(14).font('Helvetica-Bold').text('ESTADO DE RESULTADOS', { align: 'center' });
        doc.moveDown(0.5);

        // Rango de fechas
        const fechaInicioFormateada = new Date(fecha_inicio + 'T00:00:00').toLocaleDateString('es-GT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const fechaFinFormateada = new Date(fecha_fin + 'T00:00:00').toLocaleDateString('es-GT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        doc.fontSize(10).font('Helvetica').text(
            `Del ${fechaInicioFormateada} al ${fechaFinFormateada}`,
            { align: 'center' }
        );

        doc.moveDown(1.5);

        const formatearMoneda = (valor) => {
            return `Q${parseFloat(valor || 0).toFixed(2)}`;
        };

        let yPos = doc.y;

        // ============================================================================
        // INGRESOS
        // ============================================================================
        doc.fontSize(12).font('Helvetica-Bold').text('INGRESOS', 40, yPos);
        yPos += 20;

        // VENTAS
        if (estadoResultados.ingresos?.ventas?.length > 0) {
            doc.fontSize(10).font('Helvetica-Bold').text('VENTAS', 60, yPos);
            yPos += 15;

            doc.fontSize(9).font('Helvetica');
            for (const venta of estadoResultados.ingresos.ventas) {
                doc.text(venta.nombre_doctora, 80, yPos);
                doc.text(formatearMoneda(venta.total), 450, yPos, { width: 100, align: 'right' });
                yPos += 12;
            }
            
            // Total Ventas
            doc.font('Helvetica-Bold');
            doc.text('TOTAL VENTAS', 80, yPos);
            doc.text(formatearMoneda(estadoResultados.ingresos.total_ventas), 450, yPos, { width: 100, align: 'right' });
            yPos += 20;
        }

        // SERVICIOS
        if (estadoResultados.ingresos?.servicios?.length > 0) {
            doc.fontSize(10).font('Helvetica-Bold').text('SERVICIOS', 60, yPos);
            yPos += 15;

            doc.fontSize(9).font('Helvetica');
            for (const servicio of estadoResultados.ingresos.servicios) {
                doc.text(servicio.nombre_doctora, 80, yPos);
                doc.text(formatearMoneda(servicio.total), 450, yPos, { width: 100, align: 'right' });
                yPos += 12;
            }
            
            // Total Servicios
            doc.font('Helvetica-Bold');
            doc.text('TOTAL SERVICIOS', 80, yPos);
            doc.text(formatearMoneda(estadoResultados.ingresos.total_servicios), 450, yPos, { width: 100, align: 'right' });
            yPos += 20;
        }

        // TOTAL DE INGRESOS
        doc.moveTo(60, yPos).lineTo(555, yPos).stroke();
        yPos += 8;
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('TOTAL DE INGRESOS', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.ingresos.total_ingresos), 450, yPos, { width: 100, align: 'right' });
        yPos += 30;

        // Nueva página si es necesario
        if (yPos > 650) {
            doc.addPage();
            yPos = 50;
        }

        // ============================================================================
        // COSTOS DE OPERACIÓN
        // ============================================================================
        doc.fontSize(12).font('Helvetica-Bold').text('COSTOS DE OPERACION', 40, yPos);
        yPos += 20;

        // COMISIONES
        if (estadoResultados.costos_operacion?.comisiones?.length > 0) {
            doc.fontSize(9).font('Helvetica');
            for (const comision of estadoResultados.costos_operacion.comisiones) {
                doc.text(`Comisiones ${comision.nombre_doctora}`, 60, yPos);
                doc.text(formatearMoneda(comision.total), 450, yPos, { width: 100, align: 'right' });
                yPos += 12;
            }
        }

        // Gastos en clínica
        if (estadoResultados.costos_operacion?.gastos_clinica > 0) {
            doc.text('Gastos en Clinica', 60, yPos);
            doc.text(formatearMoneda(estadoResultados.costos_operacion.gastos_clinica), 450, yPos, { width: 100, align: 'right' });
            yPos += 12;
        }

        // Conceptos manuales de costos
        if (estadoResultados.costos_operacion?.conceptos_manuales?.length > 0) {
            for (const concepto of estadoResultados.costos_operacion.conceptos_manuales) {
                doc.text(concepto.nombre, 60, yPos);
                doc.text(formatearMoneda(concepto.monto), 450, yPos, { width: 100, align: 'right' });
                yPos += 12;
            }
        }

        yPos += 5;
        doc.moveTo(60, yPos).lineTo(555, yPos).stroke();
        yPos += 8;
        doc.font('Helvetica-Bold');
        doc.text('Total de costo de operacion', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.costos_operacion.total_costos), 450, yPos, { width: 100, align: 'right' });
        yPos += 25;

        // ============================================================================
        // GANANCIA BRUTA
        // ============================================================================
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('GANANCIA BRUTA', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.ganancia_bruta), 450, yPos, { width: 100, align: 'right' });
        yPos += 30;

        // Nueva página si es necesario
        if (yPos > 650) {
            doc.addPage();
            yPos = 50;
        }

        // ============================================================================
        // GASTOS DE OPERACIÓN
        // ============================================================================
        doc.fontSize(12).font('Helvetica-Bold').text('GASTOS DE OPERACION', 40, yPos);
        yPos += 20;

        doc.fontSize(9).font('Helvetica');
        
        if (estadoResultados.gastos_operacion?.conceptos?.length > 0) {
            for (const concepto of estadoResultados.gastos_operacion.conceptos) {
                doc.text(concepto.nombre, 60, yPos);
                doc.text(formatearMoneda(concepto.monto), 450, yPos, { width: 100, align: 'right' });
                yPos += 12;
            }
        }

        yPos += 5;
        doc.moveTo(60, yPos).lineTo(555, yPos).stroke();
        yPos += 8;
        doc.font('Helvetica-Bold');
        doc.text('Total Gastos de Operacion', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.gastos_operacion.total_gastos), 450, yPos, { width: 100, align: 'right' });
        yPos += 25;

        // ============================================================================
        // GANANCIA/PÉRDIDA EN OPERACIÓN
        // ============================================================================
        doc.fontSize(11).font('Helvetica-Bold');
        const esGanancia = estadoResultados.ganancia_perdida_operacion >= 0;
        doc.text(esGanancia ? 'GANANCIA EN OPERACION' : 'PERDIDA EN OPERACION', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.ganancia_perdida_operacion), 450, yPos, { width: 100, align: 'right' });
        yPos += 30;

        // ============================================================================
        // OTROS GASTOS Y PRODUCTOS FINANCIEROS
        // ============================================================================
        if (estadoResultados.otros_gastos?.total_otros_gastos > 0) {
            doc.fontSize(12).font('Helvetica-Bold').text('OTROS GASTOS Y PRODUCTOS FINANCIEROS', 40, yPos);
            yPos += 20;

            doc.fontSize(9).font('Helvetica');
            
            // Impuestos
            if (estadoResultados.otros_gastos?.impuestos > 0) {
                doc.text('Impuestos (Automatico)', 60, yPos);
                doc.text(formatearMoneda(estadoResultados.otros_gastos.impuestos), 450, yPos, { width: 100, align: 'right' });
                yPos += 12;
            }

            // Conceptos manuales
            if (estadoResultados.otros_gastos?.conceptos_manuales?.length > 0) {
                for (const concepto of estadoResultados.otros_gastos.conceptos_manuales) {
                    doc.text(concepto.nombre, 60, yPos);
                    doc.text(formatearMoneda(concepto.monto), 450, yPos, { width: 100, align: 'right' });
                    yPos += 12;
                }
            }

            yPos += 5;
            doc.moveTo(60, yPos).lineTo(555, yPos).stroke();
            yPos += 8;
            doc.font('Helvetica-Bold');
            doc.text('Total Otros Gastos', 60, yPos);
            doc.text(formatearMoneda(estadoResultados.otros_gastos.total_otros_gastos), 450, yPos, { width: 100, align: 'right' });
            yPos += 25;
        }

        // ============================================================================
        // UTILIDAD DEL EJERCICIO
        // ============================================================================
        doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
        yPos += 15;

        doc.fontSize(14).font('Helvetica-Bold');
        const utilidadPositiva = estadoResultados.utilidad_ejercicio >= 0;
        doc.fillColor(utilidadPositiva ? 'black' : 'red');
        doc.text('UTILIDAD DEL EJERCICIO', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.utilidad_ejercicio), 450, yPos, { width: 100, align: 'right' });
        doc.end();

    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar PDF',
            error: error.message
        });
    }
};

// ============================================================================
// EXPORTAR A EXCEL
// ============================================================================
const exportarExcel = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren fecha_inicio y fecha_fin'
            });
        }

        console.log('📊 Generando Excel de Estado de Resultados');

        // Obtener datos
        const estadoResultados = await EstadoResultados.obtenerEstadoResultados(fecha_inicio, fecha_fin);

        // Generar Excel
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Estado de Resultados');

        // Título
        worksheet.mergeCells('A1:C1');
        worksheet.getCell('A1').value = 'VIMESA CENTRAL ZONA 3';
        worksheet.getCell('A1').font = { bold: true, size: 14 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        // Subtítulo
        worksheet.mergeCells('A2:C2');
        worksheet.getCell('A2').value = 'ESTADO DE RESULTADOS';
        worksheet.getCell('A2').font = { bold: true, size: 12 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };

        // Rango de fechas
        const fechaInicioFormateada = new Date(fecha_inicio + 'T00:00:00').toLocaleDateString('es-GT');
        const fechaFinFormateada = new Date(fecha_fin + 'T00:00:00').toLocaleDateString('es-GT');
        worksheet.mergeCells('A3:C3');
        worksheet.getCell('A3').value = `Del ${fechaInicioFormateada} al ${fechaFinFormateada}`;
        worksheet.getCell('A3').alignment = { horizontal: 'center' };

        let currentRow = 5;

        // Formato de moneda
        const formatearMoneda = (valor) => parseFloat(valor || 0).toFixed(2);

        // ============================================================================
        // INGRESOS
        // ============================================================================
        worksheet.getCell(`A${currentRow}`).value = 'INGRESOS';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
        currentRow++;

        // VENTAS
        if (estadoResultados.ingresos?.ventas?.length > 0) {
            worksheet.getCell(`A${currentRow}`).value = 'VENTAS';
            worksheet.getCell(`A${currentRow}`).font = { bold: true };
            currentRow++;

            for (const venta of estadoResultados.ingresos.ventas) {
                worksheet.getCell(`B${currentRow}`).value = venta.nombre_doctora;
                worksheet.getCell(`C${currentRow}`).value = formatearMoneda(venta.total);
                currentRow++;
            }

            worksheet.getCell(`B${currentRow}`).value = 'TOTAL VENTAS';
            worksheet.getCell(`B${currentRow}`).font = { bold: true };
            worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.ingresos.total_ventas);
            worksheet.getCell(`C${currentRow}`).font = { bold: true };
            currentRow += 2;
        }

        // SERVICIOS
        if (estadoResultados.ingresos?.servicios?.length > 0) {
            worksheet.getCell(`A${currentRow}`).value = 'SERVICIOS';
            worksheet.getCell(`A${currentRow}`).font = { bold: true };
            currentRow++;

            for (const servicio of estadoResultados.ingresos.servicios) {
                worksheet.getCell(`B${currentRow}`).value = servicio.nombre_doctora;
                worksheet.getCell(`C${currentRow}`).value = formatearMoneda(servicio.total);
                currentRow++;
            }

            worksheet.getCell(`B${currentRow}`).value = 'TOTAL SERVICIOS';
            worksheet.getCell(`B${currentRow}`).font = { bold: true };
            worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.ingresos.total_servicios);
            worksheet.getCell(`C${currentRow}`).font = { bold: true };
            currentRow += 2;
        }

        // TOTAL INGRESOS
        worksheet.getCell(`A${currentRow}`).value = 'TOTAL DE INGRESOS';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 11 };
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.ingresos.total_ingresos);
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow += 2;

        // ============================================================================
        // COSTOS DE OPERACIÓN
        // ============================================================================
        worksheet.getCell(`A${currentRow}`).value = 'COSTOS DE OPERACION';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
        currentRow++;

        // Comisiones
        if (estadoResultados.costos_operacion?.comisiones?.length > 0) {
            for (const comision of estadoResultados.costos_operacion.comisiones) {
                worksheet.getCell(`A${currentRow}`).value = `Comisiones ${comision.nombre_doctora}`;
                worksheet.getCell(`C${currentRow}`).value = formatearMoneda(comision.total);
                currentRow++;
            }
        }

        // Gastos en clínica
        if (estadoResultados.costos_operacion?.gastos_clinica > 0) {
            worksheet.getCell(`A${currentRow}`).value = 'Gastos en Clinica';
            worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.costos_operacion.gastos_clinica);
            currentRow++;
        }

        // Conceptos manuales
        if (estadoResultados.costos_operacion?.conceptos_manuales?.length > 0) {
            for (const concepto of estadoResultados.costos_operacion.conceptos_manuales) {
                worksheet.getCell(`A${currentRow}`).value = concepto.nombre;
                worksheet.getCell(`C${currentRow}`).value = formatearMoneda(concepto.monto);
                currentRow++;
            }
        }

        worksheet.getCell(`A${currentRow}`).value = 'Total de costo de operacion';
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.costos_operacion.total_costos);
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow += 2;

        // ============================================================================
        // GANANCIA BRUTA
        // ============================================================================
        worksheet.getCell(`A${currentRow}`).value = 'GANANCIA BRUTA';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 11 };
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.ganancia_bruta);
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow += 2;

        // ============================================================================
        // GASTOS DE OPERACIÓN
        // ============================================================================
        worksheet.getCell(`A${currentRow}`).value = 'GASTOS DE OPERACION';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
        currentRow++;

        if (estadoResultados.gastos_operacion?.conceptos?.length > 0) {
            for (const concepto of estadoResultados.gastos_operacion.conceptos) {
                worksheet.getCell(`A${currentRow}`).value = concepto.nombre;
                worksheet.getCell(`C${currentRow}`).value = formatearMoneda(concepto.monto);
                currentRow++;
            }
        }

        worksheet.getCell(`A${currentRow}`).value = 'Total Gastos de Operacion';
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.gastos_operacion.total_gastos);
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow += 2;

        // ============================================================================
        // GANANCIA/PÉRDIDA EN OPERACIÓN
        // ============================================================================
        const esGanancia = estadoResultados.ganancia_perdida_operacion >= 0;
        worksheet.getCell(`A${currentRow}`).value = esGanancia ? 'GANANCIA EN OPERACION' : 'PERDIDA EN OPERACION';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 11 };
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.ganancia_perdida_operacion);
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow += 2;

        // ============================================================================
        // OTROS GASTOS
        // ============================================================================
        if (estadoResultados.otros_gastos?.total_otros_gastos > 0) {
            worksheet.getCell(`A${currentRow}`).value = 'OTROS GASTOS Y PRODUCTOS FINANCIEROS';
            worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
            currentRow++;

            // Impuestos
            if (estadoResultados.otros_gastos?.impuestos > 0) {
                worksheet.getCell(`A${currentRow}`).value = 'Impuestos (Automatico)';
                worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.otros_gastos.impuestos);
                currentRow++;
            }

            // Conceptos manuales
            if (estadoResultados.otros_gastos?.conceptos_manuales?.length > 0) {
                for (const concepto of estadoResultados.otros_gastos.conceptos_manuales) {
                    worksheet.getCell(`A${currentRow}`).value = concepto.nombre;
                    worksheet.getCell(`C${currentRow}`).value = formatearMoneda(concepto.monto);
                    currentRow++;
                }
            }

            worksheet.getCell(`A${currentRow}`).value = 'Total Otros Gastos';
            worksheet.getCell(`A${currentRow}`).font = { bold: true };
            worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.otros_gastos.total_otros_gastos);
            worksheet.getCell(`C${currentRow}`).font = { bold: true };
            currentRow += 2;
        }

        // ============================================================================
        // UTILIDAD DEL EJERCICIO
        // ============================================================================
        worksheet.getCell(`A${currentRow}`).value = 'UTILIDAD DEL EJERCICIO';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.utilidad_ejercicio);
        worksheet.getCell(`C${currentRow}`).font = { bold: true, size: 14 };

        // Ajustar anchos de columnas
        worksheet.getColumn('A').width = 40;
        worksheet.getColumn('B').width = 10;
        worksheet.getColumn('C').width = 15;

        // Configurar respuesta
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=estado-resultados-${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('❌ Error generando Excel:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar Excel',
            error: error.message
        });
    }
};

module.exports = {
    obtenerEstadoResultados,
    crearConcepto,
    obtenerConcepto,
    listarConceptos,
    actualizarConcepto,
    eliminarConcepto,
    exportarPDF,
    exportarExcel
};