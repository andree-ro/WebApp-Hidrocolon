// backend/src/routes/doctoras.js
const express = require('express');
const router = express.Router();
const { simpleAuth } = require('../middleware/authMiddleware');
const doctorasController = require('../controllers/doctorasController');

// ============================================================================
// RUTAS PÚBLICAS (requieren autenticación básica)
// ============================================================================

// GET /api/doctoras - Listar todas las doctoras activas
router.get('/', simpleAuth, doctorasController.listarDoctoras);

// GET /api/doctoras/:id - Obtener doctora específica
router.get('/:id', simpleAuth, doctorasController.obtenerDoctora);

// GET /api/doctoras/:id/estadisticas - Estadísticas de una doctora
// router.get('/:id/estadisticas', simpleAuth, doctorasController.obtenerEstadisticas);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN (solo admin puede crear/editar/eliminar)
// ============================================================================

// POST /api/doctoras - Crear nueva doctora
router.post('/', simpleAuth, doctorasController.crearDoctora);

// PUT /api/doctoras/:id - Actualizar doctora
router.put('/:id', simpleAuth, doctorasController.actualizarDoctora);

// DELETE /api/doctoras/:id - Eliminar (desactivar) doctora
router.delete('/:id', simpleAuth, doctorasController.eliminarDoctora);

// PUT /api/doctoras/:id/reactivar - Reactivar doctora
router.put('/:id/reactivar', simpleAuth, doctorasController.reactivarDoctora);

module.exports = router;