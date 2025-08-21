// backend/src/models/Servicio.js
const db = require('../config/database');

class Servicio {
    constructor(data) {
        this.id = data.id;
        this.nombre_servicio = data.nombre_servicio;
        this.precio_tarjeta = data.precio_tarjeta;
        this.precio_efectivo = data.precio_efectivo;
        this.monto_minimo = data.monto_minimo;
        this.comision_venta = data.comision_venta;
        this.descripcion = data.descripcion;
        this.activo = data.activo;
        this.requiere_medicamentos = data.requiere_medicamentos;
        this.fecha_creacion = data.fecha_creacion;
        this.fecha_actualizacion = data.fecha_actualizacion;
    }

    // ============================================================================
    // MÉTODO PRINCIPAL - LISTAR SERVICIOS CON FILTROS
    // ============================================================================
    static async findAll(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                orderBy = 'fecha_creacion',
                orderDir = 'DESC',
                activo = null,
                precio_min = null,
                precio_max = null
            } = options;

            const offset = (page - 1) * limit;
            let whereConditions = [];
            let queryParams = [];

            // Filtro de búsqueda
            if (search) {
                whereConditions.push(`(s.nombre_servicio LIKE ? OR s.descripcion LIKE ?)`);
                queryParams.push(`%${search}%`, `%${search}%`);
            }

            // Filtro por estado activo
            if (activo !== null) {
                whereConditions.push('s.activo = ?');
                queryParams.push(activo);
            }

            // Filtro por rango de precios (usando precio_efectivo como referencia)
            if (precio_min !== null) {
                whereConditions.push('s.precio_efectivo >= ?');
                queryParams.push(precio_min);
            }

            if (precio_max !== null) {
                whereConditions.push('s.precio_efectivo <= ?');
                queryParams.push(precio_max);
            }

            const whereClause = whereConditions.length > 0 
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            // Query principal con conteo de medicamentos vinculados
            const query = `
                SELECT 
                    s.*,
                    COUNT(sm.medicamento_id) as medicamentos_vinculados,
                    CASE 
                        WHEN s.precio_efectivo > s.precio_tarjeta THEN 'efectivo_mayor'
                        WHEN s.precio_tarjeta > s.precio_efectivo THEN 'tarjeta_mayor'
                        ELSE 'precios_iguales'
                    END as tipo_precio,
                    CASE 
                        WHEN s.comision_venta >= 10 THEN 'comision_alta'
                        WHEN s.comision_venta >= 5 THEN 'comision_media'
                        ELSE 'comision_baja'
                    END as nivel_comision
                FROM servicios s
                LEFT JOIN servicios_medicamentos sm ON s.id = sm.servicio_id
                ${whereClause}
                GROUP BY s.id
                ORDER BY s.${orderBy} ${orderDir}
                LIMIT ? OFFSET ?
            `;

            queryParams.push(parseInt(limit), parseInt(offset));

            // Query para contar total de registros
            const countQuery = `
                SELECT COUNT(DISTINCT s.id) as total
                FROM servicios s
                ${whereClause}
            `;

            const countParams = queryParams.slice(0, -2); // Remover limit y offset

            console.log('🔍 Query servicios:', query);
            console.log('📊 Parámetros:', queryParams);

            const [servicios] = await db.execute(query, queryParams);
            const [countResult] = await db.execute(countQuery, countParams);
            
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);

            return {
                servicios: servicios.map(servicio => new Servicio(servicio)),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            };

        } catch (error) {
            console.error('❌ Error en Servicio.findAll:', error);
            throw new Error(`Error al obtener servicios: ${error.message}`);
        }
    }

    // ============================================================================
    // BUSCAR SERVICIO POR ID
    // ============================================================================
    static async findById(id) {
        try {
            const query = `
                SELECT 
                    s.*,
                    COUNT(sm.medicamento_id) as medicamentos_vinculados
                FROM servicios s
                LEFT JOIN servicios_medicamentos sm ON s.id = sm.servicio_id
                WHERE s.id = ?
                GROUP BY s.id
            `;

            const [rows] = await db.execute(query, [id]);
            
            if (rows.length === 0) {
                return null;
            }

            console.log('✅ Servicio encontrado:', rows[0].nombre_servicio);
            return new Servicio(rows[0]);

        } catch (error) {
            console.error('❌ Error en Servicio.findById:', error);
            throw new Error(`Error al buscar servicio: ${error.message}`);
        }
    }

    // ============================================================================
    // CREAR NUEVO SERVICIO
    // ============================================================================
    static async create(data) {
        try {
            const {
                nombre_servicio,
                precio_tarjeta,
                precio_efectivo,
                monto_minimo = 0,
                comision_venta = 0,
                descripcion = '',
                activo = true,
                requiere_medicamentos = false
            } = data;

            const query = `
                INSERT INTO servicios (
                    nombre_servicio, precio_tarjeta, precio_efectivo, 
                    monto_minimo, comision_venta, descripcion,
                    activo, requiere_medicamentos, fecha_creacion, fecha_actualizacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;

            const values = [
                nombre_servicio,
                precio_tarjeta,
                precio_efectivo,
                monto_minimo,
                comision_venta,
                descripcion,
                activo,
                requiere_medicamentos
            ];

            console.log('💾 Creando servicio:', nombre_servicio);
            const [result] = await db.execute(query, values);
            
            const nuevoServicio = await this.findById(result.insertId);
            console.log('✅ Servicio creado con ID:', result.insertId);
            
            return nuevoServicio;

        } catch (error) {
            console.error('❌ Error en Servicio.create:', error);
            throw new Error(`Error al crear servicio: ${error.message}`);
        }
    }

    // ============================================================================
    // ACTUALIZAR SERVICIO
    // ============================================================================
    static async update(id, data) {
        try {
            const servicioExistente = await this.findById(id);
            if (!servicioExistente) {
                throw new Error('Servicio no encontrado');
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
            } = data;

            const query = `
                UPDATE servicios SET
                    nombre_servicio = ?,
                    precio_tarjeta = ?,
                    precio_efectivo = ?,
                    monto_minimo = ?,
                    comision_venta = ?,
                    descripcion = ?,
                    activo = ?,
                    requiere_medicamentos = ?,
                    fecha_actualizacion = NOW()
                WHERE id = ?
            `;

            const values = [
                nombre_servicio,
                precio_tarjeta,
                precio_efectivo,
                monto_minimo,
                comision_venta,
                descripcion,
                activo,
                requiere_medicamentos,
                id
            ];

            console.log('🔄 Actualizando servicio ID:', id);
            await db.execute(query, values);
            
            const servicioActualizado = await this.findById(id);
            console.log('✅ Servicio actualizado:', servicioActualizado.nombre_servicio);
            
            return servicioActualizado;

        } catch (error) {
            console.error('❌ Error en Servicio.update:', error);
            throw new Error(`Error al actualizar servicio: ${error.message}`);
        }
    }

    // ============================================================================
    // ELIMINAR SERVICIO (SOFT DELETE)
    // ============================================================================
    static async delete(id) {
        try {
            const servicio = await this.findById(id);
            if (!servicio) {
                throw new Error('Servicio no encontrado');
            }

            const query = `
                UPDATE servicios SET
                    activo = false,
                    fecha_actualizacion = NOW()
                WHERE id = ?
            `;

            console.log('🗑️ Desactivando servicio ID:', id);
            await db.execute(query, [id]);
            console.log('✅ Servicio desactivado:', servicio.nombre_servicio);
            
            return { message: 'Servicio eliminado correctamente' };

        } catch (error) {
            console.error('❌ Error en Servicio.delete:', error);
            throw new Error(`Error al eliminar servicio: ${error.message}`);
        }
    }

    // ============================================================================
    // ESTADÍSTICAS DE SERVICIOS
    // ============================================================================
    static async getStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_servicios,
                    COUNT(CASE WHEN activo = true THEN 1 END) as servicios_activos,
                    COUNT(CASE WHEN activo = false THEN 1 END) as servicios_inactivos,
                    COUNT(CASE WHEN requiere_medicamentos = true THEN 1 END) as con_medicamentos,
                    AVG(precio_efectivo) as precio_promedio_efectivo,
                    AVG(precio_tarjeta) as precio_promedio_tarjeta,
                    AVG(comision_venta) as comision_promedio,
                    MIN(precio_efectivo) as precio_min,
                    MAX(precio_efectivo) as precio_max,
                    COUNT(CASE WHEN comision_venta >= 10 THEN 1 END) as comision_alta,
                    COUNT(CASE WHEN comision_venta >= 5 AND comision_venta < 10 THEN 1 END) as comision_media,
                    COUNT(CASE WHEN comision_venta < 5 THEN 1 END) as comision_baja
                FROM servicios
            `;

            const [stats] = await db.execute(query);
            console.log('📊 Estadísticas de servicios generadas');
            
            return {
                ...stats[0],
                precio_promedio_efectivo: parseFloat(stats[0].precio_promedio_efectivo || 0).toFixed(2),
                precio_promedio_tarjeta: parseFloat(stats[0].precio_promedio_tarjeta || 0).toFixed(2),
                comision_promedio: parseFloat(stats[0].comision_promedio || 0).toFixed(2)
            };

        } catch (error) {
            console.error('❌ Error en Servicio.getStats:', error);
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }

    // ============================================================================
    // OBTENER MEDICAMENTOS VINCULADOS A UN SERVICIO
    // ============================================================================
    static async getMedicamentosVinculados(servicioId) {
        try {
            const query = `
                SELECT 
                    m.id,
                    m.nombre_medicamento,
                    m.presentacion,
                    m.precio_efectivo,
                    m.precio_tarjeta,
                    m.existencias,
                    sm.cantidad_requerida,
                    p.nombre as presentacion_nombre,
                    l.nombre as laboratorio_nombre
                FROM servicios_medicamentos sm
                INNER JOIN medicamentos m ON sm.medicamento_id = m.id
                LEFT JOIN presentaciones p ON m.presentacion_id = p.id
                LEFT JOIN laboratorios l ON m.laboratorio_id = l.id
                WHERE sm.servicio_id = ? AND m.activo = true
                ORDER BY m.nombre_medicamento
            `;

            const [medicamentos] = await db.execute(query, [servicioId]);
            console.log(`💊 ${medicamentos.length} medicamentos vinculados al servicio ${servicioId}`);
            
            return medicamentos;

        } catch (error) {
            console.error('❌ Error en getMedicamentosVinculados:', error);
            throw new Error(`Error al obtener medicamentos: ${error.message}`);
        }
    }

    // ============================================================================
    // VINCULAR MEDICAMENTO A SERVICIO
    // ============================================================================
    static async vincularMedicamento(servicioId, medicamentoId, cantidadRequerida = 1) {
        try {
            // Verificar que el servicio existe
            const servicio = await this.findById(servicioId);
            if (!servicio) {
                throw new Error('Servicio no encontrado');
            }

            // Verificar si ya está vinculado
            const checkQuery = `
                SELECT id FROM servicios_medicamentos 
                WHERE servicio_id = ? AND medicamento_id = ?
            `;
            const [existing] = await db.execute(checkQuery, [servicioId, medicamentoId]);

            if (existing.length > 0) {
                // Actualizar cantidad si ya existe
                const updateQuery = `
                    UPDATE servicios_medicamentos 
                    SET cantidad_requerida = ?, fecha_actualizacion = NOW()
                    WHERE servicio_id = ? AND medicamento_id = ?
                `;
                await db.execute(updateQuery, [cantidadRequerida, servicioId, medicamentoId]);
                console.log('🔄 Cantidad actualizada para medicamento vinculado');
            } else {
                // Crear nueva vinculación
                const insertQuery = `
                    INSERT INTO servicios_medicamentos 
                    (servicio_id, medicamento_id, cantidad_requerida, fecha_creacion, fecha_actualizacion)
                    VALUES (?, ?, ?, NOW(), NOW())
                `;
                await db.execute(insertQuery, [servicioId, medicamentoId, cantidadRequerida]);
                console.log('✅ Medicamento vinculado al servicio');
            }

            return { message: 'Medicamento vinculado correctamente' };

        } catch (error) {
            console.error('❌ Error en vincularMedicamento:', error);
            throw new Error(`Error al vincular medicamento: ${error.message}`);
        }
    }

    // ============================================================================
    // DESVINCULAR MEDICAMENTO DE SERVICIO
    // ============================================================================
    static async desvincularMedicamento(servicioId, medicamentoId) {
        try {
            const query = `
                DELETE FROM servicios_medicamentos 
                WHERE servicio_id = ? AND medicamento_id = ?
            `;

            const [result] = await db.execute(query, [servicioId, medicamentoId]);
            
            if (result.affectedRows === 0) {
                throw new Error('Vinculación no encontrada');
            }

            console.log('🔗 Medicamento desvinculado del servicio');
            return { message: 'Medicamento desvinculado correctamente' };

        } catch (error) {
            console.error('❌ Error en desvincularMedicamento:', error);
            throw new Error(`Error al desvincular medicamento: ${error.message}`);
        }
    }
}

module.exports = Servicio;