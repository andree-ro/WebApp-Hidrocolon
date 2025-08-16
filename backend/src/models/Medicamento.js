// src/models/Medicamento.js
// Modelo PROFESIONAL usando exactamente el mismo patrón que User.js

const mysql = require('mysql2/promise');

class Medicamento {
    constructor() {
        // EXACTAMENTE la misma configuración que User.js
        this.dbConfig = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            charset: 'utf8mb4',
            timezone: 'Z',
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true
        };
    }

    // EXACTAMENTE el mismo método que User.js
    async getConnection() {
        try {
            const connection = await mysql.createConnection(this.dbConfig);
            return connection;
        } catch (error) {
            console.error('❌ Error conectando a la base de datos:', error.message);
            throw new Error('Error de conexión a la base de datos');
        }
    }

    // Obtener todos los medicamentos con información completa
    async findAll(options = {}) {
        const connection = await this.getConnection();
        try {
            const {
                search = '',
                presentacion_id = null,
                laboratorio_id = null,
                stock_bajo = false,
                proximo_vencer = false,
                limit = 50,
                offset = 0,
                activo = true
            } = options;

            let whereConditions = ['m.activo = ?'];
            let queryParams = [activo ? 1 : 0];

            // Búsqueda por nombre
            if (search) {
                whereConditions.push('(m.nombre LIKE ? OR p.nombre LIKE ? OR l.nombre LIKE ?)');
                const searchTerm = `%${search}%`;
                queryParams.push(searchTerm, searchTerm, searchTerm);
            }

            // Filtro por presentación
            if (presentacion_id) {
                whereConditions.push('m.presentacion_id = ?');
                queryParams.push(presentacion_id);
            }

            // Filtro por laboratorio
            if (laboratorio_id) {
                whereConditions.push('m.laboratorio_id = ?');
                queryParams.push(laboratorio_id);
            }

            // Filtro stock bajo
            if (stock_bajo) {
                whereConditions.push('m.existencias < 11');
            }

            // Filtro próximo a vencer (30 días)
            if (proximo_vencer) {
                whereConditions.push('m.fecha_vencimiento <= DATE_ADD(NOW(), INTERVAL 30 DAY)');
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

            const query = `
                SELECT 
                    m.*,
                    p.nombre as presentacion_nombre,
                    l.nombre as laboratorio_nombre,
                    CASE 
                        WHEN m.existencias < 11 THEN 'bajo'
                        WHEN m.existencias < 50 THEN 'medio'
                        ELSE 'normal'
                    END as estado_stock,
                    CASE 
                        WHEN m.fecha_vencimiento <= NOW() THEN 'vencido'
                        WHEN m.fecha_vencimiento <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'proximo_vencer'
                        ELSE 'vigente'
                    END as estado_vencimiento,
                    DATEDIFF(m.fecha_vencimiento, NOW()) as dias_vencimiento
                FROM medicamentos m
                LEFT JOIN presentaciones p ON m.presentacion_id = p.id
                LEFT JOIN laboratorios l ON m.laboratorio_id = l.id
                ${whereClause}
                ORDER BY m.nombre ASC
                LIMIT ? OFFSET ?
            `;

            queryParams.push(limit, offset);

            const [rows] = await connection.execute(query, queryParams);
            return rows;
        } catch (error) {
            console.error('❌ Error obteniendo medicamentos:', error.message);
            throw new Error('Error obteniendo medicamentos de la base de datos');
        } finally {
            await connection.end();
        }
    }

    // Obtener medicamento por ID con extras
    async findById(id) {
        const connection = await this.getConnection();
        try {
            const [rows] = await connection.execute(`
                SELECT 
                    m.*,
                    p.nombre as presentacion_nombre,
                    l.nombre as laboratorio_nombre,
                    CASE 
                        WHEN m.existencias < 11 THEN 'bajo'
                        WHEN m.existencias < 50 THEN 'medio'
                        ELSE 'normal'
                    END as estado_stock,
                    CASE 
                        WHEN m.fecha_vencimiento <= NOW() THEN 'vencido'
                        WHEN m.fecha_vencimiento <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'proximo_vencer'
                        ELSE 'vigente'
                    END as estado_vencimiento
                FROM medicamentos m
                LEFT JOIN presentaciones p ON m.presentacion_id = p.id
                LEFT JOIN laboratorios l ON m.laboratorio_id = l.id
                WHERE m.id = ? AND m.activo = 1
            `, [id]);

            if (rows.length === 0) return null;

            const medicamento = rows[0];

            // Obtener extras vinculados
            const [extrasRows] = await connection.execute(`
                SELECT e.*, me.fecha_creacion as fecha_vinculacion
                FROM extras e
                INNER JOIN medicamentos_extras me ON e.id = me.extra_id
                WHERE me.medicamento_id = ? AND e.activo = 1
            `, [id]);

            medicamento.extras = extrasRows;
            return medicamento;
        } catch (error) {
            console.error('❌ Error buscando medicamento:', error.message);
            throw new Error('Error buscando medicamento en la base de datos');
        } finally {
            await connection.end();
        }
    }

    // Obtener estadísticas del módulo farmacia
    async getStats() {
        const connection = await this.getConnection();
        try {
            const [stats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_medicamentos,
                    SUM(CASE WHEN existencias < 11 THEN 1 ELSE 0 END) as stock_bajo,
                    SUM(CASE WHEN fecha_vencimiento <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as proximo_vencer,
                    SUM(CASE WHEN fecha_vencimiento <= NOW() THEN 1 ELSE 0 END) as vencidos,
                    SUM(existencias) as total_existencias,
                    AVG(precio_tarjeta) as precio_promedio
                FROM medicamentos 
                WHERE activo = 1
            `);

            return stats[0];
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error.message);
            throw new Error('Error obteniendo estadísticas de farmacia');
        } finally {
            await connection.end();
        }
    }

    // Obtener presentaciones activas
    async getPresentaciones() {
        const connection = await this.getConnection();
        try {
            const [rows] = await connection.execute('SELECT * FROM presentaciones WHERE activo = 1 ORDER BY nombre');
            return rows;
        } catch (error) {
            console.error('❌ Error obteniendo presentaciones:', error.message);
            throw new Error('Error obteniendo presentaciones');
        } finally {
            await connection.end();
        }
    }

    // Obtener laboratorios activos
    async getLaboratorios() {
        const connection = await this.getConnection();
        try {
            const [rows] = await connection.execute('SELECT * FROM laboratorios WHERE activo = 1 ORDER BY nombre');
            return rows;
        } catch (error) {
            console.error('❌ Error obteniendo laboratorios:', error.message);
            throw new Error('Error obteniendo laboratorios');
        } finally {
            await connection.end();
        }
    }

    // Obtener extras activos
    async getExtras() {
        const connection = await this.getConnection();
        try {
            const [rows] = await connection.execute('SELECT * FROM extras WHERE activo = 1 ORDER BY nombre');
            return rows;
        } catch (error) {
            console.error('❌ Error obteniendo extras:', error.message);
            throw new Error('Error obteniendo extras');
        } finally {
            await connection.end();
        }
    }

    // Crear nuevo medicamento
    async create(medicamentoData) {
        const connection = await this.getConnection();
        try {
            const {
                nombre, presentacion_id, laboratorio_id, existencias,
                fecha_vencimiento, precio_tarjeta, precio_efectivo, costo_compra,
                indicaciones, contraindicaciones, dosis, comision_porcentaje,
                imagen_url
            } = medicamentoData;

            const query = `
                INSERT INTO medicamentos (
                    nombre, presentacion_id, laboratorio_id, existencias,
                    fecha_vencimiento, precio_tarjeta, precio_efectivo, costo_compra,
                    indicaciones, contraindicaciones, dosis, comision_porcentaje,
                    imagen_url, activo, fecha_creacion, fecha_actualizacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
            `;

            const [result] = await connection.execute(query, [
                nombre, presentacion_id, laboratorio_id, existencias,
                fecha_vencimiento, precio_tarjeta, precio_efectivo, costo_compra,
                indicaciones, contraindicaciones, dosis, comision_porcentaje,
                imagen_url
            ]);

            return result.insertId;
        } catch (error) {
            console.error('❌ Error creando medicamento:', error.message);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un medicamento con ese nombre');
            }
            throw new Error(`Error creando medicamento: ${error.message}`);
        } finally {
            await connection.end();
        }
    }

    // Actualizar medicamento
    async update(id, medicamentoData) {
        const connection = await this.getConnection();
        try {
            const {
                nombre, presentacion_id, laboratorio_id, existencias,
                fecha_vencimiento, precio_tarjeta, precio_efectivo, costo_compra,
                indicaciones, contraindicaciones, dosis, comision_porcentaje,
                imagen_url
            } = medicamentoData;

            const query = `
                UPDATE medicamentos SET
                    nombre = ?, presentacion_id = ?, laboratorio_id = ?, existencias = ?,
                    fecha_vencimiento = ?, precio_tarjeta = ?, precio_efectivo = ?, 
                    costo_compra = ?, indicaciones = ?, contraindicaciones = ?, 
                    dosis = ?, comision_porcentaje = ?, imagen_url = ?,
                    fecha_actualizacion = NOW()
                WHERE id = ? AND activo = 1
            `;

            const [result] = await connection.execute(query, [
                nombre, presentacion_id, laboratorio_id, existencias,
                fecha_vencimiento, precio_tarjeta, precio_efectivo, costo_compra,
                indicaciones, contraindicaciones, dosis, comision_porcentaje,
                imagen_url, id
            ]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Error actualizando medicamento:', error.message);
            throw new Error('Error actualizando medicamento');
        } finally {
            await connection.end();
        }
    }

    // Eliminar medicamento (soft delete)
    async delete(id) {
        const connection = await this.getConnection();
        try {
            const [result] = await connection.execute(`
                UPDATE medicamentos SET activo = 0, fecha_actualizacion = NOW() 
                WHERE id = ? AND activo = 1
            `, [id]);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Error eliminando medicamento:', error.message);
            throw new Error('Error eliminando medicamento');
        } finally {
            await connection.end();
        }
    }
}

// Exportar instancia única como User.js
module.exports = new Medicamento();