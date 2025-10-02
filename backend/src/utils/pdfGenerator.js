// backend/src/utils/pdfGenerator.js
const PDFDocument = require('pdfkit');

class ComprobanteGenerator {
    static async generar(venta) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ 
                    size: 'LETTER',
                    margins: { top: 50, bottom: 50, left: 50, right: 50 }
                });

                const chunks = [];
                
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // ============================================
                // ENCABEZADO
                // ============================================
                doc.fontSize(20)
                   .font('Helvetica-Bold')
                   .text('HIDROCOLON', { align: 'center' });
                
                doc.moveDown(0.5);
                
                doc.fontSize(16)
                   .font('Helvetica')
                   .text('COMPROBANTE DE VENTA', { align: 'center' });
                
                doc.moveDown(1);

                // ============================================
                // INFORMACIÓN DE LA VENTA
                // ============================================
                const startY = doc.y;
                
                doc.fontSize(10)
                   .font('Helvetica-Bold')
                   .text('Número de Factura:', 50, startY);
                doc.font('Helvetica')
                   .text(venta.numero_factura, 180, startY);

                doc.font('Helvetica-Bold')
                   .text('Fecha:', 50, startY + 15);
                doc.font('Helvetica')
                   .text(new Date(venta.fecha_creacion).toLocaleString('es-GT', {
                       dateStyle: 'long',
                       timeStyle: 'short'
                   }), 180, startY + 15);

                doc.font('Helvetica-Bold')
                   .text('Vendedor:', 50, startY + 30);
                doc.font('Helvetica')
                   .text(`${venta.vendedor_nombres} ${venta.vendedor_apellidos}`, 180, startY + 30);

                doc.font('Helvetica-Bold')
                   .text('Método de Pago:', 50, startY + 45);
                doc.font('Helvetica')
                   .text(venta.metodo_pago.toUpperCase(), 180, startY + 45);

                doc.moveDown(3);

                // ============================================
                // DATOS DEL CLIENTE
                // ============================================
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .text('DATOS DEL CLIENTE', { underline: true });
                
                doc.moveDown(0.5);
                
                doc.fontSize(10)
                   .font('Helvetica-Bold')
                   .text('Cliente:', 50);
                doc.font('Helvetica')
                   .text(venta.cliente_nombre, 120);

                doc.font('Helvetica-Bold')
                   .text('NIT:', 50);
                doc.font('Helvetica')
                   .text(venta.cliente_nit, 120);

                if (venta.cliente_telefono) {
                    doc.font('Helvetica-Bold')
                       .text('Teléfono:', 50);
                    doc.font('Helvetica')
                       .text(venta.cliente_telefono, 120);
                }

                doc.moveDown(1.5);

                // ============================================
                // TABLA DE PRODUCTOS
                // ============================================
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .text('DETALLE DE PRODUCTOS', { underline: true });
                
                doc.moveDown(0.5);

                // Encabezado de tabla
                const tableTop = doc.y;
                const col1 = 50;   // Cantidad
                const col2 = 100;  // Descripción
                const col3 = 350;  // Precio Unit.
                const col4 = 450;  // Total

                doc.fontSize(9)
                   .font('Helvetica-Bold')
                   .text('Cant.', col1, tableTop)
                   .text('Descripción', col2, tableTop)
                   .text('Precio Unit.', col3, tableTop)
                   .text('Total', col4, tableTop);

                // Línea separadora
                doc.moveTo(50, tableTop + 15)
                   .lineTo(550, tableTop + 15)
                   .stroke();

                // Productos
                let yPosition = tableTop + 25;
                doc.font('Helvetica');

                for (const item of venta.detalle) {
                    if (yPosition > 700) {
                        doc.addPage();
                        yPosition = 50;
                    }

                    doc.text(item.cantidad.toString(), col1, yPosition)
                       .text(item.producto_nombre, col2, yPosition, { width: 240 })
                       .text(`Q ${parseFloat(item.precio_unitario).toFixed(2)}`, col3, yPosition)
                       .text(`Q ${parseFloat(item.precio_total).toFixed(2)}`, col4, yPosition);

                    yPosition += 20;
                }

                // Línea antes de totales
                doc.moveTo(50, yPosition + 5)
                   .lineTo(550, yPosition + 5)
                   .stroke();

                yPosition += 20;

                // ============================================
                // TOTALES
                // ============================================
                doc.fontSize(10)
                   .font('Helvetica-Bold');

                doc.text('SUBTOTAL:', 350, yPosition)
                   .font('Helvetica')
                   .text(`Q ${parseFloat(venta.subtotal).toFixed(2)}`, 450, yPosition);

                if (parseFloat(venta.descuento) > 0) {
                    yPosition += 15;
                    doc.font('Helvetica-Bold')
                       .text('DESCUENTO:', 350, yPosition)
                       .font('Helvetica')
                       .text(`Q ${parseFloat(venta.descuento).toFixed(2)}`, 450, yPosition);
                }

                yPosition += 15;
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .text('TOTAL:', 350, yPosition)
                   .text(`Q ${parseFloat(venta.total).toFixed(2)}`, 450, yPosition);

                // ============================================
                // DETALLES DE PAGO
                // ============================================
                if (venta.metodo_pago === 'efectivo') {
                    yPosition += 20;
                    doc.fontSize(10)
                       .font('Helvetica')
                       .text('Efectivo recibido:', 350, yPosition)
                       .text(`Q ${parseFloat(venta.efectivo_recibido).toFixed(2)}`, 450, yPosition);
                    
                    yPosition += 15;
                    doc.text('Cambio:', 350, yPosition)
                       .text(`Q ${parseFloat(venta.efectivo_cambio).toFixed(2)}`, 450, yPosition);
                }

                if (venta.metodo_pago === 'mixto') {
                    yPosition += 20;
                    doc.fontSize(9)
                       .font('Helvetica');
                    
                    if (parseFloat(venta.tarjeta_monto) > 0) {
                        doc.text('Tarjeta:', 350, yPosition)
                           .text(`Q ${parseFloat(venta.tarjeta_monto).toFixed(2)}`, 450, yPosition);
                        yPosition += 12;
                    }
                    
                    if (parseFloat(venta.transferencia_monto) > 0) {
                        doc.text('Transferencia:', 350, yPosition)
                           .text(`Q ${parseFloat(venta.transferencia_monto).toFixed(2)}`, 450, yPosition);
                        yPosition += 12;
                    }
                    
                    const efectivo = parseFloat(venta.total) - parseFloat(venta.tarjeta_monto) - parseFloat(venta.transferencia_monto);
                    if (efectivo > 0) {
                        doc.text('Efectivo:', 350, yPosition)
                           .text(`Q ${efectivo.toFixed(2)}`, 450, yPosition);
                    }
                }

                // ============================================
                // PIE DE PÁGINA
                // ============================================
                doc.fontSize(8)
                   .font('Helvetica')
                   .text('Gracias por su compra', 50, 720, { align: 'center' });

                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = ComprobanteGenerator;