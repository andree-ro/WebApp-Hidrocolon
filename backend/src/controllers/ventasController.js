// backend/src/controllers/ventasController.js
// Controlador para gestión de ventas del Sistema Hidrocolon

const Venta = require('../models/Venta');
const DetalleVenta = require('../models/DetalleVenta');
const { pool } = require('../config/database');
const LibroBancos = require('../models/LibroBancos');

// ============================================================================
// CREAR NUEVA VENTA
// ============================================================================
const crearVenta = async (req, res) => {
    try {
        console.log('🛒 Iniciando creación de venta');
        console.log('📦 Datos recibidos:', JSON.stringify(req.body, null, 2));

        const {
            paciente_id,
            metodo_pago,
            detalle,
            efectivo_recibido,
            tarjeta_monto,
            transferencia_monto,
            deposito_monto,
            cliente_nombre,
            cliente_telefono,
            cliente_nit,
            cliente_direccion,
            observaciones,
            // NUEVOS CAMPOS PARA REGISTRO AUTOMÁTICO
            voucher_numero,
            transferencia_numero,
            deposito_numero,
            procesador_tarjeta,
            cuotas_tarjeta
        } = req.body;

        // ============================================================================
        // VALIDACIONES
        // ============================================================================
        
        // Validar que venga el detalle
        if (!detalle || !Array.isArray(detalle) || detalle.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe incluir al menos un producto en la venta'
            });
        }

        // Validar método de pago
        const metodosValidos = ['efectivo', 'tarjeta', 'transferencia', 'deposito', 'mixto'];
        if (!metodosValidos.includes(metodo_pago)) {
            return res.status(400).json({
                success: false,
                message: 'Método de pago inválido'
            });
        }

        // Validar datos del cliente
        if (!cliente_nombre || cliente_nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre del cliente es obligatorio'
            });
        }

        // Validar estructura del detalle
        for (const item of detalle) {
            if (!item.tipo_producto || !item.producto_id || !item.cantidad || !item.precio_unitario) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos incompletos en el detalle de productos'
                });
            }

            if (item.cantidad <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `La cantidad del producto "${item.producto_nombre}" debe ser mayor a 0`
                });
            }
        }

        // Validar stock disponible para medicamentos
        for (const item of detalle) {
            if (item.tipo_producto === 'medicamento') {
                const [medicamentos] = await pool.execute(
                    'SELECT existencias, nombre FROM medicamentos WHERE id = ?',
                    [item.producto_id]
                );

                if (medicamentos.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: `Medicamento con ID ${item.producto_id} no encontrado`
                    });
                }

                const medicamento = medicamentos[0];
                if (medicamento.existencias < item.cantidad) {
                    return res.status(400).json({
                        success: false,
                        message: `Stock insuficiente para "${medicamento.nombre}". Disponible: ${medicamento.existencias}, Solicitado: ${item.cantidad}`
                    });
                }
            }
        }

        // ============================================================================
        // CALCULAR TOTALES
        // ============================================================================
        
        let subtotal = 0;
        const detalleConCalculos = [];

        for (const item of detalle) {
            const precio_total = parseFloat(item.precio_unitario) * parseInt(item.cantidad);

            detalleConCalculos.push({
                tipo_producto: item.tipo_producto,
                producto_id: item.producto_id,
                producto_nombre: item.producto_nombre,
                cantidad: parseInt(item.cantidad),
                precio_unitario: parseFloat(item.precio_unitario),
                precio_total: precio_total,
                porcentaje_comision: parseFloat(item.porcentaje_comision || 0),
                monto_comision: 0, // Se calculará después
                doctora_id: item.doctora_id || null
            });

            subtotal += precio_total;
        }

        const descuento = parseFloat(req.body.descuento || 0);
        const total = subtotal - descuento;

        // ============================================================================
        // CALCULAR COMISIONES CONSIDERANDO COMISIÓN BANCARIA SEGÚN PROCESADOR Y CUOTAS
        // ============================================================================

        // Tabla de porcentajes de comisión bancaria
        const COMISIONES_BANCARIAS = {
            neonet: { 1: 5.25, 3: 5.75, 6: 7.00 },
            bac:    { 1: 4.61, 3: 6.00, 6: 6.00 }
        };

        // Determinar % de comisión bancaria según procesador y cuotas
        let porcentajeComisionBancaria = 0;
        const procesador = procesador_tarjeta || null;
        const cuotas = parseInt(cuotas_tarjeta) || 1;

        if (procesador && COMISIONES_BANCARIAS[procesador]) {
            porcentajeComisionBancaria = COMISIONES_BANCARIAS[procesador][cuotas] || 0;
        }

        const tarjeta_monto_total = parseFloat(tarjeta_monto || 0);

        // Calcular monto de comisión bancaria
        const comision_bancaria_monto_calculado = tarjeta_monto_total * (porcentajeComisionBancaria / 100);

        // Calcular proporción de tarjeta sobre el total
        const proporcion_tarjeta = total > 0 ? tarjeta_monto_total / total : 0;
        const proporcion_otros = 1 - proporcion_tarjeta;

        // Calcular comisiones para cada item
        for (const item of detalleConCalculos) {
            const porcentaje_comision = item.porcentaje_comision;

            if (porcentaje_comision > 0) {
                const precio_item = item.precio_total;

                // Parte pagada con tarjeta de este item
                const monto_tarjeta_item = precio_item * proporcion_tarjeta;
                // Parte pagada con otros métodos
                const monto_otros_item = precio_item * proporcion_otros;

                // Comisión sobre tarjeta (restando % bancario según procesador/cuotas)
                const factor_neto = 1 - (porcentajeComisionBancaria / 100);
                const monto_tarjeta_neto = monto_tarjeta_item * factor_neto;
                const comision_tarjeta = (monto_tarjeta_neto * porcentaje_comision) / 100;

                // Comisión sobre otros métodos (sin descuento)
                const comision_otros = (monto_otros_item * porcentaje_comision) / 100;

                // Total comisión
                const comision_total = comision_tarjeta + comision_otros;

                item.monto_comision = comision_total;
            } else {
                item.monto_comision = 0;
            }
        }

        // Validar montos según método de pago
        if (metodo_pago === 'efectivo') {
            const efectivo = parseFloat(efectivo_recibido || 0);
            if (efectivo < total) {
                return res.status(400).json({
                    success: false,
                    message: `Efectivo insuficiente. Total: Q${total.toFixed(2)}, Recibido: Q${efectivo.toFixed(2)}`
                });
            }
        }

        if (metodo_pago === 'mixto') {
            const tarjeta = parseFloat(tarjeta_monto || 0);
            const transferencia = parseFloat(transferencia_monto || 0);
            const deposito = parseFloat(deposito_monto || 0);
            const efectivo = total - tarjeta - transferencia - deposito;

            if (efectivo < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Los montos de tarjeta/transferencia/depósito exceden el total de la venta'
                });
            }

            if (Math.abs((tarjeta + transferencia + deposito + efectivo) - total) > 0.01) {
                return res.status(400).json({
                    success: false,
                    message: 'La suma de los métodos de pago debe ser igual al total'
                });
            }
        }

        // ============================================================================
        // PREPARAR DATOS PARA CREAR VENTA
        // ============================================================================
        
        const ventaData = {
            turno_id: req.turno.id,
            paciente_id: paciente_id || null,
            usuario_vendedor_id: req.user.id,
            metodo_pago,
            subtotal,
            descuento,
            total,
            efectivo_recibido: (metodo_pago === 'efectivo') ? parseFloat(efectivo_recibido) : 
                   (metodo_pago === 'mixto') ? (total - parseFloat(tarjeta_monto || 0) - parseFloat(transferencia_monto || 0) - parseFloat(deposito_monto || 0)) : 0,
            efectivo_cambio: metodo_pago === 'efectivo' ? (parseFloat(efectivo_recibido) - total) : 0,
            tarjeta_monto: (metodo_pago === 'tarjeta' || metodo_pago === 'mixto') ? parseFloat(tarjeta_monto || 0) : 0,
            transferencia_monto: (metodo_pago === 'transferencia' || metodo_pago === 'mixto') ? parseFloat(transferencia_monto || 0) : 0,
            deposito_monto: (metodo_pago === 'deposito' || metodo_pago === 'mixto') ? parseFloat(deposito_monto || 0) : 0,
            cliente_nombre: cliente_nombre.trim(),
            cliente_telefono: cliente_telefono || null,
            cliente_nit: cliente_nit || 'CF',
            cliente_direccion: cliente_direccion || null,
            observaciones: observaciones || null,
            detalle: detalleConCalculos,
            // NUEVOS CAMPOS PARA REGISTRO AUTOMÁTICO
            voucher_numero: voucher_numero || null,
            transferencia_numero: transferencia_numero || null,
            deposito_numero: deposito_numero || null,
            procesador_tarjeta: procesador || null,
            cuotas_tarjeta: cuotas_tarjeta || null,
            comision_bancaria_monto: parseFloat(comision_bancaria_monto_calculado.toFixed(2)),
            comision_bancaria_porcentaje: porcentajeComisionBancaria
        };

        console.log('💾 Guardando venta:', JSON.stringify(ventaData, null, 2));

        // ============================================================================
        // CREAR VENTA
        // ============================================================================
        
        const resultado = await Venta.create(ventaData);

        console.log('✅ Venta creada exitosamente:', resultado);
        
        // Obtener la venta completa para devolverla Y generar el PDF
        const ventaCompleta = await Venta.findById(resultado.venta_id);

        // ============================================================================
        // REGISTRAR AUTOMÁTICAMENTE EN LIBRO DE BANCOS
        // ============================================================================
        try {
            const descripcion = `Venta ${resultado.numero_factura} - ${cliente_nombre} (${metodo_pago})`;
            
            // Obtener la fecha ACTUAL en zona horaria de Guatemala
            const ahora = new Date();
            
            // Crear fecha en zona horaria local de Guatemala (UTC-6)
            const offsetGuatemala = -6 * 60; // -6 horas en minutos
            const offsetLocal = ahora.getTimezoneOffset(); // offset del servidor
            const diferenciaMinutos = offsetGuatemala - offsetLocal;
            
            const fechaGuatemala = new Date(ahora.getTime() + (diferenciaMinutos * 60 * 1000));
            
            // Formatear como YYYY-MM-DD
            const year = fechaGuatemala.getFullYear();
            const month = String(fechaGuatemala.getMonth() + 1).padStart(2, '0');
            const day = String(fechaGuatemala.getDate()).padStart(2, '0');
            const fechaFormateada = `${year}-${month}-${day}`;
            
            await LibroBancos.crearOperacion({
                fecha: fechaFormateada,
                beneficiario: cliente_nombre,
                descripcion: descripcion,
                clasificacion: 'Ventas',
                tipo_operacion: 'ingreso',
                ingreso: total,
                egreso: 0,
                usuario_registro_id: req.user.id
            });
            
            console.log(`✅ Venta registrada en libro de bancos con fecha: ${fechaFormateada}`);
        } catch (libroError) {
            console.error('⚠️ Error registrando en libro de bancos (no crítico):', libroError.message);
        }

        // ============================================================================
        // ✅ GENERAR PDF AUTOMÁTICAMENTE
        // ============================================================================
        
        let pdfBase64 = null;
        
        try {
            console.log('📄 Generando PDF automáticamente...');
            const PDFGenerator = require('../utils/pdfGenerator');
            const pdfBuffer = await PDFGenerator.generar(ventaCompleta);
            pdfBase64 = pdfBuffer.toString('base64');
            console.log('✅ PDF generado correctamente');
        } catch (pdfError) {
            console.error('⚠️ Error generando PDF (no crítico):', pdfError);
            // No detenemos el proceso si falla el PDF
        }

        // ============================================================================
        // RESPUESTA CON VENTA Y PDF
        // ============================================================================
        
        res.status(201).json({
            success: true,
            message: 'Venta registrada exitosamente',
            data: {
                ...ventaCompleta,
                pdf: pdfBase64 // ✅ Agregar PDF en base64
            }
        });

    } catch (error) {
        console.error('❌ Error creando venta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar la venta',
            error: error.message
        });
    }
};



// ============================================================================
// OBTENER VENTA POR ID
// ============================================================================
const obtenerVenta = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🔍 Obteniendo venta ID: ${id}`);
        
        const venta = await Venta.findById(id);
        
        if (!venta) {
            return res.status(404).json({
                success: false,
                message: 'Venta no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: venta
        });

    } catch (error) {
        console.error('❌ Error obteniendo venta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la venta',
            error: error.message
        });
    }
};

// ============================================================================
// LISTAR VENTAS CON FILTROS
// ============================================================================
const listarVentas = async (req, res) => {
    try {
        const options = {
            page: req.query.page || 1,
            limit: req.query.limit || 20,
            fecha_inicio: req.query.fecha_inicio || null,
            fecha_fin: req.query.fecha_fin || null,
            metodo_pago: req.query.metodo_pago || null,
            turno_id: req.query.turno_id || null,
            vendedor_id: req.query.vendedor_id || null,
            numero_factura: req.query.numero_factura || null
        };

        console.log('📋 Listando ventas con filtros:', options);

        const resultado = await Venta.findAll(options);

        res.json({
            success: true,
            data: resultado.ventas,
            pagination: resultado.pagination
        });

    } catch (error) {
        console.error('❌ Error listando ventas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al listar ventas',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER ESTADÍSTICAS DE VENTAS
// ============================================================================
const obtenerEstadisticas = async (req, res) => {
    try {
        const filters = {
            fecha_inicio: req.query.fecha_inicio || null,
            fecha_fin: req.query.fecha_fin || null,
            turno_id: req.query.turno_id || null
        };

        console.log('📊 Obteniendo estadísticas con filtros:', filters);

        const estadisticas = await Venta.getEstadisticas(filters);

        res.json({
            success: true,
            data: estadisticas
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// ============================================================================
// ANULAR VENTA (Con autorización de administrador)
// ============================================================================
const anularVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo, admin_usuario, admin_password } = req.body;

        console.log(`🗑️ Iniciando anulación de venta ID: ${id}`);
        console.log(`👤 Usuario solicitante: ${req.user.nombres} ${req.user.apellidos}`);
        console.log(`🔐 Administrador autorizante: ${admin_usuario}`);

        // ============================================================================
        // VALIDACIONES
        // ============================================================================

        // 1. Validar que vengan todos los datos requeridos
        if (!motivo || motivo.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar un motivo para la anulación'
            });
        }

        if (!admin_usuario || admin_usuario.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar el usuario del administrador'
            });
        }

        if (!admin_password || admin_password.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar la contraseña del administrador'
            });
        }

        // 2. Buscar y validar el administrador
        const User = require('../models/User');
        const administrador = await User.findByEmail(admin_usuario.trim());

        if (!administrador) {
            console.log('❌ Usuario administrador no encontrado');
            return res.status(401).json({
                success: false,
                message: 'Credenciales de administrador inválidas'
            });
        }

        // 3. Validar que el usuario tenga rol de administrador
        console.log('🔍 Verificando permisos del usuario...');
        console.log('   Rol nombre:', administrador.rol_nombre);
        console.log('   Rol permisos:', administrador.rol_permisos);
        
        // Verificar si es administrador: por nombre de rol, "all", o "admin"
        const esAdmin = 
            administrador.rol_nombre?.toLowerCase().includes('admin') ||
            (administrador.rol_permisos && (
                administrador.rol_permisos.all === true ||
                administrador.rol_permisos.admin === true
            ));
        
        if (!esAdmin) {
            console.log('❌ Usuario no tiene permisos de administrador');
            return res.status(403).json({
                success: false,
                message: 'El usuario proporcionado no tiene permisos de administrador'
            });
        }
        
        console.log('✅ Usuario verificado como administrador');

        // 4. Validar la contraseña del administrador
        const passwordValida = await User.validatePassword(
            admin_password.trim(), 
            administrador.password_hash
        );

        if (!passwordValida) {
            console.log('❌ Contraseña de administrador incorrecta');
            return res.status(401).json({
                success: false,
                message: 'Contraseña de administrador incorrecta'
            });
        }

        console.log('✅ Administrador autenticado correctamente');
        console.log(`✅ Autorización concedida por: ${administrador.nombres} ${administrador.apellidos}`);

        // ============================================================================
        // ANULAR LA VENTA
        // ============================================================================

        const resultado = await Venta.anular(
            id, 
            req.user.id,           // Usuario que ejecuta la anulación
            motivo.trim(),         // Motivo de la anulación
            administrador.id       // ID del administrador que autoriza
        );

        console.log('✅ Venta anulada exitosamente:', resultado);

        res.json({
            success: true,
            message: resultado.message,
            data: {
                venta_numero: resultado.venta_numero,
                autorizador: `${administrador.nombres} ${administrador.apellidos}`,
                motivo: motivo.trim()
            }
        });

    } catch (error) {
        console.error('❌ Error anulando venta:', error);
        
        // Mensajes de error más específicos
        let mensaje = 'Error al anular la venta';
        
        if (error.message.includes('no encontrada')) {
            mensaje = 'La venta no fue encontrada';
        } else if (error.message.includes('ya fue anulada')) {
            mensaje = 'Esta venta ya fue anulada anteriormente';
        }

        res.status(500).json({
            success: false,
            message: mensaje,
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER PRODUCTOS MÁS VENDIDOS
// ============================================================================
const obtenerProductosMasVendidos = async (req, res) => {
    try {
        const options = {
            limit: req.query.limit || 10,
            tipo_producto: req.query.tipo_producto || null,
            fecha_inicio: req.query.fecha_inicio || null,
            fecha_fin: req.query.fecha_fin || null
        };

        console.log('🏆 Obteniendo productos más vendidos:', options);

        const productos = await DetalleVenta.getProductosMasVendidos(options);

        res.json({
            success: true,
            data: productos
        });

    } catch (error) {
        console.error('❌ Error obteniendo productos más vendidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos más vendidos',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER COMISIONES POR VENDEDOR
// ============================================================================
const obtenerComisiones = async (req, res) => {
    try {
        const options = {
            vendedor_id: req.query.vendedor_id || null,
            fecha_inicio: req.query.fecha_inicio || null,
            fecha_fin: req.query.fecha_fin || null,
            turno_id: req.query.turno_id || null
        };

        console.log('💰 Obteniendo comisiones por vendedor:', options);

        const comisiones = await DetalleVenta.getComisionesPorVendedor(options);

        res.json({
            success: true,
            data: comisiones
        });

    } catch (error) {
        console.error('❌ Error obteniendo comisiones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener comisiones',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER HISTORIAL DE COMPRAS DE UN PACIENTE
// ============================================================================
const obtenerHistorialPaciente = async (req, res) => {
    try {
        const { paciente_id } = req.params;
        const options = {
            page: req.query.page || 1,
            limit: req.query.limit || 20
        };

        console.log(`📜 Obteniendo historial del paciente ID: ${paciente_id}`);

        const historial = await DetalleVenta.getHistorialPaciente(paciente_id, options);

        res.json({
            success: true,
            data: historial
        });

    } catch (error) {
        console.error('❌ Error obteniendo historial del paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial del paciente',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER RESUMEN POR TIPO DE PRODUCTO
// ============================================================================
const obtenerResumenPorTipo = async (req, res) => {
    try {
        const options = {
            fecha_inicio: req.query.fecha_inicio || null,
            fecha_fin: req.query.fecha_fin || null,
            turno_id: req.query.turno_id || null
        };

        console.log('📊 Obteniendo resumen por tipo de producto:', options);

        const resumen = await DetalleVenta.getResumenPorTipoProducto(options);

        res.json({
            success: true,
            data: resumen
        });

    } catch (error) {
        console.error('❌ Error obteniendo resumen por tipo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen por tipo de producto',
            error: error.message
        });
    }
};

// ============================================================================
// GENERAR COMPROBANTE PDF
// ============================================================================
const generarComprobante = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`📄 Generando comprobante para venta ID: ${id}`);
        
        // Obtener venta completa
        const venta = await Venta.findById(id);
        
        if (!venta) {
            return res.status(404).json({
                success: false,
                message: 'Venta no encontrada'
            });
        }

        // Generar PDF
        const ComprobanteGenerator = require('../utils/pdfGenerator');
        const pdfBuffer = await ComprobanteGenerator.generar(venta);

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Comprobante-${venta.numero_factura}.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);

    } catch (error) {
        console.error('❌ Error generando comprobante:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar comprobante',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER COMISIONES POR DOCTORA
// ============================================================================
const obtenerComisionesPorDoctora = async (req, res) => {
    try {
        const { doctora_id, fecha_inicio, fecha_fin, turno_id } = req.query;

        const comisiones = await DetalleVenta.getComisionesPorDoctora({
            doctora_id,
            fecha_inicio,
            fecha_fin,
            turno_id
        });

        res.json({
            success: true,
            data: comisiones,
            total: comisiones.length
        });

    } catch (error) {
        console.error('❌ Error obteniendo comisiones por doctora:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo comisiones por doctora',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER DETALLE DE VENTAS POR DOCTORA
// ============================================================================
const obtenerDetalleVentasPorDoctora = async (req, res) => {
    try {
        const { doctora_id } = req.params;
        const { page, limit, fecha_inicio, fecha_fin } = req.query;

        const resultado = await DetalleVenta.getDetalleVentasPorDoctora(doctora_id, {
            page,
            limit,
            fecha_inicio,
            fecha_fin
        });

        res.json({
            success: true,
            data: resultado.ventas,
            pagination: resultado.pagination
        });

    } catch (error) {
        console.error('❌ Error obteniendo detalle de ventas por doctora:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo detalle de ventas por doctora',
            error: error.message
        });
    }
};

module.exports = {
    crearVenta,
    obtenerVenta,
    listarVentas,
    obtenerEstadisticas,
    anularVenta,
    obtenerProductosMasVendidos,
    obtenerComisiones,
    obtenerHistorialPaciente,
    obtenerResumenPorTipo,
    generarComprobante,
    obtenerComisionesPorDoctora,
    obtenerDetalleVentasPorDoctora
};