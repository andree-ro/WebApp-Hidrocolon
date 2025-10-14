// backend/src/routes/doctoras.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const doctorasController = require('../controllers/doctorasController');

// GET /api/doctoras - Listar todas las doctoras activas
router.get('/', authMiddleware.authenticate(), doctorasController.listarDoctoras);

module.exports = router;