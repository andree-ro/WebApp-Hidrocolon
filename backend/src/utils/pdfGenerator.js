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
}

module.exports = ComprobanteGenerator;