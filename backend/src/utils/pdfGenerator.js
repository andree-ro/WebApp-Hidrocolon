// backend/src/utils/pdfGenerator.js
const PDFDocument = require('pdfkit');

class ComprobanteGenerator {
    static async generar(venta) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ 
                    size: 'LETTER',
                    margins: { top: 30, bottom: 30, left: 40, right: 40 }
                });

                const chunks = [];
                
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                const MEDIA_CARTA_LIMITE = 396;

                // ENCABEZADO ACTUALIZADO
                doc.fontSize(18)
                .font('Helvetica-Bold')
                .text('VIMESA', { align: 'center' });
                
                doc.moveDown(0.3);
                
                doc.fontSize(8)
                .font('Helvetica')
                .text('6a. Calle D3-71 Zona 9, Los Cerezos, Quetzaltenango.', { align: 'center' });
                
                doc.moveDown(0.1);
                
                doc.fontSize(8)
                .text('PBX: 7767-2167  WHATSAPP: 5461 - 4822', { align: 'center' });
                
                doc.moveDown(0.5);
                
                doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('COMPROBANTE DE VENTA', { align: 'center' });
                
                doc.moveDown(0.5);

                // INFORMACIÓN DE LA VENTA
                const startY = doc.y;
                
                doc.fontSize(8)
                .font('Helvetica-Bold')
                .text('Factura:', 40, startY);
                doc.font('Helvetica')
                .text(venta.numero_factura, 100, startY);

                doc.font('Helvetica-Bold')
                .text('Fecha:', 300, startY);
                doc.font('Helvetica')
                .text(new Date(venta.fecha_creacion).toLocaleString('es-GT', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Guatemala'
                }), 340, startY);

                doc.font('Helvetica-Bold')
                .text('Vendedor:', 40, startY + 12);
                doc.font('Helvetica')
                .text(`${venta.vendedor_nombres} ${venta.vendedor_apellidos}`, 100, startY + 12);

                doc.font('Helvetica-Bold')
                .text('Pago:', 300, startY + 12);
                doc.font('Helvetica')
                .text(venta.metodo_pago.toUpperCase(), 340, startY + 12);

                doc.moveDown(1.5);

                // DATOS DEL CLIENTE
                doc.fontSize(8)
                .font('Helvetica-Bold')
                .text('Cliente: ', { continued: true })
                .font('Helvetica')
                .text(venta.cliente_nombre + ' | NIT: ' + venta.cliente_nit);

                doc.moveDown(0.5);

                // TABLA DE PRODUCTOS
                const tableTop = doc.y;
                const col1 = 40;
                const col2 = 75;
                const col3 = 420;
                const col4 = 495;

                doc.fontSize(7)
                .font('Helvetica-Bold')
                .text('Cant', col1, tableTop)
                .text('Descripción', col2, tableTop)
                .text('P.Unit.', col3, tableTop)
                .text('Total', col4, tableTop);

                doc.moveTo(40, tableTop + 10)
                .lineTo(555, tableTop + 10)
                .stroke();

                let yPosition = tableTop + 14;
                
                doc.font('Helvetica')
                .fontSize(7);

                for (const item of venta.detalle) {
                    if (yPosition > MEDIA_CARTA_LIMITE - 80) {
                        doc.fontSize(6)
                        .font('Helvetica-Oblique')
                        .text('(Continúa en página siguiente...)', 40, yPosition);
                        doc.addPage();
                        yPosition = 50;
                        
                        doc.fontSize(7)
                        .font('Helvetica-Bold')
                        .text('Cant', col1, yPosition)
                        .text('Descripción', col2, yPosition)
                        .text('P.Unit.', col3, yPosition)
                        .text('Total', col4, yPosition);
                        doc.moveTo(40, yPosition + 10)
                        .lineTo(555, yPosition + 10)
                        .stroke();
                        yPosition += 14;
                        doc.font('Helvetica');
                    }

                    doc.text(item.cantidad.toString(), col1, yPosition)
                    .text(item.producto_nombre, col2, yPosition, { width: 330 })
                    .text(`Q${parseFloat(item.precio_unitario).toFixed(2)}`, col3, yPosition)
                    .text(`Q${parseFloat(item.precio_total).toFixed(2)}`, col4, yPosition);
                    yPosition += 12;
                }

                doc.moveTo(40, yPosition + 2)
                .lineTo(555, yPosition + 2)
                .stroke();
                yPosition += 8;

                // TOTALES
                doc.fontSize(8)
                .font('Helvetica-Bold');

                doc.text('SUBTOTAL:', 420, yPosition)
                .font('Helvetica')
                .text(`Q${parseFloat(venta.subtotal).toFixed(2)}`, 495, yPosition);

                if (parseFloat(venta.descuento) > 0) {
                    yPosition += 10;
                    doc.font('Helvetica-Bold')
                    .text('DESCUENTO:', 420, yPosition)
                    .font('Helvetica')
                    .text(`Q${parseFloat(venta.descuento).toFixed(2)}`, 495, yPosition);
                }

                yPosition += 10;
                doc.fontSize(9)
                .font('Helvetica-Bold')
                .text('TOTAL:', 420, yPosition)
                .text(`Q${parseFloat(venta.total).toFixed(2)}`, 495, yPosition);

                // DETALLES DE PAGO
                if (venta.metodo_pago === 'efectivo') {
                    yPosition += 12;
                    doc.fontSize(7)
                    .font('Helvetica')
                    .text(`Efectivo: Q${parseFloat(venta.efectivo_recibido).toFixed(2)} | Cambio: Q${parseFloat(venta.efectivo_cambio).toFixed(2)}`, 420, yPosition);
                }

                if (venta.metodo_pago === 'mixto') {
                    yPosition += 12;
                    doc.fontSize(6)
                    .font('Helvetica');
                    const detalles = [];
                    if (parseFloat(venta.tarjeta_monto) > 0) detalles.push(`Tarjeta: Q${parseFloat(venta.tarjeta_monto).toFixed(2)}`);
                    if (parseFloat(venta.transferencia_monto) > 0) detalles.push(`Transf: Q${parseFloat(venta.transferencia_monto).toFixed(2)}`);
                    const efectivo = parseFloat(venta.total) - parseFloat(venta.tarjeta_monto) - parseFloat(venta.transferencia_monto);
                    if (efectivo > 0) detalles.push(`Efectivo: Q${efectivo.toFixed(2)}`);
                    doc.text(detalles.join(' | '), 420, yPosition);
                }

                doc.moveTo(40, MEDIA_CARTA_LIMITE)
                .lineTo(555, MEDIA_CARTA_LIMITE)
                .dash(5, { space: 3 })
                .stroke();

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    // ============================================================================
    // GENERAR REPORTE DE CIERRE DE TURNO (COMPLETO)
    // ============================================================================
    static async generarReporteCierre(datosReporte) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'LETTER',
                    margins: { top: 40, bottom: 40, left: 40, right: 40 }
                });

                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                const pageWidth = 612;
                const pageHeight = 792;
                const margin = 40;
                const contentWidth = pageWidth - (margin * 2);
                let y = margin;

                // Colores
                const colors = {
                    primary: '#2563eb',
                    secondary: '#64748b',
                    success: '#16a34a',
                    warning: '#ea580c',
                    error: '#dc2626',
                    text: '#1e293b',
                    lightGray: '#f1f5f9',
                    border: '#cbd5e1'
                };

                // Funciones auxiliares
                const formatearMoneda = (monto) => {
                    return `Q${parseFloat(monto).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
                };

                // ⭐ NUEVO: Formatear fecha con zona horaria de Guatemala (GMT-6)
                const formatearFecha = (fecha) => {
                    if (!fecha) return 'N/A';
                    
                    try {
                        const date = new Date(fecha);
                        
                        // Opciones para Guatemala (GMT-6)
                        const opciones = {
                            timeZone: 'America/Guatemala',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false // ⭐ Usar formato 24 horas
                        };
                        
                        return date.toLocaleString('es-GT', opciones);
                    } catch (error) {
                        console.error('Error formateando fecha:', error);
                        return 'Fecha inválida';
                    }
                };

                const agregarSeccionHeader = (titulo, yPos) => {
                    doc.rect(margin, yPos, contentWidth, 25).fillAndStroke(colors.primary, colors.primary);
                    doc.fontSize(12).fillColor('#ffffff').font('Helvetica-Bold')
                    .text(titulo, margin + 10, yPos + 8);
                    return yPos + 25;
                };

                const nuevaPaginaSiNecesario = (espacioNecesario) => {
                    if (y + espacioNecesario > pageHeight - margin) { // ⭐ Cambiado de 60 a margin
                        doc.addPage();
                        return margin;
                    }
                    return y;
                };

                // ============================================================
                // ENCABEZADO
                // ============================================================
                doc.fontSize(18).fillColor(colors.primary).font('Helvetica-Bold')
                .text('HIDROCOLON XELA - VIMESA ZONA 9', margin, y, { align: 'center', width: contentWidth });
                y += 25;
                doc.fontSize(16).text('REPORTE DE CIERRE DE TURNO', margin, y, { align: 'center', width: contentWidth });
                y += 30;
                doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke(colors.border);
                y += 20;

                // Información del turno
                doc.fontSize(10).fillColor(colors.text).font('Helvetica');
                doc.text(`Turno #${datosReporte.turno.id}`, margin, y);
                doc.text(`Fecha: ${formatearFecha(datosReporte.turno.fecha_cierre)}`, pageWidth - margin - 200, y, { width: 200, align: 'right' });
                y += 15;
                doc.text(`Usuario: ${datosReporte.turno.usuario_nombre}`, margin, y);
                y += 15;
                doc.text(`Apertura: ${formatearFecha(datosReporte.turno.fecha_apertura)}`, margin, y);
                y += 15;
                doc.text(`Cierre: ${formatearFecha(datosReporte.turno.fecha_cierre)}`, margin, y);
                y += 15;
                doc.text(`Duración: ${datosReporte.turno.duracion_horas}h ${datosReporte.turno.duracion_minutos}m`, margin, y);
                y += 30;

                // ============================================================
                // SECCIÓN 1: PRODUCTOS VENDIDOS
                // ============================================================
                y = nuevaPaginaSiNecesario(100);
                y = agregarSeccionHeader('PRODUCTOS VENDIDOS HOY', y);
                y += 10;

                if (datosReporte.productos_vendidos && datosReporte.productos_vendidos.length > 0) {
                    // Tabla de productos
                    const colWidths = [30, 150, 40, 60, 60, 60, 60, 72];
                    const headers = ['ID', 'Nombre', 'Cant', 'Tarjeta', 'Efectivo', 'Transfer', 'Total', 'Usuario'];
                    
                    // Encabezados
                    doc.rect(margin, y, contentWidth, 18).fillAndStroke(colors.primary, colors.border);
                    
                    let xPos = margin;
                    doc.fontSize(7).font('Helvetica-Bold');
                    headers.forEach((header, i) => {
                        doc.fillColor('#ffffff').text(header, xPos + 2, y + 5, { width: colWidths[i] - 4, align: 'center' });
                        xPos += colWidths[i];
                    });
                    y += 18;

                    doc.fontSize(7).fillColor(colors.text).font('Helvetica');
                    
                    datosReporte.productos_vendidos.forEach((prod, idx) => {
                        y = nuevaPaginaSiNecesario(14);
                        
                        const bgColor = idx % 2 === 0 ? '#ffffff' : colors.lightGray;
                        doc.rect(margin, y, contentWidth, 14).fillAndStroke(bgColor, colors.border);

                        let xPos = margin;
                        const valores = [
                            prod.venta_id.toString(),
                            prod.producto_nombre.substring(0, 26),
                            prod.cantidad.toString(),
                            formatearMoneda(prod.tarjeta),
                            formatearMoneda(prod.efectivo),
                            formatearMoneda(prod.transferencia),
                            formatearMoneda(prod.precio_total),
                            prod.usuario.substring(0, 13)
                        ];

                        valores.forEach((val, i) => {
                            doc.fillColor(colors.text).text(val, xPos + 2, y + 3, { width: colWidths[i] - 4, align: i === 1 || i === 7 ? 'left' : 'center' });
                            xPos += colWidths[i];
                        });
                        
                        y += 14;
                    });

                    y += 10;
                } else {
                    doc.fontSize(9).fillColor(colors.secondary).font('Helvetica')
                    .text('No hay productos vendidos en este turno', margin, y);
                    y += 20;
                }
                                // ============================================================
                // SECCIÓN 4: GASTOS DETALLADOS
                // ============================================================
                if (datosReporte.gastos && datosReporte.gastos.length > 0) {
                    y = nuevaPaginaSiNecesario(150);
                    y = agregarSeccionHeader('GASTOS DEL TURNO', y);
                    y += 10;

                    const colW = [40, 100, 250, 80, 62];
                    const headersGastos = ['#', 'Categoría', 'Descripción', 'Monto', 'Fecha'];
                    
                    doc.rect(margin, y, contentWidth, 18).fillAndStroke(colors.primary, colors.border);
                    
                    let xPos = margin;
                    doc.fontSize(7).font('Helvetica-Bold');
                    headersGastos.forEach((header, i) => {
                        doc.fillColor('#ffffff').text(header, xPos + 2, y + 5, { width: colW[i] - 4, align: 'center' });
                        xPos += colW[i];
                    });
                    y += 18;

                    doc.fontSize(7).fillColor(colors.text).font('Helvetica');
                    
                    datosReporte.gastos.forEach((gasto, idx) => {
                        y = nuevaPaginaSiNecesario(14);
                        
                        const bgColor = idx % 2 === 0 ? '#ffffff' : colors.lightGray;
                        doc.rect(margin, y, contentWidth, 14).fillAndStroke(bgColor, colors.border);

                        let xPos = margin;
                        const vals = [
                            (idx + 1).toString(),
                            gasto.categoria.substring(0, 18),
                            gasto.descripcion.substring(0, 45),
                            formatearMoneda(gasto.monto),
                            new Date(gasto.fecha).toLocaleDateString('es-GT', { timeZone: 'America/Guatemala' })
                        ];

                        vals.forEach((val, i) => {
                            doc.fillColor(colors.text).text(val, xPos + 2, y + 3, { width: colW[i] - 4, align: i === 2 ? 'left' : 'center' });
                            xPos += colW[i];
                        });
                        
                        y += 14;
                    });

                    // Total de gastos
                    doc.rect(margin, y, contentWidth, 16).fillAndStroke(colors.lightGray, colors.border);
                    doc.fontSize(8).fillColor(colors.text).font('Helvetica-Bold')
                    .text('TOTAL GASTOS', margin + 10, y + 4, { width: 200 });
                    doc.text(formatearMoneda(datosReporte.gastos_resumen.total), pageWidth - margin - 90, y + 4, { width: 80, align: 'right' });
                    y += 30;
                }

                // ============================================================
                // SECCIÓN 2: CIERRE CRUDO (SIN IMPUESTOS)
                // ============================================================
                y = nuevaPaginaSiNecesario(200);
                y = agregarSeccionHeader('CIERRE (CON IMPUESTOS)', y);
                y += 15;

                // Datos de entrada
                doc.fontSize(10).fillColor(colors.text).font('Helvetica-Bold')
                .text('Datos de Entrada:', margin, y);
                y += 18;

                const datosEntrada = [
                    ['Ingreso Efectivo', formatearMoneda(datosReporte.resumen_ventas.ventas_efectivo)],
                    ['Ingreso Tarjeta', formatearMoneda(datosReporte.resumen_ventas.ventas_tarjeta)],
                    ['Ingreso Transferencia', formatearMoneda(datosReporte.resumen_ventas.ventas_transferencia)],
                    ['Total Gastos', formatearMoneda(datosReporte.gastos_resumen.total)],
                    ['Total Real', formatearMoneda(datosReporte.resumen_ventas.venta_total)],
                    ['Total Banco', formatearMoneda(datosReporte.resumen_ventas.ventas_tarjeta + datosReporte.resumen_ventas.ventas_transferencia)]
                ];

                doc.fontSize(9).font('Helvetica');
                datosEntrada.forEach(([label, value]) => {
                    doc.fillColor(colors.text).text(label, margin + 20, y, { width: 200 });
                    doc.fillColor(colors.primary).font('Helvetica-Bold').text(value, margin + 240, y, { width: 100, align: 'right' });
                    doc.font('Helvetica');
                    y += 14;
                });

                y += 10;

                // Resultados del cierre crudo
                doc.fontSize(10).fillColor(colors.text).font('Helvetica-Bold')
                .text('Resultados del Cierre sin impuestos:', margin, y);
                y += 18;

                const ventaBruta = datosReporte.resumen_ventas.venta_total;
                const gastos = datosReporte.gastos_resumen.total;

                const resultadosCrudo = [
                    ['VENTA BRUTA', formatearMoneda(ventaBruta)],
                    ['GASTOS', formatearMoneda(gastos)],
                    ['TOTAL INGRESOS DEL DIA', formatearMoneda(ventaBruta - gastos)]
                ];

                doc.fontSize(9).font('Helvetica');
                resultadosCrudo.forEach(([label, value], idx) => {
                    const esFinal = idx === resultadosCrudo.length - 1;
                    if (esFinal) {
                        doc.rect(margin + 20, y - 2, contentWidth - 40, 18).fillAndStroke(colors.lightGray, colors.border);
                        doc.fillColor(colors.primary).font('Helvetica-Bold');
                    }
                    doc.text(label, margin + 25, y, { width: 200 });
                    doc.text(value, margin + 240, y, { width: 100, align: 'right' });
                    if (!esFinal) doc.font('Helvetica');
                    y += esFinal ? 20 : 14;
                });

                y += 15;

                // ============================================================
                // SECCIÓN 3: CIERRE NETO (CON IMPUESTOS)
                // ============================================================
                y = nuevaPaginaSiNecesario(250);
                y = agregarSeccionHeader('CIERRE NETO (SIN IMPUESTOS)', y);
                y += 15;

                // Ingresos netos
                doc.fontSize(10).fillColor(colors.text).font('Helvetica-Bold')
                .text('Ingresos Netos:', margin, y);
                y += 18;

                const ingresosNetos = [
                    ['Efectivo Neto', formatearMoneda(datosReporte.impuestos.efectivo.venta_neta)],
                    ['Tarjeta Neta', formatearMoneda(datosReporte.impuestos.tarjeta.venta_neta)],
                    ['Transferencia Neta', formatearMoneda(datosReporte.impuestos.transferencia.venta_neta)],
                    ['Total Ingresos Netos', formatearMoneda(datosReporte.impuestos.total_ventas_netas)]
                ];

                doc.fontSize(9).font('Helvetica');
                ingresosNetos.forEach(([label, value], idx) => {
                    const esFinal = idx === ingresosNetos.length - 1;
                    if (esFinal) {
                        doc.rect(margin + 20, y - 2, contentWidth - 40, 18).fillAndStroke(colors.lightGray, colors.border);
                        doc.fillColor(colors.success).font('Helvetica-Bold');
                    }
                    doc.fillColor(esFinal ? colors.success : colors.text).text(label, margin + 25, y, { width: 200 });
                    doc.text(value, margin + 240, y, { width: 100, align: 'right' });
                    if (!esFinal) doc.font('Helvetica');
                    y += esFinal ? 20 : 14;
                });

                y += 15;

                // Gastos y deducciones
                doc.fontSize(10).fillColor(colors.text).font('Helvetica-Bold')
                .text('Gastos y Deducciones:', margin, y);
                y += 18;

                const totalGastos = parseFloat(datosReporte.gastos_resumen.total) || 0;
                const totalImpuestos = parseFloat(datosReporte.impuestos.total_impuestos) || 0;
                const totalComisiones = parseFloat(datosReporte.deposito.comisiones) || 0;
                const totalDeducciones = totalGastos + totalImpuestos + totalComisiones;

                const deducciones = [
                    ['Total Gastos', formatearMoneda(totalGastos)],
                    ['Total Impuestos', formatearMoneda(totalImpuestos)],
                    ['  - Impuesto Efectivo (16%)', formatearMoneda(datosReporte.impuestos.efectivo.impuesto)],
                    ['  - Impuesto Tarjeta (6% + 16%)', formatearMoneda(datosReporte.impuestos.tarjeta.impuesto_total)],
                    ['  - Impuesto Transferencia (16%)', formatearMoneda(datosReporte.impuestos.transferencia.impuesto)],
                    ['Comisiones', formatearMoneda(totalComisiones)],
                    ['Total Deducciones', formatearMoneda(totalDeducciones)]
                ];

                doc.fontSize(9).font('Helvetica');
                deducciones.forEach(([label, value], idx) => {
                    const esFinal = idx === deducciones.length - 1;
                    const esSubtotal = label.startsWith('  -');
                    
                    if (esFinal) {
                        doc.rect(margin + 20, y - 2, contentWidth - 40, 18).fillAndStroke(colors.lightGray, colors.border);
                        doc.fillColor(colors.error).font('Helvetica-Bold');
                    }
                    
                    doc.fillColor(esFinal ? colors.error : colors.text).text(label, margin + (esSubtotal ? 35 : 25), y, { width: 200 });
                    doc.text(value, margin + 240, y, { width: 100, align: 'right' });
                    if (!esFinal) doc.font('Helvetica');
                    y += esFinal ? 20 : 14;
                });

                y += 15;

                // Resultado final
                doc.fontSize(10).fillColor(colors.text).font('Helvetica-Bold')
                .text('Resultado Final:', margin, y);
                y += 18;

                doc.rect(margin + 20, y - 2, contentWidth - 40, 25).fillAndStroke('#ecfdf5', '#10b981');
                doc.fontSize(11).fillColor(colors.success).font('Helvetica-Bold')
                .text('RESULTADO NETO', margin + 25, y + 5, { width: 200 });
                doc.fontSize(12).text(formatearMoneda(datosReporte.deposito.total_a_depositar), margin + 240, y + 5, { width: 100, align: 'right' });
                y += 30;



                // ⭐ ELIMINADO: Todo el pie de página

                doc.end();
            } catch (error) {
                console.error('❌ Error generando PDF de cierre:', error);
                reject(error);
            }
        });
    }


// ============================================================================
    // GENERAR PDF DE COMISIONES
    // ============================================================================
    static async generarPDFComisiones(datosPDF) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'LETTER',
                    margins: { top: 40, bottom: 40, left: 40, right: 40 }
                });

                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                const pageWidth = 612;
                const pageHeight = 792;
                const margin = 40;
                const contentWidth = pageWidth - (margin * 2);
                let y = margin;

                // Colores
                const colors = {
                    primary: '#2563eb',
                    text: '#1e293b',
                    lightGray: '#f1f5f9',
                    border: '#cbd5e1'
                };

                const formatearMoneda = (monto) => {
                    return `Q${parseFloat(monto).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
                };

                const formatearFecha = (fecha) => {
                    if (!fecha) return 'N/A';
                    return new Date(fecha).toLocaleDateString('es-GT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        timeZone: 'America/Guatemala'
                    });
                };

                const formatearFechaLarga = (fecha) => {
                    if (!fecha) return 'N/A';
                    return new Date(fecha).toLocaleDateString('es-GT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'America/Guatemala'
                    });
                };

                // ============================================================
                // ENCABEZADO
                // ============================================================
                doc.fontSize(16).fillColor(colors.primary).font('Helvetica-Bold')
                .text('HIDROCOLON XELA - VIMESA', margin, y, { align: 'center', width: contentWidth });
                y += 22;

                doc.fontSize(14).text('PAGO DE COMISIONES', margin, y, { align: 'center', width: contentWidth });
                y += 20;

                // RANGO DE FECHAS EN MAYÚSCULAS
                const fechaInicioStr = formatearFechaLarga(datosPDF.fecha_inicio).toUpperCase();
                const fechaFinStr = formatearFechaLarga(datosPDF.fecha_fin).toUpperCase();

                doc.fontSize(11).fillColor(colors.text).font('Helvetica')
                .text(`DEL ${fechaInicioStr} AL ${fechaFinStr}`, margin, y, { align: 'center', width: contentWidth });
                y += 18;

                doc.fontSize(12).font('Helvetica-Bold')
                .text(datosPDF.doctora_nombre.toUpperCase(), margin, y, { align: 'center', width: contentWidth });
                y += 30;

                doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke(colors.border);
                y += 20;

                // ============================================================
                // TABLA DE PRODUCTOS
                // ============================================================
                doc.fontSize(11).fillColor(colors.text).font('Helvetica-Bold')
                   .text('DETALLE DE VENTAS:', margin, y);
                y += 18;

                // Encabezados de tabla
                const colWidths = [220, 50, 80, 60, 82];
                const headers = ['Producto/Servicio', 'Cant', 'P.Unit.', 'Com %', 'Total Com.'];
                
                doc.rect(margin, y, contentWidth, 18).fillAndStroke(colors.primary, colors.border);
                
                let xPos = margin;
                doc.fontSize(8).font('Helvetica-Bold');
                headers.forEach((header, i) => {
                    doc.fillColor('#ffffff').text(header, xPos + 4, y + 5, { 
                        width: colWidths[i] - 8, 
                        align: i === 0 ? 'left' : 'center' 
                    });
                    xPos += colWidths[i];
                });
                y += 18;

                // Datos de productos
                doc.fontSize(8).fillColor(colors.text).font('Helvetica');

                if (datosPDF.ventas_agrupadas && datosPDF.ventas_agrupadas.length > 0) {
                    datosPDF.ventas_agrupadas.forEach((item, idx) => {
                        // Nueva página si es necesario
                        if (y > pageHeight - 200) {
                            doc.addPage();
                            y = margin + 20;
                        }

                        const bgColor = idx % 2 === 0 ? '#ffffff' : colors.lightGray;
                        doc.rect(margin, y, contentWidth, 16).fillAndStroke(bgColor, colors.border);

                        let xPos = margin;
                        const valores = [
                            (item.producto_nombre || 'Sin nombre').substring(0, 38),
                            (item.cantidad_total || 0).toString(),
                            formatearMoneda(item.precio_promedio || 0),
                            `${parseFloat(item.comision_porcentaje || 0).toFixed(1)}%`,
                            formatearMoneda(item.total_comision || 0)
                        ];

                        valores.forEach((val, i) => {
                            doc.fillColor(colors.text).text(val, xPos + 4, y + 4, { 
                                width: colWidths[i] - 8, 
                                align: i === 0 ? 'left' : 'center' 
                            });
                            xPos += colWidths[i];
                        });

                        y += 16;
                    });
                } else {
                    doc.fontSize(9).fillColor(colors.text).font('Helvetica')
                       .text('No hay ventas registradas para este período', margin + 10, y);
                    y += 20;
                }

                y += 5;
                doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke(colors.border);
                y += 15;

                // ============================================================
                // TOTAL
                // ============================================================
                doc.rect(margin, y, contentWidth, 25).fillAndStroke(colors.lightGray, colors.border);
                
                doc.fontSize(12).fillColor(colors.primary).font('Helvetica-Bold')
                   .text('TOTAL COMISIONES:', margin + 10, y + 7);
                
                doc.fontSize(14).text(formatearMoneda(datosPDF.monto_total), 
                    pageWidth - margin - 120, y + 6, { width: 110, align: 'right' });
                
                y += 35;

                // ============================================================
                // SECCIÓN DE RECIBÍ
                // ============================================================
                y += 15;
                
                const montoEnLetras = formatearMoneda(datosPDF.monto_total);
                const fechaInicioTexto = formatearFechaLarga(datosPDF.fecha_inicio).toUpperCase();
                const fechaFinTexto = formatearFechaLarga(datosPDF.fecha_fin).toUpperCase();
                const fechaHoy = formatearFechaLarga(new Date());

                doc.fontSize(9).fillColor(colors.text).font('Helvetica')
                   .text(
                       `RECIBÍ DE VIMESA LA CANTIDAD DE ${montoEnLetras} EN CONCEPTO DE COMISIONES POR VENTAS Y SERVICIOS REALIZADOS DEL ${fechaInicioTexto} AL ${fechaFinTexto} DE ACUERDO AL DETALLE ANTERIOR.`,
                       margin,
                       y,
                       { width: contentWidth, align: 'justify' }
                   );
                
                y += 40;

                // ============================================================
                // OBSERVACIONES (si hay)
                // ============================================================
                if (datosPDF.observaciones) {
                    y += 10;
                    doc.fontSize(9).fillColor(colors.text).font('Helvetica-Bold')
                       .text('Observaciones:', margin, y);
                    y += 12;
                    doc.font('Helvetica').fontSize(8)
                       .text(datosPDF.observaciones, margin, y, { width: contentWidth });
                    y += 25;
                }

                // ============================================================
                // FIRMAS
                // ============================================================
                y = Math.max(y + 30, pageHeight - 160);

                // Ajuste de posición vertical de los textos (subirlos un poco)
                const ajusteY = -3;

                // Firma de quien recibe
                doc.fontSize(9).fillColor(colors.text).font('Helvetica-Bold')
                .text('FIRMA DE QUIEN RECIBE:', margin, y + ajusteY);
                y += 5;
                doc.moveTo(margin, y).lineTo(margin + 250, y).stroke(colors.border);
                y += 20;

                // Nombre de quien recibe
                doc.fontSize(9).font('Helvetica-Bold')
                .text('NOMBRE DE QUIEN RECIBE:', margin, y + ajusteY);
                y += 5;
                doc.moveTo(margin, y).lineTo(margin + 250, y).stroke(colors.border);
                y += 20;

                // Fecha
                doc.fontSize(9).font('Helvetica-Bold')
                .text('FECHA:', margin, y + ajusteY);
                y += 5;
                doc.moveTo(margin, y).lineTo(margin + 150, y).stroke(colors.border);
                y += 30;


                // ============================================================
                // PIE DE PÁGINA
                // ============================================================
                doc.fontSize(10).fillColor(colors.text).font('Helvetica-Bold')
                   .text(`QUETZALTENANGO, ${fechaHoy.toUpperCase()}`, margin, y, { align: 'center', width: contentWidth });

                doc.end();
            } catch (error) {
                console.error('❌ Error generando PDF de comisiones:', error);
                reject(error);
            }
        });
    }


}

module.exports = ComprobanteGenerator;