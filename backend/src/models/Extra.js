
const mysql = require('mysql2/promise');

class Extra {
    constructor() {
        // Configuración simplificada
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

    // Método de conexión
    async getConnection() {
        try {
            const connection = await mysql.createConnection(this.dbConfig);
            return connection;
        } catch (error) {
            console.error('❌ Error conectando a la base de datos:', error.message);
            throw new Error('Error de conexión a la base de datos');
        }
    }

    // =====================================
    // CRUD BÁSICO DE EXTRAS
    // =====================================

    // Obtener todos los extras con filtros
    async findAll(options = {}) {
        const connection = await this.getConnection();
        try {
            console.log('🔍 Opciones recibidas en findAll extras:', options);

            let query = `
                SELECT 
                    id,
                    nombre,
                    descripcion,
                    existencias,
                    stock_minimo,
                    costo_unitario,
                    activo,
                    fecha_creacion,
                    fecha_actualizacion
                FROM extras
                WHERE activo = 1
            `;

            const params = [];

            // Filtro de búsqueda por nombre
            if (options.search && options.search.trim()) {
                console.log('🔍 Aplicando filtro de búsqueda:', options.search);
                query += ` AND nombre LIKE ?`;
                const searchParam = `%${options.search.trim()}%`;
                params.push(searchParam);
            }

            // Filtro de stock bajo
            if (options.stock_bajo === true) {
                console.log('⚠️ Aplicando filtro de stock bajo');
                query += ` AND existencias < stock_minimo`;
            }

            // Ordenamiento
            query += ` ORDER BY nombre ASC`;

            // Paginación
            if (options.limit && options.limit > 0) {
                const limitValue = parseInt(options.limit);
                const offsetValue = parseInt(options.offset) || 0;
                
                if (offsetValue > 0) {
                    query += " LIMIT " + offsetValue + ", " + limitValue;
                } else {
                    query += " LIMIT " + limitValue;
                }
            }

            console.log('🔍 Query final construido:', query);
            console.log('🔍 Parámetros:', params);

            const [rows] = await connection.execute(query, params);

            console.log(`✅ Query ejecutado exitosamente, ${rows.length} extras encontrados`);

            // Agregar campos calculados
            const extrasConEstados = rows.map(extra => ({
                ...extra,
                estado_stock: extra.existencias < extra.stock_minimo ? 'bajo' : 
                             extra.existencias < (extra.stock_minimo * 2) ? 'medio' : 'normal',
                precio_formateado: `Q ${parseFloat(extra.costo_unitario).toFixed(2)}`
            }));

            return extrasConEstados;
        } catch (error) {
            console.error('❌ Error en findAll extras:', error);
            throw new Error('Error obteniendo extras de la base de datos');
        } finally {
            await connection.end();
        }
    }

    // Obtener extra por ID
    async findById(id) {
        const connection = await this.getConnection();
        try {
            const query = `
                SELECT 
                    id,
                    nombre,
                    descripcion,
                    existencias,
                    stock_minimo,
                    costo_unitario,
                    activo,
                    fecha_creacion,
                    fecha_actualizacion
                FROM extras
                WHERE id = ? AND activo = 1
            `;

            const [rows] = await connection.execute(query, [id]);

            if (rows.length === 0) return null;

            const extra = rows[0];

            // Agregar estados calculados
            extra.estado_stock = extra.existencias < extra.stock_minimo ? 'bajo' : 
                               extra.existencias < (extra.stock_minimo * 2) ? 'medio' : 'normal';
            extra.precio_formateado = `Q ${parseFloat(extra.costo_unitario).toFixed(2)}`;

            console.log('✅ Extra encontrado:', extra.nombre);
            return extra;
        } catch (error) {
            console.error('❌ Error obteniendo extra por ID:', error);
            throw new Error('Error obteniendo extra de la base de datos');
        } finally {
            await connection.end();
        }
    }

    // Crear nuevo extra
    async create(datos) {
        const connection = await this.getConnection();
        try {
            const query = `
                INSERT INTO extras (
                    nombre, 
                    descripcion, 
                    existencias, 
                    stock_minimo, 
                    costo_unitario,
                    activo
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

            const params = [
                datos.nombre,
                datos.descripcion || null,
                parseInt(datos.existencias) || 0,
                parseInt(datos.stock_minimo) || 20,
                parseFloat(datos.costo_unitario) || 0,
                datos.activo !== undefined ? datos.activo : true
            ];

            const [result] = await connection.execute(query, params);

            console.log('✅ Extra creado exitosamente:', {
                id: result.insertId,
                nombre: datos.nombre
            });

            return result.insertId;
        } catch (error) {
            console.error('❌ Error creando extra:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un extra con ese nombre');
            }
            throw new Error('Error creando extra en la base de datos');
        } finally {
            await connection.end();
        }
    }

    // Actualizar extra
    async update(id, datos) {
        const connection = await this.getConnection();
        try {
            const query = `
                UPDATE extras SET
                    nombre = ?,
                    descripcion = ?,
                    existencias = ?,
                    stock_minimo = ?,
                    costo_unitario = ?,
                    activo = ?,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = ? AND activo = 1
            `;

            const params = [
                datos.nombre,
                datos.descripcion || null,
                parseInt(datos.existencias),
                parseInt(datos.stock_minimo) || 20,
                parseFloat(datos.costo_unitario),
                datos.activo !== undefined ? datos.activo : true,
                id
            ];

            const [result] = await connection.execute(query, params);

            if (result.affectedRows === 0) {
                throw new Error('Extra no encontrado');
            }

            console.log('✅ Extra actualizado exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error actualizando extra:', error);
            throw new Error('Error actualizando extra en la base de datos');
        } finally {
            await connection.end();
        }
    }

    // Actualizar stock específicamente
    async updateStock(id, nuevasExistencias, motivo = 'Ajuste manual') {
        const connection = await this.getConnection();
        try {
            const query = `
                UPDATE extras SET
                    existencias = ?,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = ? AND activo = 1
            `;

            const [result] = await connection.execute(query, [nuevasExistencias, id]);

            if (result.affectedRows === 0) {
                throw new Error('Extra no encontrado');
            }

            console.log('✅ Stock de extra actualizado:', {
                id: id,
                nuevasExistencias: nuevasExistencias,
                motivo: motivo
            });

            return true;
        } catch (error) {
            console.error('❌ Error actualizando stock de extra:', error);
            throw new Error('Error actualizando stock de extra');
        } finally {
            await connection.end();
        }
    }

    // Eliminar extra (soft delete)
    async delete(id) {
        const connection = await this.getConnection();
        try {
            const query = `
                UPDATE extras SET
                    activo = 0,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = ? AND activo = 1
            `;

            const [result] = await connection.execute(query, [id]);

            if (result.affectedRows === 0) {
                throw new Error('Extra no encontrado');
            }

            console.log('✅ Extra eliminado exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error eliminando extra:', error);
            throw new Error('Error eliminando extra de la base de datos');
        } finally {
            await connection.end();
        }
    }

    // =====================================
    // RELACIÓN CON MEDICAMENTOS
    // =====================================

    // Obtener extras de un medicamento
    async getExtrasByMedicamento(medicamentoId) {
        const connection = await this.getConnection();
        try {
            const query = `
                SELECT 
                    e.id,
                    e.nombre,
                    e.descripcion,
                    e.existencias,
                    e.costo_unitario,
                    me.cantidad_requerida
                FROM extras e
                INNER JOIN medicamentos_extras me ON e.id = me.extra_id
                WHERE me.medicamento_id = ? AND e.activo = 1
                ORDER BY e.nombre ASC
            `;

            const [rows] = await connection.execute(query, [medicamentoId]);

            console.log(`✅ ${rows.length} extras encontrados para medicamento ${medicamentoId}`);
            return rows;
        } catch (error) {
            console.error('❌ Error obteniendo extras de medicamento:', error);
            throw new Error('Error obteniendo extras del medicamento');
        } finally {
            await connection.end();
        }
    }

    // Vincular extra con medicamento
    async vincularConMedicamento(medicamentoId, extraId, cantidadRequerida = 1) {
        const connection = await this.getConnection();
        try {
            const query = `
                INSERT INTO medicamentos_extras (medicamento_id, extra_id, cantidad_requerida)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE cantidad_requerida = VALUES(cantidad_requerida)
            `;

            await connection.execute(query, [medicamentoId, extraId, cantidadRequerida]);

            console.log('✅ Extra vinculado con medicamento:', {
                medicamentoId,
                extraId,
                cantidadRequerida
            });

            return true;
        } catch (error) {
            console.error('❌ Error vinculando extra:', error);
            throw new Error('Error vinculando extra con medicamento');
        } finally {
            await connection.end();
        }
    }

    // Desvincular extra de medicamento
    async desvincularDeMedicamento(medicamentoId, extraId) {
        const connection = await this.getConnection();
        try {
            const query = `
                DELETE FROM medicamentos_extras 
                WHERE medicamento_id = ? AND extra_id = ?
            `;

            const [result] = await connection.execute(query, [medicamentoId, extraId]);

            console.log('✅ Extra desvinculado de medicamento');
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Error desvinculando extra:', error);
            throw new Error('Error desvinculando extra de medicamento');
        } finally {
            await connection.end();
        }
    }



    // =====================================
    // RELACIÓN CON SERVICIOS
    // =====================================

    // Obtener extras de un servicio
    async getExtrasByServicio(servicioId) {
        const connection = await this.getConnection();
        try {
            const query = `
                SELECT 
                    e.id,
                    e.nombre,
                    e.descripcion,
                    e.existencias,
                    e.stock_minimo,
                    e.costo_unitario,
                    se.cantidad_requerida,
                    se.fecha_creacion as fecha_vinculacion
                FROM extras e
                INNER JOIN servicios_extras se ON e.id = se.extra_id
                WHERE se.servicio_id = ? AND e.activo = 1
                ORDER BY e.nombre ASC
            `;

            const [rows] = await connection.execute(query, [servicioId]);

            console.log(`✅ ${rows.length} extras encontrados para servicio ${servicioId}`);
            return rows;
        } catch (error) {
            console.error('❌ Error obteniendo extras de servicio:', error);
            throw new Error('Error obteniendo extras del servicio');
        } finally {
            await connection.end();
        }
    }

    // Vincular extra con servicio
    async vincularConServicio(servicioId, extraId, cantidadRequerida = 1) {
        const connection = await this.getConnection();
        try {
            // Verificar que el servicio existe
            const [servicios] = await connection.execute(
                'SELECT id FROM servicios WHERE id = ?',
                [servicioId]
            );
            
            if (servicios.length === 0) {
                throw new Error('Servicio no encontrado');
            }
            
            // Verificar que el extra existe
            const [extras] = await connection.execute(
                'SELECT id FROM extras WHERE id = ? AND activo = 1',
                [extraId]
            );
            
            if (extras.length === 0) {
                throw new Error('Extra no encontrado');
            }

            const query = `
                INSERT INTO servicios_extras (servicio_id, extra_id, cantidad_requerida)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE cantidad_requerida = VALUES(cantidad_requerida)
            `;

            await connection.execute(query, [servicioId, extraId, cantidadRequerida]);

            console.log('✅ Extra vinculado con servicio:', {
                servicioId,
                extraId,
                cantidadRequerida
            });

            return true;
        } catch (error) {
            console.error('❌ Error vinculando extra con servicio:', error);
            throw error;
        } finally {
            await connection.end();
        }
    }

    // Desvincular extra de servicio
    async desvincularDeServicio(servicioId, extraId) {
        const connection = await this.getConnection();
        try {
            const query = `
                DELETE FROM servicios_extras 
                WHERE servicio_id = ? AND extra_id = ?
            `;

            const [result] = await connection.execute(query, [servicioId, extraId]);

            console.log('✅ Extra desvinculado de servicio');
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Error desvinculando extra de servicio:', error);
            throw new Error('Error desvinculando extra de servicio');
        } finally {
            await connection.end();
        }
    }



    // =============================================
    // MÉTODOS PARA RELACIÓN CON SERVICIOS
    // =============================================

    /**
     * Obtener extras vinculados a un servicio
     */
    static async getExtrasByServicio(servicioId) {
        try {
            const [rows] = await pool.execute(
            `SELECT 
                e.id,
                e.nombre,
                e.descripcion,
                e.existencias,
                e.stock_minimo,
                e.precio_unitario AS costo_unitario,
                e.activo,
                se.cantidad_requerida,
                se.fecha_creacion AS fecha_vinculacion
            FROM extras e
            INNER JOIN servicios_extras se ON e.id = se.extra_id
            WHERE se.servicio_id = ?
            AND e.activo = 1
            ORDER BY e.nombre ASC`,
            [servicioId]
            );
            
            return rows;
        } catch (error) {
            console.error('Error obteniendo extras del servicio:', error);
            throw error;
        }
        }

        /**
         * Vincular un extra con un servicio
         */
        static async vincularConServicio(servicioId, extraId, cantidadRequerida = 1) {
        try {
            // Verificar que el servicio existe
            const [servicios] = await pool.execute(
            'SELECT id FROM servicios WHERE id = ?',
            [servicioId]
            );
            
            if (servicios.length === 0) {
            throw new Error('Servicio no encontrado');
            }
            
            // Verificar que el extra existe
            const [extras] = await pool.execute(
            'SELECT id FROM extras WHERE id = ?',
            [extraId]
            );
            
            if (extras.length === 0) {
            throw new Error('Extra no encontrado');
            }
            
            // Insertar vinculación (o actualizar si ya existe)
            await pool.execute(
            `INSERT INTO servicios_extras (servicio_id, extra_id, cantidad_requerida)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE cantidad_requerida = ?`,
            [servicioId, extraId, cantidadRequerida, cantidadRequerida]
            );
            
            return true;
        } catch (error) {
            console.error('Error vinculando extra con servicio:', error);
            throw error;
        }
        }

        /**
         * Desvincular un extra de un servicio
         */
        static async desvincularDeServicio(servicioId, extraId) {
        try {
            const [result] = await pool.execute(
            'DELETE FROM servicios_extras WHERE servicio_id = ? AND extra_id = ?',
            [servicioId, extraId]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error desvinculando extra del servicio:', error);
            throw error;
        }
    }
    // =====================================
    // ESTADÍSTICAS Y UTILIDADES
    // =====================================

    // Obtener estadísticas de extras
    async getStats() {
        const connection = await this.getConnection();
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_extras,
                    SUM(CASE WHEN existencias < stock_minimo THEN 1 ELSE 0 END) as stock_bajo,
                    SUM(existencias) as total_existencias,
                    ROUND(AVG(costo_unitario), 2) as precio_promedio
                FROM extras 
                WHERE activo = 1
            `;

            const [stats] = await connection.execute(query);
            console.log('📊 Estadísticas de extras calculadas:', stats[0]);
            return stats[0];
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas de extras:', error.message);
            throw new Error('Error obteniendo estadísticas de extras');
        } finally {
            await connection.end();
        }
    }
}

// Exportar instancia única
module.exports = new Extra();