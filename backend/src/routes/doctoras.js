// backend/src/routes/doctoras.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const doctorasController = require('../controllers/doctorasController');

console.log('✅ Doctoras Controller cargado correctamente');
console.log('📋 Funciones disponibles:', Object.keys(doctorasController));

// Crear el middleware de autenticación UNA VEZ
const authenticate = authMiddleware.authenticate();

// ============================================================================
// RUTAS DE DOCTORAS
// ============================================================================

// GET /api/doctoras - Listar todas las doctoras (activas por defecto)
router.get('/', authenticate, doctorasController.listarDoctoras);

// GET /api/doctoras/:id - Obtener una doctora específica
router.get('/:id', authenticate, doctorasController.obtenerDoctora);

// POST /api/doctoras - Crear nueva doctora
router.post('/', authenticate, doctorasController.crearDoctora);

// PUT /api/doctoras/:id - Actualizar doctora
router.put('/:id', authenticate, doctorasController.actualizarDoctora);

// DELETE /api/doctoras/:id - Eliminar (soft delete) doctora
router.delete('/:id', authenticate, doctorasController.eliminarDoctora);

// PUT /api/doctoras/:id/reactivar - Reactivar doctora
router.put('/:id/reactivar', authenticate, doctorasController.reactivarDoctora);

// GET /api/doctoras/:id/estadisticas - Estadísticas de doctora
router.get('/:id/estadisticas', authenticate, doctorasController.obtenerEstadisticas);

console.log('✅ Rutas de doctoras configuradas');

module.exports = router;