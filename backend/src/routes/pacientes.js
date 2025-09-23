// ============================================================================
// 🏥 RUTAS DEL MÓDULO PACIENTES - Sistema Hidrocolon
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware.authenticate());

// ============================================================================
// 📋 CRUD BÁSICO PACIENTES
// ============================================================================

// GET - Listar pacientes con filtros
router.get('/', async (req, res) => {
    try {
        console.log('🔍 GET /api/pacientes - Listar pacientes');
        
        const {
            page = 1,
            limit = 10,
            search = '',
            filtro = 'todos' // todos, cumpleanos_mes, citas_manana
        } = req.query;

        let whereClause = 'WHERE p.activo = true';
        let params = [];

        // Filtro de búsqueda
        if (search) {
            whereClause += ` AND (
                p.nombre LIKE ? OR 
                p.apellido LIKE ? OR 
                p.telefono LIKE ? OR 
                p.dpi LIKE ?
            )`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // Filtros especiales
        if (filtro === 'cumpleanos_mes') {
            whereClause += ` AND MONTH(p.cumpleanos) = MONTH(NOW())`;
        } else if (filtro === 'citas_manana') {
            whereClause += ` AND DATE(p.proxima_cita) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY))`;
        }

        // Paginación
        const offset = (page - 1) * limit;

        const query = `
            SELECT 
                p.id,
                p.nombre,
                p.apellido,
                CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
                p.telefono,
                p.dpi,
                p.fecha_primer_cita,
                p.proxima_cita,
                p.cumpleanos,
                p.fecha_creacion,
                p.fecha_actualizacion
            FROM pacientes p
            ${whereClause}
            ORDER BY p.nombre ASC, p.apellido ASC
            LIMIT ? OFFSET ?
        `;
        
        params.push(parseInt(limit), parseInt(offset));
        
        const [pacientes] = await db.execute(query, params);

        // Contar total para paginación
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM pacientes p 
            ${whereClause}
        `;
        const countParams = params.slice(0, -2); // Quitar limit y offset
        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        console.log(`✅ ${pacientes.length} pacientes encontrados`);

        res.json({
            success: true,
            message: 'Pacientes obtenidos correctamente',
            data: pacientes,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total,
                total_pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('❌ Error en GET /api/pacientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo pacientes',
            error: error.message
        });
    }
});

// GET - Obtener paciente específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 GET /api/pacientes/${id} - Buscar paciente específico`);

        const query = `
            SELECT 
                p.id,
                p.nombre,
                p.apellido,
                CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
                p.telefono,
                p.dpi,
                p.fecha_primer_cita,
                p.proxima_cita,
                p.cumpleanos,
                p.activo,
                p.fecha_creacion,
                p.fecha_actualizacion
            FROM pacientes p
            WHERE p.id = ? AND p.activo = true
        `;

        const [rows] = await db.execute(query, [id]);

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
    }
});

// POST - Crear nuevo paciente
router.post('/', async (req, res) => {
    try {
        console.log('📝 POST /api/pacientes - Crear nuevo paciente');
        
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
                nombre, apellido, telefono, dpi, 
                fecha_primer_cita, proxima_cita, cumpleanos,
                activo, fecha_creacion, fecha_actualizacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
        `;

        const [result] = await db.execute(query, [
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
    }
});

// PUT - Actualizar paciente
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📝 PUT /api/pacientes/${id} - Actualizar paciente`);

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
        const checkQuery = `SELECT id FROM pacientes WHERE id = ? AND activo = true`;
        const [existing] = await db.execute(checkQuery, [id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        const query = `
            UPDATE pacientes 
            SET nombre = ?, apellido = ?, telefono = ?, dpi = ?,
                fecha_primer_cita = ?, proxima_cita = ?, cumpleanos = ?,
                fecha_actualizacion = NOW()
            WHERE id = ? AND activo = true
        `;

        await db.execute(query, [
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
    }
});

// DELETE - Eliminar paciente (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ DELETE /api/pacientes/${id} - Eliminar paciente`);

        // Verificar que el paciente existe
        const checkQuery = `SELECT id, nombre, apellido FROM pacientes WHERE id = ? AND activo = true`;
        const [existing] = await db.execute(checkQuery, [id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        const query = `
            UPDATE pacientes 
            SET activo = false, fecha_actualizacion = NOW()
            WHERE id = ?
        `;

        await db.execute(query, [id]);

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
    }
});

// ============================================================================
// 📊 ENDPOINTS ESPECIALES
// ============================================================================

// GET - Estadísticas de pacientes
router.get('/stats/general', async (req, res) => {
    try {
        console.log('📊 GET /api/pacientes/stats/general - Estadísticas');

        const queries = {
            total: `SELECT COUNT(*) as total FROM pacientes WHERE activo = true`,
            cumpleanos_mes: `
                SELECT COUNT(*) as total 
                FROM pacientes 
                WHERE activo = true AND MONTH(cumpleanos) = MONTH(NOW())
            `,
            citas_manana: `
                SELECT COUNT(*) as total 
                FROM pacientes 
                WHERE activo = true AND DATE(proxima_cita) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY))
            `,
            sin_proxima_cita: `
                SELECT COUNT(*) as total 
                FROM pacientes 
                WHERE activo = true AND (proxima_cita IS NULL OR proxima_cita < NOW())
            `
        };

        const stats = {};
        
        for (const [key, query] of Object.entries(queries)) {
            const [result] = await db.execute(query);
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
    }
});

// GET - Exportar pacientes (preparar datos para Excel)
router.get('/export/excel', async (req, res) => {
    try {
        console.log('📊 GET /api/pacientes/export/excel - Preparar datos para exportación');

        const query = `
            SELECT 
                p.id,
                p.nombre,
                p.apellido,
                CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
                p.telefono,
                COALESCE(p.dpi, 'No registrado') as dpi,
                DATE_FORMAT(p.fecha_primer_cita, '%d/%m/%Y') as fecha_primer_cita,
                CASE 
                    WHEN p.proxima_cita IS NOT NULL 
                    THEN DATE_FORMAT(p.proxima_cita, '%d/%m/%Y %H:%i')
                    ELSE 'Sin cita programada'
                END as proxima_cita,
                DATE_FORMAT(p.cumpleanos, '%d/%m/%Y') as cumpleanos,
                DATE_FORMAT(p.fecha_creacion, '%d/%m/%Y') as fecha_registro
            FROM pacientes p
            WHERE p.activo = true
            ORDER BY p.nombre ASC, p.apellido ASC
        `;

        const [pacientes] = await db.execute(query);

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