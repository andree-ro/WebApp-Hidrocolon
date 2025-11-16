// backend/src/routes/depositos.js
const express = require('express');
const router = express.Router();
const {
    registrarDeposito,
    obtenerDepositosTurno,
    verificarCuadreDepositos,
    buscarDepositoPorNumero,
    obtenerDeposito,
    actualizarDeposito,
    eliminarDeposito
} = require('../controllers/depositosController');
const { authenticate } = require('../middleware/authMiddleware');
const { verificarTurnoActivo } = require('../middleware/turnosMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticate());

// Registrar nuevo depósito (requiere turno activo)
router.post('/', verificarTurnoActivo, registrarDeposito);

// Obtener depósitos de un turno
router.get('/turno/:turno_id', obtenerDepositosTurno);

// Verificar cuadre de depósitos vs ventas
router.get('/turno/:turno_id/cuadre', verificarCuadreDepositos);

// Buscar depósito por número
router.get('/buscar/:numero_deposito', buscarDepositoPorNumero);

// Obtener un depósito específico
router.get('/:id', obtenerDeposito);

// Actualizar un depósito
router.put('/:id', actualizarDeposito);

// Eliminar un depósito
router.delete('/:id', eliminarDeposito);

module.exports = router;