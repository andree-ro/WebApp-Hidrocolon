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
        this.medicamentos_vinculados = 0; // Por ahora fijo
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
    // MÉTODO PRINCIPAL - VERSIÓN DE DEBUGGING SÚPER SIMPLE
    // ============================================================================
    static async findAll(options = {}) {
        let connection;
        try {
            console.log('🔍 Debugging findAll - Query súper simple');

            // QUERY SÚPER SIMPLE PARA DEBUGGING
            const query = `SELECT id, nombre, precio_efectivo, precio_tarjeta FROM servicios LIMIT 5`;

            console.log('🔍 Query debug:', query);
            console.log('📊 Sin parámetros');

            connection = await this.getConnection();
            console.log('✅ Conexión establecida');
            
            // SIN PARÁMETROS
            const [servicios] = await connection.execute(query);
            console.log('✅ Query ejecutada exitosamente');
            console.log('📊 Resultados obtenidos:', servicios.length);

            // Conteo simple también
            const countQuery = `SELECT COUNT(*) as total FROM servicios`;
            const [countResult] = await connection.execute(countQuery);
            console.log('✅ Conteo ejecutado:', countResult[0].total);
            
            const total = countResult[0].total;

            return {
                servicios: servicios.map(servicio => new Servicio(servicio)),
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: total,
                    itemsPerPage: servicios.length,
                    hasNextPage: false,
                    hasPrevPage: false
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
            const query = `SELECT * FROM servicios WHERE id = ?`;

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
    // ESTADÍSTICAS DE SERVICIOS (SIMPLIFICADO)
    // ============================================================================
    static async getStats() {
        let connection;
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_servicios,
                    COUNT(CASE WHEN activo = true THEN 1 END) as servicios_activos,
                    COUNT(CASE WHEN activo = false THEN 1 END) as servicios_inactivos
                FROM servicios
            `;

            connection = await this.getConnection();
            const [stats] = await connection.execute(query);
            
            console.log('📊 Estadísticas de servicios generadas');
            
            return {
                ...stats[0]
            };

        } catch (error) {
            console.error('❌ Error en Servicio.getStats:', error);
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    // ============================================================================
    // MÉTODOS SIMPLIFICADOS PARA MEDICAMENTOS (SIN FUNCIONALIDAD POR AHORA)
    // ============================================================================
    static async getMedicamentosVinculados(servicioId) {
        console.log(`💊 Función getMedicamentosVinculados - debug mode`);
        return [];
    }

    static async vincularMedicamento(servicioId, medicamentoId, cantidadRequerida = 1) {
        console.log(`🔗 Función vincularMedicamento - debug mode`);
        return { message: 'Función en modo debug - no implementada' };
    }

    static async desvincularMedicamento(servicioId, medicamentoId) {
        console.log(`🔗 Función desvincularMedicamento - debug mode`);
        return { message: 'Función en modo debug - no implementada' };
    }

    // ============================================================================
    // MÉTODOS RESTANTES (UPDATE, DELETE) - SIMPLIFICADOS
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
}

module.exports = Servicio;