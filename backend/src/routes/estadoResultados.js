// backend/src/routes/estadoResultados.js
// Rutas para el módulo de Estado de Resultados

const express = require('express');
const router = express.Router();
const estadoResultadosController = require('../controllers/estadoResultadosController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar autenticación a todas las rutas
const auth = authMiddleware.authenticate();

// ============================================================================
// RUTAS DE ESTADO DE RESULTADOS
// ============================================================================

// GET /api/estado-resultados - Obtener estado de resultados completo
router.get('/', auth, estadoResultadosController.obtenerEstadoResultados);

// ============================================================================
// RUTAS DE CONCEPTOS PERSONALIZADOS
// ============================================================================

// GET /api/estado-resultados/conceptos - Listar conceptos
router.get('/conceptos', auth, estadoResultadosController.listarConceptos);

// POST /api/estado-resultados/conceptos - Crear concepto
router.post('/conceptos', auth, estadoResultadosController.crearConcepto);

// GET /api/estado-resultados/conceptos/:id - Obtener concepto por ID
router.get('/conceptos/:id', auth, estadoResultadosController.obtenerConcepto);

// PUT /api/estado-resultados/conceptos/:id - Actualizar concepto
router.put('/conceptos/:id', auth, estadoResultadosController.actualizarConcepto);

// DELETE /api/estado-resultados/conceptos/:id - Eliminar concepto
router.delete('/conceptos/:id', auth, estadoResultadosController.eliminarConcepto);

// ============================================================================
// RUTAS DE EXPORTACIÓN
// ============================================================================

// GET /api/estado-resultados/exportar/pdf - Exportar a PDF
router.get('/exportar/pdf', auth, estadoResultadosController.exportarPDF);

// GET /api/estado-resultados/exportar/excel - Exportar a Excel
router.get('/exportar/excel', auth, estadoResultadosController.exportarExcel);

module.exports = router;
