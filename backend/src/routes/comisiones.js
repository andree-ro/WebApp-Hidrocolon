// backend/src/routes/comisiones.js
// Rutas para el módulo de comisiones de doctoras del Sistema Hidrocolon

const express = require('express');
const router = express.Router();

// Importar middlewares
const authMiddleware = require('../middleware/authMiddleware');
const turnosMiddleware = require('../middleware/turnosMiddleware');

// Importar controlador
const comisionesController = require('../controllers/comisionesController');

// Middleware de autenticación simple
const simpleAuth = authMiddleware.authenticate();

console.log('💰 Rutas de comisiones cargadas');

// ============================================================================
// RUTAS DE DASHBOARD Y CONSULTA
// ============================================================================

// GET /api/comisiones/dashboard - Dashboard con todas las doctoras y comisiones pendientes
router.get('/dashboard',
    simpleAuth,
    comisionesController.obtenerDashboard
);

// GET /api/comisiones/doctora/:doctora_id - Detalle de comisiones de una doctora
router.get('/doctora/:doctora_id',
    simpleAuth,
    comisionesController.obtenerDetalleComisionesDoctora
);

// GET /api/comisiones/acumuladas - Comisiones no pagadas por falta de efectivo
router.get('/acumuladas',
    simpleAuth,
    comisionesController.verificarComisionesAcumuladas
);

// ============================================================================
// RUTAS DE REGISTRO DE PAGOS
// ============================================================================

// POST /api/comisiones/pagar - Registrar pago de comisiones (REQUIERE TURNO ABIERTO)
router.post('/pagar',
    simpleAuth,
    turnosMiddleware.validarTurnoAbierto,
    comisionesController.registrarPago
);

// ============================================================================
// RUTAS DE HISTORIAL Y ESTADÍSTICAS
// ============================================================================

// GET /api/comisiones/historial - Historial de pagos con filtros
router.get('/historial',
    simpleAuth,
    comisionesController.obtenerHistorial
);

// GET /api/comisiones/estadisticas - Estadísticas de comisiones pagadas
router.get('/estadisticas',
    simpleAuth,
    comisionesController.obtenerEstadisticas
);

// GET /api/comisiones/pago/:id - Obtener un pago específico con detalle
router.get('/pago/:id',
    simpleAuth,
    comisionesController.obtenerPagoPorId
);

// ============================================================================
// RUTAS DE PDF
// ============================================================================

// GET /api/comisiones/pdf/:id/datos - Obtener datos formateados para PDF
router.get('/pdf/:id/datos',
    simpleAuth,
    comisionesController.obtenerDatosParaPDF
);

// POST /api/comisiones/pdf/:id/generar - Generar y descargar PDF de comisiones
router.post('/pdf/:id/generar',
    simpleAuth,
    comisionesController.generarPDF
);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN
// ============================================================================

// DELETE /api/comisiones/pago/:id/anular - Anular un pago de comisiones
router.delete('/pago/:id/anular',
    simpleAuth,
    comisionesController.anularPago
);

// ============================================================================
// MIDDLEWARE DE LOGGING
// ============================================================================

// Middleware para logging de todas las requests
router.use((req, res, next) => {
  console.log(`📋 [${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Middleware de manejo de errores
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de comisiones:', error);
  
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
      message: 'El pago ya existe'
    });
  }

  if (error.message.includes('No hay turno abierto')) {
    return res.status(400).json({
      success: false,
      message: 'No hay turno abierto actualmente'
    });
  }

  if (error.message.includes('efectivo insuficiente')) {
    return res.status(400).json({
      success: false,
      message: 'Efectivo insuficiente para pagar comisiones'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

console.log('✅ Rutas de comisiones configuradas:');
console.log('   GET    /api/comisiones/dashboard - Dashboard general');
console.log('   GET    /api/comisiones/doctora/:doctora_id - Detalle por doctora');
console.log('   GET    /api/comisiones/acumuladas - Comisiones no pagadas');
console.log('   POST   /api/comisiones/pagar - Registrar pago (requiere turno)');
console.log('   GET    /api/comisiones/historial - Historial de pagos');
console.log('   GET    /api/comisiones/estadisticas - Estadísticas');
console.log('   GET    /api/comisiones/pago/:id - Obtener pago específico');
console.log('   GET    /api/comisiones/pdf/:id/datos - Datos para PDF');
console.log('   POST   /api/comisiones/pdf/:id/generar - Generar PDF');
console.log('   DELETE /api/comisiones/pago/:id/anular - Anular pago');

module.exports = router;