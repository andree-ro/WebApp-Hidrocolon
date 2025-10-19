// backend/src/routes/transferencias.js
// Rutas para gestión de transferencias bancarias del Sistema Hidrocolon

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const transferenciasController = require('../controllers/transferenciasController');

// Middleware de autenticación
const authenticate = authMiddleware.authenticate();

console.log('🏦 Rutas de transferencias cargadas');

// ============================================================================
// RUTAS CRUD DE TRANSFERENCIAS
// ============================================================================

// POST /api/transferencias - Crear nueva transferencia
router.post('/',
    authenticate,
    transferenciasController.crearTransferencia
);

// GET /api/transferencias/turno/:turno_id - Listar transferencias de un turno
router.get('/turno/:turno_id',
    authenticate,
    transferenciasController.listarTransferenciasPorTurno
);

// GET /api/transferencias/turno/:turno_id/cuadre - Verificar cuadre
router.get('/turno/:turno_id/cuadre',
    authenticate,
    transferenciasController.verificarCuadre
);

// GET /api/transferencias/buscar/:numero_boleta - Buscar por boleta
router.get('/buscar/:numero_boleta',
    authenticate,
    transferenciasController.buscarPorBoleta
);

// GET /api/transferencias/:id - Obtener transferencia por ID
router.get('/:id',
    authenticate,
    transferenciasController.obtenerTransferencia
);

// PUT /api/transferencias/:id - Actualizar transferencia
router.put('/:id',
    authenticate,
    transferenciasController.actualizarTransferencia
);

// DELETE /api/transferencias/:id - Eliminar transferencia
router.delete('/:id',
    authenticate,
    transferenciasController.eliminarTransferencia
);

module.exports = router;