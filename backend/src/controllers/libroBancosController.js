// backend/src/controllers/libroBancosController.js
// Controlador para gestión del Libro de Bancos del Sistema Hidrocolon

const LibroBancos = require('../models/LibroBancos');

// ============================================================================
// OBTENER SALDO INICIAL
// ============================================================================
const obtenerSaldoInicial = async (req, res) => {
    try {
        const saldoInicial = await LibroBancos.obtenerSaldoInicial();

        if (!saldoInicial) {
            return res.json({
                success: true,
                data: null,
                message: 'No se ha registrado un saldo inicial'
            });
        }

        res.json({
            success: true,
            data: saldoInicial
        });

    } catch (error) {
        console.error('❌ Error obteniendo saldo inicial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener saldo inicial',
            error: error.message
        });
    }
};

// ============================================================================
// REGISTRAR SALDO INICIAL
// ============================================================================
const registrarSaldoInicial = async (req, res) => {
    try {
        const { saldo_inicial, observaciones } = req.body;

        // Validaciones
        if (saldo_inicial === undefined || saldo_inicial === null) {
            return res.status(400).json({
                success: false,
                message: 'El saldo inicial es requerido'
            });
        }

        const saldoNumerico = parseFloat(saldo_inicial);
        if (isNaN(saldoNumerico)) {
            return res.status(400).json({
                success: false,
                message: 'El saldo inicial debe ser un número válido'
            });
        }

        const resultado = await LibroBancos.registrarSaldoInicial(
            saldoNumerico,
            req.user.id,
            observaciones
        );

        res.status(201).json(resultado);

    } catch (error) {
        console.error('❌ Error registrando saldo inicial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar saldo inicial',
            error: error.message
        });
    }
};

// ============================================================================
// CALCULAR SALDO ACTUAL
// ============================================================================
const calcularSaldoActual = async (req, res) => {
    try {
        const { fecha_hasta } = req.query;

        const saldoActual = await LibroBancos.calcularSaldoActual(fecha_hasta);

        res.json({
            success: true,
            data: saldoActual
        });

    } catch (error) {
        console.error('❌ Error calculando saldo actual:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calcular saldo actual',
            error: error.message
        });
    }
};

// ============================================================================
// CREAR OPERACIÓN
// ============================================================================
const crearOperacion = async (req, res) => {
    try {
        const {
            fecha,
            beneficiario,
            descripcion,
            clasificacion,
            tipo_operacion,
            numero_cheque,
            numero_deposito,
            ingreso,
            egreso
        } = req.body;

        // Validaciones
        if (!fecha || !beneficiario || !descripcion || !tipo_operacion) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: fecha, beneficiario, descripcion, tipo_operacion'
            });
        }

        if (!['ingreso', 'egreso'].includes(tipo_operacion)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de operación inválido. Debe ser "ingreso" o "egreso"'
            });
        }

        // Validar que si es ingreso, tenga monto en ingreso
        if (tipo_operacion === 'ingreso' && (!ingreso || parseFloat(ingreso) <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Para operaciones de ingreso, el monto de ingreso debe ser mayor a 0'
            });
        }

        // Validar que si es egreso, tenga monto en egreso
        if (tipo_operacion === 'egreso' && (!egreso || parseFloat(egreso) <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Para operaciones de egreso, el monto de egreso debe ser mayor a 0'
            });
        }

        const datosOperacion = {
            fecha,
            beneficiario: beneficiario.trim(),
            descripcion: descripcion.trim(),
            clasificacion: clasificacion ? clasificacion.trim() : null,
            tipo_operacion,
            numero_cheque: numero_cheque ? numero_cheque.trim() : null,
            numero_deposito: numero_deposito ? numero_deposito.trim() : null,
            ingreso: tipo_operacion === 'ingreso' ? parseFloat(ingreso) : 0,
            egreso: tipo_operacion === 'egreso' ? parseFloat(egreso) : 0,
            usuario_registro_id: req.user.id
        };

        const resultado = await LibroBancos.crearOperacion(datosOperacion);

        res.status(201).json(resultado);

    } catch (error) {
        console.error('❌ Error creando operación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear operación',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER OPERACIÓN POR ID
// ============================================================================
const obtenerOperacion = async (req, res) => {
    try {
        const { id } = req.params;

        const operacion = await LibroBancos.obtenerPorId(id);

        if (!operacion) {
            return res.status(404).json({
                success: false,
                message: 'Operación no encontrada'
            });
        }

        res.json({
            success: true,
            data: operacion
        });

    } catch (error) {
        console.error('❌ Error obteniendo operación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener operación',
            error: error.message
        });
    }
};

// ============================================================================
// LISTAR OPERACIONES
// ============================================================================
const listarOperaciones = async (req, res) => {
    try {
        const {
            fecha_inicio,
            fecha_fin,
            tipo_operacion,
            beneficiario,
            limit
        } = req.query;

        const filtros = {
            fecha_inicio,
            fecha_fin,
            tipo_operacion,
            beneficiario,
            limit: limit ? parseInt(limit) : null
        };

        const operaciones = await LibroBancos.listar(filtros);

        res.json({
            success: true,
            data: operaciones,
            total: operaciones.length
        });

    } catch (error) {
        console.error('❌ Error listando operaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al listar operaciones',
            error: error.message
        });
    }
};

// ============================================================================
// ACTUALIZAR OPERACIÓN
// ============================================================================
const actualizarOperacion = async (req, res) => {
    try {
        const { id } = req.params;
        const datosActualizacion = { ...req.body };

        // Validar tipo_operacion si se proporciona
        if (datosActualizacion.tipo_operacion && 
            !['ingreso', 'egreso'].includes(datosActualizacion.tipo_operacion)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de operación inválido'
            });
        }

        const resultado = await LibroBancos.actualizar(id, datosActualizacion);

        res.json(resultado);

    } catch (error) {
        console.error('❌ Error actualizando operación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar operación',
            error: error.message
        });
    }
};

// ============================================================================
// ELIMINAR OPERACIÓN
// ============================================================================
const eliminarOperacion = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await LibroBancos.eliminar(id);

        res.json(resultado);

    } catch (error) {
        console.error('❌ Error eliminando operación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar operación',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER RESUMEN POR PERÍODO
// ============================================================================
const obtenerResumen = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren fecha_inicio y fecha_fin'
            });
        }

        const resumen = await LibroBancos.obtenerResumen(fecha_inicio, fecha_fin);

        res.json({
            success: true,
            data: resumen
        });

    } catch (error) {
        console.error('❌ Error obteniendo resumen:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen',
            error: error.message
        });
    }
};

module.exports = {
    obtenerSaldoInicial,
    registrarSaldoInicial,
    calcularSaldoActual,
    crearOperacion,
    obtenerOperacion,
    listarOperaciones,
    actualizarOperacion,
    eliminarOperacion,
    obtenerResumen
};