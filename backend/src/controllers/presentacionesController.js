// controllers/presentacionesController.js
// Controlador para gestión de presentaciones de medicamentos

const Presentacion = require('../models/Presentacion');

class PresentacionesController {
    
    // POST /api/presentaciones - Crear nueva presentación
    static async crearPresentacion(req, res) {
        try {
            const { nombre, descripcion } = req.body;

            console.log('➕ POST crear presentación endpoint hit');
            console.log('➕ Datos recibidos:', req.body);

            // Validación básica
            if (!nombre || nombre.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de la presentación es obligatorio'
                });
            }

            if (nombre.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre debe tener al menos 2 caracteres'
                });
            }

            if (nombre.trim().length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre no puede exceder 100 caracteres'
                });
            }

            const datosPresentacion = {
                nombre: nombre.trim(),
                descripcion: descripcion?.trim() || null,
                activo: true
            };

            const presentacionId = await Presentacion.create(datosPresentacion);

            // Obtener la presentación recién creada
            const presentaciones = await Presentacion.findAll();
            const presentacionCreada = presentaciones.find(p => p.id === presentacionId);

            res.status(201).json({
                success: true,
                message: 'Presentación creada exitosamente',
                data: presentacionCreada,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error creando presentación:', error);
            
            if (error.message === 'Ya existe una presentación con ese nombre') {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error creando presentación',
                error: error.message
            });
        }
    }

    // DELETE /api/presentaciones/:id - Eliminar presentación
    static async eliminarPresentacion(req, res) {
        try {
            const { id } = req.params;
            const presentacionId = parseInt(id);

            console.log('🗑️ DELETE presentación endpoint hit');
            console.log('🗑️ ID:', presentacionId);

            if (isNaN(presentacionId) || presentacionId < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de presentación inválido'
                });
            }

            await Presentacion.delete(presentacionId);

            res.json({
                success: true,
                message: 'Presentación eliminada exitosamente',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error eliminando presentación:', error);
            
            if (error.message === 'Presentación no encontrada') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            if (error.message.includes('No se puede eliminar')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error eliminando presentación',
                error: error.message
            });
        }
    }
}

module.exports = PresentacionesController;