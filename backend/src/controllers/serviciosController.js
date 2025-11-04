// backend/src/controllers/serviciosController.js
const Servicio = require('../models/Servicio');

// Función de mapeo para compatibilidad frontend
const mapearServicio = (servicio) => ({
    ...servicio,
    nombre_servicio: servicio.nombre,
    comision_venta: servicio.porcentaje_comision,
    activo: Boolean(servicio.activo),
    total_extras: parseInt(servicio.total_extras ?? 0, 10)
});

// ============================================================================
// LISTAR SERVICIOS CON FILTROS Y PAGINACIÓN
// ============================================================================
const getServicios = async (req, res) => {
    try {
        const options = {
            page: req.query.page || 1,
            limit: req.query.limit || 10,
            search: req.query.search || '',
            activo: req.query.activo || null,
            precio_min: req.query.precio_min || null,
            precio_max: req.query.precio_max || null
        };
        
        console.log('Parámetros recibidos:', options);
        
        // Usar el modelo que YA FUNCIONA
        const resultado = await Servicio.findAll(options);
        
        // Mapear servicios para el frontend
        const serviciosMapeados = resultado.servicios.map(servicio => mapearServicio(servicio));
        
        res.json({
            success: true,
            data: serviciosMapeados,
            pagination: resultado.pagination
        });
        
    } catch (error) {
        console.error('Error en getServicios:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo servicios'
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

        // AGREGADO: Mapear servicio para el frontend
        const servicioMapeado = mapearServicio(servicio);

        console.log(`✅ Servicio obtenido: ${servicio.nombre}`);

        res.json({
            success: true,
            message: 'Servicio obtenido correctamente',
            data: servicioMapeado
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
        console.log('🔥 Datos recibidos:', req.body);

        const {
            nombre_servicio,
            precio_tarjeta,
            precio_efectivo,
            monto_minimo = 0,
            comision_venta = 0,
            descripcion = '',
            activo = true,
            requiere_medicamentos = false,
            requiere_extras = false
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

        // CORREGIDO: Mapear campos frontend -> BD
        const datosServicio = {
            nombre: nombre_servicio.trim(),
            precio_tarjeta: parseFloat(precio_tarjeta),
            precio_efectivo: parseFloat(precio_efectivo),
            monto_minimo: montoMinimoNum,
            porcentaje_comision: comisionNum,
            descripcion: descripcion?.trim() || '',
            activo: Boolean(activo) ? 1 : 0,
            requiere_medicamentos: Boolean(requiere_medicamentos) ? 1 : 0,
            requiere_extras: Boolean(requiere_extras) ? 1 : 0
        };

        const nuevoServicio = await Servicio.create(datosServicio);

        // AGREGADO: Mapear servicio para el frontend
        const servicioMapeado = mapearServicio(nuevoServicio);

        console.log(`✅ Servicio creado con ID: ${nuevoServicio.id}`);

        res.status(201).json({
            success: true,
            message: 'Servicio creado correctamente',
            data: servicioMapeado
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
        console.log('🔥 Datos recibidos:', req.body);

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
            requiere_medicamentos,
            requiere_extras
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

        // CORREGIDO: Mapear campos frontend -> BD
        const datosActualizacion = {
            nombre: nombre_servicio.trim(),
            precio_tarjeta: parseFloat(precio_tarjeta),
            precio_efectivo: parseFloat(precio_efectivo),
            monto_minimo: parseFloat(monto_minimo || 0),
            porcentaje_comision: comisionNum,
            descripcion: descripcion?.trim() || '',
            activo: Boolean(activo) ? 1 : 0,
            requiere_medicamentos: Boolean(requiere_medicamentos) ? 1 : 0,
            requiere_extras: Boolean(requiere_extras) ? 1 : 0
        };

        const servicioActualizado = await Servicio.update(servicioId, datosActualizacion);

        // AGREGADO: Mapear servicio para el frontend
        const servicioMapeado = mapearServicio(servicioActualizado);

        console.log(`✅ Servicio actualizado: ${servicioActualizado.nombre}`);

        res.json({
            success: true,
            message: 'Servicio actualizado correctamente',
            data: servicioMapeado
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

        // AGREGADO: Mapear servicio para el frontend
        const servicioMapeado = mapearServicio(servicio);

        res.json({
            success: true,
            message: 'Medicamentos vinculados obtenidos correctamente',
            data: medicamentos,
            servicio: servicioMapeado
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
        console.log('🔥 Datos:', { medicamento_id, cantidad_requerida });

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

        const resultado = await Servicio.findAll({ limit: 1000 });

        // AGREGADO: Mapear servicios para exportar
        const serviciosMapeados = resultado.servicios.map(servicio => mapearServicio(servicio));

        console.log(`✅ ${resultado.servicios.length} servicios preparados para exportación`);

        res.json({
            success: true,
            message: 'Datos preparados para exportación',
            data: serviciosMapeados,
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