// ============================================================================
// 🏥 CONTROLADOR PACIENTES - Sistema Hidrocolon
// Siguiendo el mismo patrón que farmaciaController.js y extrasController.js
// ============================================================================

const Paciente = require('../models/Paciente');

class PacientesController {

    // ========================================================================
    // CRUD BÁSICO
    // ========================================================================

    // GET /api/pacientes - Listar con filtros
    static async getPacientes(req, res) {
        try {
            console.log('🔍 Controller getPacientes - Query params:', req.query);

            const options = {
                page: req.query.page,
                limit: req.query.limit,
                search: req.query.search,
                filtro: req.query.filtro
            };

            const result = await Paciente.findAll(options);

            console.log(`✅ Controller: ${result.data.length} pacientes obtenidos`);

            res.json({
                success: true,
                message: 'Pacientes obtenidos correctamente',
                data: result.data,
                pagination: result.pagination
            });

        } catch (error) {
            console.error('❌ Error en getPacientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo pacientes',
                error: error.message
            });
        }
    }

    // GET /api/pacientes/:id - Obtener específico
    static async getPaciente(req, res) {
        try {
            const { id } = req.params;
            console.log(`🔍 Controller getPaciente: ${id}`);

            // Validar ID
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de paciente inválido'
                });
            }

            const paciente = await Paciente.findById(parseInt(id));

            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            console.log(`✅ Controller: Paciente encontrado: ${paciente.nombre_completo}`);

            res.json({
                success: true,
                message: 'Paciente encontrado',
                data: paciente
            });

        } catch (error) {
            console.error(`❌ Error en getPaciente(${req.params.id}):`, error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo paciente',
                error: error.message
            });
        }
    }

    // POST /api/pacientes - Crear nuevo
    static async crearPaciente(req, res) {
        try {
            console.log('📝 Controller crearPaciente:', req.body);

            // Mapear nombres de campos (frontend puede usar diferentes nombres)
            const data = {
                nombres: req.body.nombre || req.body.nombres,
                apellidos: req.body.apellido || req.body.apellidos,
                telefono: req.body.telefono,
                dpi: req.body.dpi || null,
                fecha_primer_cita: req.body.fecha_primer_cita,
                proxima_cita: req.body.proxima_cita || null,
                fecha_nacimiento: req.body.cumpleanos || req.body.fecha_nacimiento
            };

            // Validaciones básicas
            const camposRequeridos = ['nombres', 'apellidos', 'telefono', 'fecha_primer_cita', 'fecha_nacimiento'];
            for (const campo of camposRequeridos) {
                if (!data[campo]) {
                    return res.status(400).json({
                        success: false,
                        message: `Campo requerido faltante: ${campo}`,
                        campo_faltante: campo
                    });
                }
            }

            const paciente = await Paciente.create(data);

            console.log(`✅ Controller: Paciente creado con ID: ${paciente.id}`);

            res.status(201).json({
                success: true,
                message: 'Paciente creado correctamente',
                data: paciente
            });

        } catch (error) {
            console.error('❌ Error en crearPaciente:', error);

            // Error por DPI duplicado
            if (error.code === 'ER_DUP_ENTRY' && error.message.includes('dpi')) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un paciente con ese DPI',
                    error_type: 'duplicate_dpi'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error creando paciente',
                error: error.message
            });
        }
    }

    // PUT /api/pacientes/:id - Actualizar
    static async actualizarPaciente(req, res) {
        try {
            const { id } = req.params;
            console.log(`📝 Controller actualizarPaciente: ${id}`, req.body);

            // Validar ID
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de paciente inválido'
                });
            }

            // Mapear nombres de campos
            const data = {
                nombres: req.body.nombre || req.body.nombres,
                apellidos: req.body.apellido || req.body.apellidos,
                telefono: req.body.telefono,
                dpi: req.body.dpi,
                fecha_primer_cita: req.body.fecha_primer_cita,
                proxima_cita: req.body.proxima_cita,
                fecha_nacimiento: req.body.cumpleanos || req.body.fecha_nacimiento
            };

            const paciente = await Paciente.update(parseInt(id), data);

            console.log(`✅ Controller: Paciente ${id} actualizado correctamente`);

            res.json({
                success: true,
                message: 'Paciente actualizado correctamente',
                data: paciente
            });

        } catch (error) {
            console.error(`❌ Error en actualizarPaciente(${req.params.id}):`, error);

            if (error.message === 'Paciente no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error actualizando paciente',
                error: error.message
            });
        }
    }

    // DELETE /api/pacientes/:id - Eliminar (soft delete)
    static async eliminarPaciente(req, res) {
        try {
            const { id } = req.params;
            console.log(`🗑️ Controller eliminarPaciente: ${id}`);

            // Validar ID
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de paciente inválido'
                });
            }

            await Paciente.delete(parseInt(id));

            console.log(`✅ Controller: Paciente ${id} eliminado correctamente`);

            res.json({
                success: true,
                message: 'Paciente eliminado correctamente'
            });

        } catch (error) {
            console.error(`❌ Error en eliminarPaciente(${req.params.id}):`, error);

            if (error.message === 'Paciente no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error eliminando paciente',
                error: error.message
            });
        }
    }

    // ========================================================================
    // ENDPOINTS ESPECIALES
    // ========================================================================

    // GET /api/pacientes/stats/general - Estadísticas
    static async getEstadisticas(req, res) {
        try {
            console.log('📊 Controller getEstadisticas');

            const stats = await Paciente.getStats();

            console.log('✅ Controller: Estadísticas obtenidas:', stats);

            res.json({
                success: true,
                message: 'Estadísticas obtenidas correctamente',
                data: stats
            });

        } catch (error) {
            console.error('❌ Error en getEstadisticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas',
                error: error.message
            });
        }
    }

    // GET /api/pacientes/export/excel - Exportar
    static async exportarExcel(req, res) {
        try {
            console.log('📊 Controller exportarExcel');

            const result = await Paciente.getExportData();

            console.log(`✅ Controller: ${result.data.length} pacientes preparados para exportación`);

            res.json({
                success: true,
                message: 'Datos preparados para exportación',
                data: result.data,
                headers: result.headers
            });

        } catch (error) {
            console.error('❌ Error en exportarExcel:', error);
            res.status(500).json({
                success: false,
                message: 'Error preparando datos para exportación',
                error: error.message
            });
        }
    }

    // ========================================================================
    // FILTROS ESPECIALES (ENDPOINTS ADICIONALES)
    // ========================================================================

    // GET /api/pacientes/cumpleanos-mes - Pacientes que cumplen años este mes
    static async getCumpleanosMes(req, res) {
        try {
            console.log('🎂 Controller getCumpleanosMes');

            const options = {
                filtro: 'cumpleanos_mes',
                page: req.query.page,
                limit: req.query.limit
            };

            const result = await Paciente.findAll(options);

            res.json({
                success: true,
                message: 'Pacientes con cumpleaños este mes obtenidos correctamente',
                data: result.data,
                pagination: result.pagination
            });

        } catch (error) {
            console.error('❌ Error en getCumpleanosMes:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo pacientes con cumpleaños',
                error: error.message
            });
        }
    }

    // GET /api/pacientes/citas-manana - Pacientes con cita mañana
    static async getCitasManana(req, res) {
        try {
            console.log('📅 Controller getCitasManana');

            const options = {
                filtro: 'citas_manana',
                page: req.query.page,
                limit: req.query.limit
            };

            const result = await Paciente.findAll(options);

            res.json({
                success: true,
                message: 'Pacientes con cita mañana obtenidos correctamente',
                data: result.data,
                pagination: result.pagination
            });

        } catch (error) {
            console.error('❌ Error en getCitasManana:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo pacientes con citas mañana',
                error: error.message
            });
        }
    }
}

module.exports = PacientesController;