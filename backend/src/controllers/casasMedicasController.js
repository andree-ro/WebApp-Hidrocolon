// controllers/casasMedicasController.js
// Controlador para gestión de casas médicas (laboratorios)

const CasaMedica = require('../models/CasaMedica');

class CasasMedicasController {
    
    // POST /api/casas-medicas - Crear nueva casa médica
    static async crearCasaMedica(req, res) {
        try {
            const { nombre, descripcion } = req.body;

            console.log('➕ POST crear casa médica endpoint hit');
            console.log('➕ Datos recibidos:', req.body);

            // Validación básica
            if (!nombre || nombre.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de la casa médica es obligatorio'
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

            const datosCasaMedica = {
                nombre: nombre.trim(),
                descripcion: descripcion?.trim() || null,
                activo: true
            };

            const casaMedicaId = await CasaMedica.create(datosCasaMedica);

            // Obtener la casa médica recién creada
            const casasMedicas = await CasaMedica.findAll();
            const casaMedicaCreada = casasMedicas.find(c => c.id === casaMedicaId);

            res.status(201).json({
                success: true,
                message: 'Casa médica creada exitosamente',
                data: casaMedicaCreada,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error creando casa médica:', error);
            
            if (error.message === 'Ya existe una casa médica con ese nombre') {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error creando casa médica',
                error: error.message
            });
        }
    }

    // DELETE /api/casas-medicas/:id - Eliminar casa médica
    static async eliminarCasaMedica(req, res) {
        try {
            const { id } = req.params;
            const casaMedicaId = parseInt(id);

            console.log('🗑️ DELETE casa médica endpoint hit');
            console.log('🗑️ ID:', casaMedicaId);

            if (isNaN(casaMedicaId) || casaMedicaId < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de casa médica inválido'
                });
            }

            await CasaMedica.delete(casaMedicaId);

            res.json({
                success: true,
                message: 'Casa médica eliminada exitosamente',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error eliminando casa médica:', error);
            
            if (error.message === 'Casa médica no encontrada') {
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
                message: 'Error eliminando casa médica',
                error: error.message
            });
        }
    }
}

module.exports = CasasMedicasController;