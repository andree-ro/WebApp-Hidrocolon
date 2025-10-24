// backend/src/routes/laboratorios.js
// Rutas para el módulo de ganancias de laboratorios del Sistema Hidrocolon

const express = require('express');
const router = express.Router();

// Importar middlewares
const authMiddleware = require('../middleware/authMiddleware');
const turnosMiddleware = require('../middleware/turnosMiddleware');

// Importar controlador
const laboratoriosController = require('../controllers/laboratoriosController');

// Middleware de autenticación simple
const simpleAuth = authMiddleware.authenticate();

console.log('🧪 Rutas de laboratorios cargadas');

// ============================================================================
// RUTAS DE DASHBOARD Y CONSULTA
// ============================================================================

// GET /api/laboratorios/dashboard - Resumen del mes actual
router.get('/dashboard',
    simpleAuth,
    laboratoriosController.obtenerResumenDashboard
);

// GET /api/laboratorios/estadisticas - Estadísticas completas con gráficas
router.get('/estadisticas',
    simpleAuth,
    laboratoriosController.obtenerEstadisticas
);

// GET /api/laboratorios/totales - Totales por período
router.get('/totales',
    simpleAuth,
    laboratoriosController.obtenerTotalesPorPeriodo
);

// GET /api/laboratorios/turno/:turno_id - Ganancias de un turno específico
router.get('/turno/:turno_id',
    simpleAuth,
    laboratoriosController.obtenerGananciasPorTurno
);

// ============================================================================
// RUTAS CRUD DE GANANCIAS
// ============================================================================

// POST /api/laboratorios - Crear nueva ganancia (REQUIERE TURNO ABIERTO)
router.post('/',
    simpleAuth,
    turnosMiddleware.validarTurnoAbierto,
    laboratoriosController.crearGanancia
);

// GET /api/laboratorios - Listar ganancias con filtros
router.get('/',
    simpleAuth,
    laboratoriosController.listarGanancias
);

// GET /api/laboratorios/:id - Obtener una ganancia específica
router.get('/:id',
    simpleAuth,
    laboratoriosController.obtenerGananciaPorId
);

// PUT /api/laboratorios/:id - Actualizar ganancia existente
router.put('/:id',
    simpleAuth,
    laboratoriosController.actualizarGanancia
);

// DELETE /api/laboratorios/:id - Eliminar ganancia
router.delete('/:id',
    simpleAuth,
    laboratoriosController.eliminarGanancia
);

// ============================================================================
// RUTAS DE CONFIGURACIÓN DE CIERRE
// ============================================================================

// PATCH /api/laboratorios/:id/incluir-cierre - Toggle incluir/excluir en reporte de cierre
router.patch('/:id/incluir-cierre',
    simpleAuth,
    laboratoriosController.cambiarEstadoIncluirEnCierre
);

// ============================================================================
// MIDDLEWARE DE LOGGING
// ============================================================================

// Middleware para logging de todas las requests
router.use((req, res, next) => {
  console.log(`🧪 [${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Middleware de manejo de errores
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de laboratorios:', error);
  
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
      message: 'La ganancia ya existe'
    });
  }

  if (error.message.includes('No hay turno abierto')) {
    return res.status(400).json({
      success: false,
      message: 'No hay turno abierto actualmente'
    });
  }

  if (error.message.includes('Ganancia no encontrada')) {
    return res.status(404).json({
      success: false,
      message: 'Ganancia de laboratorio no encontrada'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

console.log('✅ Rutas de laboratorios configuradas:');
console.log('   GET    /api/laboratorios/dashboard - Resumen del mes');
console.log('   GET    /api/laboratorios/estadisticas - Estadísticas completas');
console.log('   GET    /api/laboratorios/totales - Totales por período');
console.log('   GET    /api/laboratorios/turno/:turno_id - Ganancias por turno');
console.log('   POST   /api/laboratorios - Crear ganancia (requiere turno)');
console.log('   GET    /api/laboratorios - Listar ganancias');
console.log('   GET    /api/laboratorios/:id - Obtener ganancia específica');
console.log('   PUT    /api/laboratorios/:id - Actualizar ganancia');
console.log('   DELETE /api/laboratorios/:id - Eliminar ganancia');
console.log('   PATCH  /api/laboratorios/:id/incluir-cierre - Toggle incluir en cierre');

module.exports = router;