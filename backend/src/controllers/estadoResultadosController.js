// backend/src/controllers/estadoResultadosController.js
// Controlador para gestión del Estado de Resultados del Sistema Hidrocolon

const { EstadoResultados, ConceptoEstadoResultados } = require('../models/EstadoResultados');

// ============================================================================
// OBTENER ESTADO DE RESULTADOS COMPLETO
// ============================================================================
const obtenerEstadoResultados = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        // Validaciones
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren fecha_inicio y fecha_fin'
            });
        }

        // Validar que fecha_inicio sea menor o igual a fecha_fin
        if (new Date(fecha_inicio) > new Date(fecha_fin)) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de inicio debe ser menor o igual a la fecha de fin'
            });
        }

        console.log(`📊 Generando Estado de Resultados: ${fecha_inicio} - ${fecha_fin}`);

        const estadoResultados = await EstadoResultados.obtenerEstadoResultados(
            fecha_inicio,
            fecha_fin
        );

        res.json({
            success: true,
            data: estadoResultados
        });

    } catch (error) {
        console.error('❌ Error obteniendo estado de resultados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar estado de resultados',
            error: error.message
        });
    }
};

// ============================================================================
// CREAR CONCEPTO PERSONALIZADO
// ============================================================================
const crearConcepto = async (req, res) => {
    try {
        const {
            tipo,
            nombre,
            monto,
            periodo_inicio,
            periodo_fin,
            descripcion
        } = req.body;

        // Validaciones
        if (!tipo || !nombre || monto === undefined || !periodo_inicio || !periodo_fin) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: tipo, nombre, monto, periodo_inicio, periodo_fin'
            });
        }

        // Validar tipo
        const tiposValidos = ['costo_operacion', 'gasto_operacion', 'otro_gasto'];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({
                success: false,
                message: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}`
            });
        }

        // Validar monto
        const montoNumerico = parseFloat(monto);
        if (isNaN(montoNumerico) || montoNumerico < 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser un número válido mayor o igual a 0'
            });
        }

        // Validar fechas
        if (new Date(periodo_inicio) > new Date(periodo_fin)) {
            return res.status(400).json({
                success: false,
                message: 'El período de inicio debe ser menor o igual al período de fin'
            });
        }

        const datosConcepto = {
            tipo,
            nombre: nombre.trim(),
            monto: montoNumerico,
            periodo_inicio,
            periodo_fin,
            descripcion: descripcion ? descripcion.trim() : null,
            usuario_registro_id: req.user.id
        };

        const resultado = await ConceptoEstadoResultados.crear(datosConcepto);

        // Obtener concepto creado
        const conceptoCreado = await ConceptoEstadoResultados.obtenerPorId(resultado.id);

        res.status(201).json({
            success: true,
            data: conceptoCreado,
            message: 'Concepto creado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error creando concepto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear concepto',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER CONCEPTO POR ID
// ============================================================================
const obtenerConcepto = async (req, res) => {
    try {
        const { id } = req.params;

        const concepto = await ConceptoEstadoResultados.obtenerPorId(id);

        if (!concepto) {
            return res.status(404).json({
                success: false,
                message: 'Concepto no encontrado'
            });
        }

        res.json({
            success: true,
            data: concepto
        });

    } catch (error) {
        console.error('❌ Error obteniendo concepto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener concepto',
            error: error.message
        });
    }
};

// ============================================================================
// LISTAR CONCEPTOS
// ============================================================================
const listarConceptos = async (req, res) => {
    try {
        const {
            tipo,
            periodo_inicio,
            periodo_fin
        } = req.query;

        // Validar tipo si se proporciona
        if (tipo) {
            const tiposValidos = ['costo_operacion', 'gasto_operacion', 'otro_gasto'];
            if (!tiposValidos.includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}`
                });
            }
        }

        const filtros = {
            tipo,
            periodo_inicio,
            periodo_fin
        };

        const conceptos = await ConceptoEstadoResultados.listar(filtros);

        res.json({
            success: true,
            data: conceptos,
            total: conceptos.length
        });

    } catch (error) {
        console.error('❌ Error listando conceptos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al listar conceptos',
            error: error.message
        });
    }
};

// ============================================================================
// ACTUALIZAR CONCEPTO
// ============================================================================
const actualizarConcepto = async (req, res) => {
    try {
        const { id } = req.params;
        const datosActualizacion = { ...req.body };

        // Validar monto si se proporciona
        if (datosActualizacion.monto !== undefined) {
            const montoNumerico = parseFloat(datosActualizacion.monto);
            if (isNaN(montoNumerico) || montoNumerico < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El monto debe ser un número válido mayor o igual a 0'
                });
            }
            datosActualizacion.monto = montoNumerico;
        }

        // Validar fechas si se proporcionan ambas
        if (datosActualizacion.periodo_inicio && datosActualizacion.periodo_fin) {
            if (new Date(datosActualizacion.periodo_inicio) > new Date(datosActualizacion.periodo_fin)) {
                return res.status(400).json({
                    success: false,
                    message: 'El período de inicio debe ser menor o igual al período de fin'
                });
            }
        }

        const resultado = await ConceptoEstadoResultados.actualizar(id, datosActualizacion);

        // Obtener concepto actualizado
        const conceptoActualizado = await ConceptoEstadoResultados.obtenerPorId(id);

        res.json({
            success: true,
            data: conceptoActualizado,
            message: 'Concepto actualizado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error actualizando concepto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar concepto',
            error: error.message
        });
    }
};

// ============================================================================
// ELIMINAR CONCEPTO
// ============================================================================
const eliminarConcepto = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que existe
        const concepto = await ConceptoEstadoResultados.obtenerPorId(id);
        if (!concepto) {
            return res.status(404).json({
                success: false,
                message: 'Concepto no encontrado'
            });
        }

        const resultado = await ConceptoEstadoResultados.eliminar(id);

        res.json(resultado);

    } catch (error) {
        console.error('❌ Error eliminando concepto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar concepto',
            error: error.message
        });
    }
};

module.exports = {
    obtenerEstadoResultados,
    crearConcepto,
    obtenerConcepto,
    listarConceptos,
    actualizarConcepto,
    eliminarConcepto
};