// backend/src/routes/doctoras.js
const express = require('express');
const router = express.Router();
const { simpleAuth } = require('../middleware/authMiddleware');
const doctorasController = require('../controllers/doctorasController');

// Verificar que las funciones existen
console.log('✅ Doctoras Controller cargado correctamente');
console.log('📋 Funciones disponibles:', Object.keys(doctorasController));

// ============================================================================
// RUTAS PÚBLICAS
// ============================================================================

// GET /api/doctoras - Listar todas las doctoras
router.get('/', simpleAuth, doctorasController.listarDoctoras);

// POST /api/doctoras - Crear nueva doctora
router.post('/', simpleAuth, doctorasController.crearDoctora);

// PUT /api/doctoras/:id - Actualizar doctora
router.put('/:id', simpleAuth, doctorasController.actualizarDoctora);

// DELETE /api/doctoras/:id - Eliminar doctora
router.delete('/:id', simpleAuth, doctorasController.eliminarDoctora);

// PUT /api/doctoras/:id/reactivar - Reactivar doctora
router.put('/:id/reactivar', simpleAuth, doctorasController.reactivarDoctora);

// GET /api/doctoras/:id - Obtener doctora específica (AL FINAL)
router.get('/:id', simpleAuth, doctorasController.obtenerDoctora);

module.exports = router;