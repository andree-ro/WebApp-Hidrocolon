// backend/src/utils/pdfGenerator.js
const PDFDocument = require('pdfkit');

class ComprobanteGenerator {
    static async generar(venta) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ 
                    size: [5.5 * 72, 8.5 * 72], // Media carta en puntos (5.5" x 8.5")
                    margins: { top: 30, bottom: 30, left: 30, right: 30 }
                });

                const chunks = [];
                
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // ============================================
                // ENCABEZADO
                // ============================================
                doc.fontSize(18)
                   .font('Helvetica-Bold')
                   .text('HIDROCOLON', { align: 'center' });
                
                doc.moveDown(0.3);
                
                doc.fontSize(14)
                   .font('Helvetica')
                   .text('COMPROBANTE DE VENTA', { align: 'center' });
                
                doc.moveDown(0.8);

                // ============================================
                // INFORMACIÓN DE LA VENTA
                // ============================================
                const startY = doc.y;
                
                doc.fontSize(9)
                   .font('Helvetica-Bold')
                   .text('Número de Factura:', 30, startY);
                doc.font('Helvetica')
                   .text(venta.numero_factura, 140, startY);

                doc.font('Helvetica-Bold')
                   .text('Fecha:', 30, startY + 12);
                doc.font('Helvetica')
                   .text(new Date(venta.fecha_creacion).toLocaleString('es-GT', {
                       dateStyle: 'medium',
                       timeStyle: 'short'
                   }), 140, startY + 12);

                doc.font('Helvetica-Bold')
                   .text('Vendedor:', 30, startY + 24);
                doc.font('Helvetica')
                   .text(`${venta.vendedor_nombres} ${venta.vendedor_apellidos}`, 140, startY + 24);

                doc.font('Helvetica-Bold')
                   .text('Método de Pago:', 30, startY + 36);
                doc.font('Helvetica')
                   .text(venta.metodo_pago.toUpperCase(), 140, startY + 36);

                doc.moveDown(2.5);

                // ============================================
                // DATOS DEL CLIENTE
                // ============================================
                doc.fontSize(10)
                   .font('Helvetica-Bold')
                   .text('DATOS DEL CLIENTE', { underline: true });
                
                doc.moveDown(0.3);
                
                doc.fontSize(9)
                   .font('Helvetica-Bold')
                   .text('Cliente:', 30);
                doc.font('Helvetica')
                   .text(venta.cliente_nombre, 80);

                doc.font('Helvetica-Bold')
                   .text('NIT:', 30);
                doc.font('Helvetica')
                   .text(venta.cliente_nit, 80);

                if (venta.cliente_telefono) {
                    doc.font('Helvetica-Bold')
                       .text('Teléfono:', 30);
                    doc.font('Helvetica')
                       .text(venta.cliente_telefono, 80);
                }

                doc.moveDown(1);

                // ============================================
                // TABLA DE PRODUCTOS
                // ============================================
                doc.fontSize(10)
                   .font('Helvetica-Bold')
                   .text('DETALLE DE PRODUCTOS', { underline: true });
                
                doc.moveDown(0.3);

                // Encabezado de tabla
                const tableTop = doc.y;
                const col1 = 30;   // Cantidad
                const col2 = 70;   // Descripción
                const col3 = 260;  // Precio Unit.
                const col4 = 330;  // Total

                doc.fontSize(8)
                   .font('Helvetica-Bold')
                   .text('Cant.', col1, tableTop)
                   .text('Descripción', col2, tableTop)
                   .text('P.Unit.', col3, tableTop)
                   .text('Total', col4, tableTop);

                // Línea separadora
                doc.moveTo(30, tableTop + 12)
                   .lineTo(370, tableTop + 12)
                   .stroke();

                // Productos
                let yPosition = tableTop + 18;
                doc.font('Helvetica');

                for (const item of venta.detalle) {
                    if (yPosition > 550) {
                        doc.addPage();
                        yPosition = 50;
                    }

                    doc.text(item.cantidad.toString(), col1, yPosition)
                       .text(item.producto_nombre, col2, yPosition, { width: 180 })
                       .text(`Q${parseFloat(item.precio_unitario).toFixed(2)}`, col3, yPosition)
                       .text(`Q${parseFloat(item.precio_total).toFixed(2)}`, col4, yPosition);

                    yPosition += 15;
                }

                // Línea antes de totales
                doc.moveTo(30, yPosition + 3)
                   .lineTo(370, yPosition + 3)
                   .stroke();

                yPosition += 12;

                // ============================================
                // TOTALES
                // ============================================
                doc.fontSize(9)
                   .font('Helvetica-Bold');

                doc.text('SUBTOTAL:', 240, yPosition)
                   .font('Helvetica')
                   .text(`Q${parseFloat(venta.subtotal).toFixed(2)}`, 330, yPosition);

                if (parseFloat(venta.descuento) > 0) {
                    yPosition += 12;
                    doc.font('Helvetica-Bold')
                       .text('DESCUENTO:', 240, yPosition)
                       .font('Helvetica')
                       .text(`Q${parseFloat(venta.descuento).toFixed(2)}`, 330, yPosition);
                }

                yPosition += 12;
                doc.fontSize(10)
                   .font('Helvetica-Bold')
                   .text('TOTAL:', 240, yPosition)
                   .text(`Q${parseFloat(venta.total).toFixed(2)}`, 330, yPosition);

                // ============================================
                // DETALLES DE PAGO
                // ============================================
                if (venta.metodo_pago === 'efectivo') {
                    yPosition += 15;
                    doc.fontSize(8)
                       .font('Helvetica')
                       .text('Efectivo recibido:', 240, yPosition)
                       .text(`Q${parseFloat(venta.efectivo_recibido).toFixed(2)}`, 330, yPosition);
                    
                    yPosition += 10;
                    doc.text('Cambio:', 240, yPosition)
                       .text(`Q${parseFloat(venta.efectivo_cambio).toFixed(2)}`, 330, yPosition);
                }

                if (venta.metodo_pago === 'mixto') {
                    yPosition += 15;
                    doc.fontSize(8)
                       .font('Helvetica');
                    
                    if (parseFloat(venta.tarjeta_monto) > 0) {
                        doc.text('Tarjeta:', 240, yPosition)
                           .text(`Q${parseFloat(venta.tarjeta_monto).toFixed(2)}`, 330, yPosition);
                        yPosition += 10;
                    }
                    
                    if (parseFloat(venta.transferencia_monto) > 0) {
                        doc.text('Transferencia:', 240, yPosition)
                           .text(`Q${parseFloat(venta.transferencia_monto).toFixed(2)}`, 330, yPosition);
                        yPosition += 10;
                    }
                    
                    const efectivo = parseFloat(venta.total) - parseFloat(venta.tarjeta_monto) - parseFloat(venta.transferencia_monto);
                    if (efectivo > 0) {
                        doc.text('Efectivo:', 240, yPosition)
                           .text(`Q${efectivo.toFixed(2)}`, 330, yPosition);
                    }
                }

                // ============================================
                // PIE DE PÁGINA
                // ============================================
                doc.fontSize(7)
                   .font('Helvetica')
                   .text('Gracias por su compra', 30, 580, { align: 'center', width: 340 });

                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = ComprobanteGenerator;