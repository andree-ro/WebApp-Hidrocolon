// src/config/security.js
// Configuración completa de seguridad para Railway

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');

// Configuración por ambiente
const ENVIRONMENTS = {
    development: {
        trustProxy: false,
        rateLimitEnabled: true,
        strictSecurity: false
    },
    production: {
        trustProxy: 1, // Solo confiar en 1 proxy (Railway)
        rateLimitEnabled: true,
        strictSecurity: true
    },
    test: {
        trustProxy: false,
        rateLimitEnabled: false,
        strictSecurity: false
    }
};

const currentEnv = process.env.NODE_ENV || 'development';
const config = ENVIRONMENTS[currentEnv];

// Lista blanca de IPs confiables (Railway, desarrollo local)
const TRUSTED_IPS = [
    '127.0.0.1',
    '::1',
    'localhost'
];

// Configuración de Rate Limiting seguro
const createSecureRateLimit = (options = {}) => {
    const defaults = {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100, // límite por ventana
        message: {
            error: 'Demasiadas peticiones desde esta IP',
            retryAfter: '15 minutos'
        },
        standardHeaders: true,
        legacyHeaders: false,
        // Configuración segura para Railway
        trustProxy: config.trustProxy,
        keyGenerator: (req) => {
            // En producción, usar IP real de Railway
            if (currentEnv === 'production') {
                // Railway proporciona la IP real en X-Forwarded-For
                const forwardedIps = req.get('X-Forwarded-For');
                if (forwardedIps) {
                    const clientIP = forwardedIps.split(',')[0].trim();
                    return clientIP;
                }
            }
            // Fallback a IP de conexión
            return req.connection.remoteAddress || req.socket.remoteAddress;
        },
        // Callback para logging de rate limiting
        onLimitReached: (req, res, options) => {
            const ip = req.ip || req.connection.remoteAddress;
            console.warn(`🚨 Rate limit alcanzado para IP: ${ip} en ${new Date().toISOString()}`);
            console.warn(`📍 Endpoint: ${req.method} ${req.originalUrl}`);
            console.warn(`🔍 User-Agent: ${req.get('User-Agent')}`);
        },
        // Skip para IPs confiables en desarrollo
        skip: (req) => {
            if (currentEnv === 'development') {
                const ip = req.ip || req.connection.remoteAddress;
                return TRUSTED_IPS.includes(ip);
            }
            return false;
        }
    };

    return rateLimit({ ...defaults, ...options });
};

// Rate limiters específicos por endpoint
const rateLimiters = {
    // Rate limiter general
    general: createSecureRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 1000, // 1000 requests por IP
        message: {
            error: 'Demasiadas peticiones. Intente nuevamente en unos minutos.',
            code: 'RATE_LIMIT_EXCEEDED'
        }
    }),

    // Rate limiter para autenticación (más restrictivo)
    auth: createSecureRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 5, // Solo 5 intentos de login por IP
        message: {
            error: 'Demasiados intentos de autenticación. Intente nuevamente en 15 minutos.',
            code: 'AUTH_RATE_LIMIT_EXCEEDED'
        }
    }),

    // Rate limiter para API general
    api: createSecureRateLimit({
        windowMs: 1 * 60 * 1000, // 1 minuto
        max: 60, // 60 requests por minuto
        message: {
            error: 'Límite de API excedido. Máximo 60 peticiones por minuto.',
            code: 'API_RATE_LIMIT_EXCEEDED'
        }
    }),

    // Rate limiter para operaciones críticas (ventas, dinero)
    critical: createSecureRateLimit({
        windowMs: 1 * 60 * 1000, // 1 minuto
        max: 10, // Solo 10 operaciones críticas por minuto
        message: {
            error: 'Límite para operaciones críticas excedido.',
            code: 'CRITICAL_RATE_LIMIT_EXCEEDED'
        }
    })
};

// Configuración de Slow Down (ralentizar requests sospechosos)
const createSlowDown = () => {
    return slowDown({
        windowMs: 15 * 60 * 1000, // 15 minutos
        delayAfter: 50, // Después de 50 requests, empezar a ralentizar
        delayMs: 100, // Incrementar delay en 100ms por request
        maxDelayMs: 5000, // Máximo delay de 5 segundos
        trustProxy: config.trustProxy,
        onLimitReached: (req, res, options) => {
            const ip = req.ip || req.connection.remoteAddress;
            console.warn(`🐌 Slow down activado para IP: ${ip}`);
        }
    });
};

// Configuración de Helmet (headers de seguridad)
const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Para permitir imágenes externas
    hsts: {
        maxAge: 31536000, // 1 año
        includeSubDomains: true,
        preload: true
    }
};

// Middleware para logging de seguridad
const securityLogger = (req, res, next) => {
    // Log de requests sospechosos
    const suspiciousPatterns = [
        /\.\.\//, // Path traversal
        /<script/i, // XSS
        /union.*select/i, // SQL injection
        /admin/i, // Admin access attempts
    ];

    const url = req.originalUrl || req.url;
    const userAgent = req.get('User-Agent') || '';
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
        pattern.test(url) || pattern.test(userAgent)
    );

    if (isSuspicious) {
        const ip = req.ip || req.connection.remoteAddress;
        console.warn(`🚨 REQUEST SOSPECHOSO detectado:`);
        console.warn(`📍 IP: ${ip}`);
        console.warn(`🔗 URL: ${url}`);
        console.warn(`🖥️ User-Agent: ${userAgent}`);
        console.warn(`⏰ Timestamp: ${new Date().toISOString()}`);
    }

    next();
};

// Middleware para validar origen de requests
const validateRequestOrigin = (req, res, next) => {
    if (currentEnv === 'production') {
        const origin = req.get('Origin');
        const referer = req.get('Referer');
        
        // Lista de orígenes permitidos
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            process.env.RAILWAY_PUBLIC_DOMAIN
        ].filter(Boolean);

        // Si no hay origen (requests directos de API son OK)
        if (!origin && !referer) {
            return next();
        }

        // Validar origen
        if (origin && !allowedOrigins.some(allowed => origin.includes(allowed))) {
            console.warn(`🚨 Origen no permitido: ${origin}`);
            return res.status(403).json({
                error: 'Origen no permitido',
                code: 'FORBIDDEN_ORIGIN'
            });
        }
    }

    next();
};

module.exports = {
    config,
    rateLimiters,
    createSlowDown,
    helmetConfig,
    securityLogger,
    validateRequestOrigin,
    ENVIRONMENTS,
    currentEnv
};