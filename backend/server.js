// server.js
// Servidor principal del Sistema Hidrocolon
// Configuración completa con autenticación integrada

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Importar configuración de seguridad
const { 
    createSecureRateLimit, 
    createSlowDown, 
    detectThreats,
    securityLogger 
} = require('./src/config/security');

// Importar rutas
const authRoutes = require('./src/routes/auth');

// ============================================================================
// 🚀 CONFIGURACIÓN DEL SERVIDOR
// ============================================================================

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log(`🔒 Configurando seguridad para ambiente: ${NODE_ENV}`);

// ============================================================================
// 🛡️ CONFIGURACIÓN DE SEGURIDAD
// ============================================================================

// Trust proxy para Railway
app.set('trust proxy', 1);
console.log('✅ Trust proxy configurado: 1');

// Headers de seguridad con Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
console.log('✅ Headers de seguridad configurados');

// CORS configurado por ambiente
const corsOptions = {
    origin: NODE_ENV === 'production' 
        ? ['https://hidrocolon.com', 'https://www.hidrocolon.com'] // Ajustar dominios reales
        : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
console.log('✅ CORS configurado');

// ============================================================================
// 📊 MIDDLEWARE GENERAL
// ============================================================================

// Body parser
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf, encoding) => {
        // Detectar amenazas en el body
        const body = buf.toString();
        detectThreats(req, body);
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`📝 [${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// ============================================================================
// 🚦 RATE LIMITING GLOBAL
// ============================================================================

// Slow down para requests abusivos
const slowDown = createSlowDown({
    windowMs: 15 * 60 * 1000, // 15 minutos
    delayAfter: 50, // después de 50 requests, empezar a ralentizar
    delayMs: 100, // incrementar delay 100ms por request
    maxDelayMs: 20000, // máximo delay de 20 segundos
});

app.use(slowDown);
console.log('✅ Slow down configurado');

// Rate limiting general
const generalRateLimit = createSecureRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // 1000 requests por IP por ventana
    message: {
        success: false,
        message: 'Demasiadas requests. Intente de nuevo más tarde',
        code: 'RATE_LIMIT_GENERAL'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(generalRateLimit);
console.log('✅ Rate limiting general configurado');

// Rate limiting para API endpoints
const apiRateLimit = createSecureRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP por ventana para /api/*
    message: {
        success: false,
        message: 'Límite de API excedido',
        code: 'RATE_LIMIT_API'
    }
});

app.use('/api/', apiRateLimit);
console.log('✅ Rate limiting API configurado');

// ============================================================================
// 🛣️ RUTAS PRINCIPALES
// ============================================================================

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Sistema Hidrocolon API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        endpoints: {
            health: '/health',
            auth: '/api/auth/*',
            api: '/api/*'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Sistema Hidrocolon funcionando correctamente',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        version: '1.0.0',
        database: 'connected', // TODO: Verificar conexión real a BD
        services: {
            auth: 'active',
            api: 'active'
        }
    });
});

// ============================================================================
// 🔐 RUTAS DE AUTENTICACIÓN
// ============================================================================

// Montar rutas de autenticación
app.use('/api/auth', authRoutes);
console.log('✅ Rutas de autenticación configuradas en /api/auth');

// ============================================================================
// 📋 RUTAS DE MÓDULOS (Por implementar)
// ============================================================================

// TODO: Descomentar cuando se implementen los módulos

// Farmacia
// const farmaciaRoutes = require('./src/routes/farmacia');
// app.use('/api/farmacia', authMiddleware.seller(), farmaciaRoutes);

// Servicios
// const serviciosRoutes = require('./src/routes/servicios');
// app.use('/api/servicios', authMiddleware.seller(), serviciosRoutes);

// Pacientes
// const pacientesRoutes = require('./src/routes/pacientes');
// app.use('/api/pacientes', authMiddleware.seller(), pacientesRoutes);

// Carrito
// const carritoRoutes = require('./src/routes/carrito');
// app.use('/api/carrito', authMiddleware.seller(), carritoRoutes);

// Financiero
// const financieroRoutes = require('./src/routes/financiero');
// app.use('/api/financiero', authMiddleware.admin(), financieroRoutes);

// Usuarios (Admin only)
// const usuariosRoutes = require('./src/routes/usuarios');
// app.use('/api/usuarios', authMiddleware.admin(), usuariosRoutes);

console.log('📋 Módulos pendientes: farmacia, servicios, pacientes, carrito, financiero, usuarios');

// ============================================================================
// 🧪 RUTAS DE DESARROLLO
// ============================================================================

if (NODE_ENV === 'development') {
    // Endpoint para testing de conexión a BD
    app.get('/debug/db', async (req, res) => {
        try {
            const User = require('./src/models/User');
            const users = await User.getAll();
            
            res.json({
                success: true,
                message: 'Conexión a BD exitosa',
                data: {
                    totalUsers: users.length,
                    users: users.map(u => ({
                        id: u.id,
                        usuario: u.usuario,
                        rol: u.rol_nombre
                    }))
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error conectando a BD',
                error: error.message
            });
        }
    });

    // Endpoint de información del sistema
    app.get('/debug/info', (req, res) => {
        res.json({
            success: true,
            message: 'Información del sistema - Solo desarrollo',
            data: {
                environment: NODE_ENV,
                nodeVersion: process.version,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                routes: {
                    auth: 'Configurado',
                    health: 'Configurado',
                    debug: 'Solo desarrollo'
                },
                database: {
                    host: process.env.DB_HOST || 'No configurado',
                    name: process.env.DB_NAME || 'No configurado',
                    port: process.env.DB_PORT || 'No configurado'
                }
            }
        });
    });

    console.log('🧪 Rutas de desarrollo habilitadas');
}

// ============================================================================
// 🚫 MANEJO DE ERRORES Y 404
// ============================================================================

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
        code: 'ROUTE_NOT_FOUND',
        availableEndpoints: {
            root: 'GET /',
            health: 'GET /health',
            auth: 'POST|GET /api/auth/*'
        }
    });
});

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
    console.error('❌ Error global capturado:', error);

    // Error de JSON malformado
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
            success: false,
            message: 'JSON malformado en el request',
            code: 'INVALID_JSON'
        });
    }

    // Error de rate limiting
    if (error.status === 429) {
        return res.status(429).json({
            success: false,
            message: 'Demasiadas requests',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }

    // Error genérico del servidor
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR',
        ...(NODE_ENV === 'development' && { error: error.message })
    });
});

// ============================================================================
// 🚀 INICIAR SERVIDOR
// ============================================================================

app.listen(PORT, () => {
    console.log('🚀 Servidor corriendo en puerto', PORT);
    console.log('🌍 Ambiente:', NODE_ENV);
    console.log('🔒 Seguridad: Estricta');
    console.log('📊 Health check: http://localhost:' + PORT + '/health');
    console.log('✅ Sistema Hidrocolon listo para uso');
    
    // Log de rutas disponibles
    console.log('\n📋 Endpoints disponibles:');
    console.log('   GET  / - Información general');
    console.log('   GET  /health - Estado del sistema');
    console.log('   POST /api/auth/login - Iniciar sesión');
    console.log('   GET  /api/auth/verify - Verificar token');
    console.log('   POST /api/auth/logout - Cerrar sesión');
    console.log('   GET  /api/auth/me - Info usuario actual');
    
    if (NODE_ENV === 'development') {
        console.log('   GET  /debug/db - Test conexión BD');
        console.log('   GET  /debug/info - Info del sistema');
        console.log('   GET  /api/auth/debug - Debug auth');
    }
    
    console.log('\n🔥 ¡Sistema de autenticación listo para testing!');
});

// ============================================================================
// 🛑 MANEJO GRACEFUL DE CIERRE
// ============================================================================

process.on('SIGINT', () => {
    console.log('\n🛑 Recibida señal SIGINT, cerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
    process.exit(0);
});

// Capturar errores no manejados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rechazada no manejada en:', promise, 'razón:', reason);
    process.exit(1);
});

module.exports = app;