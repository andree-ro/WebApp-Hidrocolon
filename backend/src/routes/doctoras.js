// backend/src/routes/doctoras.js
const express = require('express');
const router = express.Router();
const { simpleAuth } = require('../middleware/authMiddleware');
const doctorasController = require('../controllers/doctorasController');

// DIAGNÓSTICO: Ver qué funciones están disponibles
console.log('🔍 Funciones disponibles en doctorasController:');
console.log(Object.keys(doctorasController));

// GET /api/doctoras - Listar todas las doctoras activas
router.get('/', simpleAuth, doctorasController.listarDoctoras);

module.exports = router;