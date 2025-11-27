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

        doc.fontSize(9).font('Helvetica');
        doc.text('Ventas de Medicamentos', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.ingresos?.ventas_medicamentos || 0), 450, yPos, { width: 100, align: 'right' });
        yPos += 15;

        doc.text('Ventas de Extras', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.ingresos?.ventas_extras || 0), 450, yPos, { width: 100, align: 'right' });
        yPos += 15;

        doc.text('Ventas de Servicios', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.ingresos?.ventas_servicios || 0), 450, yPos, { width: 100, align: 'right' });
        yPos += 15;

        doc.text('Ganancias de Laboratorios', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.ingresos?.ganancias_laboratorios || 0), 450, yPos, { width: 100, align: 'right' });
        yPos += 20;

        // Total Ingresos
        doc.moveTo(60, yPos).lineTo(555, yPos).stroke();
        yPos += 8;
        doc.font('Helvetica-Bold');
        doc.text('TOTAL INGRESOS', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.ingresos?.total || 0), 450, yPos, { width: 100, align: 'right' });
        yPos += 25;

        // ============================================================================
        // COSTOS DE OPERACIÓN
        // ============================================================================
        doc.fontSize(12).font('Helvetica-Bold').text('COSTOS DE OPERACIÓN', 40, yPos);
        yPos += 20;

        doc.fontSize(9).font('Helvetica');
        doc.text('Costo Medicamentos Vendidos', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.costos_operacion?.costo_medicamentos || 0), 450, yPos, { width: 100, align: 'right' });
        yPos += 15;

        doc.text('Costo Extras Vendidos', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.costos_operacion?.costo_extras || 0), 450, yPos, { width: 100, align: 'right' });
        yPos += 15;

        // Conceptos personalizados de costos
        if (estadoResultados.costos_operacion?.conceptos_personalizados?.length > 0) {
            for (const concepto of estadoResultados.costos_operacion.conceptos_personalizados) {
                doc.text(concepto.nombre, 60, yPos);
                doc.text(formatearMoneda(concepto.monto), 450, yPos, { width: 100, align: 'right' });
                yPos += 15;
            }
        }

        yPos += 5;
        doc.moveTo(60, yPos).lineTo(555, yPos).stroke();
        yPos += 8;
        doc.font('Helvetica-Bold');
        doc.text('TOTAL COSTOS DE OPERACIÓN', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.costos_operacion?.total || 0), 450, yPos, { width: 100, align: 'right' });
        yPos += 25;

        // ============================================================================
        // UTILIDAD BRUTA
        // ============================================================================
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('UTILIDAD BRUTA', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.utilidad_bruta || 0), 450, yPos, { width: 100, align: 'right' });
        yPos += 30;

        // Nueva página si es necesario
        if (yPos > 650) {
            doc.addPage();
            yPos = 50;
        }

        // ============================================================================
        // GASTOS DE OPERACIÓN
        // ============================================================================
        doc.fontSize(12).font('Helvetica-Bold').text('GASTOS DE OPERACIÓN', 40, yPos);
        yPos += 20;

        doc.fontSize(9).font('Helvetica');
        doc.text('Comisiones Pagadas', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.gastos_operacion?.comisiones || 0), 450, yPos, { width: 100, align: 'right' });
        yPos += 15;

        doc.text('Gastos Registrados', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.gastos_operacion?.gastos || 0), 450, yPos, { width: 100, align: 'right' });
        yPos += 15;

        // Conceptos personalizados de gastos
        if (estadoResultados.gastos_operacion?.conceptos_personalizados?.length > 0) {
            for (const concepto of estadoResultados.gastos_operacion.conceptos_personalizados) {
                doc.text(concepto.nombre, 60, yPos);
                doc.text(formatearMoneda(concepto.monto), 450, yPos, { width: 100, align: 'right' });
                yPos += 15;
            }
        }

        yPos += 5;
        doc.moveTo(60, yPos).lineTo(555, yPos).stroke();
        yPos += 8;
        doc.font('Helvetica-Bold');
        doc.text('TOTAL GASTOS DE OPERACIÓN', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.gastos_operacion?.total || 0), 450, yPos, { width: 100, align: 'right' });
        yPos += 25;

        // ============================================================================
        // UTILIDAD OPERATIVA
        // ============================================================================
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('UTILIDAD OPERATIVA', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.utilidad_operativa || 0), 450, yPos, { width: 100, align: 'right' });
        yPos += 30;

        // ============================================================================
        // OTROS GASTOS
        // ============================================================================
        if (estadoResultados.otros_gastos?.total > 0) {
            doc.fontSize(12).font('Helvetica-Bold').text('OTROS GASTOS', 40, yPos);
            yPos += 20;

            doc.fontSize(9).font('Helvetica');
            
            if (estadoResultados.otros_gastos?.conceptos_personalizados?.length > 0) {
                for (const concepto of estadoResultados.otros_gastos.conceptos_personalizados) {
                    doc.text(concepto.nombre, 60, yPos);
                    doc.text(formatearMoneda(concepto.monto), 450, yPos, { width: 100, align: 'right' });
                    yPos += 15;
                }
            }

            yPos += 5;
            doc.moveTo(60, yPos).lineTo(555, yPos).stroke();
            yPos += 8;
            doc.font('Helvetica-Bold');
            doc.text('TOTAL OTROS GASTOS', 60, yPos);
            doc.text(formatearMoneda(estadoResultados.otros_gastos?.total || 0), 450, yPos, { width: 100, align: 'right' });
            yPos += 25;
        }

        // ============================================================================
        // UTILIDAD NETA
        // ============================================================================
        doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
        yPos += 15;

        doc.fontSize(14).font('Helvetica-Bold');
        const utilidadColor = estadoResultados.utilidad_neta >= 0 ? 'black' : 'red';
        doc.fillColor(utilidadColor);
        doc.text('UTILIDAD NETA', 60, yPos);
        doc.text(formatearMoneda(estadoResultados.utilidad_neta || 0), 450, yPos, { width: 100, align: 'right' });

        // Pie de página
        doc.fillColor('black');
        doc.fontSize(8).font('Helvetica').text(
            `Generado el ${new Date().toLocaleDateString('es-GT')} a las ${new Date().toLocaleTimeString('es-GT')}`,
            40,
            750,
            { align: 'center', width: 530 }
        );

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

        // INGRESOS
        worksheet.getCell(`A${currentRow}`).value = 'INGRESOS';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
        currentRow++;

        worksheet.getCell(`A${currentRow}`).value = 'Ventas de Medicamentos';
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.ingresos?.ventas_medicamentos);
        currentRow++;

        worksheet.getCell(`A${currentRow}`).value = 'Ventas de Extras';
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.ingresos?.ventas_extras);
        currentRow++;

        worksheet.getCell(`A${currentRow}`).value = 'Ventas de Servicios';
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.ingresos?.ventas_servicios);
        currentRow++;

        worksheet.getCell(`A${currentRow}`).value = 'Ganancias de Laboratorios';
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.ingresos?.ganancias_laboratorios);
        currentRow++;

        worksheet.getCell(`A${currentRow}`).value = 'TOTAL INGRESOS';
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.ingresos?.total);
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow += 2;

        // COSTOS DE OPERACIÓN
        worksheet.getCell(`A${currentRow}`).value = 'COSTOS DE OPERACIÓN';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
        currentRow++;

        worksheet.getCell(`A${currentRow}`).value = 'Costo Medicamentos Vendidos';
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.costos_operacion?.costo_medicamentos);
        currentRow++;

        worksheet.getCell(`A${currentRow}`).value = 'Costo Extras Vendidos';
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.costos_operacion?.costo_extras);
        currentRow++;

        if (estadoResultados.costos_operacion?.conceptos_personalizados?.length > 0) {
            for (const concepto of estadoResultados.costos_operacion.conceptos_personalizados) {
                worksheet.getCell(`A${currentRow}`).value = concepto.nombre;
                worksheet.getCell(`C${currentRow}`).value = formatearMoneda(concepto.monto);
                currentRow++;
            }
        }

        worksheet.getCell(`A${currentRow}`).value = 'TOTAL COSTOS DE OPERACIÓN';
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.costos_operacion?.total);
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow += 2;

        // UTILIDAD BRUTA
        worksheet.getCell(`A${currentRow}`).value = 'UTILIDAD BRUTA';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 11 };
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.utilidad_bruta);
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow += 2;

        // GASTOS DE OPERACIÓN
        worksheet.getCell(`A${currentRow}`).value = 'GASTOS DE OPERACIÓN';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
        currentRow++;

        worksheet.getCell(`A${currentRow}`).value = 'Comisiones Pagadas';
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.gastos_operacion?.comisiones);
        currentRow++;

        worksheet.getCell(`A${currentRow}`).value = 'Gastos Registrados';
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.gastos_operacion?.gastos);
        currentRow++;

        if (estadoResultados.gastos_operacion?.conceptos_personalizados?.length > 0) {
            for (const concepto of estadoResultados.gastos_operacion.conceptos_personalizados) {
                worksheet.getCell(`A${currentRow}`).value = concepto.nombre;
                worksheet.getCell(`C${currentRow}`).value = formatearMoneda(concepto.monto);
                currentRow++;
            }
        }

        worksheet.getCell(`A${currentRow}`).value = 'TOTAL GASTOS DE OPERACIÓN';
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.gastos_operacion?.total);
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow += 2;

        // UTILIDAD OPERATIVA
        worksheet.getCell(`A${currentRow}`).value = 'UTILIDAD OPERATIVA';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 11 };
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.utilidad_operativa);
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow += 2;

        // OTROS GASTOS
        if (estadoResultados.otros_gastos?.total > 0) {
            worksheet.getCell(`A${currentRow}`).value = 'OTROS GASTOS';
            worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
            currentRow++;

            if (estadoResultados.otros_gastos?.conceptos_personalizados?.length > 0) {
                for (const concepto of estadoResultados.otros_gastos.conceptos_personalizados) {
                    worksheet.getCell(`A${currentRow}`).value = concepto.nombre;
                    worksheet.getCell(`C${currentRow}`).value = formatearMoneda(concepto.monto);
                    currentRow++;
                }
            }

            worksheet.getCell(`A${currentRow}`).value = 'TOTAL OTROS GASTOS';
            worksheet.getCell(`A${currentRow}`).font = { bold: true };
            worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.otros_gastos?.total);
            worksheet.getCell(`C${currentRow}`).font = { bold: true };
            currentRow += 2;
        }

        // UTILIDAD NETA
        worksheet.getCell(`A${currentRow}`).value = 'UTILIDAD NETA';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
        worksheet.getCell(`C${currentRow}`).value = formatearMoneda(estadoResultados.utilidad_neta);
        worksheet.getCell(`C${currentRow}`).font = { bold: true, size: 14 };

        // Ajustar anchos de columnas
        worksheet.getColumn('A').width = 35;
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