// src/routes/presentaciones.js
// Rutas para el módulo de presentaciones del Sistema Hidrocolon

const express = require('express');
const router = express.Router();
const PresentacionesController = require('../controllers/presentacionesController');

// ✅ IMPORT CORRECTO DEL MIDDLEWARE
const authMiddleware = require('../middleware/authMiddleware');
const simpleAuth = authMiddleware.authenticate();

// =====================================
// RUTAS DE PRESENTACIONES
// =====================================

// POST /api/presentaciones - Crear presentación
router.post('/', simpleAuth, PresentacionesController.crearPresentacion);

// DELETE /api/presentaciones/:id - Eliminar presentación
router.delete('/:id', simpleAuth, PresentacionesController.eliminarPresentacion);

// =====================================
// MIDDLEWARE DE MANEJO DE ERRORES
// =====================================

router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de presentaciones:', error);
  
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
      message: 'La presentación ya existe'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

console.log('📋 Rutas de presentaciones configuradas');

module.exports = router;