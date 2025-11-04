// src/routes/extras.js
// Rutas para el módulo de extras del Sistema Hidrocolon

const express = require('express');
const router = express.Router();
const ExtrasController = require('../controllers/extrasController');

// ✅ IMPORT CORRECTO DEL MIDDLEWARE
const authMiddleware = require('../middleware/authMiddleware');
const simpleAuth = authMiddleware.authenticate();

// =====================================
// RUTAS DE EXTRAS
// =====================================

// GET /api/extras/stats - Estadísticas (ANTES de /:id)
router.get('/stats', simpleAuth, ExtrasController.getStats);

// GET /api/extras - Listar todos
router.get('/', simpleAuth, ExtrasController.getExtras);

// GET /api/extras/:id - Extra específico
router.get('/:id', simpleAuth, ExtrasController.getExtra);

// POST /api/extras - Crear extra
router.post('/', simpleAuth, ExtrasController.crearExtra);

// PUT /api/extras/:id - Actualizar extra
router.put('/:id', simpleAuth, ExtrasController.actualizarExtra);

// PUT /api/extras/:id/stock - Actualizar stock
router.put('/:id/stock', simpleAuth, ExtrasController.actualizarStock);

// DELETE /api/extras/:id - Eliminar extra
router.delete('/:id', simpleAuth, ExtrasController.eliminarExtra);

// =====================================
// MIDDLEWARE DE MANEJO DE ERRORES
// =====================================

router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de extras:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: error.details
    });
  }

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'El extra ya existe'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

console.log('🧰 Rutas de extras configuradas');

module.exports = router;