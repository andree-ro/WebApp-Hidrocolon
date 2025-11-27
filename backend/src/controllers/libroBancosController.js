// backend/src/controllers/libroBancosController.js
// Controlador para gestión del Libro de Bancos del Sistema Hidrocolon

const LibroBancos = require('../models/LibroBancos');

// ============================================================================
// OBTENER SALDO INICIAL
// ============================================================================
const obtenerSaldoInicial = async (req, res) => {
    try {
        const saldoInicial = await LibroBancos.obtenerSaldoInicial();

        if (!saldoInicial) {
            return res.json({
                success: true,
                data: null,
                message: 'No se ha registrado un saldo inicial'
            });
        }

        res.json({
            success: true,
            data: saldoInicial
        });

    } catch (error) {
        console.error('❌ Error obteniendo saldo inicial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener saldo inicial',
            error: error.message
        });
    }
};

// ============================================================================
// REGISTRAR SALDO INICIAL
// ============================================================================
const registrarSaldoInicial = async (req, res) => {
    try {
        const { saldo_inicial, observaciones } = req.body;

        // Validaciones
        if (saldo_inicial === undefined || saldo_inicial === null) {
            return res.status(400).json({
                success: false,
                message: 'El saldo inicial es requerido'
            });
        }

        const saldoNumerico = parseFloat(saldo_inicial);
        if (isNaN(saldoNumerico)) {
            return res.status(400).json({
                success: false,
                message: 'El saldo inicial debe ser un número válido'
            });
        }

        const resultado = await LibroBancos.registrarSaldoInicial(
            saldoNumerico,
            req.user.id,
            observaciones
        );

        res.status(201).json(resultado);

    } catch (error) {
        console.error('❌ Error registrando saldo inicial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar saldo inicial',
            error: error.message
        });
    }
};

// ============================================================================
// CALCULAR SALDO ACTUAL
// ============================================================================
const calcularSaldoActual = async (req, res) => {
    try {
        const { fecha_hasta } = req.query;

        const saldoActual = await LibroBancos.calcularSaldoActual(fecha_hasta);

        res.json({
            success: true,
            data: saldoActual
        });

    } catch (error) {
        console.error('❌ Error calculando saldo actual:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calcular saldo actual',
            error: error.message
        });
    }
};

// ============================================================================
// CREAR OPERACIÓN
// ============================================================================
const crearOperacion = async (req, res) => {
    try {
        const {
            fecha,
            beneficiario,
            descripcion,
            clasificacion,
            tipo_operacion,
            numero_cheque,
            numero_deposito,
            ingreso,
            egreso
        } = req.body;

        // Validaciones
        if (!fecha || !beneficiario || !descripcion || !tipo_operacion) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: fecha, beneficiario, descripcion, tipo_operacion'
            });
        }

        if (!['ingreso', 'egreso'].includes(tipo_operacion)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de operación inválido. Debe ser "ingreso" o "egreso"'
            });
        }

        // Validar que si es ingreso, tenga monto en ingreso
        if (tipo_operacion === 'ingreso' && (!ingreso || parseFloat(ingreso) <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Para operaciones de ingreso, el monto de ingreso debe ser mayor a 0'
            });
        }

        // Validar que si es egreso, tenga monto en egreso
        if (tipo_operacion === 'egreso' && (!egreso || parseFloat(egreso) <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Para operaciones de egreso, el monto de egreso debe ser mayor a 0'
            });
        }

        const datosOperacion = {
            fecha,
            beneficiario: beneficiario.trim(),
            descripcion: descripcion.trim(),
            clasificacion: clasificacion ? clasificacion.trim() : null,
            tipo_operacion,
            numero_cheque: numero_cheque ? numero_cheque.trim() : null,
            numero_deposito: numero_deposito ? numero_deposito.trim() : null,
            ingreso: tipo_operacion === 'ingreso' ? parseFloat(ingreso) : 0,
            egreso: tipo_operacion === 'egreso' ? parseFloat(egreso) : 0,
            usuario_registro_id: req.user.id
        };

        const resultado = await LibroBancos.crearOperacion(datosOperacion);

        res.status(201).json(resultado);

    } catch (error) {
        console.error('❌ Error creando operación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear operación',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER OPERACIÓN POR ID
// ============================================================================
const obtenerOperacion = async (req, res) => {
    try {
        const { id } = req.params;

        const operacion = await LibroBancos.obtenerPorId(id);

        if (!operacion) {
            return res.status(404).json({
                success: false,
                message: 'Operación no encontrada'
            });
        }

        res.json({
            success: true,
            data: operacion
        });

    } catch (error) {
        console.error('❌ Error obteniendo operación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener operación',
            error: error.message
        });
    }
};

// ============================================================================
// LISTAR OPERACIONES
// ============================================================================
const listarOperaciones = async (req, res) => {
    try {
        const {
            fecha_inicio,
            fecha_fin,
            tipo_operacion,
            beneficiario,
            limit
        } = req.query;

        const filtros = {
            fecha_inicio,
            fecha_fin,
            tipo_operacion,
            beneficiario,
            limit: limit ? parseInt(limit) : null
        };

        const operaciones = await LibroBancos.listar(filtros);

        res.json({
            success: true,
            data: operaciones,
            total: operaciones.length
        });

    } catch (error) {
        console.error('❌ Error listando operaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al listar operaciones',
            error: error.message
        });
    }
};

// ============================================================================
// ACTUALIZAR OPERACIÓN
// ============================================================================
const actualizarOperacion = async (req, res) => {
    try {
        const { id } = req.params;
        const datosActualizacion = { ...req.body };

        // Validar tipo_operacion si se proporciona
        if (datosActualizacion.tipo_operacion && 
            !['ingreso', 'egreso'].includes(datosActualizacion.tipo_operacion)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de operación inválido'
            });
        }

        const resultado = await LibroBancos.actualizar(id, datosActualizacion);

        res.json(resultado);

    } catch (error) {
        console.error('❌ Error actualizando operación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar operación',
            error: error.message
        });
    }
};

// ============================================================================
// ELIMINAR OPERACIÓN
// ============================================================================
const eliminarOperacion = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await LibroBancos.eliminar(id);

        res.json(resultado);

    } catch (error) {
        console.error('❌ Error eliminando operación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar operación',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER RESUMEN POR PERÍODO
// ============================================================================
const obtenerResumen = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren fecha_inicio y fecha_fin'
            });
        }

        const resumen = await LibroBancos.obtenerResumen(fecha_inicio, fecha_fin);

        res.json({
            success: true,
            data: resumen
        });

    } catch (error) {
        console.error('❌ Error obteniendo resumen:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen',
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

        console.log('📄 Generando PDF de Libro de Bancos');

        // Obtener datos
        const filtros = { fecha_inicio, fecha_fin };
        const operaciones = await LibroBancos.listar(filtros);
        const saldoInicial = await LibroBancos.obtenerSaldoInicial();
        const saldoActual = await LibroBancos.calcularSaldoActual(fecha_fin);

        // Generar PDF usando PDFDocument
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ 
            size: 'LETTER',
            margins: { top: 40, bottom: 40, left: 40, right: 40 }
        });

        // Configurar respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=libro-bancos-${Date.now()}.pdf`);
        doc.pipe(res);

        // ============================================================================
        // ENCABEZADO
        // ============================================================================
        doc.fontSize(16).font('Helvetica-Bold').text('VIMESA CENTRAL ZONA 3', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(14).font('Helvetica-Bold').text('LIBRO DE BANCOS', { align: 'center' });
        doc.moveDown(0.5);

        // Rango de fechas
        if (fecha_inicio && fecha_fin) {
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
        } else {
            doc.fontSize(10).font('Helvetica').text('Todas las fechas', { align: 'center' });
        }

        doc.moveDown(1);

        // ============================================================================
        // RESUMEN DE SALDOS
        // ============================================================================
        doc.fontSize(11).font('Helvetica-Bold').text('RESUMEN DE SALDOS', 40, doc.y);
        doc.moveDown(0.5);

        const yResumen = doc.y;
        doc.fontSize(9).font('Helvetica');
        doc.text(`Saldo Inicial:`, 40, yResumen);
        doc.text(`Q${parseFloat(saldoInicial?.saldo_inicial || 0).toFixed(2)}`, 150, yResumen);

        doc.text(`Total Ingresos:`, 40, yResumen + 12);
        doc.text(`Q${parseFloat(saldoActual?.total_ingresos || 0).toFixed(2)}`, 150, yResumen + 12);

        doc.text(`Total Egresos:`, 40, yResumen + 24);
        doc.text(`Q${parseFloat(saldoActual?.total_egresos || 0).toFixed(2)}`, 150, yResumen + 24);

        doc.font('Helvetica-Bold');
        doc.text(`Saldo Actual:`, 40, yResumen + 36);
        doc.text(`Q${parseFloat(saldoActual?.saldo_actual || 0).toFixed(2)}`, 150, yResumen + 36);

        doc.moveDown(2);

        // ============================================================================
        // TABLA DE OPERACIONES
        // ============================================================================
        doc.fontSize(11).font('Helvetica-Bold').text('DETALLE DE OPERACIONES', 40, doc.y);
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const col1 = 40;   // Fecha
        const col2 = 100;  // Beneficiario
        const col3 = 260;  // Descripción
        const col4 = 400;  // Ingreso
        const col5 = 470;  // Egreso
        const col6 = 530;  // Saldo

        // Encabezados
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('Fecha', col1, tableTop);
        doc.text('Beneficiario', col2, tableTop);
        doc.text('Descripción', col3, tableTop);
        doc.text('Ingreso', col4, tableTop);
        doc.text('Egreso', col5, tableTop);
        doc.text('Saldo', col6, tableTop);

        // Línea debajo de encabezados
        doc.moveTo(40, tableTop + 12).lineTo(570, tableTop + 12).stroke();

        let yPosition = tableTop + 18;
        let saldoAcumulado = parseFloat(saldoInicial?.saldo_inicial || 0);

        doc.fontSize(7).font('Helvetica');

        for (const op of operaciones) {
            // Nueva página si es necesario
            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
                
                // Repetir encabezados
                doc.fontSize(8).font('Helvetica-Bold');
                doc.text('Fecha', col1, yPosition);
                doc.text('Beneficiario', col2, yPosition);
                doc.text('Descripción', col3, yPosition);
                doc.text('Ingreso', col4, yPosition);
                doc.text('Egreso', col5, yPosition);
                doc.text('Saldo', col6, yPosition);
                doc.moveTo(40, yPosition + 12).lineTo(570, yPosition + 12).stroke();
                yPosition += 18;
                doc.fontSize(7).font('Helvetica');
            }

            const fecha = new Date(op.fecha + 'T00:00:00').toLocaleDateString('es-GT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const ingreso = parseFloat(op.ingreso || 0);
            const egreso = parseFloat(op.egreso || 0);
            saldoAcumulado = saldoAcumulado + ingreso - egreso;

            doc.text(fecha, col1, yPosition);
            doc.text((op.beneficiario || '').substring(0, 20), col2, yPosition);
            doc.text((op.descripcion || '').substring(0, 25), col3, yPosition);
            doc.text(ingreso > 0 ? `Q${ingreso.toFixed(2)}` : '-', col4, yPosition);
            doc.text(egreso > 0 ? `Q${egreso.toFixed(2)}` : '-', col5, yPosition);
            doc.text(`Q${saldoAcumulado.toFixed(2)}`, col6, yPosition);

            yPosition += 12;
        }

        // Línea final
        doc.moveTo(40, yPosition + 2).lineTo(570, yPosition + 2).stroke();

        // Pie de página
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

        console.log('📊 Generando Excel de Libro de Bancos');

        // Obtener datos
        const filtros = { fecha_inicio, fecha_fin };
        const operaciones = await LibroBancos.listar(filtros);
        const saldoInicial = await LibroBancos.obtenerSaldoInicial();
        const saldoActual = await LibroBancos.calcularSaldoActual(fecha_fin);

        // Generar Excel
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Libro de Bancos');

        // Configurar columnas
        worksheet.columns = [
            { header: 'Fecha', key: 'fecha', width: 12 },
            { header: 'Beneficiario', key: 'beneficiario', width: 25 },
            { header: 'Descripción', key: 'descripcion', width: 35 },
            { header: 'Clasificación', key: 'clasificacion', width: 20 },
            { header: 'N° Cheque', key: 'numero_cheque', width: 12 },
            { header: 'N° Depósito', key: 'numero_deposito', width: 12 },
            { header: 'Ingreso', key: 'ingreso', width: 12 },
            { header: 'Egreso', key: 'egreso', width: 12 },
            { header: 'Saldo', key: 'saldo', width: 12 }
        ];

        // Título
        worksheet.mergeCells('A1:I1');
        worksheet.getCell('A1').value = 'VIMESA CENTRAL ZONA 3';
        worksheet.getCell('A1').font = { bold: true, size: 14 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        // Subtítulo
        worksheet.mergeCells('A2:I2');
        worksheet.getCell('A2').value = 'LIBRO DE BANCOS';
        worksheet.getCell('A2').font = { bold: true, size: 12 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };

        // Rango de fechas
        if (fecha_inicio && fecha_fin) {
            const fechaInicioFormateada = new Date(fecha_inicio + 'T00:00:00').toLocaleDateString('es-GT');
            const fechaFinFormateada = new Date(fecha_fin + 'T00:00:00').toLocaleDateString('es-GT');
            worksheet.mergeCells('A3:I3');
            worksheet.getCell('A3').value = `Del ${fechaInicioFormateada} al ${fechaFinFormateada}`;
            worksheet.getCell('A3').alignment = { horizontal: 'center' };
        }

        // Resumen de saldos
        worksheet.addRow([]);
        worksheet.addRow(['RESUMEN DE SALDOS']);
        worksheet.addRow(['Saldo Inicial:', `Q${parseFloat(saldoInicial?.saldo_inicial || 0).toFixed(2)}`]);
        worksheet.addRow(['Total Ingresos:', `Q${parseFloat(saldoActual?.total_ingresos || 0).toFixed(2)}`]);
        worksheet.addRow(['Total Egresos:', `Q${parseFloat(saldoActual?.total_egresos || 0).toFixed(2)}`]);
        worksheet.addRow(['Saldo Actual:', `Q${parseFloat(saldoActual?.saldo_actual || 0).toFixed(2)}`]);
        
        // Espacio
        worksheet.addRow([]);

        // Encabezados de tabla (fila 11)
        const headerRow = worksheet.addRow([
            'Fecha', 'Beneficiario', 'Descripción', 'Clasificación', 
            'N° Cheque', 'N° Depósito', 'Ingreso', 'Egreso', 'Saldo'
        ]);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };

        // Datos
        let saldoAcumulado = parseFloat(saldoInicial?.saldo_inicial || 0);
        
        operaciones.forEach(op => {
            const fecha = new Date(op.fecha + 'T00:00:00').toLocaleDateString('es-GT');
            const ingreso = parseFloat(op.ingreso || 0);
            const egreso = parseFloat(op.egreso || 0);
            saldoAcumulado = saldoAcumulado + ingreso - egreso;

            worksheet.addRow({
                fecha: fecha,
                beneficiario: op.beneficiario || '',
                descripcion: op.descripcion || '',
                clasificacion: op.clasificacion || '',
                numero_cheque: op.numero_cheque || '',
                numero_deposito: op.numero_deposito || '',
                ingreso: ingreso > 0 ? ingreso.toFixed(2) : '',
                egreso: egreso > 0 ? egreso.toFixed(2) : '',
                saldo: saldoAcumulado.toFixed(2)
            });
        });

        // Configurar respuesta
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=libro-bancos-${Date.now()}.xlsx`);

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
    obtenerSaldoInicial,
    registrarSaldoInicial,
    calcularSaldoActual,
    crearOperacion,
    obtenerOperacion,
    listarOperaciones,
    actualizarOperacion,
    eliminarOperacion,
    obtenerResumen,
    exportarPDF,
    exportarExcel
};