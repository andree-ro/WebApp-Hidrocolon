// backend/src/routes/depositos.js
const express = require('express');
const router = express.Router();
const depositosController = require('../controllers/depositosController');
const { authenticate } = require('../middleware/authMiddleware');
const { verificarTurnoActivo } = require('../middleware/turnosMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticate());

// Registrar nuevo depósito (requiere turno activo)
router.post('/', verificarTurnoActivo, depositosController.registrarDeposito);

// Obtener depósitos de un turno
router.get('/turno/:turno_id', depositosController.obtenerDepositosTurno);

// Verificar cuadre de depósitos vs ventas
router.get('/turno/:turno_id/cuadre', depositosController.verificarCuadreDepositos);

// Buscar depósito por número
router.get('/buscar/:numero_deposito', depositosController.buscarDepositoPorNumero);

// Obtener un depósito específico
router.get('/:id', depositosController.obtenerDeposito);

// Actualizar un depósito
router.put('/:id', depositosController.actualizarDeposito);

// Eliminar un depósito
router.delete('/:id', depositosController.eliminarDeposito);

module.exports = router;