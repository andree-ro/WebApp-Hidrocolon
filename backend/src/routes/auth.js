// src/routes/auth.js
// VERSIÓN TEMPORAL - Rate limiting muy permisivo para desarrollo

const express = require('express');
const router = express.Router();

// Importar controladores y middleware
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Importar rate limiting directamente
const rateLimit = require('express-rate-limit');

// ============================================================================
// 🔧 RATE LIMITING MUY PERMISIVO PARA DESARROLLO
// ============================================================================

// Rate limiting para login (MUY PERMISIVO)
const loginRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto en lugar de 15
    max: 1000, // 1000 intentos en lugar de 5
    message: {
        success: false,
        message: 'Demasiados intentos de login. Intente de nuevo en 1 minuto',
        code: 'RATE_LIMIT_LOGIN'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Demasiados intentos de login. Intente de nuevo en 1 minuto',
            code: 'RATE_LIMIT_LOGIN'
        });
    }
});

// Rate limiting para refresh token (MUY PERMISIVO)
const refreshRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 1000, // 1000 refresh por IP
    message: {
        success: false,
        message: 'Demasiados intentos de refresh. Intente de nuevo en 1 minuto',
        code: 'RATE_LIMIT_REFRESH'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Demasiados intentos de refresh. Intente de nuevo en 1 minuto',
            code: 'RATE_LIMIT_REFRESH'
        });
    }
});

// Rate limiting general para auth endpoints (MUY PERMISIVO)
const authRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 10000, // 10,000 requests por IP
    message: {
        success: false,
        message: 'Demasiadas requests de autenticación',
        code: 'RATE_LIMIT_AUTH'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Demasiadas requests de autenticación',
            code: 'RATE_LIMIT_AUTH'
        });
    }
});

// ============================================================================
// 📝 MIDDLEWARE DE LOGGING PARA AUTH
// ============================================================================

// Middleware personalizado para logging de auth
const authLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    console.log(`🔐 [${timestamp}] AUTH ${req.method} ${req.path} - IP: ${ip}`);
    
    // Log adicional para requests sospechosos
    if (req.body && req.body.usuario) {
        console.log(`👤 Intento auth: ${req.body.usuario} - IP: ${ip}`);
    }
    
    next();
};

// ============================================================================
// 🚫 RUTAS PÚBLICAS (Sin autenticación)
// ============================================================================

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión en el sistema
 * @access  Público
 * @rate    1000 requests por 1 minuto (MUY PERMISIVO)
 */
router.post('/login', 
    loginRateLimit,
    authLogger,
    authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar token de acceso usando refresh token
 * @access  Público (requiere refresh token válido)
 * @rate    1000 requests por 1 minuto
 */
router.post('/refresh',
    refreshRateLimit,
    authLogger,
    authController.refresh
);

/**
 * @route   POST /api/auth/verificar-password
 * @desc    Verificar si una contraseña pertenece a un administrador
 * @access  Private (requiere autenticación)
 * @body    { password: string }
 */
router.post(
    '/verificar-password',
    authMiddleware.authenticate(), // Requiere estar autenticado
    authController.verificarPassword
);

// ============================================================================
// 🔒 RUTAS PROTEGIDAS (Requieren autenticación)
// ============================================================================

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión (invalidar token)
 * @access  Privado
 * @rate    10000 requests por 1 minuto
 */
router.post('/logout',
    authRateLimit,
    authLogger,
    authMiddleware.authenticate(),
    authController.logout
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verificar validez del token actual
 * @access  Privado
 * @rate    10000 requests por 1 minuto
 */
router.get('/verify',
    authRateLimit,
    authLogger,
    authMiddleware.authenticate(),
    authController.verify
);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario actual
 * @access  Privado
 * @rate    10000 requests por 1 minuto
 */
router.get('/me',
    authRateLimit,
    authLogger,
    authMiddleware.authenticate(),
    authController.me
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña del usuario actual
 * @access  Privado
 * @rate    10000 requests por 1 minuto
 */
router.post('/change-password',
    authRateLimit,
    authLogger,
    authMiddleware.authenticate(),
    authController.changePassword
);

// ============================================================================
// 👑 RUTAS ADMINISTRATIVAS (Solo administradores)
// ============================================================================

/**
 * @route   GET /api/auth/stats
 * @desc    Obtener estadísticas del sistema de autenticación
 * @access  Privado (Solo administradores)
 * @rate    10000 requests por 1 minuto
 */
router.get('/stats',
    authRateLimit,
    authLogger,
    authMiddleware.authenticate(),
    authMiddleware.requireAdmin(),
    authController.getStats
);

// ============================================================================
// 🧪 RUTAS DE TESTING/DEBUG (Solo en desarrollo)
// ============================================================================

// Solo habilitar en desarrollo
if (process.env.NODE_ENV === 'development') {
    
    /**
     * @route   GET /api/auth/test-token
     * @desc    Generar token de prueba (solo desarrollo)
     * @access  Público (solo en desarrollo)
     */
    router.get('/test-token', (req, res) => {
        const testPayload = {
            id: 999,
            usuario: 'test@hidrocolon.com',
            rol_nombre: 'administrador',
            nombres: 'Usuario',
            apellidos: 'Prueba'
        };
        
        try {
            const authService = require('../services/authService');
            const tokenData = authService.generateToken(testPayload);
            
            res.json({
                success: true,
                message: 'Token de prueba generado',
                data: tokenData,
                warning: 'Solo disponible en desarrollo'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error generando token de prueba'
            });
        }
    });

    /**
     * @route   GET /api/auth/debug
     * @desc    Información de debug del sistema auth
     * @access  Público (solo en desarrollo)
     */
    router.get('/debug', (req, res) => {
        res.json({
            success: true,
            message: 'Debug info - Solo desarrollo',
            data: {
                environment: process.env.NODE_ENV,
                timestamp: new Date().toISOString(),
                authService: 'Loaded',
                middleware: 'Loaded',
                rateLimiting: 'VERY PERMISSIVE FOR DEVELOPMENT',
                routes: [
                    'POST /login',
                    'POST /logout', 
                    'GET /verify',
                    'POST /refresh',
                    'GET /me',
                    'POST /change-password',
                    'GET /stats'
                ]
            }
        });
    });
}

// ============================================================================
// 🚫 MANEJO DE RUTAS NO ENCONTRADAS
// ============================================================================

// Middleware para capturar rutas auth no definidas
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta de autenticación no encontrada: ${req.method} ${req.baseUrl}${req.path}`,
        code: 'AUTH_ROUTE_NOT_FOUND'
    });
});

// ============================================================================
// 📊 INFORMACIÓN DE LAS RUTAS (Para debugging)
// ============================================================================

// Log de rutas registradas al inicializar
console.log('🛣️ Rutas de autenticación registradas:');
console.log('   POST /api/auth/login (1000 req/min)');
console.log('   POST /api/auth/logout');
console.log('   GET  /api/auth/verify');
console.log('   POST /api/auth/refresh (1000 req/min)');
console.log('   GET  /api/auth/me');
console.log('   POST /api/auth/change-password');
console.log('   GET  /api/auth/stats (admin only)');

if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Rutas de desarrollo:');
    console.log('   GET  /api/auth/test-token');
    console.log('   GET  /api/auth/debug');
}

console.log('⚠️  RATE LIMITING MUY PERMISIVO PARA DESARROLLO');
console.log('✅ Router de autenticación configurado');

// ============================================================================
// 📤 EXPORTAR ROUTER
// ============================================================================

module.exports = router;