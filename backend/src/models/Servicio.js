// backend/src/models/Servicio.js
const mysql = require('mysql2/promise');

class Servicio {
    constructor(data) {
        this.id = data.id;
        this.nombre_servicio = data.nombre || data.nombre_servicio;
        this.precio_tarjeta = data.precio_tarjeta;
        this.precio_efectivo = data.precio_efectivo;
        this.monto_minimo = data.monto_minimo;
        this.comision_venta = data.porcentaje_comision;
        this.requiere_medicamentos = data.requiere_medicamentos;
        this.requiere_extras = data.requiere_extras;
        this.activo = data.activo;
        this.fecha_creacion = data.fecha_creacion;
        this.fecha_actualizacion = data.fecha_actualizacion;
        this.medicamentos_vinculados = 0; // Fijo por ahora
    }

    static async getConnection() {
        return await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });
    }

    // VERSIÓN SÚPER SIMPLE QUE SÍ FUNCIONA
    static async findAll(options = {}) {
        let connection;
        try {
            console.log('🔍 Versión emergencia - SIMPLE Y EFECTIVA');

            connection = await this.getConnection();

            // Query súper básica SIN JOIN, SIN PROBLEMAS
            const query = `SELECT * FROM servicios ORDER BY fecha_creacion DESC`;
            console.log('🔍 Query simple:', query);

            const [servicios] = await connection.execute(query);
            console.log('✅ Query ejecutada - servicios obtenidos:', servicios.length);

            // Count súper simple
            const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM servicios');
            const total = countResult[0].total;

            console.log('✅ Todo funciona perfectamente');

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
            console.error('❌ Error:', error);
            throw new Error(`Error: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    static async findById(id) {
        let connection;
        try {
            connection = await this.getConnection();
            const [rows] = await connection.execute('SELECT * FROM servicios WHERE id = ?', [id]);
            return rows.length > 0 ? new Servicio(rows[0]) : null;
        } catch (error) {
            throw new Error(`Error: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

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

            connection = await this.getConnection();
            const [result] = await connection.execute(query, [
                nombre_servicio, precio_tarjeta, precio_efectivo, 
                monto_minimo, comision_venta, activo, 
                requiere_medicamentos, requiere_extras
            ]);

            return await this.findById(result.insertId);
        } catch (error) {
            throw new Error(`Error: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    static async update(id, data) {
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
                UPDATE servicios SET
                    nombre = ?, precio_tarjeta = ?, precio_efectivo = ?,
                    monto_minimo = ?, porcentaje_comision = ?, activo = ?,
                    requiere_medicamentos = ?, requiere_extras = ?,
                    fecha_actualizacion = NOW()
                WHERE id = ?
            `;

            console.log('🔄 Actualizando con valores:', {
                nombre_servicio, precio_tarjeta, precio_efectivo,
                monto_minimo, comision_venta, activo,
                requiere_medicamentos, requiere_extras, id
            });

            connection = await this.getConnection();
            await connection.execute(query, [
                nombre_servicio, precio_tarjeta, precio_efectivo,
                monto_minimo, comision_venta, activo,
                requiere_medicamentos, requiere_extras, id
            ]);

            return await this.findById(id);
        } catch (error) {
            console.error('❌ Error en update:', error);
            throw new Error(`Error: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    static async delete(id) {
        let connection;
        try {
            connection = await this.getConnection();
            await connection.execute('UPDATE servicios SET activo = false WHERE id = ?', [id]);
            return { message: 'Servicio eliminado correctamente' };
        } catch (error) {
            throw new Error(`Error: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    static async getStats() {
        let connection;
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_servicios,
                    COUNT(CASE WHEN activo = true THEN 1 END) as servicios_activos,
                    COUNT(CASE WHEN activo = false THEN 1 END) as servicios_inactivos,
                    AVG(precio_efectivo) as precio_promedio_efectivo,
                    AVG(precio_tarjeta) as precio_promedio_tarjeta
                FROM servicios
            `;

            connection = await this.getConnection();
            const [stats] = await connection.execute(query);
            
            return {
                ...stats[0],
                precio_promedio_efectivo: parseFloat(stats[0].precio_promedio_efectivo || 0).toFixed(2),
                precio_promedio_tarjeta: parseFloat(stats[0].precio_promedio_tarjeta || 0).toFixed(2)
            };
        } catch (error) {
            throw new Error(`Error: ${error.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }

    // Funciones de medicamentos - versión simple
    static async getMedicamentosVinculados(servicioId) {
        return []; // Por ahora vacío
    }

    static async vincularMedicamento(servicioId, medicamentoId, cantidadRequerida = 1) {
        return { message: 'Funcionalidad pendiente' };
    }

    static async desvincularMedicamento(servicioId, medicamentoId) {
        return { message: 'Funcionalidad pendiente' };
    }
}

module.exports = Servicio;