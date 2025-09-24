// ============================================================================
// 🏥 MODELO PACIENTE - Sistema Hidrocolon
// Siguiendo el mismo patrón que Medicamento.js, Extra.js y Servicio.js
// ============================================================================

const mysql = require('mysql2/promise');

class Paciente {
    constructor(data = {}) {
        this.id = data.id;
        this.nombres = data.nombres;
        this.apellidos = data.apellidos;
        this.nombre_completo = data.nombre_completo || (data.nombres && data.apellidos ? `${data.nombres} ${data.apellidos}` : null);
        this.telefono = data.telefono;
        this.dpi = data.dpi;
        this.fecha_primer_cita = data.fecha_primer_cita;
        this.proxima_cita = data.proxima_cita;
        this.fecha_nacimiento = data.fecha_nacimiento;
        this.cumpleanos = data.cumpleanos || data.fecha_nacimiento; // Alias
        this.activo = Boolean(data.activo);
        this.fecha_creacion = data.fecha_creacion;
        this.fecha_actualizacion = data.fecha_actualizacion;
    }

    // ========================================================================
    // CONFIGURACIÓN DE CONEXIÓN BD
    // ========================================================================
    static async getConnection() {
        try {
            return await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                port: process.env.DB_PORT || 3306,
                charset: 'utf8mb4',
                timezone: 'Z',
                acquireTimeout: 60000,
                timeout: 60000
            });
        } catch (error) {
            console.error('❌ Error creando conexión DB Paciente:', error);
            throw new Error('Error conectando a la base de datos');
        }
    }

    // ========================================================================
    // CRUD BÁSICO
    // ========================================================================

    // FINDALL - Lista con filtros y paginación
    static async findAll(options = {}) {
        console.log('🔍 Paciente.findAll - Opciones:', options);
        
        let connection;
        try {
            connection = await this.getConnection();

            // Validación estricta de parámetros
            const page = Math.max(1, parseInt(options.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 10));
            const search = (options.search || '').toString().trim();
            const filtro = (options.filtro || 'todos').toString();

            // Query base
            let whereConditions = ['p.activo = 1'];
            let queryParams = [];

            // Filtro de búsqueda
            if (search.length > 0) {
                whereConditions.push(`(
                    p.nombres LIKE ? OR 
                    p.apellidos LIKE ? OR 
                    p.telefono LIKE ? OR 
                    p.dpi LIKE ?
                )`);
                const searchTerm = `%${search}%`;
                queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            // Filtros especiales
            if (filtro === 'cumpleanos_mes') {
                whereConditions.push('MONTH(p.fecha_nacimiento) = MONTH(NOW())');
            } else if (filtro === 'citas_manana') {
                whereConditions.push('DATE(p.proxima_cita) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY))');
            } else if (filtro === 'sin_proxima_cita') {
                whereConditions.push('(p.proxima_cita IS NULL OR p.proxima_cita < NOW())');
            } else if (filtro === 'menores_edad') {
                whereConditions.push('p.dpi IS NULL');
            }

            // Construir query principal
            const whereClause = whereConditions.join(' AND ');
            const mainQuery = `
                SELECT 
                    p.id,
                    p.nombres,
                    p.apellidos,
                    CONCAT(p.nombres, ' ', p.apellidos) as nombre_completo,
                    p.telefono,
                    p.dpi,
                    p.fecha_primer_cita,
                    p.proxima_cita,
                    p.fecha_nacimiento,
                    p.activo,
                    p.fecha_creacion,
                    p.fecha_actualizacion,
                    CASE 
                        WHEN p.dpi IS NULL THEN 'Menor de edad'
                        ELSE 'Adulto'
                    END as tipo_paciente,
                    CASE 
                        WHEN p.proxima_cita IS NULL THEN 'Sin cita'
                        WHEN DATE(p.proxima_cita) = CURDATE() THEN 'Cita hoy'
                        WHEN DATE(p.proxima_cita) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY)) THEN 'Cita mañana'
                        WHEN p.proxima_cita < NOW() THEN 'Cita vencida'
                        ELSE 'Cita programada'
                    END as estado_cita
                FROM pacientes p
                WHERE ${whereClause}
                ORDER BY p.nombres ASC, p.apellidos ASC
            `;

            console.log('📋 Query Pacientes:', mainQuery);
            console.log('📋 Parámetros:', queryParams);

            // Ejecutar query
            const [allRows] = await connection.execute(mainQuery, queryParams);
            
            // Paginación manual
            const offset = (page - 1) * limit;
            const pacientes = allRows.slice(offset, offset + limit);
            const total = allRows.length;

            console.log(`✅ ${pacientes.length} pacientes encontrados de ${total} total`);

            return {
                data: pacientes.map(p => new Paciente(p)),
                pagination: {
                    current_page: page,
                    per_page: limit,
                    total: total,
                    total_pages: Math.ceil(total / limit),
                    has_next: offset + limit < total,
                    has_prev: page > 1
                }
            };

        } catch (error) {
            console.error('❌ Error en Paciente.findAll:', error);
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    }

    // FINDBYID - Buscar por ID
    static async findById(id) {
        console.log(`🔍 Paciente.findById: ${id}`);
        
        let connection;
        try {
            connection = await this.getConnection();

            const query = `
                SELECT 
                    p.id,
                    p.nombres,
                    p.apellidos,
                    CONCAT(p.nombres, ' ', p.apellidos) as nombre_completo,
                    p.telefono,
                    p.dpi,
                    p.fecha_primer_cita,
                    p.proxima_cita,
                    p.fecha_nacimiento,
                    p.activo,
                    p.fecha_creacion,
                    p.fecha_actualizacion
                FROM pacientes p
                WHERE p.id = ? AND p.activo = 1
            `;

            const [rows] = await connection.execute(query, [id]);

            if (rows.length === 0) {
                return null;
            }

            console.log(`✅ Paciente encontrado: ${rows[0].nombre_completo}`);
            return new Paciente(rows[0]);

        } catch (error) {
            console.error(`❌ Error en Paciente.findById(${id}):`, error);
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    }

    // CREATE - Crear nuevo paciente
    static async create(data) {
        console.log('📝 Paciente.create:', data);
        
        let connection;
        try {
            connection = await this.getConnection();

            // Validaciones
            if (!data.nombres || !data.apellidos || !data.telefono || !data.fecha_primer_cita || !data.fecha_nacimiento) {
                throw new Error('Campos requeridos: nombres, apellidos, telefono, fecha_primer_cita, fecha_nacimiento');
            }

            const query = `
                INSERT INTO pacientes (
                    nombres, apellidos, telefono, dpi, 
                    fecha_primer_cita, proxima_cita, fecha_nacimiento,
                    activo, fecha_creacion, fecha_actualizacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
            `;

            const [result] = await connection.execute(query, [
                data.nombres.trim(),
                data.apellidos.trim(),
                data.telefono.trim(),
                data.dpi ? data.dpi.trim() : null,
                data.fecha_primer_cita,
                data.proxima_cita || null,
                data.fecha_nacimiento || data.cumpleanos
            ]);

            console.log(`✅ Paciente creado con ID: ${result.insertId}`);

            // Devolver el paciente creado
            return await this.findById(result.insertId);

        } catch (error) {
            console.error('❌ Error en Paciente.create:', error);
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    }

    // UPDATE - Actualizar paciente
    static async update(id, data) {
        console.log(`📝 Paciente.update(${id}):`, data);
        
        let connection;
        try {
            connection = await this.getConnection();

            // Verificar que existe
            const exists = await this.findById(id);
            if (!exists) {
                throw new Error('Paciente no encontrado');
            }

            const query = `
                UPDATE pacientes 
                SET nombres = ?, apellidos = ?, telefono = ?, dpi = ?,
                    fecha_primer_cita = ?, proxima_cita = ?, fecha_nacimiento = ?,
                    fecha_actualizacion = NOW()
                WHERE id = ? AND activo = 1
            `;

            await connection.execute(query, [
                data.nombres?.trim(),
                data.apellidos?.trim(),
                data.telefono?.trim(),
                data.dpi ? data.dpi.trim() : null,
                data.fecha_primer_cita,
                data.proxima_cita || null,
                data.fecha_nacimiento || data.cumpleanos,
                id
            ]);

            console.log(`✅ Paciente ${id} actualizado correctamente`);

            // Devolver el paciente actualizado
            return await this.findById(id);

        } catch (error) {
            console.error(`❌ Error en Paciente.update(${id}):`, error);
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    }

    // DELETE - Soft delete
    static async delete(id) {
        console.log(`🗑️ Paciente.delete: ${id}`);
        
        let connection;
        try {
            connection = await this.getConnection();

            // Verificar que existe
            const exists = await this.findById(id);
            if (!exists) {
                throw new Error('Paciente no encontrado');
            }

            const query = `
                UPDATE pacientes 
                SET activo = 0, fecha_actualizacion = NOW()
                WHERE id = ?
            `;

            await connection.execute(query, [id]);

            console.log(`✅ Paciente ${id} eliminado (soft delete)`);
            return true;

        } catch (error) {
            console.error(`❌ Error en Paciente.delete(${id}):`, error);
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    }

    // ========================================================================
    // MÉTODOS ESPECIALES
    // ========================================================================

    // GETSTATS - Estadísticas
    static async getStats() {
        console.log('📊 Paciente.getStats');
        
        let connection;
        try {
            connection = await this.getConnection();

            const query = `
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN MONTH(fecha_nacimiento) = MONTH(NOW()) THEN 1 END) as cumpleanos_mes,
                    COUNT(CASE WHEN DATE(proxima_cita) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY)) THEN 1 END) as citas_manana,
                    COUNT(CASE WHEN dpi IS NULL THEN 1 END) as menores_sin_dpi,
                    COUNT(CASE WHEN proxima_cita IS NULL OR proxima_cita < NOW() THEN 1 END) as sin_proxima_cita,
                    COUNT(CASE WHEN DATE(proxima_cita) = CURDATE() THEN 1 END) as citas_hoy
                FROM pacientes 
                WHERE activo = 1
            `;

            const [result] = await connection.execute(query);
            const stats = result[0];

            console.log('✅ Estadísticas calculadas:', stats);
            return stats;

        } catch (error) {
            console.error('❌ Error en Paciente.getStats:', error);
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    }

    // GETEXPORTDATA - Datos para Excel
    static async getExportData() {
        console.log('📊 Paciente.getExportData');
        
        let connection;
        try {
            connection = await this.getConnection();

            const query = `
                SELECT 
                    p.id,
                    p.nombres,
                    p.apellidos,
                    CONCAT(p.nombres, ' ', p.apellidos) as nombre_completo,
                    p.telefono,
                    COALESCE(p.dpi, 'No registrado') as dpi,
                    DATE_FORMAT(p.fecha_primer_cita, '%d/%m/%Y') as fecha_primer_cita,
                    CASE 
                        WHEN p.proxima_cita IS NOT NULL 
                        THEN DATE_FORMAT(p.proxima_cita, '%d/%m/%Y %H:%i')
                        ELSE 'Sin cita programada'
                    END as proxima_cita,
                    DATE_FORMAT(p.fecha_nacimiento, '%d/%m/%Y') as cumpleanos,
                    DATE_FORMAT(p.fecha_creacion, '%d/%m/%Y') as fecha_registro
                FROM pacientes p
                WHERE p.activo = 1
                ORDER BY p.nombres ASC, p.apellidos ASC
            `;

            const [pacientes] = await connection.execute(query);

            console.log(`✅ ${pacientes.length} pacientes preparados para exportación`);

            return {
                data: pacientes,
                headers: [
                    'ID', 'Nombres', 'Apellidos', 'Nombre Completo', 
                    'Teléfono', 'DPI', 'Fecha Primera Cita', 
                    'Próxima Cita', 'Cumpleaños', 'Fecha Registro'
                ]
            };

        } catch (error) {
            console.error('❌ Error en Paciente.getExportData:', error);
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    }
}

module.exports = Paciente;