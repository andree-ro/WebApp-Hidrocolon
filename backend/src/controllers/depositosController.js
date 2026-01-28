// backend/src/controllers/depositosController.js
const Deposito = require('../models/Deposito');

/**
 * Registrar un nuevo depósito
 */
const registrarDeposito = async (req, res) => {
    try {
        const { numero_deposito, paciente_nombre, monto } = req.body;

        // Validaciones
        if (!numero_deposito || !paciente_nombre || !monto) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos: numero_deposito, paciente_nombre, monto'
            });
        }

        if (monto <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a cero'
            });
        }

        // Crear depósito
        const depositoData = {
            turno_id: req.turno.id,
            numero_deposito: numero_deposito.trim(),
            paciente_nombre: paciente_nombre.trim(),
            monto: parseFloat(monto)
        };

        const deposito = await Deposito.create(depositoData);

        res.status(201).json({
            success: true,
            message: 'Depósito registrado exitosamente',
            data: deposito
        });

    } catch (error) {
        console.error('Error al registrar depósito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar el depósito',
            error: error.message
        });
    }
};

/**
 * Obtener todos los depósitos de un turno
 */
const obtenerDepositosTurno = async (req, res) => {
    try {
        const { turno_id } = req.params;

        const depositos = await Deposito.findByTurno(turno_id);

        res.json({
            success: true,
            data: depositos
        });

    } catch (error) {
        console.error('Error al obtener depósitos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los depósitos',
            error: error.message
        });
    }
};

/**
 * Verificar cuadre de depósitos vs ventas
 */
const verificarCuadreDepositos = async (req, res) => {
    try {
        const { turno_id } = req.params;

        const cuadre = await Deposito.verificarCuadre(turno_id);

        res.json({
            success: true,
            data: cuadre
        });

    } catch (error) {
        console.error('Error al verificar cuadre:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar el cuadre de depósitos',
            error: error.message
        });
    }
};

/**
 * Buscar depósito por número
 */
const buscarDepositoPorNumero = async (req, res) => {
    try {
        const { numero_deposito } = req.params;

        const depositos = await Deposito.findByNumero(numero_deposito);

        res.json({
            success: true,
            data: depositos
        });

    } catch (error) {
        console.error('Error al buscar depósito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar el depósito',
            error: error.message
        });
    }
};

/**
 * Obtener un depósito específico
 */
const obtenerDeposito = async (req, res) => {
    try {
        const { id } = req.params;

        const deposito = await Deposito.findById(id);

        if (!deposito) {
            return res.status(404).json({
                success: false,
                message: 'Depósito no encontrado'
            });
        }

        res.json({
            success: true,
            data: deposito
        });

    } catch (error) {
        console.error('Error al obtener depósito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el depósito',
            error: error.message
        });
    }
};

/**
 * Actualizar un depósito
 */
const actualizarDeposito = async (req, res) => {
    try {
        const { id } = req.params;
        const { numero_deposito, paciente_nombre, monto } = req.body;

        // Validaciones
        if (!numero_deposito || !paciente_nombre || !monto) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos'
            });
        }

        if (monto <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a cero'
            });
        }

        const depositoData = {
            numero_deposito: numero_deposito.trim(),
            paciente_nombre: paciente_nombre.trim(),
            monto: parseFloat(monto)
        };

        const actualizado = await Deposito.update(id, depositoData);

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Depósito no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Depósito actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar depósito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el depósito',
            error: error.message
        });
    }
};

/**
 * Eliminar un depósito
 */
const eliminarDeposito = async (req, res) => {
    try {
        const { id } = req.params;

        const eliminado = await Deposito.delete(id);

        if (!eliminado) {
            return res.status(404).json({
                success: false,
                message: 'Depósito no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Depósito eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar depósito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el depósito',
            error: error.message
        });
    }
};

module.exports = {
    registrarDeposito,
    obtenerDepositosTurno,
    verificarCuadreDepositos,
    buscarDepositoPorNumero,
    obtenerDeposito,
    actualizarDeposito,
    eliminarDeposito
};