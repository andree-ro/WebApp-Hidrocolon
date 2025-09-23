// ============================================================================
// 🏥 RUTAS DEL MÓDULO PACIENTES - Sistema Hidrocolon
// SOLUCIÓN FINAL BASADA EN PROBLEMAS RESUELTOS DE FARMACIA
// ============================================================================

const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware.authenticate());

// ============================================================================
// 🔧 FUNCIÓN AUXILIAR PARA CONEXIÓN BD
// ============================================================================

async function getConnection() {
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
        console.error('❌ Error conectando a la base de datos:', error.message);
        throw new Error('Error de conexión a la base de datos');
    }
}

// ============================================================================
// 📋 CRUD BÁSICO PACIENTES
// ============================================================================

// GET - Listar pacientes con filtros - VERSIÓN CORREGIDA
router.get('/', async (req, res) => {
    let connection;
    try {
        console.log('🔍 GET /api/pacientes - Listar pacientes');
        
        connection = await getConnection();
        
        // VALIDACIÓN ESTRICTA como en servicios.js
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const search = (req.query.search || '').toString().trim();
        const filtro = (req.query.filtro || 'todos').toString();

        console.log('📋 Parámetros validados:', { page, limit, search, filtro });

        // QUERY BASE SIN PARÁMETROS DINÁMICOS
        let whereConditions = ['p.activo = 1'];
        let queryParams = [];

        // Agregar condiciones de búsqueda
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

        // Agregar filtros especiales
        if (filtro === 'cumpleanos_mes') {
            whereConditions.push('MONTH(p.fecha_nacimiento) = MONTH(NOW())');
        } else if (filtro === 'citas_manana') {
            whereConditions.push('DATE(p.proxima_cita) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY))');
        }

        // CONSTRUIR QUERY PRINCIPAL SIN LIMIT DINÁMICO
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
                p.fecha_actualizacion
            FROM pacientes p
            WHERE ${whereClause}
            ORDER BY p.nombres ASC, p.apellidos ASC
        `;

        console.log('📋 Query principal:', mainQuery);
        console.log('📋 Parámetros query:', queryParams);

        // EJECUTAR QUERY PRINCIPAL
        const [allRows] = await connection.execute(mainQuery, queryParams);
        
        // APLICAR PAGINACIÓN MANUALMENTE (SOLUCIÓN COMPROBADA)
        const offset = (page - 1) * limit;
        const pacientes = allRows.slice(offset, offset + limit);
        const total = allRows.length;

        console.log(`✅ Query exitoso: ${pacientes.length} pacientes de ${total} total`);

        res.json({
            success: true,
            message: 'Pacientes obtenidos correctamente',
            data: pacientes,
            pagination: {
                current_page: page,
                per_page: limit,
                total: total,
                total_pages: Math.ceil(total / limit),
                has_next: offset + limit < total,
                has_prev: page > 1
            }
        });

    } catch (error) {
        console.error('❌ Error en GET /api/pacientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo pacientes',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

// GET - Obtener paciente específico
router.get('/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        console.log(`🔍 GET /api/pacientes/${id} - Buscar paciente específico`);

        connection = await getConnection();

        const query = `
            SELECT 
                p.id,
                p.nombres as nombre,
                p.apellidos as apellido,
                CONCAT(p.nombres, ' ', p.apellidos) as nombre_completo,
                p.telefono,
                p.dpi,
                p.fecha_primer_cita,
                p.proxima_cita,
                p.fecha_nacimiento as cumpleanos,
                p.activo,
                p.fecha_creacion,
                p.fecha_actualizacion
            FROM pacientes p
            WHERE p.id = ? AND p.activo = 1
        `;

        const [rows] = await connection.execute(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        console.log(`✅ Paciente encontrado: ${rows[0].nombre_completo}`);

        res.json({
            success: true,
            message: 'Paciente encontrado',
            data: rows[0]
        });

    } catch (error) {
        console.error(`❌ Error en GET /api/pacientes/${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo paciente',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

// POST - Crear nuevo paciente
router.post('/', async (req, res) => {
    let connection;
    try {
        console.log('📝 POST /api/pacientes - Crear nuevo paciente');
        
        connection = await getConnection();
        
        const {
            nombre,
            apellido,
            telefono,
            dpi = null,
            fecha_primer_cita,
            proxima_cita = null,
            cumpleanos
        } = req.body;

        // Validaciones básicas
        if (!nombre || !apellido || !telefono || !fecha_primer_cita || !cumpleanos) {
            return res.status(400).json({
                success: false,
                message: 'Campos requeridos: nombre, apellido, telefono, fecha_primer_cita, cumpleanos'
            });
        }

        const query = `
            INSERT INTO pacientes (
                nombres, apellidos, telefono, dpi, 
                fecha_primer_cita, proxima_cita, fecha_nacimiento,
                activo, fecha_creacion, fecha_actualizacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
        `;

        const [result] = await connection.execute(query, [
            nombre.trim(),
            apellido.trim(),
            telefono.trim(),
            dpi ? dpi.trim() : null,
            fecha_primer_cita,
            proxima_cita,
            cumpleanos
        ]);

        console.log(`✅ Paciente creado con ID: ${result.insertId}`);

        res.status(201).json({
            success: true,
            message: 'Paciente creado correctamente',
            data: {
                id: result.insertId,
                nombre,
                apellido,
                telefono,
                dpi,
                fecha_primer_cita,
                proxima_cita,
                cumpleanos
            }
        });

    } catch (error) {
        console.error('❌ Error en POST /api/pacientes:', error);
        
        // Error por DPI duplicado (si tiene UNIQUE constraint)
        if (error.code === 'ER_DUP_ENTRY' && error.message.includes('dpi')) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un paciente con ese DPI'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creando paciente',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

// PUT - Actualizar paciente
router.put('/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        console.log(`📝 PUT /api/pacientes/${id} - Actualizar paciente`);

        connection = await getConnection();

        const {
            nombre,
            apellido,
            telefono,
            dpi,
            fecha_primer_cita,
            proxima_cita,
            cumpleanos
        } = req.body;

        // Verificar que el paciente existe
        const checkQuery = `SELECT id FROM pacientes WHERE id = ? AND activo = 1`;
        const [existing] = await connection.execute(checkQuery, [id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        const query = `
            UPDATE pacientes 
            SET nombres = ?, apellidos = ?, telefono = ?, dpi = ?,
                fecha_primer_cita = ?, proxima_cita = ?, fecha_nacimiento = ?,
                fecha_actualizacion = NOW()
            WHERE id = ? AND activo = 1
        `;

        await connection.execute(query, [
            nombre?.trim(),
            apellido?.trim(),
            telefono?.trim(),
            dpi ? dpi.trim() : null,
            fecha_primer_cita,
            proxima_cita,
            cumpleanos,
            id
        ]);

        console.log(`✅ Paciente ${id} actualizado correctamente`);

        res.json({
            success: true,
            message: 'Paciente actualizado correctamente',
            data: {
                id: parseInt(id),
                nombre,
                apellido,
                telefono,
                dpi,
                fecha_primer_cita,
                proxima_cita,
                cumpleanos
            }
        });

    } catch (error) {
        console.error(`❌ Error en PUT /api/pacientes/${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando paciente',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

// DELETE - Eliminar paciente (soft delete)
router.delete('/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        console.log(`🗑️ DELETE /api/pacientes/${id} - Eliminar paciente`);

        connection = await getConnection();

        // Verificar que el paciente existe
        const checkQuery = `SELECT id, nombres, apellidos FROM pacientes WHERE id = ? AND activo = 1`;
        const [existing] = await connection.execute(checkQuery, [id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        const query = `
            UPDATE pacientes 
            SET activo = 0, fecha_actualizacion = NOW()
            WHERE id = ?
        `;

        await connection.execute(query, [id]);

        console.log(`✅ Paciente ${id} eliminado (soft delete)`);

        res.json({
            success: true,
            message: 'Paciente eliminado correctamente'
        });

    } catch (error) {
        console.error(`❌ Error en DELETE /api/pacientes/${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error eliminando paciente',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

// ============================================================================
// 📊 ENDPOINTS ESPECIALES
// ============================================================================

// GET - Estadísticas de pacientes
router.get('/stats/general', async (req, res) => {
    let connection;
    try {
        console.log('📊 GET /api/pacientes/stats/general - Estadísticas');

        connection = await getConnection();

        const queries = {
            total: `SELECT COUNT(*) as total FROM pacientes WHERE activo = 1`,
            cumpleanos_mes: `
                SELECT COUNT(*) as total 
                FROM pacientes 
                WHERE activo = 1 AND MONTH(fecha_nacimiento) = MONTH(NOW())
            `,
            citas_manana: `
                SELECT COUNT(*) as total 
                FROM pacientes 
                WHERE activo = 1 AND DATE(proxima_cita) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY))
            `,
            sin_proxima_cita: `
                SELECT COUNT(*) as total 
                FROM pacientes 
                WHERE activo = 1 AND (proxima_cita IS NULL OR proxima_cita < NOW())
            `
        };

        const stats = {};
        
        for (const [key, query] of Object.entries(queries)) {
            const [result] = await connection.execute(query);
            stats[key] = result[0].total;
        }

        console.log(`✅ Estadísticas calculadas:`, stats);

        res.json({
            success: true,
            message: 'Estadísticas obtenidas correctamente',
            data: stats
        });

    } catch (error) {
        console.error('❌ Error en GET /api/pacientes/stats/general:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

// GET - Exportar pacientes (preparar datos para Excel)
router.get('/export/excel', async (req, res) => {
    let connection;
    try {
        console.log('📊 GET /api/pacientes/export/excel - Preparar datos para exportación');

        connection = await getConnection();

        const query = `
            SELECT 
                p.id,
                p.nombres as nombre,
                p.apellidos as apellido,
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

        res.json({
            success: true,
            message: 'Datos preparados para exportación',
            data: pacientes,
            headers: [
                'ID', 'Nombre', 'Apellido', 'Nombre Completo', 
                'Teléfono', 'DPI', 'Fecha Primera Cita', 
                'Próxima Cita', 'Cumpleaños', 'Fecha Registro'
            ]
        });

    } catch (error) {
        console.error('❌ Error en GET /api/pacientes/export/excel:', error);
        res.status(500).json({
            success: false,
            message: 'Error preparando datos para exportación',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

console.log('✅ Rutas del módulo PACIENTES configuradas:');
console.log('   GET    /api/pacientes');
console.log('   GET    /api/pacientes/:id');
console.log('   POST   /api/pacientes');
console.log('   PUT    /api/pacientes/:id');
console.log('   DELETE /api/pacientes/:id');
console.log('   GET    /api/pacientes/stats/general');
console.log('   GET    /api/pacientes/export/excel');

module.exports = router;