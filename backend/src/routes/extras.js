// src/routes/extras.js
// Rutas para el módulo de extras del Sistema Hidrocolon

const express = require('express');
const router = express.Router();
const ExtrasController = require('../controllers/extrasController');

// ✅ IMPORT CORRECTO DEL MIDDLEWARE
const authMiddleware = require('../middleware/authMiddleware');
// Usar el método authenticate() del middleware existente
const simpleAuth = authMiddleware.authenticate();

// =====================================
// RUTAS PÚBLICAS (con autenticación básica)
// =====================================

// GET /api/extras - Listar todos los extras
router.get('/', simpleAuth, ExtrasController.getExtras);

// GET /api/extras/stats - Estadísticas de extras
router.get('/stats', simpleAuth, ExtrasController.getStats);

// GET /api/extras/:id - Obtener extra específico
router.get('/:id', simpleAuth, ExtrasController.getExtra);

// =====================================
// RUTAS ADMINISTRATIVAS
// =====================================

// POST /api/extras - Crear nuevo extra (admin)
router.post('/', simpleAuth, ExtrasController.crearExtra);

// PUT /api/extras/:id - Actualizar extra (admin)
router.put('/:id', simpleAuth, ExtrasController.actualizarExtra);

// PUT /api/extras/:id/stock - Actualizar stock de extra (admin)
router.put('/:id/stock', simpleAuth, ExtrasController.actualizarStock);

// DELETE /api/extras/:id - Eliminar extra (admin)
router.delete('/:id', simpleAuth, ExtrasController.eliminarExtra);

// =====================================
// MIDDLEWARE DE VALIDACIÓN Y LOGGING
// =====================================

// Middleware para logging de todas las requests
router.use((req, res, next) => {
  console.log(`📝 [${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Middleware de manejo de errores
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

console.log('🧰 Rutas de extras configuradas:');
console.log(' GET /api/extras - Listar extras');
console.log(' GET /api/extras/stats - Estadísticas');
console.log(' GET /api/extras/:id - Extra específico');
console.log(' POST /api/extras - Crear extra');
console.log(' PUT /api/extras/:id - Actualizar extra');
console.log(' PUT /api/extras/:id/stock - Actualizar stock');
console.log(' DELETE /api/extras/:id - Eliminar extra');

module.exports = router;