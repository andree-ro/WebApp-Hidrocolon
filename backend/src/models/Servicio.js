// backend/src/models/Servicio.js
const mysql = require('mysql2/promise');

class Servicio {
    constructor(data) {
        this.id = data.id;
        this.nombre_servicio = data.nombre || data.nombre_servicio;
        this.precio_tarjeta = data.precio_tarjeta;
        this.precio_efectivo = data.precio_efectivo;
        this.monto_minimo = data.monto_minimo;
        this.comision_venta = data.porcentaje_comision; // Mapear nombre correcto
        this.requiere_medicamentos = data.requiere_medicamentos;
        this.requiere_extras = data.requiere_extras;
        this.activo = data.activo;
        this.fecha_creacion = data.fecha_creacion;
        this.fecha_actualizacion = data.fecha_actualizacion;
        this.medicamentos_vinculados = data.medicamentos_vinculados || 0;
    }

    // Crear conexión a la base de datos
    static async getConnection() {
        return await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });
    }

    // ============================================================================
    // MÉTODO PRINCIPAL - LISTAR SERVICIOS CON FILTROS (VERSIÓN CORREGIDA)
    // ============================================================================
    static async findAll(options = {}) {
        let connection;
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

            // Validar y limpiar parámetros
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
            const offset = (pageNum - 1) * limitNum;

            // Validar orderBy para prevenir SQL injection
            const validOrderFields = ['id', 'nombre', 'precio_efectivo', 'precio_tarjeta', 'fecha_creacion', 'fecha_actualizacion'];
            const safeOrderBy = validOrderFields.includes(orderBy) ? orderBy : 'fecha_creacion';
            const safeOrderDir = orderDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            let whereConditions = [];
            let queryParams = [];

            // Construir WHERE dinámico
            if (search && search.trim() !== '') {
                whereConditions.push(`nombre LIKE ?`);
                queryParams.push(`%${search.trim()}%`);
            }

            if (activo !== null && activo !== '') {
                whereConditions.push('activo = ?');
                queryParams.push(activo === 'true' || activo === '1' || activo === 1);
            }

            if (precio_min !== null && precio_min !== '' && !isNaN(precio_min)) {
                whereConditions.push('precio_efectivo >= ?');
                queryParams.push(parseFloat(precio_min));
            }

            if (precio_max !== null && precio_max !== '' && !isNaN(precio_max)) {
                whereConditions.push('precio_efectivo <= ?');
                queryParams.push(parseFloat(precio_max));
            }

            const whereClause = whereConditions.length > 0 
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            // Query principal con LEFT JOIN a servicios_medicamentos
            const query = `
                SELECT 
                    s.*,
                    COUNT(sm.medicamento_id) as medicamentos_vinculados
                FROM servicios s
                LEFT JOIN servicios_medicamentos sm ON s.id = sm.servicio_id
                ${whereClause}
                GROUP BY s.id, s.nombre, s.precio_tarjeta, s.precio_efectivo, s.monto_minimo, 
                         s.porcentaje_comision, s.requiere_medicamentos, s.requiere_extras, 
                         s.activo, s.fecha_creacion, s.fecha_actualizacion
                ORDER BY s.${safeOrderBy} ${safeOrderDir}
                LIMIT ? OFFSET ?
            `;

            // Crear array separado para count (sin LIMIT/OFFSET)
            const countParams = [...queryParams];
            
            // Agregar LIMIT y OFFSET solo para la query principal
            queryParams.push(limitNum, offset);

            console.log('🔍 Query servicios:', query);
            console.log('📊 Parámetros finales:', queryParams);
            console.log('🔢 Count query:', countQuery);
            console.log('📊 Count parámetros:', countParams);

            connection = await this.getConnection();
            
            // Ejecutar ambas queries con sus parámetros correctos
            const [servicios] = await connection.execute(query, queryParams);
            const [countResult] = await connection.execute(countQuery, countParams);
            
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limitNum);

            console.log(`✅ ${servicios.length} servicios obtenidos de ${total} totales`);

            return {
                servicios: servicios.map(servicio => new Servicio(servicio)),
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limitNum,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                }
            };

        } catch (error) {
            console.error('❌ Error en Servicio.findAll:', error);
            throw new Error(`Error al obtener servicios: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    // ============================================================================
    // BUSCAR SERVICIO POR ID
    // ============================================================================
    static async findById(id) {
        let connection;
        try {
            const query = `
                SELECT 
                    s.*,
                    COUNT(sm.medicamento_id) as medicamentos_vinculados
                FROM servicios s
                LEFT JOIN servicios_medicamentos sm ON s.id = sm.servicio_id
                WHERE s.id = ?
                GROUP BY s.id, s.nombre, s.precio_tarjeta, s.precio_efectivo, s.monto_minimo, 
                         s.porcentaje_comision, s.requiere_medicamentos, s.requiere_extras, 
                         s.activo, s.fecha_creacion, s.fecha_actualizacion
            `;

            connection = await this.getConnection();
            const [rows] = await connection.execute(query, [id]);
            
            if (rows.length === 0) {
                return null;
            }

            console.log('✅ Servicio encontrado:', rows[0].nombre);
            return new Servicio(rows[0]);

        } catch (error) {
            console.error('❌ Error en Servicio.findById:', error);
            throw new Error(`Error al buscar servicio: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    // ============================================================================
    // CREAR NUEVO SERVICIO
    // ============================================================================
    static async create(data) {
        let connection;
        try {
            const {
                nombre_servicio,
                precio_tarjeta,
                precio_efectivo,
                monto_minimo = 0,
                comision_venta = 0,
                activo = true,
                requiere_medicamentos = false,
                requiere_extras = false
            } = data;

            const query = `
                INSERT INTO servicios (
                    nombre, precio_tarjeta, precio_efectivo, 
                    monto_minimo, porcentaje_comision,
                    activo, requiere_medicamentos, requiere_extras,
                    fecha_creacion, fecha_actualizacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;

            const values = [
                nombre_servicio,
                precio_tarjeta,
                precio_efectivo,
                monto_minimo,
                comision_venta,
                activo,
                requiere_medicamentos,
                requiere_extras
            ];

            console.log('💾 Creando servicio:', nombre_servicio);
            
            connection = await this.getConnection();
            const [result] = await connection.execute(query, values);
            
            const nuevoServicio = await this.findById(result.insertId);
            console.log('✅ Servicio creado con ID:', result.insertId);
            
            return nuevoServicio;

        } catch (error) {
            console.error('❌ Error en Servicio.create:', error);
            throw new Error(`Error al crear servicio: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    // ============================================================================
    // ACTUALIZAR SERVICIO
    // ============================================================================
    static async update(id, data) {
        let connection;
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
                activo,
                requiere_medicamentos,
                requiere_extras
            } = data;

            const query = `
                UPDATE servicios SET
                    nombre = ?,
                    precio_tarjeta = ?,
                    precio_efectivo = ?,
                    monto_minimo = ?,
                    porcentaje_comision = ?,
                    activo = ?,
                    requiere_medicamentos = ?,
                    requiere_extras = ?,
                    fecha_actualizacion = NOW()
                WHERE id = ?
            `;

            const values = [
                nombre_servicio,
                precio_tarjeta,
                precio_efectivo,
                monto_minimo,
                comision_venta,
                activo,
                requiere_medicamentos,
                requiere_extras,
                id
            ];

            console.log('🔄 Actualizando servicio ID:', id);
            
            connection = await this.getConnection();
            await connection.execute(query, values);
            
            const servicioActualizado = await this.findById(id);
            console.log('✅ Servicio actualizado:', servicioActualizado.nombre_servicio);
            
            return servicioActualizado;

        } catch (error) {
            console.error('❌ Error en Servicio.update:', error);
            throw new Error(`Error al actualizar servicio: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    // ============================================================================
    // ELIMINAR SERVICIO (SOFT DELETE)
    // ============================================================================
    static async delete(id) {
        let connection;
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
            
            connection = await this.getConnection();
            await connection.execute(query, [id]);
            
            console.log('✅ Servicio desactivado:', servicio.nombre_servicio);
            
            return { message: 'Servicio eliminado correctamente' };

        } catch (error) {
            console.error('❌ Error en Servicio.delete:', error);
            throw new Error(`Error al eliminar servicio: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    // ============================================================================
    // ESTADÍSTICAS DE SERVICIOS
    // ============================================================================
    static async getStats() {
        let connection;
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_servicios,
                    COUNT(CASE WHEN activo = true THEN 1 END) as servicios_activos,
                    COUNT(CASE WHEN activo = false THEN 1 END) as servicios_inactivos,
                    COUNT(CASE WHEN requiere_medicamentos = true THEN 1 END) as con_medicamentos,
                    COUNT(CASE WHEN requiere_extras = true THEN 1 END) as con_extras,
                    AVG(precio_efectivo) as precio_promedio_efectivo,
                    AVG(precio_tarjeta) as precio_promedio_tarjeta,
                    AVG(porcentaje_comision) as comision_promedio,
                    MIN(precio_efectivo) as precio_min,
                    MAX(precio_efectivo) as precio_max
                FROM servicios
            `;

            connection = await this.getConnection();
            const [stats] = await connection.execute(query);
            
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
        } finally {
            if (connection) await connection.end();
        }
    }

    // ============================================================================
    // OBTENER MEDICAMENTOS VINCULADOS A UN SERVICIO
    // ============================================================================
    static async getMedicamentosVinculados(servicioId) {
        let connection;
        try {
            const query = `
                SELECT 
                    m.id,
                    m.nombre as nombre_medicamento,
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
                ORDER BY m.nombre
            `;

            connection = await this.getConnection();
            const [medicamentos] = await connection.execute(query, [servicioId]);
            
            console.log(`💊 ${medicamentos.length} medicamentos vinculados al servicio ${servicioId}`);
            
            return medicamentos;

        } catch (error) {
            console.error('❌ Error en getMedicamentosVinculados:', error);
            throw new Error(`Error al obtener medicamentos: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    // ============================================================================
    // VINCULAR MEDICAMENTO A SERVICIO
    // ============================================================================
    static async vincularMedicamento(servicioId, medicamentoId, cantidadRequerida = 1) {
        let connection;
        try {
            const servicio = await this.findById(servicioId);
            if (!servicio) {
                throw new Error('Servicio no encontrado');
            }

            connection = await this.getConnection();

            // Verificar si ya está vinculado
            const checkQuery = `
                SELECT id FROM servicios_medicamentos 
                WHERE servicio_id = ? AND medicamento_id = ?
            `;
            const [existing] = await connection.execute(checkQuery, [servicioId, medicamentoId]);

            if (existing.length > 0) {
                // Actualizar cantidad
                const updateQuery = `
                    UPDATE servicios_medicamentos 
                    SET cantidad_requerida = ?
                    WHERE servicio_id = ? AND medicamento_id = ?
                `;
                await connection.execute(updateQuery, [cantidadRequerida, servicioId, medicamentoId]);
                console.log('🔄 Cantidad actualizada para medicamento vinculado');
            } else {
                // Crear nueva vinculación
                const insertQuery = `
                    INSERT INTO servicios_medicamentos 
                    (servicio_id, medicamento_id, cantidad_requerida, fecha_creacion)
                    VALUES (?, ?, ?, NOW())
                `;
                await connection.execute(insertQuery, [servicioId, medicamentoId, cantidadRequerida]);
                console.log('✅ Medicamento vinculado al servicio');
            }

            return { message: 'Medicamento vinculado correctamente' };

        } catch (error) {
            console.error('❌ Error en vincularMedicamento:', error);
            throw new Error(`Error al vincular medicamento: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    // ============================================================================
    // DESVINCULAR MEDICAMENTO DE SERVICIO
    // ============================================================================
    static async desvincularMedicamento(servicioId, medicamentoId) {
        let connection;
        try {
            const query = `
                DELETE FROM servicios_medicamentos 
                WHERE servicio_id = ? AND medicamento_id = ?
            `;

            connection = await this.getConnection();
            const [result] = await connection.execute(query, [servicioId, medicamentoId]);
            
            if (result.affectedRows === 0) {
                throw new Error('Vinculación no encontrada');
            }

            console.log('🔗 Medicamento desvinculado del servicio');
            return { message: 'Medicamento desvinculado correctamente' };

        } catch (error) {
            console.error('❌ Error en desvincularMedicamento:', error);
            throw new Error(`Error al desvincular medicamento: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }
}

module.exports = Servicio;