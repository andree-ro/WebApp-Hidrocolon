// backend/src/routes/gastos.js
// Rutas para gestión de gastos del Sistema Hidrocolon

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const gastosController = require('../controllers/gastosController');

// Middleware de autenticación
const authenticate = authMiddleware.authenticate();

console.log('💰 Rutas de gastos cargadas');

// ============================================================================
// RUTAS CRUD DE GASTOS
// ============================================================================

// POST /api/gastos - Crear nuevo gasto
router.post('/',
    authenticate,
    gastosController.crearGasto
);

// GET /api/gastos/por-fechas - Listar gastos por rango de fechas
router.get('/por-fechas',
    authenticate,
    gastosController.listarGastosPorFechas
);

// GET /api/gastos/turno/:turno_id - Listar gastos de un turno
router.get('/turno/:turno_id',
    authenticate,
    gastosController.listarGastosPorTurno
);

// GET /api/gastos/turno/:turno_id/resumen - Resumen por categoría
router.get('/turno/:turno_id/resumen',
    authenticate,
    gastosController.obtenerResumenPorCategoria
);

// GET /api/gastos/:id - Obtener gasto por ID
router.get('/:id',
    authenticate,
    gastosController.obtenerGasto
);

// PUT /api/gastos/:id - Actualizar gasto
router.put('/:id',
    authenticate,
    gastosController.actualizarGasto
);

// DELETE /api/gastos/:id - Eliminar gasto
router.delete('/:id',
    authenticate,
    gastosController.eliminarGasto
);

module.exports = router;