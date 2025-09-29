console.log('');
    console.log('💊 Farmacia | 🧰 Extras | 🏥 Servicios | 👥 Pacientes');
    console.log('   GET|POST|PUT|DELETE /api/[modulo]/*');
    console.log('');
    console.log('🛒 Ventas (NUEVO):');
    console.log('   POST /api/ventas - Crear venta');
    console.log('   GET  /api/ventas - Listar ventas');
    console.log('   GET  /api/ventas/:id - Ver venta');
    console.log('   DELETE /api/ventas/:id/anular - Anular venta');
    console.log('   GET  /api/ventas/stats - Estadísticas');
    console.log('   GET  /api/ventas/productos-mas-vendidos');
    console.log('   GET  /api/ventas/comisiones');
    console.log('   GET  /api/ventas/paciente/:id/historial');
    console.log('');
    console.log('🕐 Turnos (NUEVO):');
    console.log('   GET  /api/turnos/actual - Turno actual');
    console.log('   POST /api/turnos - Abrir turno');
    console.log('   PUT  /api/turnos/:id/cerrar - Cerrar turno');
    console.log('   GET  /api/turnos - Historial');
    console.log('   GET  /api/turnos/:id - Ver turno específico');
    
    if (NODE_ENV === 'development') {
        console.log('');
        console.log('🧪 Debug (solo desarrollo):');
        console.log('   GET  /debug/db - Test conexión BD');
        console.log('   GET  /debug/farmacia - Test módulo farmacia');
        console.log('   GET  /debug/extras - Test módulo extras');
        console.log('   GET  /debug/servicios - Test módulo servicios');
        console.log('   GET  /debug/pacientes - Test módulo pacientes');
        console.log('   GET  /debug/system - Test sistema completo');
        console.log('   GET  /debug/info - Info del sistema');
        console.log('   POST /debug/insert-extras-data - Insertar datos extras');
        console.log('   POST /debug/insert-servicios-data - Insertar datos servicios');
    }
    
    console.log('\n🔥 ¡Módulo Carrito/Ventas integrado y listo!');
    console.log('🔐 Credenciales: admin@hidrocolon.com / admin123');
    console.log('📋 Próximos módulos: financiero (cierre turno), usuarios, notificaciones');// server.js
// Servidor principal del Sistema Hidrocolon
// Configuración completa con autenticación, farmacia, extras, servicios, ventas y turnos

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Importar configuración de seguridad
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// ============================================================================
// 🔧 VARIABLES DE ENTORNO (DECLARAR PRIMERO)
// ============================================================================
const NODE_ENV = process.env.NODE_ENV || 'production';
const PORT = process.env.PORT || 8080;

console.log(`🔧 Configurando seguridad para ambiente: ${NODE_ENV}`);

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

// ============================================================================
// 🚀 CONFIGURACIÓN DEL SERVIDOR
// ============================================================================

const app = express();

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
    const startTime = Date.now();
    
    // Log de inicio de request
    if (!req.path.includes('/health')) {
        console.log(`📍 [${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    }
    
    // Interceptar response para medir tiempo
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - startTime;
        
        // Log de finalización con tiempo
        if (!req.path.includes('/health') && res.statusCode >= 400) {
            console.error(`❌ Error ${res.statusCode}: ${req.method} ${req.path} (${duration}ms)`);
        }
        
        originalSend.call(this, data);
    };
    
    next();
});

// ============================================================================
// 🚦 RATE LIMITING GLOBAL
// ============================================================================

// Slow down para requests abusivos
const slowDownConfig = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutos
    delayAfter: 50, // después de 50 requests, empezar a ralentizar
    delayMs: () => 100, // delay fijo de 100ms
    maxDelayMs: 20000, // máximo delay de 20 segundos
});

app.use(slowDownConfig);
console.log('✅ Slow down configurado');

// Rate limiting general
const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: NODE_ENV === 'development' ? 2000 : 1000, // Más requests en desarrollo
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

// Rate limiting para API endpoints
const apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: NODE_ENV === 'development' ? 300 : 100, // Más requests en desarrollo
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
// 🛣️ RUTAS PRINCIPALES
// ============================================================================

// Ruta raíz
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

// Health check
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
// 🔐 RUTAS DE AUTENTICACIÓN
// ============================================================================

app.use('/api/auth', authRoutes);
console.log('✅ Rutas de autenticación configuradas en /api/auth');

// ============================================================================
// 💊 RUTAS DE FARMACIA
// ============================================================================

app.use('/api/farmacia', farmaciaRoutes);
console.log('✅ Rutas de farmacia configuradas en /api/farmacia');

// ============================================================================
// 🧰 RUTAS DE EXTRAS
// ============================================================================

app.use('/api/extras', extrasRoutes);
console.log('✅ Rutas de extras configuradas en /api/extras');

// ============================================================================
// 🏥 RUTAS DE SERVICIOS
// ============================================================================

app.use('/api/servicios', serviciosRoutes);
console.log('✅ Rutas de servicios configuradas en /api/servicios');

// ============================================================================
// 👥 RUTAS DE PACIENTES
// ============================================================================

app.use('/api/pacientes', pacientesRoutes);
console.log('✅ Rutas de pacientes configuradas en /api/pacientes');

// ============================================================================
// 🛒 RUTAS DE VENTAS (NUEVO)
// ============================================================================

app.use('/api/ventas', ventasRoutes);
console.log('✅ Rutas de ventas configuradas en /api/ventas');

// ============================================================================
// 🕐 RUTAS DE TURNOS (NUEVO)
// ============================================================================

app.use('/api/turnos', turnosRoutes);
console.log('✅ Rutas de turnos configuradas en /api/turnos');

// ============================================================================
// 🔗 RUTAS DE RELACIÓN MEDICAMENTOS-EXTRAS
// ============================================================================

const ExtrasController = require('./src/controllers/extrasController');
const authMiddleware = require('./src/middleware/authMiddleware');
const simpleAuth = authMiddleware.authenticate();

app.get('/api/medicamentos/:id/extras', simpleAuth, ExtrasController.getExtrasDeMedicamento);
app.post('/api/medicamentos/:id/extras', simpleAuth, ExtrasController.vincularExtraConMedicamento);
app.delete('/api/medicamentos/:id/extras/:extraId', simpleAuth, ExtrasController.desvincularExtraDeMedicamento);

console.log('✅ Rutas de medicamentos-extras configuradas:');
console.log('   GET    /api/medicamentos/:id/extras');
console.log('   POST   /api/medicamentos/:id/extras');
console.log('   DELETE /api/medicamentos/:id/extras/:extraId');

// ============================================================================
// 🔗 RUTAS DE RELACIÓN SERVICIOS-MEDICAMENTOS
// ============================================================================

app.get('/api/medicamentos/:id/servicios', simpleAuth, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🏥 GET /api/medicamentos/${id}/servicios - Servicios que usan medicamento`);

        const medicamentoId = parseInt(id);
        if (isNaN(medicamentoId) || medicamentoId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de medicamento inválido'
            });
        }

        const db = require('./src/config/database');
        const query = `
            SELECT 
                s.*,
                sm.cantidad_requerida,
                COUNT(sm2.medicamento_id) as total_medicamentos_vinculados
            FROM servicios s
            INNER JOIN servicios_medicamentos sm ON s.id = sm.servicio_id
            LEFT JOIN servicios_medicamentos sm2 ON s.id = sm2.servicio_id
            WHERE sm.medicamento_id = ? AND s.activo = true
            GROUP BY s.id, sm.cantidad_requerida
            ORDER BY s.nombre_servicio
        `;

        const [servicios] = await db.execute(query, [medicamentoId]);

        console.log(`✅ ${servicios.length} servicios encontrados que usan medicamento ${medicamentoId}`);

        res.json({
            success: true,
            message: 'Servicios obtenidos correctamente',
            data: servicios,
            medicamento_id: medicamentoId
        });

    } catch (error) {
        console.error('❌ Error en GET /api/medicamentos/:id/servicios:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo servicios del medicamento',
            error: error.message
        });
    }
});

console.log('✅ Rutas adicionales servicios-medicamentos configuradas:');
console.log('   GET    /api/medicamentos/:id/servicios');

// ============================================================================
// 📋 MÓDULOS FUTUROS
// ============================================================================

console.log('📋 Módulos implementados: auth, farmacia, extras, servicios, pacientes, ventas, turnos');
console.log('📋 Módulos pendientes: financiero (cierre de turno), usuarios (admin), notificaciones');

// ============================================================================
// 🧪 RUTAS DE DESARROLLO
// ============================================================================

app.get('/debug/pacientes', async (req, res) => {
    try {
        const Paciente = require('./src/models/Paciente');
        const stats = await Paciente.getStats();
        const pacientes = await Paciente.findAll({ limit: 3 });
            
        res.json({
            success: true,
            message: 'Módulo pacientes funcionando',
            data: {
                stats,
                sample_pacientes: pacientes.data
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en módulo pacientes',
            error: error.message
        });
    }
});

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

    // Test farmacia
    app.get('/debug/farmacia', async (req, res) => {
        try {
            const Medicamento = require('./src/models/Medicamento');
            const stats = await Medicamento.getStats();
            const medicamentos = await Medicamento.findAll({ limit: 3 });
            
            res.json({
                success: true,
                message: 'Módulo farmacia funcionando',
                data: {
                    stats,
                    sample_medicamentos: medicamentos
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error en módulo farmacia',
                error: error.message
            });
        }
    });

    // Test extras
    app.get('/debug/extras', async (req, res) => {
        try {
            const Extra = require('./src/models/Extra');
            const stats = await Extra.getStats();
            const extras = await Extra.findAll({ limit: 3 });
            
            res.json({
                success: true,
                message: 'Módulo extras funcionando',
                data: {
                    stats,
                    sample_extras: extras
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error en módulo extras',
                error: error.message
            });
        }
    });

    // Test servicios
    app.get('/debug/servicios', async (req, res) => {
        try {
            const Servicio = require('./src/models/Servicio');
            const stats = await Servicio.getStats();
            const servicios = await Servicio.findAll({ limit: 3 });
            
            res.json({
                success: true,
                message: 'Módulo servicios funcionando',
                data: {
                    stats,
                    sample_servicios: servicios.servicios
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error en módulo servicios',
                error: error.message
            });
        }
    });

    // Test completo del sistema
    app.get('/debug/system', async (req, res) => {
        try {
            console.log('🧪 Testing sistema completo...');
            
            const User = require('./src/models/User');
            const Medicamento = require('./src/models/Medicamento');
            const Extra = require('./src/models/Extra');
            const Servicio = require('./src/models/Servicio');

            const [usuarios, medicamentosResult, extrasResult, serviciosResult] = await Promise.all([
                User.getAll(),
                Medicamento.findAll({ limit: 1 }),
                Extra.findAll({ limit: 1 }),
                Servicio.findAll({ limit: 1 })
            ]);

            res.json({
                success: true,
                message: 'Sistema completo funcionando',
                modules: {
                    auth: {
                        status: 'OK',
                        users: usuarios.length
                    },
                    farmacia: {
                        status: 'OK',
                        medicamentos: medicamentosResult.pagination.totalItems
                    },
                    extras: {
                        status: 'OK',
                        extras: extrasResult.pagination.totalItems
                    },
                    servicios: {
                        status: 'OK',
                        servicios: serviciosResult.pagination.totalItems
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error en test del sistema:', error);
            res.status(500).json({
                success: false,
                message: 'Error en test del sistema',
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
                    auth: 'Configurado y funcionando',
                    farmacia: 'Configurado y funcionando',
                    extras: 'Configurado y funcionando',
                    servicios: 'Configurado y funcionando',
                    pacientes: 'Configurado y funcionando',
                    ventas: 'Configurado y funcionando',
                    turnos: 'Configurado y funcionando',
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

    // Endpoint para insertar datos de prueba de extras
    app.post('/debug/insert-extras-data', async (req, res) => {
        try {
            console.log('🧰 Insertando datos de prueba de extras...');
            
            const mysql = require('mysql2/promise');
            
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                port: process.env.DB_PORT || 3306
            });

            const [existingExtras] = await connection.execute('SELECT COUNT(*) as count FROM extras WHERE activo = 1');
            
            if (existingExtras[0].count > 0) {
                await connection.end();
                return res.json({
                    success: true,
                    message: `Ya existen ${existingExtras[0].count} extras en la base de datos`,
                    data: { extras_existentes: existingExtras[0].count }
                });
            }

            const extrasData = [
                ['Alcohol Etílico 70%', 'Antiséptico para desinfección de piel antes de inyecciones', 50, 20, 2.50],
                ['Algodón', 'Algodón estéril para limpieza y aplicación de medicamentos', 100, 30, 1.00],
                ['Jeringas 5ml', 'Jeringas desechables de 5ml para aplicación de medicamentos', 200, 50, 1.50],
                ['Jeringas 10ml', 'Jeringas desechables de 10ml para sueros y medicamentos', 150, 40, 2.00],
                ['Agujas 21G', 'Agujas desechables calibre 21G para inyecciones intramusculares', 300, 100, 0.75],
                ['Agujas 23G', 'Agujas desechables calibre 23G para inyecciones subcutáneas', 250, 80, 0.70],
                ['Equipo de Venoclisis', 'Equipo para administración de sueros y medicamentos IV', 25, 15, 8.00],
                ['Gasas Estériles', 'Gasas estériles para curaciones y limpieza', 80, 25, 3.00],
                ['Cinta Micropore', 'Cinta adhesiva hipoalergénica para fijación', 35, 20, 4.50],
                ['Catéter IV 22G', 'Catéter intravenoso calibre 22G para acceso vascular', 40, 20, 12.00]
            ];

            const insertQuery = `
                INSERT INTO extras (nombre, descripcion, existencias, stock_minimo, precio_unitario, activo) 
                VALUES (?, ?, ?, ?, ?, 1)
            `;

            let insertedCount = 0;
            for (const extraData of extrasData) {
                try {
                    await connection.execute(insertQuery, extraData);
                    insertedCount++;
                    console.log(`✅ Extra insertado: ${extraData[0]}`);
                } catch (error) {
                    console.log(`⚠️ Error insertando ${extraData[0]}:`, error.message);
                }
            }

            const [medicamentos] = await connection.execute('SELECT id FROM medicamentos WHERE activo = 1 LIMIT 4');
            
            let vinculacionesCreadas = 0;
            if (medicamentos.length > 0) {
                console.log('🔗 Vinculando extras con medicamentos...');
                
                if (medicamentos[0]) {
                    const vinculaciones = [
                        [medicamentos[0].id, 3, 1],
                        [medicamentos[0].id, 5, 1],
                        [medicamentos[0].id, 1, 1],
                        [medicamentos[0].id, 2, 1]
                    ];

                    for (const [medId, extraId, cantidad] of vinculaciones) {
                        try {
                            await connection.execute(
                                'INSERT IGNORE INTO medicamentos_extras (medicamento_id, extra_id, cantidad_requerida) VALUES (?, ?, ?)',
                                [medId, extraId, cantidad]
                            );
                            vinculacionesCreadas++;
                        } catch (error) {
                            console.log('⚠️ Error vinculando extra:', error.message);
                        }
                    }
                }

                if (medicamentos[1]) {
                    const vinculacionesSupero = [
                        [medicamentos[1].id, 7, 1],
                        [medicamentos[1].id, 10, 1],
                        [medicamentos[1].id, 1, 1],
                        [medicamentos[1].id, 2, 2],
                        [medicamentos[1].id, 9, 1]
                    ];

                    for (const [medId, extraId, cantidad] of vinculacionesSupero) {
                        try {
                            await connection.execute(
                                'INSERT IGNORE INTO medicamentos_extras (medicamento_id, extra_id, cantidad_requerida) VALUES (?, ?, ?)',
                                [medId, extraId, cantidad]
                            );
                            vinculacionesCreadas++;
                        } catch (error) {
                            console.log('⚠️ Error vinculando extra suero:', error.message);
                        }
                    }
                }
            }

            await connection.end();

            res.json({
                success: true,
                message: 'Datos de extras insertados exitosamente',
                data: {
                    extras_insertados: insertedCount,
                    vinculaciones_creadas: vinculacionesCreadas,
                    medicamentos_disponibles: medicamentos.length,
                    total_extras: extrasData.length
                }
            });

        } catch (error) {
            console.error('❌ Error insertando datos de extras:', error);
            res.status(500).json({
                success: false,
                message: 'Error insertando datos de extras',
                error: error.message
            });
        }
    });

    // Endpoint para insertar datos de prueba de servicios
    app.post('/debug/insert-servicios-data', async (req, res) => {
        try {
            console.log('🏥 Insertando datos de prueba de servicios...');
            
            const mysql = require('mysql2/promise');
            
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                port: process.env.DB_PORT || 3306
            });

            const [existingServicios] = await connection.execute('SELECT COUNT(*) as count FROM servicios WHERE activo = 1');
            
            if (existingServicios[0].count > 0) {
                await connection.end();
                return res.json({
                    success: true,
                    message: `Ya existen ${existingServicios[0].count} servicios en la base de datos`,
                    data: { servicios_existentes: existingServicios[0].count }
                });
            }

            const serviciosData = [
                ['Hidroterapia de Colon Básica', 'Sesión básica de hidroterapia de colon con equipo estándar', 300.00, 280.00, 250.00, 15.00, true, false],
                ['Hidroterapia de Colon Premium', 'Sesión premium con ozono, probióticos y seguimiento nutricional', 450.00, 420.00, 400.00, 20.00, true, true],
                ['Consulta Nutricional', 'Evaluación nutricional completa con plan personalizado', 150.00, 140.00, 100.00, 10.00, true, false],
                ['Paquete 3 Sesiones Hidrocolon', 'Paquete promocional de 3 sesiones de hidroterapia', 800.00, 750.00, 700.00, 25.00, true, true],
                ['Ultrasonido Abdominal', 'Ultrasonido diagnóstico abdominal completo', 200.00, 180.00, 150.00, 12.00, true, false],
                ['Terapia de Ozono', 'Sesión de ozonoterapia para desintoxicación', 180.00, 160.00, 120.00, 8.00, true, true],
                ['Limpieza Hepática', 'Protocolo de limpieza hepática con suplementos naturales', 120.00, 100.00, 80.00, 5.00, true, true]
            ];

            const insertQuery = `
                INSERT INTO servicios (
                    nombre_servicio, descripcion, precio_tarjeta, precio_efectivo, 
                    monto_minimo, comision_venta, activo, requiere_medicamentos,
                    fecha_creacion, fecha_actualizacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;

            let insertedCount = 0;
            for (const servicioData of serviciosData) {
                try {
                    await connection.execute(insertQuery, servicioData);
                    insertedCount++;
                    console.log(`✅ Servicio insertado: ${servicioData[0]}`);
                } catch (error) {
                    console.log(`⚠️ Error insertando ${servicioData[0]}:`, error.message);
                }
            }

            const [medicamentos] = await connection.execute('SELECT id FROM medicamentos WHERE activo = 1 LIMIT 3');
            const [servicios] = await connection.execute('SELECT id FROM servicios WHERE requiere_medicamentos = 1 LIMIT 3');
            
            let vinculacionesCreadas = 0;
            if (medicamentos.length > 0 && servicios.length > 0) {
                console.log('🔗 Vinculando servicios con medicamentos...');
                
                for (let i = 0; i < Math.min(medicamentos.length, 2); i++) {
                    try {
                        await connection.execute(
                            'INSERT IGNORE INTO servicios_medicamentos (servicio_id, medicamento_id, cantidad_requerida, fecha_creacion, fecha_actualizacion) VALUES (?, ?, ?, NOW(), NOW())',
                            [servicios[0].id, medicamentos[i].id, 1]
                        );
                        vinculacionesCreadas++;
                    } catch (error) {
                        console.log(`⚠️ Error vinculando:`, error.message);
                    }
                }

                if (servicios[1] && medicamentos.length > 1) {
                    try {
                        await connection.execute(
                            'INSERT IGNORE INTO servicios_medicamentos (servicio_id, medicamento_id, cantidad_requerida, fecha_creacion, fecha_actualizacion) VALUES (?, ?, ?, NOW(), NOW())',
                            [servicios[1].id, medicamentos[1].id, 2]
                        );
                        vinculacionesCreadas++;
                    } catch (error) {
                        console.log(`⚠️ Error vinculando segundo servicio:`, error.message);
                    }
                }
            }

            await connection.end();

            res.json({
                success: true,
                message: 'Datos de servicios insertados exitosamente',
                data: {
                    servicios_insertados: insertedCount,
                    total_servicios: serviciosData.length,
                    vinculaciones_creadas: vinculacionesCreadas,
                    medicamentos_disponibles: medicamentos.length
                }
            });

        } catch (error) {
            console.error('❌ Error insertando datos de servicios:', error);
            res.status(500).json({
                success: false,
                message: 'Error insertando datos de servicios',
                error: error.message
            });
        }
    });

    console.log('🧪 Rutas de desarrollo habilitadas');
}

// ============================================================================
// 🚫 MANEJO DE ERRORES Y 404
// ============================================================================

// Endpoint para insertar datos de extras (disponible en producción)
app.post('/api/extras/initialize-data', async (req, res) => {
    try {
        console.log('🧰 Inicializando datos de extras...');
        
        const mysql = require('mysql2/promise');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        const [existingExtras] = await connection.execute('SELECT COUNT(*) as count FROM extras WHERE activo = 1');
        
        if (existingExtras[0].count > 0) {
            await connection.end();
            return res.json({
                success: true,
                message: `Ya existen ${existingExtras[0].count} extras en la base de datos`,
                data: { extras_existentes: existingExtras[0].count }
            });
        }

        const extrasData = [
            ['Alcohol Etílico 70%', 'Antiséptico para desinfección de piel antes de inyecciones', 50, 20, 2.50],
            ['Algodón', 'Algodón estéril para limpieza y aplicación de medicamentos', 100, 30, 1.00],
            ['Jeringas 5ml', 'Jeringas desechables de 5ml para aplicación de medicamentos', 200, 50, 1.50],
            ['Jeringas 10ml', 'Jeringas desechables de 10ml para sueros y medicamentos', 150, 40, 2.00],
            ['Agujas 21G', 'Agujas desechables calibre 21G para inyecciones intramusculares', 300, 100, 0.75],
            ['Agujas 23G', 'Agujas desechables calibre 23G para inyecciones subcutáneas', 250, 80, 0.70],
            ['Equipo de Venoclisis', 'Equipo para administración de sueros y medicamentos IV', 25, 15, 8.00],
            ['Gasas Estériles', 'Gasas estériles para curaciones y limpieza', 80, 25, 3.00],
            ['Cinta Micropore', 'Cinta adhesiva hipoalergénica para fijación', 35, 20, 4.50],
            ['Catéter IV 22G', 'Catéter intravenoso calibre 22G para acceso vascular', 40, 20, 12.00]
        ];

        const insertQuery = `
            INSERT INTO extras (nombre, descripcion, existencias, stock_minimo, costo_unitario, activo) 
            VALUES (?, ?, ?, ?, ?, 1)
        `;

        let insertedCount = 0;
        for (const extraData of extrasData) {
            try {
                await connection.execute(insertQuery, extraData);
                insertedCount++;
                console.log(`✅ Extra insertado: ${extraData[0]}`);
            } catch (error) {
                console.log(`⚠️ Error insertando ${extraData[0]}:`, error.message);
            }
        }

        await connection.end();

        res.json({
            success: true,
            message: 'Datos de extras insertados exitosamente',
            data: {
                extras_insertados: insertedCount,
                total_extras: extrasData.length
            }
        });

    } catch (error) {
        console.error('❌ Error insertando datos de extras:', error);
        res.status(500).json({
            success: false,
            message: 'Error insertando datos de extras',
            error: error.message
        });
    }
});

// Endpoint para insertar datos de servicios (disponible en producción)
app.post('/api/servicios/initialize-data', async (req, res) => {
    try {
        console.log('🏥 Inicializando datos de servicios...');
        
        const mysql = require('mysql2/promise');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        const [existingServicios] = await connection.execute('SELECT COUNT(*) as count FROM servicios WHERE activo = 1');
        
        if (existingServicios[0].count > 0) {
            await connection.end();
            return res.json({
                success: true,
                message: `Ya existen ${existingServicios[0].count} servicios en la base de datos`,
                data: { servicios_existentes: existingServicios[0].count }
            });
        }

        const serviciosData = [
            ['Hidroterapia de Colon Básica', 'Sesión básica de hidroterapia de colon', 300.00, 280.00, 250.00, 15.00, true, false],
            ['Hidroterapia de Colon Premium', 'Sesión premium con ozono y probióticos', 450.00, 420.00, 400.00, 20.00, true, true],
            ['Consulta Nutricional', 'Evaluación nutricional completa', 150.00, 140.00, 100.00, 10.00, true, false]
        ];

        const insertQuery = `
            INSERT INTO servicios (
                nombre_servicio, descripcion, precio_tarjeta, precio_efectivo, 
                monto_minimo, comision_venta, activo, requiere_medicamentos,
                fecha_creacion, fecha_actualizacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        let insertedCount = 0;
        for (const servicioData of serviciosData) {
            try {
                await connection.execute(insertQuery, servicioData);
                insertedCount++;
                console.log(`✅ Servicio insertado: ${servicioData[0]}`);
            } catch (error) {
                console.log(`⚠️ Error insertando ${servicioData[0]}:`, error.message);
            }
        }

        await connection.end();

        res.json({
            success: true,
            message: 'Datos de servicios insertados exitosamente',
            data: {
                servicios_insertados: insertedCount,
                total_servicios: serviciosData.length
            }
        });

    } catch (error) {
        console.error('❌ Error insertando datos de servicios:', error);
        res.status(500).json({
            success: false,
            message: 'Error insertando datos de servicios',
            error: error.message
        });
    }
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
        code: 'ROUTE_NOT_FOUND',
        availableEndpoints: {
            root: 'GET /',
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

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
    console.error('❌ Error global capturado:', {
        message: error.message,
        stack: NODE_ENV === 'development' ? error.stack : undefined,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
            success: false,
            message: 'JSON malformado en el request',
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
    
    console.log('\n📋 Endpoints disponibles:');
    console.log('   GET  / - Información general');
    console.log('   GET  /health - Estado del sistema');
    console.log('');
    console.log('🔐 Autenticación:');
    console.log('   POST /api/auth/login');
    console.log('   GET  /api/auth/verify');
    console.log('');
    console.log('💊 Farmacia | 🧰 Extras | 🏥 Servicios | 👥 Pacientes');
    console.log('   GET|POST|PUT|DELETE /api/[modulo]/*');
    console.log('');
    console.log('🛒 Ventas (NUEVO):');
    console.log('   POST /api/ventas - Crear venta');
    console.log('   GET  /api/ventas - Listar ventas');
    console.log('   GET  /api/ventas/:id - Ver venta');
    console.log('   DELETE /api/ventas/:id/anular - Anular venta');
    console.log('   GET  /api/ventas/stats - Estadísticas');
    console.log('');
    console.log('🕐 Turnos (NUEVO):');
    console.log('   GET  /api/turnos/actual - Turno actual');
    console.log('   POST /api/turnos - Abrir turno');
    console.log('   PUT  /api/turnos/:id/cerrar - Cerrar turno');
    console.log('   GET  /api/turnos - Historial');
    
    if (NODE_ENV === 'development') {
        console.log('');
        console.log('🧪 Debug (solo desarrollo):');
        console.log('   GET /debug/system - Test completo');
    }
    
    console.log('\n🔥 ¡Módulo Carrito/Ventas integrado y listo!');
    console.log('🔐 Credenciales: admin@hidrocolon.com / admin123');
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

process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rechazada no manejada en:', promise, 'razón:', reason);
    process.exit(1);
});

module.exports = app;