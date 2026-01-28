// ============================================================================
// 🏥 RUTAS DEL MÓDULO PACIENTES - Sistema Hidrocolon
// Versión refactorizada siguiendo el patrón de farmacia.js y servicios.js
// ============================================================================

const express = require('express');
const router = express.Router();
const PacientesController = require('../controllers/pacientesController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware.authenticate());

console.log('🏥 Rutas pacientes cargadas con middleware de autenticación');

// ============================================================================
// 📊 RUTAS ESPECIALES (DEBEN IR ANTES DE /:id)
// ============================================================================

// GET /api/pacientes/stats/general - Estadísticas
router.get('/stats/general', PacientesController.getEstadisticas);

// GET /api/pacientes/export/excel - Exportar a Excel
router.get('/export/excel', PacientesController.exportarExcel);

// GET /api/pacientes/cumpleanos-mes - Filtro cumpleaños mes
router.get('/cumpleanos-mes', PacientesController.getCumpleanosMes);

// GET /api/pacientes/citas-manana - Filtro citas mañana
router.get('/citas-manana', PacientesController.getCitasManana);

// POST /api/pacientes/rapido - Crear paciente rápido (solo nombres, apellidos, nit)
router.post('/rapido', PacientesController.crearPacienteRapido);

// ============================================================================
// 📋 CRUD BÁSICO
// ============================================================================

// GET /api/pacientes - Listar pacientes con filtros y paginación
router.get('/', PacientesController.getPacientes);

// GET /api/pacientes/:id - Obtener paciente específico
router.get('/:id', PacientesController.getPaciente);

// POST /api/pacientes - Crear nuevo paciente
router.post('/', PacientesController.crearPaciente);

// PUT /api/pacientes/:id - Actualizar paciente
router.put('/:id', PacientesController.actualizarPaciente);

// DELETE /api/pacientes/:id - Eliminar paciente (soft delete)
router.delete('/:id', PacientesController.eliminarPaciente);

module.exports = router;