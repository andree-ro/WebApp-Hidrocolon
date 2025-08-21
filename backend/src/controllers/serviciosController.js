// backend/src/controllers/serviciosController.js
const Servicio = require('../models/Servicio');

// ============================================================================
// LISTAR SERVICIOS CON FILTROS Y PAGINACIÓN
// ============================================================================
const getServicios = async (req, res) => {
    try {
        console.log('🔍 GET /api/servicios - Obteniendo lista de servicios');
        console.log('📥 Query params:', req.query);

        const {
            page = 1,
            limit = 10,
            search = '',
            orderBy = 'fecha_creacion',
            orderDir = 'DESC',
            activo = null,
            precio_min = null,
            precio_max = null
        } = req.query;

        // Validaciones de entrada
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
        
        const validOrderFields = [
            'nombre_servicio', 'precio_efectivo', 'precio_tarjeta', 
            'comision_venta', 'fecha_creacion', 'fecha_actualizacion'
        ];
        const validOrderBy = validOrderFields.includes(orderBy) ? orderBy : 'fecha_creacion';
        const validOrderDir = ['ASC', 'DESC'].includes(orderDir?.toUpperCase()) ? orderDir.toUpperCase() : 'DESC';

        // Filtros opcionales
        const filters = {
            page: pageNum,
            limit: limitNum,
            search: search.trim(),
            orderBy: validOrderBy,
            orderDir: validOrderDir
        };

        // Aplicar filtros si están presentes
        if (activo !== null && activo !== '') {
            filters.activo = activo === 'true' || activo === '1';
        }

        if (precio_min !== null && precio_min !== '') {
            const minPrice = parseFloat(precio_min);
            if (!isNaN(minPrice) && minPrice >= 0) {
                filters.precio_min = minPrice;
            }
        }

        if (precio_max !== null && precio_max !== '') {
            const maxPrice = parseFloat(precio_max);
            if (!isNaN(maxPrice) && maxPrice >= 0) {
                filters.precio_max = maxPrice;
            }
        }

        console.log('🎯 Filtros aplicados:', filters);

        const resultado = await Servicio.findAll(filters);

        console.log(`✅ ${resultado.servicios.length} servicios obtenidos de ${resultado.pagination.totalItems} totales`);

        res.json({
            success: true,
            message: 'Servicios obtenidos correctamente',
            data: resultado.servicios,
            pagination: resultado.pagination,
            filters: filters
        });

    } catch (error) {
        console.error('❌ Error en getServicios:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener servicios',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER SERVICIO POR ID
// ============================================================================
const getServicio = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 GET /api/servicios/${id} - Obteniendo servicio específico`);

        // Validar ID
        const servicioId = parseInt(id);
        if (isNaN(servicioId) || servicioId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de servicio inválido'
            });
        }

        const servicio = await Servicio.findById(servicioId);
        
        if (!servicio) {
            return res.status(404).json({
                success: false,
                message: 'Servicio no encontrado'
            });
        }

        console.log(`✅ Servicio obtenido: ${servicio.nombre_servicio}`);

        res.json({
            success: true,
            message: 'Servicio obtenido correctamente',
            data: servicio
        });

    } catch (error) {
        console.error('❌ Error en getServicio:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener servicio',
            error: error.message
        });
    }
};

// ============================================================================
// CREAR NUEVO SERVICIO
// ============================================================================
const crearServicio = async (req, res) => {
    try {
        console.log('💾 POST /api/servicios - Creando nuevo servicio');
        console.log('📥 Datos recibidos:', req.body);

        const {
            nombre_servicio,
            precio_tarjeta,
            precio_efectivo,
            monto_minimo = 0,
            comision_venta = 0,
            descripcion = '',
            activo = true,
            requiere_medicamentos = false
        } = req.body;

        // Validaciones obligatorias
        if (!nombre_servicio || !nombre_servicio.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del servicio es obligatorio'
            });
        }

        if (!precio_tarjeta || precio_tarjeta <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio con tarjeta debe ser mayor a 0'
            });
        }

        if (!precio_efectivo || precio_efectivo <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio en efectivo debe ser mayor a 0'
            });
        }

        // Validaciones de tipos y rangos
        const comisionNum = parseFloat(comision_venta);
        if (isNaN(comisionNum) || comisionNum < 0 || comisionNum > 100) {
            return res.status(400).json({
                success: false,
                message: 'La comisión debe estar entre 0 y 100'
            });
        }

        const montoMinimoNum = parseFloat(monto_minimo);
        if (isNaN(montoMinimoNum) || montoMinimoNum < 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto mínimo no puede ser negativo'
            });
        }

        const datosServicio = {
            nombre_servicio: nombre_servicio.trim(),
            precio_tarjeta: parseFloat(precio_tarjeta),
            precio_efectivo: parseFloat(precio_efectivo),
            monto_minimo: montoMinimoNum,
            comision_venta: comisionNum,
            descripcion: descripcion?.trim() || '',
            activo: Boolean(activo),
            requiere_medicamentos: Boolean(requiere_medicamentos)
        };

        const nuevoServicio = await Servicio.create(datosServicio);

        console.log(`✅ Servicio creado con ID: ${nuevoServicio.id}`);

        res.status(201).json({
            success: true,
            message: 'Servicio creado correctamente',
            data: nuevoServicio
        });

    } catch (error) {
        console.error('❌ Error en crearServicio:', error.message);
        
        if (error.message.includes('Duplicate entry')) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un servicio con ese nombre'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear servicio',
            error: error.message
        });
    }
};

// ============================================================================
// ACTUALIZAR SERVICIO
// ============================================================================
const actualizarServicio = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔄 PUT /api/servicios/${id} - Actualizando servicio`);
        console.log('📥 Datos recibidos:', req.body);

        // Validar ID
        const servicioId = parseInt(id);
        if (isNaN(servicioId) || servicioId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de servicio inválido'
            });
        }

        const {
            nombre_servicio,
            precio_tarjeta,
            precio_efectivo,
            monto_minimo,
            comision_venta,
            descripcion,
            activo,
            requiere_medicamentos
        } = req.body;

        // Validaciones similares al crear
        if (!nombre_servicio || !nombre_servicio.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del servicio es obligatorio'
            });
        }

        if (!precio_tarjeta || precio_tarjeta <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio con tarjeta debe ser mayor a 0'
            });
        }

        if (!precio_efectivo || precio_efectivo <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio en efectivo debe ser mayor a 0'
            });
        }

        const comisionNum = parseFloat(comision_venta);
        if (isNaN(comisionNum) || comisionNum < 0 || comisionNum > 100) {
            return res.status(400).json({
                success: false,
                message: 'La comisión debe estar entre 0 y 100'
            });
        }

        const datosActualizacion = {
            nombre_servicio: nombre_servicio.trim(),
            precio_tarjeta: parseFloat(precio_tarjeta),
            precio_efectivo: parseFloat(precio_efectivo),
            monto_minimo: parseFloat(monto_minimo || 0),
            comision_venta: comisionNum,
            descripcion: descripcion?.trim() || '',
            activo: Boolean(activo),
            requiere_medicamentos: Boolean(requiere_medicamentos)
        };

        const servicioActualizado = await Servicio.update(servicioId, datosActualizacion);

        console.log(`✅ Servicio actualizado: ${servicioActualizado.nombre_servicio}`);

        res.json({
            success: true,
            message: 'Servicio actualizado correctamente',
            data: servicioActualizado
        });

    } catch (error) {
        console.error('❌ Error en actualizarServicio:', error.message);
        
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar servicio',
            error: error.message
        });
    }
};

// ============================================================================
// ELIMINAR SERVICIO (SOFT DELETE)
// ============================================================================
const eliminarServicio = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ DELETE /api/servicios/${id} - Eliminando servicio`);

        // Validar ID
        const servicioId = parseInt(id);
        if (isNaN(servicioId) || servicioId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de servicio inválido'
            });
        }

        const resultado = await Servicio.delete(servicioId);

        console.log(`✅ Servicio eliminado (ID: ${servicioId})`);

        res.json({
            success: true,
            message: resultado.message
        });

    } catch (error) {
        console.error('❌ Error en eliminarServicio:', error.message);
        
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al eliminar servicio',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER ESTADÍSTICAS DE SERVICIOS
// ============================================================================
const getEstadisticas = async (req, res) => {
    try {
        console.log('📊 GET /api/servicios/stats - Obteniendo estadísticas');

        const stats = await Servicio.getStats();

        console.log('✅ Estadísticas generadas correctamente');

        res.json({
            success: true,
            message: 'Estadísticas obtenidas correctamente',
            data: stats
        });

    } catch (error) {
        console.error('❌ Error en getEstadisticas:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// ============================================================================
// OBTENER MEDICAMENTOS VINCULADOS A UN SERVICIO
// ============================================================================
const getMedicamentosVinculados = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`💊 GET /api/servicios/${id}/medicamentos - Obteniendo medicamentos vinculados`);

        // Validar ID
        const servicioId = parseInt(id);
        if (isNaN(servicioId) || servicioId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de servicio inválido'
            });
        }

        // Verificar que el servicio existe
        const servicio = await Servicio.findById(servicioId);
        if (!servicio) {
            return res.status(404).json({
                success: false,
                message: 'Servicio no encontrado'
            });
        }

        const medicamentos = await Servicio.getMedicamentosVinculados(servicioId);

        console.log(`✅ ${medicamentos.length} medicamentos vinculados obtenidos`);

        res.json({
            success: true,
            message: 'Medicamentos vinculados obtenidos correctamente',
            data: medicamentos,
            servicio: {
                id: servicio.id,
                nombre_servicio: servicio.nombre_servicio,
                requiere_medicamentos: servicio.requiere_medicamentos
            }
        });

    } catch (error) {
        console.error('❌ Error en getMedicamentosVinculados:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener medicamentos vinculados',
            error: error.message
        });
    }
};

// ============================================================================
// VINCULAR MEDICAMENTO A SERVICIO
// ============================================================================
const vincularMedicamento = async (req, res) => {
    try {
        const { id } = req.params;
        const { medicamento_id, cantidad_requerida = 1 } = req.body;
        
        console.log(`🔗 POST /api/servicios/${id}/medicamentos - Vinculando medicamento`);
        console.log('📥 Datos:', { medicamento_id, cantidad_requerida });

        // Validaciones
        const servicioId = parseInt(id);
        const medicamentoId = parseInt(medicamento_id);
        const cantidad = parseInt(cantidad_requerida);

        if (isNaN(servicioId) || servicioId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de servicio inválido'
            });
        }

        if (isNaN(medicamentoId) || medicamentoId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de medicamento inválido'
            });
        }

        if (isNaN(cantidad) || cantidad <= 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad requerida debe ser mayor a 0'
            });
        }

        const resultado = await Servicio.vincularMedicamento(servicioId, medicamentoId, cantidad);

        console.log('✅ Medicamento vinculado correctamente');

        res.json({
            success: true,
            message: resultado.message
        });

    } catch (error) {
        console.error('❌ Error en vincularMedicamento:', error.message);
        
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al vincular medicamento',
            error: error.message
        });
    }
};

// ============================================================================
// DESVINCULAR MEDICAMENTO DE SERVICIO
// ============================================================================
const desvincularMedicamento = async (req, res) => {
    try {
        const { id, medicamento_id } = req.params;
        
        console.log(`🔗 DELETE /api/servicios/${id}/medicamentos/${medicamento_id} - Desvinculando medicamento`);

        // Validaciones
        const servicioId = parseInt(id);
        const medicamentoId = parseInt(medicamento_id);

        if (isNaN(servicioId) || servicioId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de servicio inválido'
            });
        }

        if (isNaN(medicamentoId) || medicamentoId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de medicamento inválido'
            });
        }

        const resultado = await Servicio.desvincularMedicamento(servicioId, medicamentoId);

        console.log('✅ Medicamento desvinculado correctamente');

        res.json({
            success: true,
            message: resultado.message
        });

    } catch (error) {
        console.error('❌ Error en desvincularMedicamento:', error.message);
        
        if (error.message.includes('no encontrada')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al desvincular medicamento',
            error: error.message
        });
    }
};

// ============================================================================
// EXPORTAR SERVICIOS A EXCEL (PLACEHOLDER)
// ============================================================================
const exportarExcel = async (req, res) => {
    try {
        console.log('📊 GET /api/servicios/export/excel - Exportando servicios');

        // Por ahora devolvemos los datos en JSON
        // En el futuro se puede implementar la generación real de Excel
        const resultado = await Servicio.findAll({ limit: 1000 });

        console.log(`✅ ${resultado.servicios.length} servicios preparados para exportación`);

        res.json({
            success: true,
            message: 'Datos preparados para exportación',
            data: resultado.servicios,
            total: resultado.pagination.totalItems,
            note: 'Implementación de Excel pendiente - datos en JSON'
        });

    } catch (error) {
        console.error('❌ Error en exportarExcel:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al exportar servicios',
            error: error.message
        });
    }
};

// ============================================================================
// EXPORTAR FUNCIONES
// ============================================================================
module.exports = {
    getServicios,
    getServicio,
    crearServicio,
    actualizarServicio,
    eliminarServicio,
    getEstadisticas,
    getMedicamentosVinculados,
    vincularMedicamento,
    desvincularMedicamento,
    exportarExcel
};