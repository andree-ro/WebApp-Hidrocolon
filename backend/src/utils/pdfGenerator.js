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
                .text(process.env.SUCURSAL_NOMBRE || 'VIMESA CENTRAL', { align: 'center' });
                
                doc.moveDown(0.3);
                
                doc.fontSize(8)
                .font('Helvetica')
                .text(process.env.SUCURSAL_DIRECCION || '20 avenida y 9a. calle 9-20 zona 3 Quetzaltenango', { align: 'center' });
                
                doc.moveDown(0.1);
                
                doc.fontSize(8)
                .text(process.env.SUCURSAL_TELEFONO || 'PBX: 7767-1851  WHATSAPP: 3569 - 4483', { align: 'center' });
                
                doc.moveDown(0.5);
                
                doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('COMPROBANTE DE VENTA', { align: 'center' });
                
                doc.moveDown(0.5);

                // INFORMACIÓN DE LA VENTA
                const startY = doc.y;
                
                doc.fontSize(8)
                .font('Helvetica-Bold')
                .text('Comprobante:', 40, startY);
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

                // Agregar información de la doctora si existe
                const doctoraNombre = venta.detalle && venta.detalle.length > 0 && venta.detalle[0].doctora_nombre 
                    ? venta.detalle[0].doctora_nombre 
                    : 'No asignado';
                
                doc.font('Helvetica-Bold')
                .text('Doctor(a):', 40, startY + 24);
                doc.font('Helvetica')
                .text(doctoraNombre, 100, startY + 24);

                // DATOS DEL CLIENTE (ahora debajo de Doctor(a))
                doc.fontSize(8)
                .font('Helvetica-Bold')
                .text('Cliente:', 40, startY + 36);
                doc.font('Helvetica')
                .text(venta.cliente_nombre + ' | NIT: ' + venta.cliente_nit, 100, startY + 36);

                doc.moveDown(1.5);

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
                    if (parseFloat(venta.tarjeta_monto || 0) > 0) detalles.push(`Tarjeta: Q${parseFloat(venta.tarjeta_monto).toFixed(2)}`);
                    if (parseFloat(venta.transferencia_monto || 0) > 0) detalles.push(`Transf: Q${parseFloat(venta.transferencia_monto).toFixed(2)}`);
                    if (parseFloat(venta.deposito_monto || 0) > 0) detalles.push(`Depósito: Q${parseFloat(venta.deposito_monto).toFixed(2)}`);
                    const efectivo = parseFloat(venta.total) - parseFloat(venta.tarjeta_monto || 0) - parseFloat(venta.transferencia_monto || 0) - parseFloat(venta.deposito_monto || 0);
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
                    border: '#cbd5e1',
                    // Nuevos colores para los cierres
                    cierreConImpuestos: '#1e40af',      // Azul oscuro
                    fondoCierreConImpuestos: '#dbeafe', // Azul claro
                    cierreNeto: '#15803d',              // Verde oscuro
                    fondoCierreNeto: '#dcfce7'          // Verde claro
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
                .text(process.env.SUCURSAL_NOMBRE || 'HIDROCOLON XELA - VIMESA ZONA 3', margin, y, { align: 'center', width: contentWidth });
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
                    const colWidths = [22, 100, 25, 45, 45, 45, 45, 45, 55, 45, 30];
                    const headers = ['ID', 'Nombre', 'Cant', 'Tarjeta', 'Efectivo', 'Transfer', 'Depósito', 'Total', 'Usuario', 'Procesador', 'Cuotas'];
                    
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
                            prod.producto_nombre.substring(0, 18),
                            prod.cantidad.toString(),
                            formatearMoneda(prod.tarjeta || 0),
                            formatearMoneda(prod.efectivo || 0),
                            formatearMoneda(prod.transferencia || 0),
                            formatearMoneda(prod.deposito || 0),
                            formatearMoneda(prod.precio_total),
                            prod.usuario.substring(0, 10),
                            prod.procesador_tarjeta ? prod.procesador_tarjeta.toUpperCase() : '-',
                            prod.cuotas_tarjeta ? prod.cuotas_tarjeta.toString() : '-'
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
                // SECCIÓN 2: RESUMEN
                // ============================================================
                y = nuevaPaginaSiNecesario(200);
                y = agregarSeccionHeader('RESUMEN', y);
                y += 10;

                // Calcular datos
                const comisionBancariaTotal = datosReporte.impuestos.tarjeta.comision || 0;
                const impuestoEfectivo = datosReporte.impuestos.efectivo.impuesto || 0;
                const impuestoTarjeta = datosReporte.impuestos.tarjeta.impuesto_restante || 0;
                const impuestoTransferencia = datosReporte.impuestos.transferencia.impuesto || 0;
                const impuestoDeposito = datosReporte.impuestos.depositos?.impuesto || 0;
                const impuestoTC_Dep_Trans = impuestoTarjeta + impuestoTransferencia + impuestoDeposito;

                const ventasTarjeta = datosReporte.resumen_ventas.ventas_tarjeta || 0;
                const ventasEfectivo = datosReporte.resumen_ventas.ventas_efectivo || 0;
                const ventasTransferencia = datosReporte.resumen_ventas.ventas_transferencia || 0;
                const ventasDeposito = datosReporte.resumen_ventas.ventas_deposito || 0;
                const ventasTotal = datosReporte.resumen_ventas.venta_total || 0;

                const totalIngresoDiaTarjeta = ventasTarjeta - comisionBancariaTotal - impuestoTarjeta;
                const totalIngresoDiaEfectivo = ventasEfectivo - impuestoEfectivo;
                const totalIngresoDiaTransferencia = ventasTransferencia - impuestoTransferencia;
                const totalIngresoDiaDeposito = ventasDeposito - impuestoDeposito;
                const totalIngresoDia = totalIngresoDiaTarjeta + totalIngresoDiaEfectivo + totalIngresoDiaTransferencia + totalIngresoDiaDeposito;

                // Encabezados de tabla resumen
                const colResumen = [130, 100, 100, 102];
                const headersResumen = ['Descripción', 'Ingresos Brutos', 'Comisión BC TC', 'Impuestos', 'Total Ingreso del día'];
                const colResumenFull = [130, 95, 95, 95, 117];

                doc.rect(margin, y, contentWidth, 18).fillAndStroke(colors.primary, colors.border);
                let xR = margin;
                doc.fontSize(7).font('Helvetica-Bold');
                headersResumen.forEach((h, i) => {
                    doc.fillColor('#ffffff').text(h, xR + 2, y + 5, { width: colResumenFull[i] - 4, align: i === 0 ? 'left' : 'center' });
                    xR += colResumenFull[i];
                });
                y += 18;

                // Filas del resumen
                const filasResumen = [
                    ['Tarjeta',        ventasTarjeta,        comisionBancariaTotal, impuestoTarjeta,        totalIngresoDiaTarjeta],
                    ['Efectivo',       ventasEfectivo,       0,                     impuestoEfectivo,        totalIngresoDiaEfectivo],
                    ['Transferencia',  ventasTransferencia,  0,                     impuestoTransferencia,   totalIngresoDiaTransferencia],
                    ['Depósito',       ventasDeposito,       0,                     impuestoDeposito,        totalIngresoDiaDeposito],
                ];

                doc.fontSize(8).font('Helvetica');
                filasResumen.forEach(([desc, bruto, comision, impuesto, total], idx) => {
                    const bg = idx % 2 === 0 ? '#ffffff' : colors.lightGray;
                    doc.rect(margin, y, contentWidth, 14).fillAndStroke(bg, colors.border);
                    let xF = margin;
                    const vals = [desc, formatearMoneda(bruto), comision > 0 ? formatearMoneda(comision) : '-', formatearMoneda(impuesto), formatearMoneda(total)];
                    vals.forEach((v, i) => {
                        doc.fillColor(colors.text).text(v, xF + 3, y + 3, { width: colResumenFull[i] - 6, align: i === 0 ? 'left' : 'center' });
                        xF += colResumenFull[i];
                    });
                    y += 14;
                });

                // Fila total
                doc.rect(margin, y, contentWidth, 16).fillAndStroke(colors.lightGray, colors.border);
                let xT = margin;
                const totalesResumen = ['Total de Ingresos Brutos', formatearMoneda(ventasTotal), formatearMoneda(comisionBancariaTotal), formatearMoneda(impuestoEfectivo + impuestoTarjeta + impuestoTransferencia + impuestoDeposito), formatearMoneda(totalIngresoDia)];
                doc.fontSize(8).font('Helvetica-Bold');
                totalesResumen.forEach((v, i) => {
                    doc.fillColor(colors.text).text(v, xT + 3, y + 4, { width: colResumenFull[i] - 6, align: i === 0 ? 'left' : 'center' });
                    xT += colResumenFull[i];
                });
                y += 25;

                // ============================================================
                // SECCIÓN 3: RESUMEN PARA DEPÓSITO
                // ============================================================
                y = nuevaPaginaSiNecesario(250);
                y = agregarSeccionHeader('RESUMEN PARA DEPÓSITO', y);
                y += 15;

                const totalGastos = parseFloat(datosReporte.gastos_resumen?.total) || 0;
                const totalComisiones = parseFloat(datosReporte.deposito?.comisiones) || 0;
                const ingresoTransferenciaNeto = ventasTransferencia - impuestoTransferencia;
                const ingresoDepositoNeto = ventasDeposito - impuestoDeposito;
                const ingresosTarjetaDeduccion = ventasTarjeta - impuestoTarjeta;

                const totalADepositar = ventasTotal - ingresosTarjetaDeduccion - impuestoTC_Dep_Trans - totalGastos - totalComisiones - ingresoTransferenciaNeto - ingresoDepositoNeto;

                const itemsDeposito = [
                    { label: 'Total de ingresos', valor: formatearMoneda(ventasTotal), esTitulo: true },
                    { label: '(-) Ingresos Tarjeta', valor: formatearMoneda(ingresosTarjetaDeduccion), esDed: true },
                    { label: '(-) Impuestos TC/Depósito/Transferencia', valor: formatearMoneda(impuestoTC_Dep_Trans), esDed: true },
                    { label: '(-) Gastos', valor: formatearMoneda(totalGastos), esDed: true },
                    { label: '(-) Comisiones Dr(a)', valor: formatearMoneda(totalComisiones), esDed: true },
                    { label: '(-) Ingreso Transferencia', valor: formatearMoneda(ingresoTransferenciaNeto), esDed: true },
                    { label: '(-) Ingreso Depósito', valor: formatearMoneda(ingresoDepositoNeto), esDed: true },
                ];

                const colLabel = 300;
                const colValor = contentWidth - colLabel;

                itemsDeposito.forEach(({ label, valor, esTitulo }) => {
                    doc.fontSize(esTitulo ? 10 : 9)
                       .font(esTitulo ? 'Helvetica-Bold' : 'Helvetica')
                       .fillColor(colors.text)
                       .text(label, margin + 10, y, { width: colLabel });
                    doc.fontSize(esTitulo ? 10 : 9)
                       .font(esTitulo ? 'Helvetica-Bold' : 'Helvetica')
                       .fillColor(esTitulo ? colors.primary : colors.text)
                       .text(valor, margin + colLabel, y, { width: colValor - 10, align: 'right' });
                    y += esTitulo ? 16 : 14;
                });

                // Línea separadora
                y += 5;
                doc.moveTo(margin + 10, y).lineTo(pageWidth - margin - 10, y).lineWidth(1).stroke(colors.border);
                y += 10;

                // TOTAL A DEPOSITAR - vistoso en verde
                doc.rect(margin + 10, y - 2, contentWidth - 20, 38).fillAndStroke('#dcfce7', '#15803d');
                doc.lineWidth(3);
                doc.rect(margin + 10, y - 2, contentWidth - 20, 38).stroke('#15803d');
                doc.lineWidth(1);

                doc.fontSize(14).fillColor('#15803d').font('Helvetica-Bold')
                .text('TOTAL A DEPOSITAR', margin + 20, y + 10, { width: colLabel - 10 });
                doc.fontSize(16).text(formatearMoneda(totalADepositar), margin + colLabel, y + 9, { width: colValor - 20, align: 'right' });
                y += 45;

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
                // ============================================================
                // LÓGICA DE AJUSTE DINÁMICO SEGÚN CANTIDAD DE PRODUCTOS
                // ============================================================
                const cantidadProductos = datosPDF.ventas_agrupadas ? datosPDF.ventas_agrupadas.length : 0;
                
                // Configuración dinámica según cantidad de productos
                let config = {
                    tablaFontSize: 8,
                    tablaRowHeight: 16,
                    headerFontSize: 11,
                    espacioEntreEncabezado: 30,
                    espacioAntesObservaciones: 10,
                    espacioAntesRecibo: 15,
                    espacioAntesFirmas: 30
                };
                
                if (cantidadProductos > 35) {
                    // Ultra compacto (36+ productos)
                    config = {
                        tablaFontSize: 5.5,
                        tablaRowHeight: 9,
                        headerFontSize: 9,
                        espacioEntreEncabezado: 10,
                        espacioAntesObservaciones: 3,
                        espacioAntesRecibo: 5,
                        espacioAntesFirmas: 10
                    };
                } else if (cantidadProductos > 25) {
                    // Muy compacto (26-35 productos)
                    config = {
                        tablaFontSize: 6,
                        tablaRowHeight: 10,
                        headerFontSize: 9,
                        espacioEntreEncabezado: 12,
                        espacioAntesObservaciones: 4,
                        espacioAntesRecibo: 6,
                        espacioAntesFirmas: 12
                    };
                } else if (cantidadProductos > 15) {
                    // Compacto (16-25 productos)
                    config = {
                        tablaFontSize: 6.5,
                        tablaRowHeight: 11,
                        headerFontSize: 10,
                        espacioEntreEncabezado: 15,
                        espacioAntesObservaciones: 5,
                        espacioAntesRecibo: 8,
                        espacioAntesFirmas: 15
                    };
                    // Muy compacto (31-40 productos)
                    config = {
                        tablaFontSize: 6.5,
                        tablaRowHeight: 11,
                        headerFontSize: 10,
                        espacioEntreEncabezado: 20,
                        espacioAntesObservaciones: 6,
                        espacioAntesRecibo: 10,
                        espacioAntesFirmas: 20
                    };
                } else if (cantidadProductos > 20) {
                    // Compacto (21-30 productos)
                    config = {
                        tablaFontSize: 7,
                        tablaRowHeight: 13,
                        headerFontSize: 10,
                        espacioEntreEncabezado: 25,
                        espacioAntesObservaciones: 8,
                        espacioAntesRecibo: 12,
                        espacioAntesFirmas: 25
                    };
                }
                
                console.log(`📊 Cantidad de productos: ${cantidadProductos} | Usando configuración: ${cantidadProductos > 40 ? 'ULTRA-COMPACTO' : cantidadProductos > 30 ? 'MUY-COMPACTO' : cantidadProductos > 20 ? 'COMPACTO' : 'NORMAL'}`);

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
                    
                    // Agregar T12:00:00 para evitar problemas de zona horaria
                    const fechaStr = typeof fecha === 'string' && !fecha.includes('T') 
                        ? fecha + 'T12:00:00' 
                        : fecha;
                    
                    return new Date(fechaStr).toLocaleDateString('es-GT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'America/Guatemala'
                    });
                };

                // ============================================================
                // ENCABEZADO
                // ============================================================
                doc.fontSize(14).fillColor(colors.primary).font('Helvetica-Bold')
                .text(process.env.SUCURSAL_NOMBRE || 'HIDROCOLON XELA - VIMESA', margin, y, { align: 'center', width: contentWidth });
                y += 16;

                doc.fontSize(12).text('PAGO DE COMISIONES', margin, y, { align: 'center', width: contentWidth });
                y += config.espacioEntreEncabezado + 5;

                // RANGO DE FECHAS EN MAYÚSCULAS - Agregar T12:00:00 para evitar desfase
                const fechaInicioString = datosPDF.fecha_inicio instanceof Date 
                    ? datosPDF.fecha_inicio.toISOString().split('T')[0] 
                    : datosPDF.fecha_inicio;
                const fechaFinString = datosPDF.fecha_fin instanceof Date 
                    ? datosPDF.fecha_fin.toISOString().split('T')[0] 
                    : datosPDF.fecha_fin;
                
                const fechaInicioAjustada = fechaInicioString && !fechaInicioString.includes('T') 
                    ? fechaInicioString + 'T12:00:00' 
                    : fechaInicioString;
                const fechaFinAjustada = fechaFinString && !fechaFinString.includes('T') 
                    ? fechaFinString + 'T12:00:00' 
                    : fechaFinString;
                
                const fechaInicioStr = formatearFechaLarga(fechaInicioAjustada).toUpperCase();
                const fechaFinStr = formatearFechaLarga(fechaFinAjustada).toUpperCase();

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

                // Encabezados de tabla
                const colWidths = [220, 50, 80, 60, 82];
                const headers = ['Producto/Servicio', 'Cant', 'P.Unit.', 'Com %', 'Total Com.'];
                
                doc.rect(margin, y, contentWidth, 18).fillAndStroke(colors.primary, colors.border);
                
                let xPos = margin;
                doc.fontSize(config.tablaFontSize).font('Helvetica-Bold');
                headers.forEach((header, i) => {
                    doc.fillColor('#ffffff').text(header, xPos + 4, y + 5, { 
                        width: colWidths[i] - 8, 
                        align: i === 0 ? 'left' : 'center' 
                    });
                    xPos += colWidths[i];
                });
                y += 18;

                // Datos de productos
                doc.fontSize(config.tablaFontSize).fillColor(colors.text).font('Helvetica');

                if (datosPDF.ventas_agrupadas && datosPDF.ventas_agrupadas.length > 0) {
                    datosPDF.ventas_agrupadas.forEach((item, idx) => {
                        // Nueva página si es necesario
                        if (y > pageHeight - 200) {
                            doc.addPage();
                            y = margin + 20;
                        }

                        const bgColor = idx % 2 === 0 ? '#ffffff' : colors.lightGray;
                        doc.rect(margin, y, contentWidth, config.tablaRowHeight).fillAndStroke(bgColor, colors.border);

                        let xPos = margin;
                        const valores = [
                            (item.producto_nombre || 'Sin nombre').substring(0, 38),
                            (item.cantidad_total || 0).toString(),
                            formatearMoneda(item.precio_promedio || 0),
                            `${parseFloat(item.comision_porcentaje || 0).toFixed(2)}%`,  // ← Cambiar aquí
                            formatearMoneda(item.total_comision || 0)
                        ];
                        valores.forEach((val, i) => {
                            doc.fillColor(colors.text).text(val, xPos + 4, y + 4, { 
                                width: colWidths[i] - 8, 
                                align: i === 0 ? 'left' : 'center' 
                            });
                            xPos += colWidths[i];
                        });

                        y += config.tablaRowHeight;
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
                y += config.espacioAntesRecibo;
                
                const montoEnLetras = formatearMoneda(datosPDF.monto_total);
                
                // Agregar T12:00:00 para evitar desfase
                const fechaInicioTextoString = datosPDF.fecha_inicio instanceof Date 
                    ? datosPDF.fecha_inicio.toISOString().split('T')[0] 
                    : datosPDF.fecha_inicio;
                const fechaFinTextoString = datosPDF.fecha_fin instanceof Date 
                    ? datosPDF.fecha_fin.toISOString().split('T')[0] 
                    : datosPDF.fecha_fin;
                
                const fechaInicioParaTexto = fechaInicioTextoString && !fechaInicioTextoString.includes('T') 
                    ? fechaInicioTextoString + 'T12:00:00' 
                    : fechaInicioTextoString;
                const fechaFinParaTexto = fechaFinTextoString && !fechaFinTextoString.includes('T') 
                    ? fechaFinTextoString + 'T12:00:00' 
                    : fechaFinTextoString;
                
                const fechaInicioTexto = formatearFechaLarga(fechaInicioParaTexto).toUpperCase();
                const fechaFinTexto = formatearFechaLarga(fechaFinParaTexto).toUpperCase();
                const fechaHoy = formatearFechaLarga(new Date());

                doc.fontSize(9).fillColor(colors.text).font('Helvetica')
                   .text(
                       `RECIBÍ DE ${process.env.SUCURSAL_NOMBRE || 'VIMESA'} LA CANTIDAD DE ${montoEnLetras} EN CONCEPTO DE COMISIONES POR VENTAS Y SERVICIOS REALIZADOS DEL ${fechaInicioTexto} AL ${fechaFinTexto} DE ACUERDO AL DETALLE ANTERIOR.`,
                       margin,
                       y,
                       { width: contentWidth, align: 'justify' }
                   );
                
                y += 40;

                // ============================================================
                // OBSERVACIONES
                // ============================================================
                y += config.espacioAntesObservaciones;
                doc.fontSize(9).fillColor(colors.text).font('Helvetica-Bold')
                   .text('Observaciones:', margin, y);
                y += 12;
                
                // Determinar qué mostrar
                const textoObservaciones = datosPDF.observaciones && datosPDF.observaciones.trim() !== '' 
                    ? datosPDF.observaciones 
                    : 'No se agregaron observaciones';
                
                doc.font('Helvetica').fontSize(8)
                   .text(textoObservaciones, margin, y, { width: contentWidth });
                y += 25;

                // ============================================================
                // FIRMAS - SOLUCIÓN DINÁMICA CON VALIDACIÓN
                // ============================================================
                
                // Añadir espacio después de observaciones
                y += config.espacioAntesFirmas;
                
                // Espacio necesario para las firmas (estimado):
                // - Firma: 25px
                // - Nombre: 25px  
                // - Fecha: 25px
                // - Pie de página: 25px
                // - Margen de seguridad: 50px
                // TOTAL: ~150px
                const espacioNecesarioParaFirmas = 150;
                const espacioDisponible = pageHeight - margin - y;
            

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
                doc.fontSize(8).fillColor(colors.text).font('Helvetica-Bold')
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