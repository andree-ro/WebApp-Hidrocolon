// backend/src/routes/doctoras.js
const express = require('express');
const router = express.Router();
const doctorasController = require('../controllers/doctorasController');

console.log('✅ Doctoras Controller cargado correctamente');
console.log('📋 Funciones disponibles:', Object.keys(doctorasController));

// GET /api/doctoras - SIN AUTENTICACIÓN (temporal para testing)
router.get('/', doctorasController.listarDoctoras);

module.exports = router;