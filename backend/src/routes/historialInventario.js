// src/routes/historialInventario.js
const express = require('express');
const router = express.Router();
const HistorialInventarioController = require('../controllers/historialInventarioController');
const { authenticate } = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate());

/**
 * GET /api/historial-inventario
 * Obtener historial completo con filtros
 */
router.get('/', HistorialInventarioController.obtenerHistorial);

/**
 * GET /api/historial-inventario/estadisticas
 * Obtener estadísticas del historial
 */
router.get('/estadisticas', HistorialInventarioController.obtenerEstadisticas);

/**
 * GET /api/historial-inventario/producto/:tipo/:id
 * Obtener historial de un producto específico
 * :tipo = 'medicamento' o 'extra'
 * :id = ID del producto
 */
router.get('/producto/:tipo/:id', HistorialInventarioController.obtenerHistorialProducto);

/**
 * POST /api/historial-inventario/registrar-entrada
 * Registrar entrada manual de inventario (compra, recepción, etc.)
 */
router.post('/registrar-entrada', HistorialInventarioController.registrarEntrada);

/**
 * POST /api/historial-inventario/registrar-salida
 * Registrar salida manual de inventario (devolución, vencimiento, etc.)
 */
router.post('/registrar-salida', HistorialInventarioController.registrarSalida);

module.exports = router;