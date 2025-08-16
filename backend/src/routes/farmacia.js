// src/routes/farmacia.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const FarmaciaController = require('../controllers/farmaciaController');
const { authenticate, requireRole, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiting específico para farmacia
const farmaciaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes al módulo farmacia. Intenta de nuevo en 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para operaciones críticas (crear, actualizar, eliminar)
const criticalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // 50 operaciones críticas por ventana
  message: {
    success: false,
    message: 'Demasiadas operaciones críticas. Intenta de nuevo en 15 minutos.',
    code: 'CRITICAL_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware de logging específico para farmacia
const farmaciaLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous',
      userRole: req.user?.rol || 'unknown',
      duration: `${duration}ms`,
      statusCode: res.statusCode,
      success: res.statusCode < 400
    };

    // Log específico por tipo de operación
    if (req.method === 'POST' && req.path === '/') {
      console.log('🆕 Farmacia - Nuevo medicamento:', {
        ...logData,
        action: 'create_medicamento',
        medicamento: req.body?.nombre || 'unknown'
      });
    } else if (req.method === 'PUT' && req.path.includes('/stock')) {
      console.log('📦 Farmacia - Actualización stock:', {
        ...logData,
        action: 'update_stock',
        medicamentoId: req.params.id,
        cantidad: req.body?.cantidad
      });
    } else if (req.method === 'POST' && req.path.includes('/carrito')) {
      console.log('🛒 Farmacia - Agregar a carrito:', {
        ...logData,
        action: 'add_to_cart',
        medicamentoId: req.params.id,
        cantidad: req.body?.cantidad
      });
    } else if (req.method === 'GET' && req.query.search) {
      console.log('🔍 Farmacia - Búsqueda:', {
        ...logData,
        action: 'search',
        searchTerm: req.query.search,
        filters: {
          presentacion: req.query.presentacion_id,
          laboratorio: req.query.laboratorio_id,
          stockBajo: req.query.stock_bajo,
          proximoVencer: req.query.proximo_vencer
        }
      });
    }

    originalSend.call(this, data);
  };

  next();
};

// Aplicar middleware general
router.use(farmaciaLimiter);
router.use(authenticate);
router.use(farmaciaLogger);

// =====================================
// RUTAS PÚBLICAS (solo lectura)
// =====================================

// GET /api/farmacia - Obtener medicamentos con filtros y búsqueda
router.get('/', FarmaciaController.getMedicamentos);

// GET /api/farmacia/stats - Estadísticas del módulo (requiere autenticación)
router.get('/stats', FarmaciaController.getEstadisticas);

// GET /api/farmacia/presentaciones - Obtener presentaciones
router.get('/presentaciones', FarmaciaController.getPresentaciones);

// GET /api/farmacia/laboratorios - Obtener laboratorios
router.get('/laboratorios', FarmaciaController.getLaboratorios);

// GET /api/farmacia/extras - Obtener extras
router.get('/extras', FarmaciaController.getExtras);

// GET /api/farmacia/export/excel - Exportar a Excel
router.get('/export/excel', FarmaciaController.exportarExcel);

// GET /api/farmacia/:id - Obtener medicamento específico
router.get('/:id', FarmaciaController.getMedicamento);

// =====================================
// RUTAS DE VENTA (vendedor y admin)
// =====================================

// POST /api/farmacia/:id/carrito - Agregar medicamento al carrito
router.post('/:id/carrito', FarmaciaController.agregarAlCarrito);

// =====================================
// RUTAS ADMINISTRATIVAS (solo admin)
// =====================================

// POST /api/farmacia - Crear nuevo medicamento (solo admin)
router.post('/', criticalLimiter, admin, FarmaciaController.crearMedicamento);

// PUT /api/farmacia/:id - Actualizar medicamento (solo admin)
router.put('/:id', criticalLimiter, admin, FarmaciaController.actualizarMedicamento);

// DELETE /api/farmacia/:id - Eliminar medicamento (solo admin)
router.delete('/:id', criticalLimiter, admin, FarmaciaController.eliminarMedicamento);

// PUT /api/farmacia/:id/stock - Actualizar stock (solo admin)
router.put('/:id/stock', criticalLimiter, admin, FarmaciaController.actualizarStock);

// =====================================
// MIDDLEWARE DE MANEJO DE ERRORES
// =====================================

router.use((error, req, res, next) => {
  console.error('❌ Error en ruta farmacia:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    userId: req.user?.id,
    userRole: req.user?.rol
  });

  // Errores específicos de farmacia
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un medicamento con esos datos',
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Presentación o laboratorio no válido',
      code: 'INVALID_REFERENCE'
    });
  }

  if (error.code === 'ER_BAD_NULL_ERROR') {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos obligatorios',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    message: 'Error interno en el módulo farmacia',
    code: 'INTERNAL_SERVER_ERROR',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// =====================================
// RUTAS DE DESARROLLO (solo en development)
// =====================================

if (process.env.NODE_ENV === 'development') {
  // GET /api/farmacia/debug/test - Endpoint de prueba
  router.get('/debug/test', (req, res) => {
    res.json({
      success: true,
      message: 'Módulo farmacia funcionando correctamente',
      timestamp: new Date().toISOString(),
      user: req.user || null,
      environment: process.env.NODE_ENV
    });
  });

  // GET /api/farmacia/debug/stats-extended - Estadísticas extendidas
  router.get('/debug/stats-extended', async (req, res) => {
    try {
      const Medicamento = require('../models/Medicamento');
      const stats = await Medicamento.getStats();
      const medicamentos = await Medicamento.findAll({ limit: 5 });
      
      res.json({
        success: true,
        debug: true,
        stats,
        sample_medicamentos: medicamentos,
        database_status: 'connected',
        auth_user: req.user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        debug: true,
        error: error.message,
        stack: error.stack
      });
    }
  });
}

module.exports = router;