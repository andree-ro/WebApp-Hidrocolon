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

                // ENCABEZADO
                doc.fontSize(16)
                   .font('Helvetica-Bold')
                   .text('HIDROCOLON', { align: 'center' });
                
                doc.moveDown(0.2);
                
                doc.fontSize(12)
                   .font('Helvetica')
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
                       minute: '2-digit'
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

                // PIE DE PÁGINA
                doc.fontSize(6)
                   .font('Helvetica')
                   .text('Gracias por su compra', 40, MEDIA_CARTA_LIMITE - 15, { align: 'center', width: 515 });

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

                const formatearFecha = (fecha) => {
                    return new Date(fecha).toLocaleString('es-GT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                };

                const agregarSeccionHeader = (titulo, yPos) => {
                    doc.rect(margin, yPos, contentWidth, 25).fillAndStroke(colors.primary, colors.primary);
                    doc.fontSize(12).fillColor('#ffffff').font('Helvetica-Bold')
                       .text(titulo, margin + 10, yPos + 8);
                    return yPos + 25;
                };

                const nuevaPaginaSiNecesario = (espacioNecesario) => {
                    if (y + espacioNecesario > pageHeight - 60) {
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
                    const colWidths = [30, 160, 40, 60, 60, 60, 60, 62];
                    const headers = ['ID', 'Nombre', 'Cant', 'Tarjeta', 'Efectivo', 'Transfer', 'Total', 'Usuario'];
                    
                    // Encabezados
                    let xPos = margin;
                    doc.fontSize(7).fillColor('#ffffff').font('Helvetica-Bold');
                    doc.rect(margin, y, contentWidth, 18).fillAndStroke(colors.primary, colors.border);
                    
                    headers.forEach((header, i) => {
                        doc.text(header, xPos + 2, y + 5, { width: colWidths[i] - 4, align: 'center' });
                        xPos += colWidths[i];
                    });
                    y += 18;

                    // Productos
                    doc.fontSize(6).fillColor(colors.text).font('Helvetica');
                    datosReporte.productos_vendidos.forEach((prod, idx) => {
                        y = nuevaPaginaSiNecesario(14);
                        
                        const bgColor = idx % 2 === 0 ? '#ffffff' : colors.lightGray;
                        doc.rect(margin, y, contentWidth, 14).fillAndStroke(bgColor, colors.border);

                        xPos = margin;
                        const valores = [
                            prod.venta_id.toString(),
                            prod.producto_nombre.substring(0, 28),
                            prod.cantidad.toString(),
                            formatearMoneda(prod.tarjeta),
                            formatearMoneda(prod.efectivo),
                            formatearMoneda(prod.transferencia),
                            formatearMoneda(prod.precio_total),
                            prod.usuario.substring(0, 12)
                        ];

                        valores.forEach((val, i) => {
                            doc.text(val, xPos + 2, y + 3, { width: colWidths[i] - 4, align: i === 1 || i === 7 ? 'left' : 'center' });
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
                // SECCIÓN 2: CIERRE CRUDO (SIN IMPUESTOS)
                // ============================================================
                y = nuevaPaginaSiNecesario(200);
                y = agregarSeccionHeader('CIERRE CRUDO (SIN IMPUESTOS)', y);
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
                   .text('Resultados del Cierre Crudo:', margin, y);
                y += 18;

                const ventaBruta = datosReporte.resumen_ventas.venta_total;
                const gastos = datosReporte.gastos_resumen.total;

                const resultadosCrudo = [
                    ['VENTA BRUTA', formatearMoneda(ventaBruta)],
                    ['GASTOS', formatearMoneda(gastos)],
                    ['TOTAL CRUDO', formatearMoneda(ventaBruta - gastos)]
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
                y = agregarSeccionHeader('CIERRE NETO (CON IMPUESTOS)', y);
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

                const deducciones = [
                    ['Total Gastos', formatearMoneda(datosReporte.gastos_resumen.total)],
                    ['Total Impuestos', formatearMoneda(datosReporte.impuestos.total_impuestos)],
                    ['  - Impuesto Efectivo (16%)', formatearMoneda(datosReporte.impuestos.efectivo.impuesto)],
                    ['  - Impuesto Tarjeta (6% + 16%)', formatearMoneda(datosReporte.impuestos.tarjeta.impuesto_total)],
                    ['  - Impuesto Transferencia (16%)', formatearMoneda(datosReporte.impuestos.transferencia.impuesto)],
                    ['Comisiones', formatearMoneda(datosReporte.deposito.comisiones)],
                    ['Total Deducciones', formatearMoneda(datosReporte.gastos_resumen.total + datosReporte.impuestos.total_impuestos + datosReporte.deposito.comisiones)]
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

                // ============================================================
                // SECCIÓN 4: GASTOS DETALLADOS
                // ============================================================
                if (datosReporte.gastos && datosReporte.gastos.length > 0) {
                    y = nuevaPaginaSiNecesario(150);
                    y = agregarSeccionHeader('GASTOS DEL TURNO', y);
                    y += 10;

                    const colW = [40, 100, 250, 80, 62];
                    const headersGastos = ['#', 'Categoría', 'Descripción', 'Monto', 'Fecha'];
                    
                    xPos = margin;
                    doc.fontSize(7).fillColor('#ffffff').font('Helvetica-Bold');
                    doc.rect(margin, y, contentWidth, 18).fillAndStroke(colors.primary, colors.border);
                    
                    headersGastos.forEach((header, i) => {
                        doc.text(header, xPos + 2, y + 5, { width: colW[i] - 4, align: 'center' });
                        xPos += colW[i];
                    });
                    y += 18;

                    doc.fontSize(7).fillColor(colors.text).font('Helvetica');
                    datosReporte.gastos.forEach((gasto, idx) => {
                        y = nuevaPaginaSiNecesario(14);
                        
                        const bgColor = idx % 2 === 0 ? '#ffffff' : colors.lightGray;
                        doc.rect(margin, y, contentWidth, 14).fillAndStroke(bgColor, colors.border);

                        xPos = margin;
                        const vals = [
                            (idx + 1).toString(),
                            gasto.categoria.substring(0, 18),
                            gasto.descripcion.substring(0, 45),
                            formatearMoneda(gasto.monto),
                            new Date(gasto.fecha).toLocaleDateString('es-GT')
                        ];

                        vals.forEach((val, i) => {
                            doc.text(val, xPos + 2, y + 3, { width: colW[i] - 4, align: i === 2 ? 'left' : 'center' });
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
                // PIE DE PÁGINA
                // ============================================================
                doc.fontSize(8).fillColor(colors.secondary).font('Helvetica')
                   .text(`Reporte generado: ${formatearFecha(new Date())}`, margin, pageHeight - 60);
                doc.text('Sistema Hidrocolon v1.0', margin, pageHeight - 45);
                doc.text('Este documento es válido como comprobante de cierre de turno', margin, pageHeight - 30);

                doc.end();
            } catch (error) {
                console.error('❌ Error generando PDF de cierre:', error);
                reject(error);
            }
        });
    }
}

module.exports = ComprobanteGenerator;