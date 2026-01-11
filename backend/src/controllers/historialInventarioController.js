// src/controllers/historialInventarioController.js
const historialInventario = require('../models/HistorialInventario');
const medicamento = require('../models/Medicamento');
const extra = require('../models/Extra');

class HistorialInventarioController {
    
    /**
     * GET /api/historial-inventario
     * Obtener historial completo con filtros
     */
    static async obtenerHistorial(req, res) {
        try {
            const {
                tipo_producto,
                producto_id,
                tipo_movimiento,
                fecha_inicio,
                fecha_fin,
                usuario_id,
                search,
                page = 1,
                limit = 50
            } = req.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const filtros = {
                tipo_producto,
                producto_id: producto_id ? parseInt(producto_id) : null,
                tipo_movimiento,
                fecha_inicio,
                fecha_fin,
                usuario_id: usuario_id ? parseInt(usuario_id) : null,
                search: search ? search.trim() : null,
                limit: parseInt(limit),
                offset
            };

            const historial = await historialInventario.obtenerHistorial(filtros);

            // Obtener total para paginación
            const totalFiltros = { ...filtros, limit: 10000, offset: 0 };
            const totalHistorial = await historialInventario.obtenerHistorial(totalFiltros);
            const total = totalHistorial.length;

            res.json({
                success: true,
                data: {
                    historial,
                    pagination: {
                        current_page: parseInt(page),
                        per_page: parseInt(limit),
                        total: total,
                        total_pages: Math.ceil(total / parseInt(limit))
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo historial de inventario',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * GET /api/historial-inventario/producto/:tipo/:id
     * Obtener historial de un producto específico
     */
    static async obtenerHistorialProducto(req, res) {
        try {
            const { tipo, id } = req.params;

            if (!['medicamento', 'extra'].includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de producto inválido. Debe ser "medicamento" o "extra"'
                });
            }

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de producto inválido'
                });
            }

            const historial = await historialInventario.obtenerHistorialProducto(tipo, parseInt(id));

            res.json({
                success: true,
                data: historial
            });
        } catch (error) {
            console.error('❌ Error obteniendo historial del producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo historial del producto',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * GET /api/historial-inventario/estadisticas
     * Obtener estadísticas del historial
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;

            const filtros = {
                fecha_inicio,
                fecha_fin
            };

            const estadisticas = await historialInventario.obtenerEstadisticas(filtros);

            res.json({
                success: true,
                data: estadisticas
            });
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas del historial',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * POST /api/historial-inventario/registrar-entrada
     * Registrar entrada manual de medicamento/extra
     */
    static async registrarEntrada(req, res) {
        try {
            const {
                tipo_producto,
                producto_id,
                cantidad,
                motivo,
                detalle,
                proveedor,
                numero_documento,
                costo_unitario
            } = req.body;

            const usuarioId = req.user?.id || 1;

            // Validaciones
            if (!tipo_producto || !['medicamento', 'extra'].includes(tipo_producto)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de producto inválido'
                });
            }

            if (!producto_id || isNaN(parseInt(producto_id))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de producto inválido'
                });
            }

            if (!cantidad || parseInt(cantidad) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad debe ser mayor a 0'
                });
            }

            // Obtener producto actual
            let producto;
            if (tipo_producto === 'medicamento') {
                producto = await medicamento.findById(parseInt(producto_id));
            } else {
                producto = await extra.findById(parseInt(producto_id));
            }

            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: `${tipo_producto === 'medicamento' ? 'Medicamento' : 'Extra'} no encontrado`
                });
            }

            // Calcular nuevo stock
            const stockAnterior = producto.existencias;
            const nuevoStock = stockAnterior + parseInt(cantidad);

            // Actualizar stock
            if (tipo_producto === 'medicamento') {
                await medicamento.updateStock(
                    parseInt(producto_id),
                    nuevoStock,
                    motivo || 'Entrada manual',
                    usuarioId,
                    {
                        detalle,
                        proveedor,
                        numero_documento,
                        costo_unitario: costo_unitario ? parseFloat(costo_unitario) : null
                    }
                );
            } else {
                await extra.updateStock(
                    parseInt(producto_id),
                    nuevoStock,
                    motivo || 'Entrada manual',
                    usuarioId,
                    {
                        detalle,
                        proveedor,
                        numero_documento,
                        costo_unitario: costo_unitario ? parseFloat(costo_unitario) : null
                    }
                );
            }

            res.json({
                success: true,
                message: 'Entrada registrada exitosamente',
                data: {
                    stock_anterior: stockAnterior,
                    cantidad_ingresada: parseInt(cantidad),
                    stock_nuevo: nuevoStock
                }
            });
        } catch (error) {
            console.error('❌ Error registrando entrada:', error);
            res.status(500).json({
                success: false,
                message: 'Error registrando entrada de inventario',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * POST /api/historial-inventario/registrar-salida
     * Registrar salida manual (devolución, vencimiento, etc.)
     */
    static async registrarSalida(req, res) {
        try {
            const {
                tipo_producto,
                producto_id,
                cantidad,
                tipo_salida, // 'devolucion', 'vencimiento', 'otro'
                motivo,
                detalle,
                numero_documento
            } = req.body;

            const usuarioId = req.user?.id || 1;

            // Validaciones
            if (!tipo_producto || !['medicamento', 'extra'].includes(tipo_producto)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de producto inválido'
                });
            }

            if (!producto_id || isNaN(parseInt(producto_id))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de producto inválido'
                });
            }

            if (!cantidad || parseInt(cantidad) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad debe ser mayor a 0'
                });
            }

            // Obtener producto actual
            let producto;
            if (tipo_producto === 'medicamento') {
                producto = await medicamento.findById(parseInt(producto_id));
            } else {
                producto = await extra.findById(parseInt(producto_id));
            }

            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: `${tipo_producto === 'medicamento' ? 'Medicamento' : 'Extra'} no encontrado`
                });
            }

            // Validar stock suficiente
            const stockAnterior = producto.existencias;
            if (stockAnterior < parseInt(cantidad)) {
                return res.status(400).json({
                    success: false,
                    message: 'Stock insuficiente',
                    data: {
                        stock_disponible: stockAnterior,
                        cantidad_solicitada: parseInt(cantidad)
                    }
                });
            }

            // Calcular nuevo stock
            const nuevoStock = stockAnterior - parseInt(cantidad);

            // Actualizar stock
            if (tipo_producto === 'medicamento') {
                await medicamento.updateStock(
                    parseInt(producto_id),
                    nuevoStock,
                    motivo || `Salida: ${tipo_salida}`,
                    usuarioId,
                    {
                        detalle,
                        numero_documento
                    }
                );
            } else {
                await extra.updateStock(
                    parseInt(producto_id),
                    nuevoStock,
                    motivo || `Salida: ${tipo_salida}`,
                    usuarioId,
                    {
                        detalle,
                        numero_documento
                    }
                );
            }

            res.json({
                success: true,
                message: 'Salida registrada exitosamente',
                data: {
                    stock_anterior: stockAnterior,
                    cantidad_retirada: parseInt(cantidad),
                    stock_nuevo: nuevoStock
                }
            });
        } catch (error) {
            console.error('❌ Error registrando salida:', error);
            res.status(500).json({
                success: false,
                message: 'Error registrando salida de inventario',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = HistorialInventarioController;