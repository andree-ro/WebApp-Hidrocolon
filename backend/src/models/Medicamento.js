// src/models/Medicamento.js
// VERSIÓN CORREGIDA - REEMPLAZAR ARCHIVO COMPLETO

const mysql = require('mysql2/promise');

class Medicamento {
    constructor() {
        // Configuración simplificada (sin opciones problemáticas)
        this.dbConfig = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            charset: 'utf8mb4',
            timezone: 'Z'
        };
    }

    // Método de conexión simplificado
    async getConnection() {
        try {
            const connection = await mysql.createConnection(this.dbConfig);
            return connection;
        } catch (error) {
            console.error('❌ Error conectando a la base de datos:', error.message);
            throw new Error('Error de conexión a la base de datos');
        }
    }

    // Obtener todos los medicamentos - VERSIÓN ULTRA SIMPLIFICADA
    async findAll(options = {}) {
        const connection = await this.getConnection();
        try {
            console.log('🔍 Opciones recibidas en findAll:', options);

            // Query ULTRA SIMPLE sin filtros complejos
            const query = `
                SELECT 
                    m.id,
                    m.nombre,
                    m.presentacion_id,
                    m.laboratorio_id,
                    m.existencias,
                    m.fecha_vencimiento,
                    m.precio_tarjeta,
                    m.precio_efectivo,
                    m.costo_compra,
                    m.porcentaje_comision,
                    m.activo,
                    p.nombre as presentacion_nombre,
                    l.nombre as laboratorio_nombre
                FROM medicamentos m
                LEFT JOIN presentaciones p ON m.presentacion_id = p.id
                LEFT JOIN laboratorios l ON m.laboratorio_id = l.id
                WHERE m.activo = 1
                ORDER BY m.nombre ASC
                LIMIT 10
            `;

            console.log('🔍 Query simplificado:', query);
            console.log('🔍 Sin parámetros - query fijo');

            const [rows] = await connection.execute(query);

            console.log(`🔍 Query ejecutado exitosamente, ${rows.length} resultados`);

            // Agregar campos calculados básicos
            const medicamentosConEstados = rows.map(medicamento => ({
                ...medicamento,
                estado_stock: medicamento.existencias < 11 ? 'bajo' : 'normal',
                estado_vencimiento: new Date(medicamento.fecha_vencimiento) <= new Date() ? 'vencido' : 'vigente'
            }));

            return medicamentosConEstados;
        } catch (error) {
            console.error('❌ Error en findAll simplificado:', error);
            throw new Error('Error obteniendo medicamentos de la base de datos');
        } finally {
            await connection.end();
        }
    }

    // Obtener medicamento por ID
    async findById(id) {
        const connection = await this.getConnection();
        try {
            const query = `
                SELECT 
                    m.*,
                    p.nombre as presentacion_nombre,
                    l.nombre as laboratorio_nombre
                FROM medicamentos m
                LEFT JOIN presentaciones p ON m.presentacion_id = p.id
                LEFT JOIN laboratorios l ON m.laboratorio_id = l.id
                WHERE m.id = ? AND m.activo = 1
            `;

            const [rows] = await connection.execute(query, [id]);

            if (rows.length === 0) return null;

            const medicamento = rows[0];

            // Agregar estados calculados
            medicamento.estado_stock = medicamento.existencias < 11 ? 'bajo' : 
                                     medicamento.existencias < 50 ? 'medio' : 'normal';
            medicamento.estado_vencimiento = new Date(medicamento.fecha_vencimiento) <= new Date() ? 'vencido' :
                                           new Date(medicamento.fecha_vencimiento) <= new Date(Date.now() + 30*24*60*60*1000) ? 'proximo_vencer' : 'vigente';

            return medicamento;
        } catch (error) {
            console.error('❌ Error buscando medicamento:', error.message);
            throw new Error('Error buscando medicamento en la base de datos');
        } finally {
            await connection.end();
        }
    }

    // Obtener estadísticas
    async getStats() {
        const connection = await this.getConnection();
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_medicamentos,
                    SUM(CASE WHEN existencias < 11 THEN 1 ELSE 0 END) as stock_bajo,
                    SUM(CASE WHEN fecha_vencimiento <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as proximo_vencer,
                    SUM(CASE WHEN fecha_vencimiento <= NOW() THEN 1 ELSE 0 END) as vencidos,
                    SUM(existencias) as total_existencias,
                    AVG(precio_tarjeta) as precio_promedio
                FROM medicamentos 
                WHERE activo = 1
            `;

            const [stats] = await connection.execute(query);
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
                indicaciones = '', contraindicaciones = '', dosis = '', porcentaje_comision = 0,
                imagen_url = ''
            } = medicamentoData;

            const query = `
                INSERT INTO medicamentos (
                    nombre, presentacion_id, laboratorio_id, existencias,
                    fecha_vencimiento, precio_tarjeta, precio_efectivo, costo_compra,
                    indicaciones, contraindicaciones, dosis, porcentaje_comision,
                    imagen_url, activo, fecha_creacion, fecha_actualizacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
            `;

            const [result] = await connection.execute(query, [
                nombre, presentacion_id, laboratorio_id, existencias,
                fecha_vencimiento, precio_tarjeta, precio_efectivo, costo_compra,
                indicaciones, contraindicaciones, dosis, porcentaje_comision,
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
                indicaciones = '', contraindicaciones = '', dosis = '', porcentaje_comision = 0,
                imagen_url = ''
            } = medicamentoData;

            const query = `
                UPDATE medicamentos SET
                    nombre = ?, presentacion_id = ?, laboratorio_id = ?, existencias = ?,
                    fecha_vencimiento = ?, precio_tarjeta = ?, precio_efectivo = ?, 
                    costo_compra = ?, indicaciones = ?, contraindicaciones = ?, 
                    dosis = ?, porcentaje_comision = ?, imagen_url = ?,
                    fecha_actualizacion = NOW()
                WHERE id = ? AND activo = 1
            `;

            const [result] = await connection.execute(query, [
                nombre, presentacion_id, laboratorio_id, existencias,
                fecha_vencimiento, precio_tarjeta, precio_efectivo, costo_compra,
                indicaciones, contraindicaciones, dosis, porcentaje_comision,
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

    // Actualizar solo el stock de un medicamento
    async updateStock(id, nuevaCantidad) {
        const connection = await this.getConnection();
        try {
            const query = `
                UPDATE medicamentos 
                SET existencias = ?, fecha_actualizacion = NOW()
                WHERE id = ? AND activo = 1
            `;

            const [result] = await connection.execute(query, [nuevaCantidad, id]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Error actualizando stock:', error.message);
            throw new Error('Error actualizando stock');
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

// Exportar instancia única
module.exports = new Medicamento();