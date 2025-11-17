// backend/src/routes/libroBancos.js
// Rutas para el módulo de Libro de Bancos

const express = require('express');
const router = express.Router();
const libroBancosController = require('../controllers/libroBancosController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar autenticación a todas las rutas
const auth = authMiddleware.authenticate();

// ============================================================================
// RUTAS DE SALDO INICIAL
// ============================================================================

// GET /api/libro-bancos/saldo-inicial - Obtener saldo inicial
router.get('/saldo-inicial', auth, libroBancosController.obtenerSaldoInicial);

// POST /api/libro-bancos/saldo-inicial - Registrar saldo inicial
router.post('/saldo-inicial', auth, libroBancosController.registrarSaldoInicial);

// ============================================================================
// RUTAS DE SALDO ACTUAL
// ============================================================================

// GET /api/libro-bancos/saldo-actual - Calcular saldo actual
router.get('/saldo-actual', auth, libroBancosController.calcularSaldoActual);

// ============================================================================
// RUTAS DE OPERACIONES
// ============================================================================

// GET /api/libro-bancos - Listar operaciones con filtros
router.get('/', auth, libroBancosController.listarOperaciones);

// POST /api/libro-bancos - Crear nueva operación
router.post('/', auth, libroBancosController.crearOperacion);

// GET /api/libro-bancos/:id - Obtener operación por ID
router.get('/:id', auth, libroBancosController.obtenerOperacion);

// PUT /api/libro-bancos/:id - Actualizar operación
router.put('/:id', auth, libroBancosController.actualizarOperacion);

// DELETE /api/libro-bancos/:id - Eliminar operación
router.delete('/:id', auth, libroBancosController.eliminarOperacion);

// ============================================================================
// RUTAS DE REPORTES
// ============================================================================

// GET /api/libro-bancos/resumen - Obtener resumen por período
router.get('/resumen/periodo', auth, libroBancosController.obtenerResumen);

module.exports = router;