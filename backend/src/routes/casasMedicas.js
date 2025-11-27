// src/routes/casasMedicas.js
// Rutas para el módulo de casas médicas (laboratorios) del Sistema Hidrocolon

const express = require('express');
const router = express.Router();
const CasasMedicasController = require('../controllers/casasMedicasController');

// ✅ IMPORT CORRECTO DEL MIDDLEWARE
const authMiddleware = require('../middleware/authMiddleware');
const simpleAuth = authMiddleware.authenticate();

// =====================================
// RUTAS DE CASAS MÉDICAS
// =====================================

// POST /api/casas-medicas - Crear casa médica
router.post('/', simpleAuth, CasasMedicasController.crearCasaMedica);

// DELETE /api/casas-medicas/:id - Eliminar casa médica
router.delete('/:id', simpleAuth, CasasMedicasController.eliminarCasaMedica);

// =====================================
// MIDDLEWARE DE MANEJO DE ERRORES
// =====================================

router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de casas médicas:', error);
  
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
      message: 'La casa médica ya existe'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

console.log('🏭 Rutas de casas médicas configuradas');

module.exports = router;