// backend/src/utils/pdfGenerator.js
const PDFDocument = require('pdfkit');

class ComprobanteGenerator {
    static async generar(venta) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ 
                    size: [8.5 * 72, 5.5 * 72], // Media carta horizontal: 8.5" ancho x 5.5" alto
                    margins: { top: 30, bottom: 30, left: 40, right: 40 }
                });

                const chunks = [];
                
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

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
                // INFORMACIÓN DE LA VENTA (2 COLUMNAS)
                // ============================================
                const startY = doc.y;
                
                // Columna izquierda
                doc.fontSize(8)
                   .font('Helvetica-Bold')
                   .text('Número de Factura:', 40, startY);
                doc.font('Helvetica')
                   .text(venta.numero_factura, 130, startY);

                doc.font('Helvetica-Bold')
                   .text('Fecha:', 40, startY + 12);
                doc.font('Helvetica')
                   .text(new Date(venta.fecha_creacion).toLocaleString('es-GT', {
                       dateStyle: 'medium',
                       timeStyle: 'short'
                   }), 130, startY + 12);

                // Columna derecha
                doc.font('Helvetica-Bold')
                   .text('Vendedor:', 350, startY);
                doc.font('Helvetica')
                   .text(`${venta.vendedor_nombres} ${venta.vendedor_apellidos}`, 420, startY);

                doc.font('Helvetica-Bold')
                   .text('Método de Pago:', 350, startY + 12);
                doc.font('Helvetica')
                   .text(venta.metodo_pago.toUpperCase(), 420, startY + 12);

                doc.moveDown(1.8);

                // ============================================
                // DATOS DEL CLIENTE
                // ============================================
                doc.fontSize(9)
                   .font('Helvetica-Bold')
                   .text('Cliente: ', { continued: true })
                   .font('Helvetica')
                   .text(venta.cliente_nombre, { continued: true })
                   .font('Helvetica-Bold')
                   .text(' | NIT: ', { continued: true })
                   .font('Helvetica')
                   .text(venta.cliente_nit);

                if (venta.cliente_telefono) {
                    doc.font('Helvetica-Bold')
                       .text(' | Tel: ', { continued: true })
                       .font('Helvetica')
                       .text(venta.cliente_telefono);
                }

                doc.moveDown(0.8);

                // ============================================
                // TABLA DE PRODUCTOS
                // ============================================
                const tableTop = doc.y;
                const col1 = 40;   // Cantidad
                const col2 = 80;   // Descripción
                const col3 = 450;  // Precio Unit.
                const col4 = 530;  // Total

                // Encabezado de tabla
                doc.fontSize(8)
                   .font('Helvetica-Bold')
                   .text('Cant.', col1, tableTop)
                   .text('Descripción', col2, tableTop)
                   .text('Precio Unit.', col3, tableTop)
                   .text('Total', col4, tableTop);

                // Línea separadora
                doc.moveTo(40, tableTop + 12)
                   .lineTo(580, tableTop + 12)
                   .stroke();

                // Productos
                let yPosition = tableTop + 18;
                doc.font('Helvetica')
                   .fontSize(8);

                for (const item of venta.detalle) {
                    if (yPosition > 320) {
                        doc.addPage();
                        yPosition = 50;
                    }

                    doc.text(item.cantidad.toString(), col1, yPosition)
                       .text(item.producto_nombre, col2, yPosition, { width: 360 })
                       .text(`Q ${parseFloat(item.precio_unitario).toFixed(2)}`, col3, yPosition)
                       .text(`Q ${parseFloat(item.precio_total).toFixed(2)}`, col4, yPosition);

                    yPosition += 14;
                }

                // Línea antes de totales
                doc.moveTo(40, yPosition + 3)
                   .lineTo(580, yPosition + 3)
                   .stroke();

                yPosition += 10;

                // ============================================
                // TOTALES
                // ============================================
                doc.fontSize(8)
                   .font('Helvetica-Bold');

                doc.text('SUBTOTAL:', 450, yPosition)
                   .font('Helvetica')
                   .text(`Q ${parseFloat(venta.subtotal).toFixed(2)}`, 530, yPosition);

                if (parseFloat(venta.descuento) > 0) {
                    yPosition += 12;
                    doc.font('Helvetica-Bold')
                       .text('DESCUENTO:', 450, yPosition)
                       .font('Helvetica')
                       .text(`Q ${parseFloat(venta.descuento).toFixed(2)}`, 530, yPosition);
                }

                yPosition += 12;
                doc.fontSize(9)
                   .font('Helvetica-Bold')
                   .text('TOTAL:', 450, yPosition)
                   .text(`Q ${parseFloat(venta.total).toFixed(2)}`, 530, yPosition);

                // ============================================
                // DETALLES DE PAGO
                // ============================================
                if (venta.metodo_pago === 'efectivo') {
                    yPosition += 14;
                    doc.fontSize(7)
                       .font('Helvetica')
                       .text('Efectivo recibido:', 450, yPosition)
                       .text(`Q ${parseFloat(venta.efectivo_recibido).toFixed(2)}`, 530, yPosition);
                    
                    yPosition += 10;
                    doc.text('Cambio:', 450, yPosition)
                       .text(`Q ${parseFloat(venta.efectivo_cambio).toFixed(2)}`, 530, yPosition);
                }

                if (venta.metodo_pago === 'mixto') {
                    yPosition += 14;
                    doc.fontSize(7)
                       .font('Helvetica');
                    
                    if (parseFloat(venta.tarjeta_monto) > 0) {
                        doc.text('Tarjeta:', 450, yPosition)
                           .text(`Q ${parseFloat(venta.tarjeta_monto).toFixed(2)}`, 530, yPosition);
                        yPosition += 10;
                    }
                    
                    if (parseFloat(venta.transferencia_monto) > 0) {
                        doc.text('Transferencia:', 450, yPosition)
                           .text(`Q ${parseFloat(venta.transferencia_monto).toFixed(2)}`, 530, yPosition);
                        yPosition += 10;
                    }
                    
                    const efectivo = parseFloat(venta.total) - parseFloat(venta.tarjeta_monto) - parseFloat(venta.transferencia_monto);
                    if (efectivo > 0) {
                        doc.text('Efectivo:', 450, yPosition)
                           .text(`Q ${efectivo.toFixed(2)}`, 530, yPosition);
                    }
                }

                // ============================================
                // PIE DE PÁGINA
                // ============================================
                doc.fontSize(7)
                   .font('Helvetica')
                   .text('Gracias por su compra', 40, 360, { align: 'center', width: 532 });

                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = ComprobanteGenerator;