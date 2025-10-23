// backend/src/utils/pdfGenerator.js
const PDFDocument = require('pdfkit');

class ComprobanteGenerator {
    static async generar(venta) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ 
                    size: 'LETTER', // Carta completa 8.5" × 11"
                    margins: { top: 30, bottom: 30, left: 40, right: 40 }
                });

                const chunks = [];
                
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                const MEDIA_CARTA_LIMITE = 396; // Mitad de 11" = 5.5" × 72 = 396 puntos

                // ============================================
                // ENCABEZADO
                // ============================================
                doc.fontSize(16)
                   .font('Helvetica-Bold')
                   .text('HIDROCOLON', { align: 'center' });
                
                doc.moveDown(0.2);
                
                doc.fontSize(12)
                   .font('Helvetica')
                   .text('COMPROBANTE DE VENTA', { align: 'center' });
                
                doc.moveDown(0.5);

                // ============================================
                // INFORMACIÓN DE LA VENTA
                // ============================================
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

                // ============================================
                // DATOS DEL CLIENTE (Compacto)
                // ============================================
                doc.fontSize(8)
                   .font('Helvetica-Bold')
                   .text('Cliente: ', { continued: true })
                   .font('Helvetica')
                   .text(venta.cliente_nombre + ' | NIT: ' + venta.cliente_nit);

                doc.moveDown(0.5);

                // ============================================
                // TABLA DE PRODUCTOS
                // ============================================
                const tableTop = doc.y;
                const col1 = 40;   // Cantidad
                const col2 = 75;   // Descripción
                const col3 = 420;  // Precio Unit.
                const col4 = 495;  // Total

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
                    // Verificar si llegamos al límite de media carta
                    if (yPosition > MEDIA_CARTA_LIMITE - 80) {
                        // Marcar que hay más productos
                        doc.fontSize(6)
                           .font('Helvetica-Oblique')
                           .text('(Continúa en página siguiente...)', 40, yPosition);
                        
                        doc.addPage();
                        yPosition = 50;
                        
                        // Re-dibujar encabezado de tabla
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

                // ============================================
                // TOTALES
                // ============================================
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

                // ============================================
                // DETALLES DE PAGO
                // ============================================
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

                // ============================================
                // PIE DE PÁGINA
                // ============================================
                doc.fontSize(6)
                   .font('Helvetica')
                   .text('Gracias por su compra', 40, MEDIA_CARTA_LIMITE - 15, { align: 'center', width: 515 });

                // Línea de corte visual
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
    // GENERAR REPORTE DE CIERRE DE TURNO
    // ============================================================================
    static async generarReporteCierre(datosReporte) {
        return new Promise((resolve, reject) => {
            try {
                // Crear documento en tamaño carta
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
                    return `Q ${parseFloat(monto).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
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

                const formatearFechaCorta = (fecha) => {
                    return new Date(fecha).toLocaleDateString('es-GT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                    });
                };

                const agregarSeccionHeader = (titulo, yPos) => {
                    doc.rect(margin, yPos, contentWidth, 25).fillAndStroke(colors.primary, colors.primary);
                    doc.fontSize(12).fillColor('#ffffff').font('Helvetica-Bold')
                       .text(titulo, margin + 10, yPos + 8);
                };

                const agregarTablaSimple = (yPos, rows) => {
                    const colWidth = contentWidth / rows[0].length;
                    const rowHeight = 18;
                    let currentY = yPos;

                    rows.forEach((row, rowIndex) => {
                        const isHeader = rowIndex === 0;
                        const isTotal = rowIndex === rows.length - 1;

                        if (isHeader) {
                            doc.rect(margin, currentY, contentWidth, rowHeight).fillAndStroke(colors.primary, colors.border);
                        } else if (isTotal) {
                            doc.rect(margin, currentY, contentWidth, rowHeight).fillAndStroke(colors.lightGray, colors.border);
                        } else {
                            if (rowIndex % 2 === 0) {
                                doc.rect(margin, currentY, contentWidth, rowHeight).fillAndStroke('#ffffff', colors.border);
                            } else {
                                doc.rect(margin, currentY, contentWidth, rowHeight).fillAndStroke('#f8fafc', colors.border);
                            }
                        }

                        row.forEach((cell, colIndex) => {
                            const cellX = margin + (colIndex * colWidth);
                            const align = colIndex === row.length - 1 ? 'right' : 'left';
                            const padding = align === 'right' ? -10 : 10;

                            if (isHeader) {
                                doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold');
                            } else if (isTotal) {
                                doc.fontSize(9).fillColor(colors.text).font('Helvetica-Bold');
                            } else {
                                doc.fontSize(9).fillColor(colors.text).font('Helvetica');
                            }

                            doc.text(cell, cellX + padding, currentY + 4, {
                                width: colWidth - 20,
                                align: align
                            });
                        });

                        currentY += rowHeight;
                    });

                    return currentY;
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
                doc.text(`Estado: ${datosReporte.turno.estado.toUpperCase()}`, pageWidth - margin - 150, y, { width: 150, align: 'right' });
                
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
                // RESUMEN DE VENTAS
                // ============================================================
                agregarSeccionHeader('RESUMEN DE VENTAS DEL TURNO', y);
                y += 35;

                const ventas = datosReporte.resumen_ventas;
                y = agregarTablaSimple(y, [
                    ['Concepto', 'Monto'],
                    ['Venta Total', formatearMoneda(ventas.venta_total)],
                    ['├─ Ventas en Efectivo', formatearMoneda(ventas.ventas_efectivo)],
                    ['├─ Ventas con Tarjeta', formatearMoneda(ventas.ventas_tarjeta)],
                    ['└─ Ventas con Transferencia', formatearMoneda(ventas.ventas_transferencia)]
                ]);
                
                y += 30;

                // ============================================================
                // CUADRE DE EFECTIVO
                // ============================================================
                agregarSeccionHeader('CUADRE DE EFECTIVO', y);
                y += 35;

                // Efectivo Inicial
                doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.text)
                   .text('A. EFECTIVO INICIAL (Apertura del Turno)', margin, y);
                y += 20;

                // Billetes iniciales
                const billetesIniciales = [['Denominación', 'Cantidad', 'Subtotal']];
                let totalBilletesInicial = 0;
                const denBilletes = ['200', '100', '50', '20', '10', '5', '1'];
                denBilletes.forEach(den => {
                    const cant = datosReporte.efectivo_inicial.billetes[den] || 0;
                    const subtotal = cant * parseFloat(den);
                    totalBilletesInicial += subtotal;
                    billetesIniciales.push([`Q ${den}`, cant.toString(), formatearMoneda(subtotal)]);
                });
                billetesIniciales.push(['Total Billetes', '', formatearMoneda(totalBilletesInicial)]);

                y = agregarTablaSimple(y, billetesIniciales);
                y += 20;

                // Monedas iniciales
                const monedasIniciales = [['Denominación', 'Cantidad', 'Subtotal']];
                let totalMonedasInicial = 0;
                const denMonedas = ['1', '0.50', '0.25', '0.10', '0.05'];
                denMonedas.forEach(den => {
                    const cant = datosReporte.efectivo_inicial.monedas[den] || 0;
                    const subtotal = cant * parseFloat(den);
                    totalMonedasInicial += subtotal;
                    monedasIniciales.push([`Q ${den}`, cant.toString(), formatearMoneda(subtotal)]);
                });
                monedasIniciales.push(['Total Monedas', '', formatearMoneda(totalMonedasInicial)]);

                y = agregarTablaSimple(y, monedasIniciales);
                y += 20;

                doc.font('Helvetica-Bold').fontSize(10).text(`Efectivo Inicial Total: ${formatearMoneda(datosReporte.efectivo_inicial.total)}`, margin, y);
                y += 30;

                // Verificar nueva página
                if (y > pageHeight - 250) {
                    doc.addPage();
                    y = margin;
                }

                // Movimientos de efectivo
                doc.fontSize(11).font('Helvetica-Bold').text('B. MOVIMIENTOS DE EFECTIVO', margin, y);
                y += 20;

                y = agregarTablaSimple(y, [
                    ['Concepto', 'Monto'],
                    ['(+) Efectivo Inicial', formatearMoneda(datosReporte.movimientos_efectivo.efectivo_inicial)],
                    ['(+) Ventas en Efectivo', formatearMoneda(datosReporte.movimientos_efectivo.ventas_efectivo)],
                    ['(-) Gastos del Turno', formatearMoneda(datosReporte.movimientos_efectivo.gastos)],
                    ['(-) Comisiones Pagadas', formatearMoneda(datosReporte.movimientos_efectivo.comisiones_pagadas)],
                    ['= EFECTIVO ESPERADO', formatearMoneda(datosReporte.movimientos_efectivo.efectivo_esperado)]
                ]);

                y += 30;

                // Verificar nueva página
                if (y > pageHeight - 300) {
                    doc.addPage();
                    y = margin;
                }

                // Efectivo Final
                doc.fontSize(11).font('Helvetica-Bold').text('C. EFECTIVO FINAL (Conteo al Cierre)', margin, y);
                y += 20;

                // Billetes finales
                const billetesFinal = [['Denominación', 'Cantidad', 'Subtotal']];
                let totalBilletesFinal = 0;
                denBilletes.forEach(den => {
                    const cant = datosReporte.efectivo_final.billetes[den] || 0;
                    const subtotal = cant * parseFloat(den);
                    totalBilletesFinal += subtotal;
                    billetesFinal.push([`Q ${den}`, cant.toString(), formatearMoneda(subtotal)]);
                });
                billetesFinal.push(['Total Billetes', '', formatearMoneda(totalBilletesFinal)]);

                y = agregarTablaSimple(y, billetesFinal);
                y += 20;

                // Monedas finales
                const monedasFinal = [['Denominación', 'Cantidad', 'Subtotal']];
                let totalMonedasFinal = 0;
                denMonedas.forEach(den => {
                    const cant = datosReporte.efectivo_final.monedas[den] || 0;
                    const subtotal = cant * parseFloat(den);
                    totalMonedasFinal += subtotal;
                    monedasFinal.push([`Q ${den}`, cant.toString(), formatearMoneda(subtotal)]);
                });
                monedasFinal.push(['Total Monedas', '', formatearMoneda(totalMonedasFinal)]);

                y = agregarTablaSimple(y, monedasFinal);
                y += 20;

                doc.font('Helvetica-Bold').fontSize(10).text(`Efectivo Contado Total: ${formatearMoneda(datosReporte.efectivo_final.total)}`, margin, y);
                y += 30;

                // Resultado del cuadre
                doc.fontSize(11).font('Helvetica-Bold').text('D. RESULTADO DEL CUADRE', margin, y);
                y += 20;

                const diferencia = datosReporte.diferencias.efectivo;
                const estado = datosReporte.diferencias.estado_efectivo;
                
                let colorEstado = colors.success;
                let icono = '✓';
                if (estado === 'SOBRANTE') {
                    colorEstado = colors.warning;
                    icono = '⚠';
                } else if (estado === 'FALTANTE') {
                    colorEstado = colors.error;
                    icono = '✗';
                }

                doc.rect(margin, y, contentWidth, 80).fillAndStroke(colors.lightGray, colors.border);
                y += 15;

                doc.fillColor(colors.text).font('Helvetica').fontSize(10)
                   .text(`Efectivo Esperado: ${formatearMoneda(datosReporte.movimientos_efectivo.efectivo_esperado)}`, margin + 20, y);
                y += 15;
                doc.text(`Efectivo Contado: ${formatearMoneda(datosReporte.efectivo_final.total)}`, margin + 20, y);
                y += 15;
                doc.text(`Diferencia: ${formatearMoneda(diferencia)}`, margin + 20, y);
                y += 20;
                doc.fillColor(colorEstado).font('Helvetica-Bold')
                   .text(`${icono} Estado: ${estado}`, margin + 20, y);

                y += 50;

                // Nueva página si es necesario
                if (y > pageHeight - 300) {
                    doc.addPage();
                    y = margin;
                }

                // ============================================================
                // IMPUESTOS
                // ============================================================
                agregarSeccionHeader('IMPUESTOS Y VENTAS NETAS', y);
                y += 35;

                y = agregarTablaSimple(y, [
                    ['Método de Pago', 'Ventas', 'Impuesto', 'Tasa', 'Venta Neta'],
                    [
                        'Efectivo',
                        formatearMoneda(datosReporte.impuestos.efectivo.ventas),
                        formatearMoneda(datosReporte.impuestos.efectivo.impuesto),
                        '16%',
                        formatearMoneda(datosReporte.impuestos.efectivo.venta_neta)
                    ],
                    [
                        'Tarjeta',
                        formatearMoneda(datosReporte.impuestos.tarjeta.ventas),
                        formatearMoneda(datosReporte.impuestos.tarjeta.impuesto_total),
                        '6%+16%',
                        formatearMoneda(datosReporte.impuestos.tarjeta.venta_neta)
                    ],
                    [
                        'Transferencia',
                        formatearMoneda(datosReporte.impuestos.transferencia.ventas),
                        formatearMoneda(datosReporte.impuestos.transferencia.impuesto),
                        '16%',
                        formatearMoneda(datosReporte.impuestos.transferencia.venta_neta)
                    ],
                    [
                        'TOTALES',
                        formatearMoneda(datosReporte.resumen_ventas.venta_total),
                        formatearMoneda(datosReporte.impuestos.total_impuestos),
                        '',
                        formatearMoneda(datosReporte.impuestos.total_ventas_netas)
                    ]
                ]);

                y += 30;

                // ============================================================
                // TOTAL A DEPOSITAR
                // ============================================================
                agregarSeccionHeader('CÁLCULO DE DEPÓSITO', y);
                y += 35;

                doc.rect(margin, y, contentWidth, 80).fillAndStroke(colors.lightGray, colors.border);
                y += 15;

                doc.fillColor(colors.text).font('Helvetica').fontSize(10)
                   .text(`Ventas Netas: ${formatearMoneda(datosReporte.deposito.ventas_netas)}`, margin + 20, y);
                y += 15;
                doc.text(`(-) Gastos: ${formatearMoneda(datosReporte.deposito.gastos)}`, margin + 20, y);
                y += 15;
                doc.text(`(-) Comisiones Pagadas: ${formatearMoneda(datosReporte.deposito.comisiones)}`, margin + 20, y);
                y += 20;
                doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(12)
                   .text(`TOTAL A DEPOSITAR: ${formatearMoneda(datosReporte.deposito.total_a_depositar)}`, margin + 20, y);

                y += 40;

                // ============================================================
                // AUTORIZACIÓN (si aplica)
                // ============================================================
                if (datosReporte.autorizacion.requiere) {
                    if (y > pageHeight - 200) {
                        doc.addPage();
                        y = margin;
                    }

                    doc.rect(margin, y, contentWidth, 120).fillAndStroke('#fff7ed', colors.warning);
                    y += 15;

                    doc.fillColor(colors.warning).fontSize(12).font('Helvetica-Bold')
                       .text('⚠️  ESTE CIERRE PRESENTA DIFERENCIAS', margin + 20, y);
                    
                    y += 25;
                    doc.fillColor(colors.text).fontSize(10).font('Helvetica')
                       .text(`Autorizado por: ${datosReporte.autorizacion.autorizado_por}`, margin + 20, y);
                    
                    y += 15;
                    doc.text(`Fecha de autorización: ${formatearFecha(datosReporte.autorizacion.fecha_autorizacion)}`, margin + 20, y);
                    
                    y += 15;
                    doc.text(`Justificación:`, margin + 20, y);
                    
                    y += 15;
                    doc.fontSize(9).text(datosReporte.autorizacion.justificacion || 'No especificada', margin + 20, y, { width: contentWidth - 40 });
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