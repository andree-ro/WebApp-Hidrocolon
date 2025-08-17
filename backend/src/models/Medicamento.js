// src/models/Medicamento.js
// VERSIÓN CORREGIDA CON FILTROS FUNCIONANDO

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

    // Obtener todos los medicamentos CON FILTROS FUNCIONANDO
    async findAll(options = {}) {
        const connection = await this.getConnection();
        try {
            console.log('🔍 Opciones recibidas en findAll:', options);

            // Query base
            let query = `
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
                    m.indicaciones,
                    m.contraindicaciones,
                    m.dosis,
                    m.requiere_extras,
                    m.activo,
                    p.nombre as presentacion_nombre,
                    l.nombre as laboratorio_nombre
                FROM medicamentos m
                LEFT JOIN presentaciones p ON m.presentacion_id = p.id
                LEFT JOIN laboratorios l ON m.laboratorio_id = l.id
                WHERE m.activo = 1
            `;

            const params = [];

            // =====================================
            // APLICAR FILTROS
            // =====================================

            // Filtro de búsqueda por nombre
            if (options.search && options.search.trim()) {
                console.log('🔍 Aplicando filtro de búsqueda:', options.search);
                query += ` AND (m.nombre LIKE ? OR p.nombre LIKE ? OR l.nombre LIKE ?)`;
                const searchParam = `%${options.search.trim()}%`;
                params.push(searchParam, searchParam, searchParam);
            }

            // Filtro por presentación
            if (options.presentacion_id) {
                console.log('📋 Aplicando filtro de presentación:', options.presentacion_id);
                query += ` AND m.presentacion_id = ?`;
                params.push(options.presentacion_id);
            }

            // Filtro por laboratorio
            if (options.laboratorio_id) {
                console.log('🏭 Aplicando filtro de laboratorio:', options.laboratorio_id);
                query += ` AND m.laboratorio_id = ?`;
                params.push(options.laboratorio_id);
            }

            // Filtro de stock bajo
            if (options.stock_bajo === true) {
                console.log('⚠️ Aplicando filtro de stock bajo');
                query += ` AND m.existencias < 11`;
            }

            // Filtro de próximo a vencer
            if (options.proximo_vencer === true) {
                console.log('⏰ Aplicando filtro de próximo a vencer');
                query += ` AND m.fecha_vencimiento <= DATE_ADD(NOW(), INTERVAL 30 DAY) AND m.fecha_vencimiento > NOW()`;
            }

            // Ordenamiento
            query += ` ORDER BY m.nombre ASC`;

            // Paginación
            if (options.limit && options.limit > 0) {
                const limitValue = parseInt(options.limit);
                const offsetValue = parseInt(options.offset) || 0;
                
                // MySQL requiere LIMIT y OFFSET en esta sintaxis específica
                query += ` LIMIT ?, ?`;
                params.push(offsetValue, limitValue);  // offset primero, luego limit
            } else if (options.limit) {
                // Solo LIMIT sin OFFSET
                query += ` LIMIT ?`;
                params.push(parseInt(options.limit));
}

            console.log('🔍 Query final construido:', query);
            console.log('🔍 Parámetros:', params);

            const [rows] = await connection.execute(query, params);

            console.log(`✅ Query ejecutado exitosamente, ${rows.length} resultados encontrados`);

            // Agregar campos calculados
            const medicamentosConEstados = rows.map(medicamento => ({
                ...medicamento,
                estado_stock: medicamento.existencias < 11 ? 'bajo' : 
                             medicamento.existencias < 50 ? 'medio' : 'normal',
                estado_vencimiento: new Date(medicamento.fecha_vencimiento) <= new Date() ? 'vencido' :
                                  new Date(medicamento.fecha_vencimiento) <= new Date(Date.now() + 30*24*60*60*1000) ? 'proximo_vencer' : 'vigente'
            }));

            return medicamentosConEstados;
        } catch (error) {
            console.error('❌ Error en findAll:', error);
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

    // Crear nuevo medicamento
    async create(medicamentoData) {
        const connection = await this.getConnection();
        try {
            console.log('➕ Creando medicamento:', medicamentoData.nombre);

            const query = `
                INSERT INTO medicamentos (
                    nombre, presentacion_id, laboratorio_id, existencias,
                    fecha_vencimiento, precio_tarjeta, precio_efectivo, costo_compra,
                    indicaciones, contraindicaciones, dosis, porcentaje_comision,
                    requiere_extras, activo, fecha_creacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
            `;

            const params = [
                medicamentoData.nombre,
                medicamentoData.presentacion_id,
                medicamentoData.laboratorio_id,
                medicamentoData.existencias || 0,
                medicamentoData.fecha_vencimiento,
                medicamentoData.precio_tarjeta || 0,
                medicamentoData.precio_efectivo || 0,
                medicamentoData.costo_compra || 0,
                medicamentoData.indicaciones || '',
                medicamentoData.contraindicaciones || '',
                medicamentoData.dosis || '',
                medicamentoData.porcentaje_comision || 0,
                medicamentoData.requiere_extras || false
            ];

            const [result] = await connection.execute(query, params);
            
            console.log('✅ Medicamento creado con ID:', result.insertId);

            // Obtener el medicamento creado
            return await this.findById(result.insertId);
        } catch (error) {
            console.error('❌ Error creando medicamento:', error);
            throw new Error('Error creando medicamento en la base de datos');
        } finally {
            await connection.end();
        }
    }

    // Actualizar medicamento
    async update(id, medicamentoData) {
        const connection = await this.getConnection();
        try {
            console.log('✏️ Actualizando medicamento ID:', id);

            // Construir query dinámico solo con campos proporcionados
            const setClauses = [];
            const params = [];

            if (medicamentoData.nombre !== undefined) {
                setClauses.push('nombre = ?');
                params.push(medicamentoData.nombre);
            }
            if (medicamentoData.presentacion_id !== undefined) {
                setClauses.push('presentacion_id = ?');
                params.push(medicamentoData.presentacion_id);
            }
            if (medicamentoData.laboratorio_id !== undefined) {
                setClauses.push('laboratorio_id = ?');
                params.push(medicamentoData.laboratorio_id);
            }
            if (medicamentoData.existencias !== undefined) {
                setClauses.push('existencias = ?');
                params.push(medicamentoData.existencias);
            }
            if (medicamentoData.fecha_vencimiento !== undefined) {
                setClauses.push('fecha_vencimiento = ?');
                params.push(medicamentoData.fecha_vencimiento);
            }
            if (medicamentoData.precio_tarjeta !== undefined) {
                setClauses.push('precio_tarjeta = ?');
                params.push(medicamentoData.precio_tarjeta);
            }
            if (medicamentoData.precio_efectivo !== undefined) {
                setClauses.push('precio_efectivo = ?');
                params.push(medicamentoData.precio_efectivo);
            }
            if (medicamentoData.costo_compra !== undefined) {
                setClauses.push('costo_compra = ?');
                params.push(medicamentoData.costo_compra);
            }
            if (medicamentoData.indicaciones !== undefined) {
                setClauses.push('indicaciones = ?');
                params.push(medicamentoData.indicaciones);
            }
            if (medicamentoData.contraindicaciones !== undefined) {
                setClauses.push('contraindicaciones = ?');
                params.push(medicamentoData.contraindicaciones);
            }
            if (medicamentoData.dosis !== undefined) {
                setClauses.push('dosis = ?');
                params.push(medicamentoData.dosis);
            }
            if (medicamentoData.porcentaje_comision !== undefined) {
                setClauses.push('porcentaje_comision = ?');
                params.push(medicamentoData.porcentaje_comision);
            }
            if (medicamentoData.requiere_extras !== undefined) {
                setClauses.push('requiere_extras = ?');
                params.push(medicamentoData.requiere_extras);
            }

            // Siempre actualizar fecha de modificación
            setClauses.push('fecha_actualizacion = NOW()');

            if (setClauses.length === 1) { // Solo fecha_actualizacion
                throw new Error('No hay campos para actualizar');
            }

            params.push(id); // Para el WHERE

            const query = `UPDATE medicamentos SET ${setClauses.join(', ')} WHERE id = ? AND activo = 1`;

            console.log('🔄 Query de actualización:', query);
            console.log('🔄 Parámetros:', params);

            const [result] = await connection.execute(query, params);

            if (result.affectedRows === 0) {
                throw new Error('Medicamento no encontrado o no se pudo actualizar');
            }

            console.log('✅ Medicamento actualizado exitosamente');

            // Obtener el medicamento actualizado
            return await this.findById(id);
        } catch (error) {
            console.error('❌ Error actualizando medicamento:', error);
            throw new Error('Error actualizando medicamento en la base de datos');
        } finally {
            await connection.end();
        }
    }

    // Actualizar stock específico
    async updateStock(id, cantidad, motivo = 'Ajuste manual', usuarioId = 1) {
        const connection = await this.getConnection();
        try {
            console.log('📦 Actualizando stock ID:', id, 'Nueva cantidad:', cantidad);

            // Verificar que el medicamento existe
            const medicamento = await this.findById(id);
            if (!medicamento) {
                throw new Error('Medicamento no encontrado');
            }

            // Actualizar stock
            const query = `UPDATE medicamentos SET existencias = ?, fecha_actualizacion = NOW() WHERE id = ? AND activo = 1`;
            const [result] = await connection.execute(query, [cantidad, id]);

            if (result.affectedRows === 0) {
                throw new Error('No se pudo actualizar el stock');
            }

            console.log('✅ Stock actualizado exitosamente');

            // Obtener medicamento actualizado
            return await this.findById(id);
        } catch (error) {
            console.error('❌ Error actualizando stock:', error);
            throw error;
        } finally {
            await connection.end();
        }
    }

    // Eliminar medicamento (soft delete)
    async delete(id) {
        const connection = await this.getConnection();
        try {
            console.log('🗑️ Eliminando medicamento ID:', id);

            const query = `UPDATE medicamentos SET activo = 0, fecha_actualizacion = NOW() WHERE id = ? AND activo = 1`;
            const [result] = await connection.execute(query, [id]);

            if (result.affectedRows === 0) {
                throw new Error('Medicamento no encontrado');
            }

            console.log('✅ Medicamento eliminado exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error eliminando medicamento:', error);
            throw new Error('Error eliminando medicamento de la base de datos');
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
                    SUM(CASE WHEN fecha_vencimiento <= DATE_ADD(NOW(), INTERVAL 30 DAY) AND fecha_vencimiento > NOW() THEN 1 ELSE 0 END) as proximo_vencer,
                    SUM(CASE WHEN fecha_vencimiento <= NOW() THEN 1 ELSE 0 END) as vencidos,
                    SUM(existencias) as total_existencias,
                    ROUND(AVG(precio_tarjeta), 2) as precio_promedio
                FROM medicamentos 
                WHERE activo = 1
            `;

            const [stats] = await connection.execute(query);
            console.log('📊 Estadísticas calculadas:', stats[0]);
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
            console.log(`📋 ${rows.length} presentaciones encontradas`);
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
            console.log(`🏭 ${rows.length} laboratorios encontrados`);
            return rows;
        } catch (error) {
            console.error('❌ Error obteniendo laboratorios:', error.message);
            throw new Error('Error obteniendo laboratorios');
        } finally {
            await connection.end();
        }
    }
}

// Exportar instancia única
module.exports = new Medicamento();