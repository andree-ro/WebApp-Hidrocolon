// server.js
// Servidor principal del Sistema Hidrocolon
// Configuración completa con autenticación, farmacia, extras, servicios, ventas y turnos

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// ============================================================================
// DECLARAR VARIABLES PRIMERO
// ============================================================================
const NODE_ENV = process.env.NODE_ENV || 'production';
const PORT = process.env.PORT || 8080;

console.log(`🔧 Configurando seguridad para ambiente: ${NODE_ENV}`);

// ============================================================================
// FUNCIONES Y RUTAS
// ============================================================================

// Función simple para detectar amenazas
const detectThreats = (req, body) => {
    const threats = ['<script>', 'union select', '../'];
    const found = threats.some(threat => 
        body.toLowerCase().includes(threat.toLowerCase())
    );
    if (found) {
        console.warn(`⚠️ Amenaza detectada desde ${req.ip}: ${body.substring(0, 100)}`);
    }
};

// Importar rutas
const authRoutes = require('./src/routes/auth');
const farmaciaRoutes = require('./src/routes/farmacia');
const extrasRoutes = require('./src/routes/extras');
const serviciosRoutes = require('./src/routes/servicios');
const pacientesRoutes = require('./src/routes/pacientes');
const ventasRoutes = require('./src/routes/ventas');
const turnosRoutes = require('./src/routes/turnos');

const app = express();

// ============================================================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================================================

app.set('trust proxy', 1);
console.log('✅ Trust proxy configurado: 1');

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

const corsOptions = {
    origin: [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://127.0.0.1:3000',
        'https://web-app-hidrocolon.vercel.app',
        'https://web-app-hidrocolon-git-main-andree-ros-projects.vercel.app',
        /^https:\/\/web-app-hidrocolon-.*\.vercel\.app$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
console.log('✅ CORS configurado');

// ============================================================================
// MIDDLEWARE GENERAL
// ============================================================================

app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf, encoding) => {
        const body = buf.toString();
        detectThreats(req, body);
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const startTime = Date.now();
    
    if (!req.path.includes('/health')) {
        console.log(`📍 [${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    }
    
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - startTime;
        
        if (!req.path.includes('/health') && res.statusCode >= 400) {
            console.error(`❌ Error ${res.statusCode}: ${req.method} ${req.path} (${duration}ms)`);
        }
        
        originalSend.call(this, data);
    };
    
    next();
});

// ============================================================================
// RATE LIMITING
// ============================================================================

const slowDownConfig = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: () => 100,
    maxDelayMs: 20000,
});

app.use(slowDownConfig);
console.log('✅ Slow down configurado');

const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: NODE_ENV === 'development' ? 2000 : 1000,
    message: {
        success: false,
        message: 'Demasiadas requests. Intente de nuevo más tarde',
        code: 'RATE_LIMIT_GENERAL'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Demasiadas requests. Intente de nuevo más tarde',
            code: 'RATE_LIMIT_GENERAL'
        });
    }
});

app.use(generalRateLimit);
console.log('✅ Rate limiting general configurado');

const apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: NODE_ENV === 'development' ? 300 : 100,
    message: {
        success: false,
        message: 'Límite de API excedido',
        code: 'RATE_LIMIT_API'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Límite de API excedido',
            code: 'RATE_LIMIT_API'
        });
    }
});

app.use('/api/', apiRateLimit);
console.log('✅ Rate limiting API configurado');

// ============================================================================
// RUTAS PRINCIPALES
// ============================================================================

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Sistema Hidrocolon API',
        version: '1.5.0-ventas-turnos-integration',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        modules: {
            auth: 'Sistema de autenticación JWT completo',
            farmacia: 'Gestión de medicamentos e inventario',
            extras: 'Gestión de extras y utensilios médicos',
            servicios: 'Gestión de servicios médicos y promociones',
            pacientes: 'Gestión de pacientes y historial',
            ventas: 'Sistema de ventas y carrito',
            turnos: 'Control de turnos y caja'
        },
        endpoints: {
            health: 'GET /health',
            auth: 'POST|GET /api/auth/*',
            farmacia: 'GET|POST|PUT|DELETE /api/farmacia/*',
            extras: 'GET|POST|PUT|DELETE /api/extras/*',
            servicios: 'GET|POST|PUT|DELETE /api/servicios/*',
            pacientes: 'GET|POST|PUT|DELETE /api/pacientes/*',
            ventas: 'GET|POST|DELETE /api/ventas/*',
            turnos: 'GET|POST|PUT /api/turnos/*'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Sistema Hidrocolon funcionando correctamente',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        version: '1.5.0-ventas-turnos-integration',
        database: 'connected',
        services: {
            auth: 'active',
            farmacia: 'active',
            extras: 'active',
            servicios: 'active',
            pacientes: 'active',
            ventas: 'active',
            turnos: 'active',
            api: 'active'
        }
    });
});

// ============================================================================
// MONTAR RUTAS DE MÓDULOS
// ============================================================================

app.use('/api/auth', authRoutes);
console.log('✅ Rutas de autenticación configuradas');

app.use('/api/farmacia', farmaciaRoutes);
console.log('✅ Rutas de farmacia configuradas');

app.use('/api/extras', extrasRoutes);
console.log('✅ Rutas de extras configuradas');

app.use('/api/servicios', serviciosRoutes);
console.log('✅ Rutas de servicios configuradas');

app.use('/api/pacientes', pacientesRoutes);
console.log('✅ Rutas de pacientes configuradas');

app.use('/api/ventas', ventasRoutes);
console.log('✅ Rutas de ventas configuradas');

app.use('/api/turnos', turnosRoutes);
console.log('✅ Rutas de turnos configuradas');

// ============================================================================
// RUTAS ADICIONALES
// ============================================================================

const ExtrasController = require('./src/controllers/extrasController');
const authMiddleware = require('./src/middleware/authMiddleware');
const simpleAuth = authMiddleware.authenticate();

app.get('/api/medicamentos/:id/extras', simpleAuth, ExtrasController.getExtrasDeMedicamento);
app.post('/api/medicamentos/:id/extras', simpleAuth, ExtrasController.vincularExtraConMedicamento);
app.delete('/api/medicamentos/:id/extras/:extraId', simpleAuth, ExtrasController.desvincularExtraDeMedicamento);

console.log('✅ Rutas medicamentos-extras configuradas');

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
        code: 'ROUTE_NOT_FOUND'
    });
});

app.use((error, req, res, next) => {
    console.error('❌ Error global:', error.message);

    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
            success: false,
            message: 'JSON malformado',
            code: 'INVALID_JSON'
        });
    }

    if (error.status === 429) {
        return res.status(429).json({
            success: false,
            message: 'Demasiadas requests',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }

    if (error.code && error.code.startsWith('ER_')) {
        return res.status(500).json({
            success: false,
            message: 'Error de base de datos',
            code: 'DATABASE_ERROR'
        });
    }

    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR'
    });
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

app.listen(PORT, () => {
    console.log('🚀 Servidor corriendo en puerto', PORT);
    console.log('🌍 Ambiente:', NODE_ENV);
    console.log('✅ Sistema Hidrocolon listo');
    console.log('\n📋 Módulos activos: auth, farmacia, extras, servicios, pacientes, ventas, turnos');
});

// ============================================================================
// MANEJO DE CIERRE
// ============================================================================

process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rechazada:', reason);
    process.exit(1);
});

module.exports = app;