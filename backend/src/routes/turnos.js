// backend/src/routes/turnos.js
// Rutas completas para gestión de turnos del Sistema Hidrocolon
// VERSIÓN COMBINADA: Endpoints antiguos + nuevos del módulo financiero

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Importar middlewares
const authMiddleware = require('../middleware/authMiddleware');
const turnosMiddleware = require('../middleware/turnosMiddleware');

// Importar controlador nuevo
const turnosController = require('../controllers/turnosController');

const simpleAuth = authMiddleware.authenticate();

console.log('🔄 Rutas de turnos cargadas');

// ============================================================================
// ENDPOINTS NUEVOS - MÓDULO FINANCIERO COMPLETO
// ============================================================================

// POST /api/turnos/abrir-completo - Abrir turno con conteo de billetes/monedas
router.post('/abrir-completo',
    simpleAuth,
    turnosController.abrirTurnoCompleto
);

// POST /api/turnos/:id/cerrar-completo - Cerrar turno con cuadre automático
router.post('/:id/cerrar-completo',
    simpleAuth,
    turnosController.cerrarTurnoCompleto
);

// GET /api/turnos/activo - Obtener turno activo (NUEVO)
router.get('/activo',
    simpleAuth,
    turnosController.obtenerTurnoActivo
);

// GET /api/turnos/estadisticas - Estadísticas generales
router.get('/estadisticas',
    simpleAuth,
    turnosController.obtenerEstadisticas
);

// GET /api/turnos/:id/resumen - Resumen del turno (dashboard en tiempo real)
router.get('/:id/resumen',
    simpleAuth,
    turnosController.obtenerResumenTurno
);

// POST /api/turnos/:id/cuadre-previo - Calcular cuadre sin cerrar (preview)
router.post('/:id/cuadre-previo',
    simpleAuth,
    turnosController.calcularCuadrePrevio
);

// POST /api/turnos/validar-apertura - Validar datos de apertura
router.post('/validar-apertura',
    simpleAuth,
    turnosController.validarDatosApertura
);

// GET /api/turnos/:id/datos-reporte - Obtener datos completos para generar PDF
router.get('/:id/datos-reporte',
    simpleAuth,
    turnosController.obtenerDatosReporte
);

// GET /api/turnos/:id/reporte-pdf - Generar y descargar PDF del reporte
router.get('/:id/reporte-pdf',
    simpleAuth,
    turnosController.generarPDFReporte
);

// ============================================================================
// ENDPOINTS ANTIGUOS - COMPATIBILIDAD CON CÓDIGO EXISTENTE
// ============================================================================

// GET /api/turnos/actual - Obtener turno actual (ANTIGUO - Mantener por compatibilidad)
router.get('/actual',
    simpleAuth,
    async (req, res) => {
        try {
            const usuario_id = req.user.id;
            
            console.log(`🔍 Buscando turno actual para usuario ${usuario_id}`);
            
            // 🔧 FIX: Buscar CUALQUIER turno abierto, no solo del usuario
            const [turnos] = await pool.execute(
                `SELECT t.*, u.nombres, u.apellidos, u.usuario
                 FROM turnos t
                 INNER JOIN usuarios u ON t.usuario_id = u.id
                 WHERE t.estado = 'abierto'
                 ORDER BY t.fecha_apertura DESC
                 LIMIT 1`
            );
            
            if (turnos.length === 0) {
                console.log('⚠️ No hay ningún turno abierto');
                return res.json({
                    success: true,
                    data: null,
                    message: 'No hay turno abierto'
                });
            }
            
            console.log(`✅ Turno encontrado: #${turnos[0].id} del usuario ${turnos[0].nombres}`);
            
            res.json({
                success: true,
                data: turnos[0]
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo turno actual:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el turno actual',
                error: error.message
            });
        }
    }
);

// POST /api/turnos - Abrir turno SIMPLE (ANTIGUO - sin conteo detallado)
router.post('/',
    simpleAuth,
    turnosMiddleware.validarNoTurnoAbierto,
    async (req, res) => {
        try {
            const usuario_id = req.user.id;
            const { efectivo_inicial, observaciones } = req.body;
            
            console.log(`🔓 Abriendo turno SIMPLE para usuario ${usuario_id}`);
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
            const [result] = await pool.execute(
                `INSERT INTO turnos (
                    usuario_id,
                    efectivo_inicial,
                    efectivo_inicial_total,
                    observaciones,
                    estado,
                    fecha_apertura
                ) VALUES (?, ?, ?, ?, 'abierto', NOW())`,
                [usuario_id, efectivo, efectivo, observaciones || null]
            );
            
            const turno_id = result.insertId;
            
            // Obtener el turno creado
            const [turno] = await pool.execute(
                'SELECT * FROM turnos WHERE id = ?',
                [turno_id]
            );
            
            console.log(`✅ Turno ${turno_id} abierto exitosamente (modo simple)`);
            
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

// PUT /api/turnos/:id/cerrar - Cerrar turno SIMPLE (ANTIGUO)
router.put('/:id/cerrar',
    simpleAuth,
    turnosMiddleware.validarTurnoParaCierre,
    async (req, res) => {
        try {
            const turno_id = req.params.id;
            const { efectivo_final, observaciones } = req.body;
            
            console.log(`🔒 Cerrando turno SIMPLE ${turno_id}`);
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
                                     parseFloat(turno.total_ventas_efectivo || 0);
            
            // Calcular diferencia
            const diferencia = efectivo - efectivo_esperado;
            
            // Actualizar turno
            await pool.execute(
                `UPDATE turnos 
                 SET efectivo_final = ?,
                     efectivo_final_total = ?,
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
                    efectivo,
                    observaciones || `Cerrado con diferencia: Q${diferencia.toFixed(2)}`,
                    turno_id
                ]
            );
            
            // Obtener turno actualizado
            const [turnoActualizado] = await pool.execute(
                'SELECT * FROM turnos WHERE id = ?',
                [turno_id]
            );
            
            console.log(`✅ Turno ${turno_id} cerrado exitosamente (modo simple)`);
            
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
                        cuadra: Math.abs(diferencia) < 0.50
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
// ENDPOINTS COMPARTIDOS (Usan el nuevo controlador)
// ============================================================================

// GET /api/turnos - Listar turnos con filtros (USA NUEVO CONTROLADOR)
router.get('/',
    simpleAuth,
    turnosController.listarTurnos
);

// GET /api/turnos/:id - Obtener turno por ID (USA NUEVO CONTROLADOR)
router.get('/:id',
    simpleAuth,
    turnosController.obtenerTurnoPorId
);

console.log('✅ Rutas de turnos configuradas (COMBINADAS):');
console.log('   📦 ENDPOINTS NUEVOS (Módulo Financiero):');
console.log('      POST   /api/turnos/abrir-completo');
console.log('      POST   /api/turnos/:id/cerrar-completo');
console.log('      GET    /api/turnos/activo');
console.log('      GET    /api/turnos/estadisticas');
console.log('      GET    /api/turnos/:id/resumen');
console.log('      POST   /api/turnos/:id/cuadre-previo');
console.log('      POST   /api/turnos/validar-apertura');
console.log('      GET    /api/turnos/:id/datos-reporte');
console.log('      GET    /api/turnos/:id/reporte-pdf');
console.log('   ♻️  ENDPOINTS ANTIGUOS (Compatibilidad):');
console.log('      GET    /api/turnos/actual');
console.log('      POST   /api/turnos');
console.log('      PUT    /api/turnos/:id/cerrar');
console.log('   🔄 ENDPOINTS COMPARTIDOS:');
console.log('      GET    /api/turnos');
console.log('      GET    /api/turnos/:id');

module.exports = router;