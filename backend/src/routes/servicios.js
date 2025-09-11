// backend/src/routes/servicios.js
const express = require('express');
const router = express.Router();

// IMPORT CORRECTO DEL MIDDLEWARE (mismo patrón que farmacia)
const authMiddleware = require('../middleware/authMiddleware');
// Usar el método authenticate() del middleware existente
const simpleAuth = authMiddleware.authenticate();

console.log('🏥 Servicios routes cargadas');

// Obtener controlador
let serviciosController;
try {
    serviciosController = require('../controllers/serviciosController');
    console.log('✅ Controlador serviciosController cargado exitosamente');
} catch (error) {
    console.error('❌ Error cargando controlador serviciosController:', error);
}

// ============================================================================
// RUTAS PRINCIPALES DEL MÓDULO SERVICIOS
// ============================================================================

// GET /api/servicios/stats - Obtener estadísticas (DEBE IR ANTES DE /:id)
router.get('/stats', simpleAuth, async (req, res) => {
    console.log('📊 GET /api/servicios/stats endpoint hit');
    
    try {
        if (!serviciosController) {
            throw new Error('Controlador serviciosController no disponible');
        }
        
        await serviciosController.getEstadisticas(req, res);
        
    } catch (error) {
        console.error('❌ Error en /stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas de servicios',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/servicios/export/excel - Exportar servicios a Excel (DEBE IR ANTES DE /:id)
router.get('/export/excel', simpleAuth, async (req, res) => {
    console.log('📊 GET /api/servicios/export/excel endpoint hit');
    
    try {
        if (!serviciosController) {
            throw new Error('Controlador serviciosController no disponible');
        }
        
        await serviciosController.exportarExcel(req, res);
        
    } catch (error) {
        console.error('❌ Error en /export/excel:', error);
        res.status(500).json({
            success: false,
            message: 'Error exportando servicios',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/servicios - Listar servicios con filtros y paginación
router.get('/', simpleAuth, async (req, res) => {
    console.log('🔍 GET /api/servicios endpoint hit');
    console.log('📥 Query params:', req.query);
    
    try {
        if (!serviciosController) {
            throw new Error('Controlador serviciosController no disponible');
        }
        
        await serviciosController.getServicios(req, res);
        
    } catch (error) {
        console.error('❌ Error en GET /servicios:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo servicios',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// POST /api/servicios - Crear nuevo servicio
router.post('/', simpleAuth, async (req, res) => {
    console.log('💾 POST /api/servicios endpoint hit');
    console.log('📥 Body data:', req.body);
    
    try {
        if (!serviciosController) {
            throw new Error('Controlador serviciosController no disponible');
        }
        
        await serviciosController.crearServicio(req, res);
        
    } catch (error) {
        console.error('❌ Error en POST /servicios:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando servicio',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/servicios/:id - Obtener servicio específico
router.get('/:id', simpleAuth, async (req, res) => {
    console.log(`🔍 GET /api/servicios/${req.params.id} endpoint hit`);
    
    try {
        if (!serviciosController) {
            throw new Error('Controlador serviciosController no disponible');
        }
        
        await serviciosController.getServicio(req, res);
        
    } catch (error) {
        console.error('❌ Error en GET /servicios/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo servicio',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// PUT /api/servicios/:id - Actualizar servicio
router.put('/:id', simpleAuth, async (req, res) => {
    console.log(`🔄 PUT /api/servicios/${req.params.id} endpoint hit`);
    console.log('📥 Body data:', req.body);
    
    try {
        if (!serviciosController) {
            throw new Error('Controlador serviciosController no disponible');
        }
        
        await serviciosController.actualizarServicio(req, res);
        
    } catch (error) {
        console.error('❌ Error en PUT /servicios/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando servicio',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// DELETE /api/servicios/:id - Eliminar servicio (soft delete)
router.delete('/:id', simpleAuth, async (req, res) => {
    console.log(`🗑️ DELETE /api/servicios/${req.params.id} endpoint hit`);
    
    try {
        if (!serviciosController) {
            throw new Error('Controlador serviciosController no disponible');
        }
        
        await serviciosController.eliminarServicio(req, res);
        
    } catch (error) {
        console.error('❌ Error en DELETE /servicios/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error eliminando servicio',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================================================
// RUTAS DE GESTIÓN DE MEDICAMENTOS VINCULADOS
// ============================================================================

// GET /api/servicios/:id/medicamentos - Obtener medicamentos vinculados
router.get('/:id/medicamentos', simpleAuth, async (req, res) => {
    console.log(`💊 GET /api/servicios/${req.params.id}/medicamentos endpoint hit`);
    
    try {
        if (!serviciosController) {
            throw new Error('Controlador serviciosController no disponible');
        }
        
        await serviciosController.getMedicamentosVinculados(req, res);
        
    } catch (error) {
        console.error('❌ Error en GET /servicios/:id/medicamentos:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo medicamentos vinculados',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// POST /api/servicios/:id/medicamentos - Vincular medicamento a servicio
router.post('/:id/medicamentos', simpleAuth, async (req, res) => {
    console.log(`🔗 POST /api/servicios/${req.params.id}/medicamentos endpoint hit`);
    console.log('📥 Body data:', req.body);
    
    try {
        if (!serviciosController) {
            throw new Error('Controlador serviciosController no disponible');
        }
        
        await serviciosController.vincularMedicamento(req, res);
        
    } catch (error) {
        console.error('❌ Error en POST /servicios/:id/medicamentos:', error);
        res.status(500).json({
            success: false,
            message: 'Error vinculando medicamento',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// DELETE /api/servicios/:id/medicamentos/:medicamento_id - Desvincular medicamento
router.delete('/:id/medicamentos/:medicamento_id', simpleAuth, async (req, res) => {
    console.log(`🔗 DELETE /api/servicios/${req.params.id}/medicamentos/${req.params.medicamento_id} endpoint hit`);
    
    try {
        if (!serviciosController) {
            throw new Error('Controlador serviciosController no disponible');
        }
        
        await serviciosController.desvincularMedicamento(req, res);
        
    } catch (error) {
        console.error('❌ Error en DELETE /servicios/:id/medicamentos/:medicamento_id:', error);
        res.status(500).json({
            success: false,
            message: 'Error desvinculando medicamento',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================================================
// ENDPOINTS DE DEBUGGING (SOLO EN DESARROLLO)
// ============================================================================

// DEBUG: Test básico del endpoint
router.get('/debug/basic', simpleAuth, async (req, res) => {
    console.log('🧪 Debug basic endpoint hit');
    
    res.json({
        success: true,
        message: 'Endpoint servicios funcionando',
        module: 'servicios',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// DEBUG: Test de autenticación
router.get('/debug/auth', simpleAuth, async (req, res) => {
    console.log('🧪 Debug auth endpoint hit');
    
    const authHeader = req.headers.authorization;
    
    res.json({
        success: true,
        message: 'Auth funcionando en servicios',
        hasAuthHeader: !!authHeader,
        user: req.user || 'No user data',
        timestamp: new Date().toISOString()
    });
});

// DEBUG: Test de base de datos
router.get('/debug/db', simpleAuth, async (req, res) => {
    console.log('🧪 Debug DB endpoint hit');
    
    try {
        // Test simple: obtener conteo de servicios
        const Servicio = require('../models/Servicio');
        const stats = await Servicio.getStats();
        
        res.json({
            success: true,
            message: 'Conexión a BD funcionando',
            stats: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error en debug DB:', error);
        res.status(500).json({
            success: false,
            message: 'Error conectando a BD',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ============================================================================

router.use((error, req, res, next) => {
    console.error('❌ Error en servicios routes:', error);
    
    res.status(500).json({
        success: false,
        message: 'Error interno del módulo servicios',
        error: error.message,
        timestamp: new Date().toISOString()
    });
});

// ============================================================================
// LOG FINAL Y EXPORTACIÓN
// ============================================================================

console.log('✅ Servicios routes completas configuradas:');
console.log('   GET    /api/servicios                           - Listar servicios');
console.log('   POST   /api/servicios                           - Crear servicio');
console.log('   GET    /api/servicios/:id                       - Obtener servicio');
console.log('   PUT    /api/servicios/:id                       - Actualizar servicio');
console.log('   DELETE /api/servicios/:id                       - Eliminar servicio');
console.log('   GET    /api/servicios/stats                     - Estadísticas');
console.log('   GET    /api/servicios/export/excel              - Exportar Excel');
console.log('   GET    /api/servicios/:id/medicamentos          - Medicamentos vinculados');
console.log('   POST   /api/servicios/:id/medicamentos          - Vincular medicamento');
console.log('   DELETE /api/servicios/:id/medicamentos/:med_id  - Desvincular medicamento');

module.exports = router;