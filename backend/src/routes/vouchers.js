// backend/src/routes/vouchers.js
// Rutas para gestión de vouchers de tarjeta del Sistema Hidrocolon

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const vouchersController = require('../controllers/vouchersController');

// Middleware de autenticación
const authenticate = authMiddleware.authenticate();

console.log('💳 Rutas de vouchers cargadas');

// ============================================================================
// RUTAS CRUD DE VOUCHERS
// ============================================================================

// POST /api/vouchers - Crear nuevo voucher
router.post('/',
    authenticate,
    vouchersController.crearVoucher
);

// GET /api/vouchers/turno/:turno_id - Listar vouchers de un turno
router.get('/turno/:turno_id',
    authenticate,
    vouchersController.listarVouchersPorTurno
);

// GET /api/vouchers/turno/:turno_id/cuadre - Verificar cuadre
router.get('/turno/:turno_id/cuadre',
    authenticate,
    vouchersController.verificarCuadre
);

// GET /api/vouchers/buscar/:numero_voucher - Buscar por número
router.get('/buscar/:numero_voucher',
    authenticate,
    vouchersController.buscarPorNumero
);

// GET /api/vouchers/:id - Obtener voucher por ID
router.get('/:id',
    authenticate,
    vouchersController.obtenerVoucher
);

// PUT /api/vouchers/:id - Actualizar voucher
router.put('/:id',
    authenticate,
    vouchersController.actualizarVoucher
);

// DELETE /api/vouchers/:id - Eliminar voucher
router.delete('/:id',
    authenticate,
    vouchersController.eliminarVoucher
);

module.exports = router;