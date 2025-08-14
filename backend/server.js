// server.js
// Servidor con configuración de seguridad completa para Railway

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Importar configuración de seguridad
const {
    config,
    rateLimiters,
    createSlowDown,
    helmetConfig,
    securityLogger,
    validateRequestOrigin,
    currentEnv
} = require('./src/config/security');

const app = express();
const PORT = process.env.PORT || 8080;

// =====================================================
// CONFIGURACIÓN DE SEGURIDAD
// =====================================================

console.log(`🔒 Configurando seguridad para ambiente: ${currentEnv}`);

// 1. Trust Proxy - Configuración segura para Railway
if (config.trustProxy !== false) {
    app.set('trust proxy', config.trustProxy);
    console.log(`✅ Trust proxy configurado: ${config.trustProxy}`);
}

// 2. Helmet - Headers de seguridad
app.use(helmet(helmetConfig));
console.log('✅ Headers de seguridad configurados');

// 3. CORS - Configuración por ambiente
const corsOptions = {
    origin: function (origin, callback) {
        // En desarrollo, permitir todos los orígenes
        if (currentEnv === 'development') {
            return callback(null, true);
        }
        
        // En producción, validar orígenes específicos
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            process.env.RAILWAY_PUBLIC_DOMAIN,
            'http://localhost:5173', // Vue.js dev server
            'http://localhost:3000'  // Posible frontend alternativo
        ].filter(Boolean);

        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        console.warn(`🚨 CORS: Origen no permitido: ${origin}`);
        callback(new Error('No permitido por CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
console.log('✅ CORS configurado');

// 4. Middleware de parsing
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf, encoding) => {
        // Validar que el JSON no sea malicioso
        try {
            JSON.parse(buf);
        } catch (e) {
            throw new Error('JSON inválido');
        }
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Security Logger - Log de requests sospechosos
app.use(securityLogger);

// 6. Validación de origen de requests
app.use(validateRequestOrigin);

// 7. Slow Down - Ralentizar requests sospechosos
if (config.rateLimitEnabled) {
    app.use(createSlowDown());
    console.log('✅ Slow down configurado');
}

// =====================================================
// RATE LIMITERS ESPECÍFICOS
// =====================================================

if (config.rateLimitEnabled) {
    // Rate limiter general
    app.use(rateLimiters.general);
    console.log('✅ Rate limiting general configurado');
    
    // Rate limiter específico para API
    app.use('/api/', rateLimiters.api);
    console.log('✅ Rate limiting API configurado');
    
    // Rate limiter para autenticación
    app.use('/api/auth/', rateLimiters.auth);
    console.log('✅ Rate limiting autenticación configurado');
    
    // Rate limiter para operaciones críticas
    app.use('/api/ventas/', rateLimiters.critical);
    app.use('/api/turnos/', rateLimiters.critical);
    app.use('/api/financiero/', rateLimiters.critical);
    console.log('✅ Rate limiting operaciones críticas configurado');
}

// =====================================================
// MIDDLEWARE PERSONALIZADO
// =====================================================

// Middleware para agregar información de seguridad a las respuestas
app.use((req, res, next) => {
    // Headers adicionales de seguridad
    res.setHeader('X-Request-ID', `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    res.setHeader('X-API-Version', '1.0.0');
    
    // Log de requests en producción
    if (currentEnv === 'production') {
        const ip = req.ip || req.connection.remoteAddress;
        console.log(`📝 ${req.method} ${req.originalUrl} - IP: ${ip} - ${new Date().toISOString()}`);
    }
    
    next();
});

// =====================================================
// RUTAS DEL SISTEMA
// =====================================================

// Health Check - Sin rate limiting
app.get('/health', (req, res) => {
    const healthInfo = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: currentEnv,
        version: '1.0.0',
        database: 'Connected', // TODO: Verificar conexión real a DB
        security: {
            rateLimitEnabled: config.rateLimitEnabled,
            trustProxy: config.trustProxy,
            strictSecurity: config.strictSecurity
        }
    };
    
    res.status(200).json(healthInfo);
});

// Ruta de información del sistema (solo en desarrollo)
if (currentEnv === 'development') {
    app.get('/debug/security', (req, res) => {
        res.json({
            environment: currentEnv,
            config: config,
            trustProxy: app.get('trust proxy'),
            ip: req.ip,
            ips: req.ips,
            headers: {
                'x-forwarded-for': req.get('X-Forwarded-For'),
                'x-real-ip': req.get('X-Real-IP'),
                'user-agent': req.get('User-Agent')
            }
        });
    });
}

// =====================================================
// IMPORTAR RUTAS DE LA APLICACIÓN
// =====================================================

// TODO: Importar rutas cuando las creemos
// const authRoutes = require('./src/routes/auth');
// const farmaciaRoutes = require('./src/routes/farmacia');
// const pacientesRoutes = require('./src/routes/pacientes');

// app.use('/api/auth', authRoutes);
// app.use('/api/farmacia', farmaciaRoutes);
// app.use('/api/pacientes', pacientesRoutes);

// Ruta temporal de bienvenida
app.get('/', (req, res) => {
    res.json({
        message: '🏥 Sistema Hidrocolon API',
        version: '1.0.0',
        environment: currentEnv,
        status: 'Funcionando correctamente',
        security: 'Configuración de seguridad activa',
        documentation: '/health para verificar estado del sistema'
    });
});

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    console.warn(`🚨 Ruta no encontrada: ${req.method} ${req.originalUrl} - IP: ${ip}`);
    
    res.status(404).json({
        error: 'Ruta no encontrada',
        code: 'ROUTE_NOT_FOUND',
        method: req.method,
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    // Log del error
    console.error(`❌ Error en ${req.method} ${req.originalUrl}:`);
    console.error(`📍 IP: ${ip}`);
    console.error(`🔍 Error: ${error.message}`);
    console.error(`📊 Stack: ${error.stack}`);
    
    // Respuesta según el tipo de error
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: 'Formato de datos inválido',
            code: 'INVALID_JSON',
            message: 'El cuerpo de la petición no es JSON válido'
        });
    }
    
    if (error.message.includes('CORS')) {
        return res.status(403).json({
            error: 'Origen no permitido por CORS',
            code: 'CORS_ERROR'
        });
    }
    
    // Error genérico
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({
        error: currentEnv === 'production' ? 'Error interno del servidor' : error.message,
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString()
    });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(PORT, () => {
    console.log('🚀 Servidor corriendo en puerto', PORT);
    console.log('🌍 Ambiente:', currentEnv);
    console.log('🔒 Seguridad:', config.strictSecurity ? 'Estricta' : 'Estándar');
    console.log('📊 Health check: http://localhost:' + PORT + '/health');
    
    if (currentEnv === 'development') {
        console.log('🔍 Debug de seguridad: http://localhost:' + PORT + '/debug/security');
    }
    
    console.log('✅ Sistema Hidrocolon listo para uso');
});

module.exports = app;