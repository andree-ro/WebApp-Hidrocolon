// backend/src/routes/ventas.js
// Rutas para el módulo de ventas del Sistema Hidrocolon

const express = require('express');
const router = express.Router();

// Importar middlewares
const authMiddleware = require('../middleware/authMiddleware');
const turnosMiddleware = require('../middleware/turnosMiddleware');

// Importar controlador
const ventasController = require('../controllers/ventasController');

// Middleware de autenticación simple
const simpleAuth = authMiddleware.authenticate();

console.log('🛒 Rutas de ventas cargadas');

// ============================================================================
// RUTAS DE ESTADÍSTICAS Y REPORTES (sin validación de turno)
// ============================================================================

// GET /api/ventas/stats - Obtener estadísticas generales
router.get('/stats',
    simpleAuth,
    ventasController.obtenerEstadisticas
);

// GET /api/ventas/productos-mas-vendidos - Top productos
router.get('/productos-mas-vendidos',
    simpleAuth,
    ventasController.obtenerProductosMasVendidos
);

// GET /api/ventas/comisiones - Comisiones por vendedor
router.get('/comisiones',
    simpleAuth,
    ventasController.obtenerComisiones
);

// GET /api/ventas/comisiones-doctoras - Comisiones por doctora ← NUEVA
router.get('/comisiones-doctoras',
    simpleAuth,
    ventasController.obtenerComisionesPorDoctora
);

// GET /api/ventas/doctora/:doctora_id/detalle - Detalle ventas por doctora ← NUEVA
router.get('/doctora/:doctora_id/detalle',
    simpleAuth,
    ventasController.obtenerDetalleVentasPorDoctora
);

// GET /api/ventas/resumen-por-tipo - Resumen por tipo de producto
router.get('/resumen-por-tipo',
    simpleAuth,
    ventasController.obtenerResumenPorTipo
);

// GET /api/ventas/paciente/:paciente_id/historial - Historial de un paciente
router.get('/paciente/:paciente_id/historial',
    simpleAuth,
    ventasController.obtenerHistorialPaciente
);

// ============================================================================
// RUTAS CRUD DE VENTAS
// ============================================================================

// POST /api/ventas - Crear nueva venta (REQUIERE TURNO ABIERTO)
router.post('/',
    simpleAuth,
    turnosMiddleware.validarTurnoAbierto,
    ventasController.crearVenta
);

// GET /api/ventas - Listar ventas con filtros
router.get('/',
    simpleAuth,
    ventasController.listarVentas
);

// GET /api/ventas/:id/comprobante - Generar comprobante PDF (ANTES DE /:id)
router.get('/:id/comprobante',
    simpleAuth,
    ventasController.generarComprobante
);

// GET /api/ventas/:id - Obtener venta específica
router.get('/:id',
    simpleAuth,
    ventasController.obtenerVenta
);

// DELETE /api/ventas/:id/anular - Anular venta
router.delete('/:id/anular',
    simpleAuth,
    ventasController.anularVenta
);

console.log('✅ Rutas de ventas configuradas:');
console.log('   POST   /api/ventas - Crear venta (requiere turno abierto)');
console.log('   GET    /api/ventas - Listar ventas');
console.log('   GET    /api/ventas/:id - Obtener venta');
console.log('   GET    /api/ventas/:id/comprobante - Generar comprobante PDF');
console.log('   DELETE /api/ventas/:id/anular - Anular venta');
console.log('   GET    /api/ventas/stats - Estadísticas');
console.log('   GET    /api/ventas/productos-mas-vendidos');
console.log('   GET    /api/ventas/comisiones');
console.log('   GET    /api/ventas/comisiones-doctoras - NUEVO');
console.log('   GET    /api/ventas/doctora/:doctora_id/detalle - NUEVO');
console.log('   GET    /api/ventas/resumen-por-tipo');
console.log('   GET    /api/ventas/paciente/:paciente_id/historial');

module.exports = router;