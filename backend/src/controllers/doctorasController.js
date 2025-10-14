// backend/src/controllers/doctorasController.js
const Doctora = require('../models/Doctora');

// ============================================================================
// LISTAR TODAS LAS DOCTORAS
// ============================================================================
exports.listarDoctoras = async (req, res) => {
    try {
        const incluirInactivas = req.query.incluirInactivas === 'true';
        
        const doctoras = await Doctora.findAll({ incluirInactivas });

        res.json({
            success: true,
            data: doctoras,
            total: doctoras.length
        });

    } catch (error) {
        console.error('❌ Error en listarDoctoras:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo lista de doctoras',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER DOCTORA POR ID
// ============================================================================
exports.obtenerDoctora = async (req, res) => {
    try {
        const { id } = req.params;

        const doctora = await Doctora.findById(id);

        if (!doctora) {
            return res.status(404).json({
                success: false,
                message: 'Doctora no encontrada'
            });
        }

        res.json({
            success: true,
            data: doctora
        });

    } catch (error) {
        console.error('❌ Error en obtenerDoctora:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo doctora',
            error: error.message
        });
    }
};

// ============================================================================
// CREAR NUEVA DOCTORA
// ============================================================================
exports.crearDoctora = async (req, res) => {
    try {
        const { nombre, activo } = req.body;

        // Validaciones
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la doctora es requerido'
            });
        }

        const nuevaDoctora = await Doctora.create({
            nombre: nombre.trim(),
            activo: activo !== undefined ? activo : 1
        });

        res.status(201).json({
            success: true,
            message: 'Doctora creada exitosamente',
            data: nuevaDoctora
        });

    } catch (error) {
        console.error('❌ Error en crearDoctora:', error);
        
        // Si es error de duplicado
        if (error.message.includes('ya existe')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creando doctora',
            error: error.message
        });
    }
};

// ============================================================================
// ACTUALIZAR DOCTORA
// ============================================================================
exports.actualizarDoctora = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, activo } = req.body;

        // Validaciones
        if (nombre && nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre no puede estar vacío'
            });
        }

        const doctoraActualizada = await Doctora.update(id, {
            nombre,
            activo
        });

        res.json({
            success: true,
            message: 'Doctora actualizada exitosamente',
            data: doctoraActualizada
        });

    } catch (error) {
        console.error('❌ Error en actualizarDoctora:', error);

        if (error.message === 'Doctora no encontrada') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('Ya existe')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error actualizando doctora',
            error: error.message
        });
    }
};

// ============================================================================
// ELIMINAR DOCTORA (SOFT DELETE)
// ============================================================================
exports.eliminarDoctora = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await Doctora.delete(id);

        res.json({
            success: true,
            message: resultado.message,
            ventasAsociadas: resultado.ventasAsociadas
        });

    } catch (error) {
        console.error('❌ Error en eliminarDoctora:', error);

        if (error.message === 'Doctora no encontrada') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error eliminando doctora',
            error: error.message
        });
    }
};

// ============================================================================
// REACTIVAR DOCTORA
// ============================================================================
exports.reactivarDoctora = async (req, res) => {
    try {
        const { id } = req.params;

        const doctoraReactivada = await Doctora.reactivar(id);

        res.json({
            success: true,
            message: 'Doctora reactivada exitosamente',
            data: doctoraReactivada
        });

    } catch (error) {
        console.error('❌ Error en reactivarDoctora:', error);

        if (error.message === 'Doctora no encontrada') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error reactivando doctora',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER ESTADÍSTICAS DE UNA DOCTORA
// ============================================================================
exports.obtenerEstadisticas = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_inicio, fecha_fin } = req.query;

        const estadisticas = await Doctora.getEstadisticas(id, {
            fecha_inicio,
            fecha_fin
        });

        res.json({
            success: true,
            data: estadisticas
        });

    } catch (error) {
        console.error('❌ Error en obtenerEstadisticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas',
            error: error.message
        });
    }
};

// ✅ YA NO NECESITAS ESTA LÍNEA:
// module.exports = exports;