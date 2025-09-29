// backend/src/routes/turnos.js
// Rutas para gestión de turnos del Sistema Hidrocolon

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Importar middlewares
const authMiddleware = require('../middleware/authMiddleware');
const turnosMiddleware = require('../middleware/turnosMiddleware');

const simpleAuth = authMiddleware.authenticate();

console.log('🕐 Rutas de turnos cargadas');

// ============================================================================
// OBTENER TURNO ACTUAL (ABIERTO)
// ============================================================================
router.get('/actual',
    simpleAuth,
    async (req, res) => {
        try {
            const usuario_id = req.user.id;
            
            console.log(`🔍 Buscando turno actual para usuario ${usuario_id}`);
            
            const [turnos] = await db.execute(
                `SELECT * FROM turnos 
                 WHERE usuario_id = ? 
                 AND estado = 'abierto'
                 ORDER BY fecha_apertura DESC
                 LIMIT 1`,
                [usuario_id]
            );
            
            if (turnos.length === 0) {
                return res.json({
                    success: true,
                    data: null,
                    message: 'No hay turno abierto'
                });
            }
            
            res.json({
                success: true,
                data: turnos[0]
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo turno actual:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener turno actual',
                error: error.message
            });
        }
    }
);

// ============================================================================
// ABRIR NUEVO TURNO
// ============================================================================
router.post('/',
    simpleAuth,
    turnosMiddleware.validarNoTurnoAbierto,
    async (req, res) => {
        try {
            const usuario_id = req.user.id;
            const { efectivo_inicial, observaciones } = req.body;
            
            console.log(`🔓 Abriendo turno para usuario ${usuario_id}`);
            console.log(`💵 Efectivo inicial: Q${efectivo_inicial}`);
            
            // Validar efectivo inicial
            if (efectivo_inicial === undefined || efectivo_inicial === null) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe especificar el efectivo inicial'
                });
            }
            
            const efectivo = parseFloat(efectivo_inicial);
            
            if (isNaN(efectivo) || efectivo < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El efectivo inicial debe ser un número válido mayor o igual a 0'
                });
            }
            
            // Crear turno
            const [result] = await db.query(
                `INSERT INTO turnos (
                    usuario_id,
                    efectivo_inicial,
                    observaciones,
                    estado,
                    fecha_apertura
                ) VALUES (?, ?, ?, 'abierto', NOW())`,
                [usuario_id, efectivo, observaciones || null]
            );
            
            const turno_id = result.insertId;
            
            // Obtener el turno creado
            const [turno] = await db.query(
                'SELECT * FROM turnos WHERE id = ?',
                [turno_id]
            );
            
            console.log(`✅ Turno ${turno_id} abierto exitosamente`);
            
            res.status(201).json({
                success: true,
                message: 'Turno abierto exitosamente',
                data: turno[0]
            });
            
        } catch (error) {
            console.error('❌ Error abriendo turno:', error);
            res.status(500).json({
                success: false,
                message: 'Error al abrir turno',
                error: error.message
            });
        }
    }
);

// ============================================================================
// CERRAR TURNO
// ============================================================================
router.put('/:id/cerrar',
    simpleAuth,
    turnosMiddleware.validarTurnoParaCierre,
    async (req, res) => {
        try {
            const turno_id = req.params.id;
            const { efectivo_final, observaciones } = req.body;
            
            console.log(`🔒 Cerrando turno ${turno_id}`);
            console.log(`💵 Efectivo final: Q${efectivo_final}`);
            
            // Validar efectivo final
            if (efectivo_final === undefined || efectivo_final === null) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe especificar el efectivo final contado físicamente'
                });
            }
            
            const efectivo = parseFloat(efectivo_final);
            
            if (isNaN(efectivo) || efectivo < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El efectivo final debe ser un número válido mayor o igual a 0'
                });
            }
            
            // Obtener datos del turno
            const turno = req.turno; // Viene del middleware
            
            // Calcular el efectivo esperado
            const efectivo_esperado = parseFloat(turno.efectivo_inicial) + 
                                     parseFloat(turno.total_ventas_efectivo);
            
            // Calcular diferencia
            const diferencia = efectivo - efectivo_esperado;
            
            // Actualizar turno
            await db.query(
                `UPDATE turnos 
                 SET efectivo_final = ?,
                     estado = 'cerrado',
                     fecha_cierre = NOW(),
                     observaciones = CONCAT(
                         COALESCE(observaciones, ''),
                         IF(observaciones IS NOT NULL AND observaciones != '', ' | ', ''),
                         ?
                     )
                 WHERE id = ?`,
                [
                    efectivo,
                    observaciones || `Cerrado con diferencia: Q${diferencia.toFixed(2)}`,
                    turno_id
                ]
            );
            
            // Obtener turno actualizado
            const [turnoActualizado] = await db.query(
                'SELECT * FROM turnos WHERE id = ?',
                [turno_id]
            );
            
            console.log(`✅ Turno ${turno_id} cerrado exitosamente`);
            
            res.json({
                success: true,
                message: 'Turno cerrado exitosamente',
                data: {
                    turno: turnoActualizado[0],
                    resumen: {
                        efectivo_inicial: parseFloat(turno.efectivo_inicial),
                        efectivo_esperado: efectivo_esperado,
                        efectivo_contado: efectivo,
                        diferencia: diferencia,
                        cuadra: Math.abs(diferencia) < 0.50 // Tolerancia de Q0.50
                    }
                }
            });
            
        } catch (error) {
            console.error('❌ Error cerrando turno:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cerrar turno',
                error: error.message
            });
        }
    }
);

// ============================================================================
// LISTAR TURNOS (historial)
// ============================================================================
router.get('/',
    simpleAuth,
    async (req, res) => {
        try {
            const usuario_id = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            
            let whereConditions = ['usuario_id = ?'];
            let queryParams = [usuario_id];
            
            // Filtro por estado
            if (req.query.estado) {
                whereConditions.push('estado = ?');
                queryParams.push(req.query.estado);
            }
            
            // Filtro por fecha
            if (req.query.fecha_inicio && req.query.fecha_fin) {
                whereConditions.push('DATE(fecha_apertura) BETWEEN ? AND ?');
                queryParams.push(req.query.fecha_inicio, req.query.fecha_fin);
            }
            
            const whereClause = whereConditions.join(' AND ');
            
            // Contar total
            const [countResult] = await db.query(
                `SELECT COUNT(*) as total FROM turnos WHERE ${whereClause}`,
                queryParams
            );
            
            const total = countResult[0].total;
            
            // Obtener turnos
            const [turnos] = await db.execute(
                `SELECT * FROM turnos 
                 WHERE ${whereClause}
                 ORDER BY fecha_apertura DESC
                 LIMIT ? OFFSET ?`,
                [...queryParams, limit, offset]
            );
            
            res.json({
                success: true,
                data: turnos,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
            
        } catch (error) {
            console.error('❌ Error listando turnos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al listar turnos',
                error: error.message
            });
        }
    }
);

// ============================================================================
// OBTENER TURNO POR ID
// ============================================================================
router.get('/:id',
    simpleAuth,
    async (req, res) => {
        try {
            const turno_id = req.params.id;
            const usuario_id = req.user.id;
            
            const [turnos] = await db.execute(
                `SELECT t.*, u.nombres, u.apellidos
                 FROM turnos t
                 LEFT JOIN usuarios u ON t.usuario_id = u.id
                 WHERE t.id = ? AND t.usuario_id = ?`,
                [turno_id, usuario_id]
            );
            
            if (turnos.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Turno no encontrado'
                });
            }
            
            // Obtener ventas del turno
            const [ventas] = await db.query(
                `SELECT COUNT(*) as num_ventas,
                        SUM(total) as total_ventas
                 FROM ventas
                 WHERE turno_id = ?`,
                [turno_id]
            );
            
            res.json({
                success: true,
                data: {
                    ...turnos[0],
                    ventas: ventas[0]
                }
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo turno:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener turno',
                error: error.message
            });
        }
    }
);

console.log('✅ Rutas de turnos configuradas:');
console.log('   GET    /api/turnos/actual - Obtener turno actual');
console.log('   POST   /api/turnos - Abrir nuevo turno');
console.log('   PUT    /api/turnos/:id/cerrar - Cerrar turno');
console.log('   GET    /api/turnos - Listar turnos');
console.log('   GET    /api/turnos/:id - Obtener turno específico');

module.exports = router;