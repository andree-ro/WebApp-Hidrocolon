// src/controllers/authController.js
// Controladores de autenticación para Sistema Hidrocolon
// Maneja todos los endpoints de login, logout, verify y refresh

// CAMBIO: En lugar de importar authService inexistente, usar los modelos/utils directamente
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validarEmail, validarPassword, Validators } = require('../utils/validators');

class AuthController {
    constructor() {
        // Bind de métodos para mantener contexto
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.verify = this.verify.bind(this);
        this.refresh = this.refresh.bind(this);
        this.me = this.me.bind(this);
        
        console.log('🎮 AuthController inicializado');
    }

    // POST /api/auth/login - Iniciar sesión
    async login(req, res) {
        try {
            // 1. Validar datos de entrada
            const { usuario, password } = req.body;

            // Validación simple temporal
            if (!usuario || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario y contraseña son requeridos'
                });
            }

            // Validación básica de formato email
            if (!usuario.includes('@hidrocolon.com')) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario debe terminar en @hidrocolon.com'
                });
            }

            // 2. Buscar usuario en la base de datos
            const user = await User.findByEmail(usuario.toLowerCase().trim());
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas'
                });
            }

            // 3. Verificar contraseña
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas'
                });
            }

            // 4. Verificar que el usuario esté activo
            if (!user.activo) {
                return res.status(403).json({
                    success: false,
                    message: 'Usuario desactivado. Contacte al administrador'
                });
            }

            // 5. Generar tokens JWT
            const payload = {
                id: user.id,
                usuario: user.usuario,
                rol_id: user.rol_id,
                rol_nombre: user.rol_nombre,
                nombres: user.nombres,
                apellidos: user.apellidos,
                permisos: user.rol_permisos || {}
            };

            const accessToken = jwt.sign(
                payload,
                process.env.JWT_SECRET || 'hidrocolon-secret-key',
                { 
                    expiresIn: '24h',
                    audience: 'hidrocolon-users',
                    issuer: 'hidrocolon-system'
                }
            );

            const refreshToken = jwt.sign(
                { id: user.id, usuario: user.usuario },
                process.env.JWT_REFRESH_SECRET || 'hidrocolon-refresh-secret',
                { expiresIn: '7d' }
            );

            // 6. Actualizar último login
            await User.updateLastLogin(user.id);

            // 7. Respuesta exitosa
            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: {
                    user: {
                        id: user.id,
                        usuario: user.usuario,
                        nombres: user.nombres,
                        apellidos: user.apellidos,
                        rol_id: user.rol_id,
                        rol_nombre: user.rol_nombre,
                        activo: user.activo
                    },
                    tokens: {
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                        expiresIn: '24h',
                        tokenType: 'Bearer'
                    }
                }
            });

            // 8. Log de auditoría
            console.log(`✅ Login exitoso: ${usuario} - IP: ${req.ip}`);

        } catch (error) {
            // Log del error (sin mostrar detalles sensibles)
            console.error(`❌ Error en login: ${error.message} - IP: ${req.ip}`);

            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // POST /api/auth/logout - Cerrar sesión
    async logout(req, res) {
        try {
            // TODO: Implementar blacklist de tokens si es necesario
            
            res.status(200).json({
                success: true,
                message: 'Logout exitoso'
            });

            console.log(`✅ Logout exitoso - IP: ${req.ip}`);

        } catch (error) {
            console.error(`❌ Error en logout: ${error.message} - IP: ${req.ip}`);
            
            res.status(500).json({
                success: false,
                message: 'Error cerrando sesión'
            });
        }
    }

    // GET /api/auth/verify - Verificar token
    async verify(req, res) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'Token no proporcionado'
                });
            }

            const token = authHeader.substring(7);
            
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'hidrocolon-secret-key'
            );

            // Verificar que el usuario aún existe y está activo
            const user = await User.findById(decoded.id);
            
            if (!user || !user.activo) {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Token válido',
                data: {
                    user: {
                        id: user.id,
                        usuario: user.usuario,
                        nombres: user.nombres,
                        apellidos: user.apellidos,
                        rol_nombre: user.rol_nombre
                    }
                }
            });

        } catch (error) {
            console.error(`❌ Error verificando token: ${error.message} - IP: ${req.ip}`);
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido'
                });
            }
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error verificando token'
            });
        }
    }

    // POST /api/auth/refresh - Refrescar token
    async refresh(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token requerido'
                });
            }

            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET || 'hidrocolon-refresh-secret'
            );

            const user = await User.findById(decoded.id);
            
            if (!user || !user.activo) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token inválido'
                });
            }

            // Generar nuevo access token
            const payload = {
                id: user.id,
                usuario: user.usuario,
                rol_id: user.rol_id,
                rol_nombre: user.rol_nombre,
                nombres: user.nombres,
                apellidos: user.apellidos
            };

            const newAccessToken = jwt.sign(
                payload,
                process.env.JWT_SECRET || 'hidrocolon-secret-key',
                { 
                    expiresIn: '24h',
                    audience: 'hidrocolon-users',
                    issuer: 'hidrocolon-system'
                }
            );

            res.status(200).json({
                success: true,
                message: 'Token refrescado',
                data: {
                    accessToken: newAccessToken,
                    tokenType: 'Bearer',
                    expiresIn: '24h'
                }
            });

        } catch (error) {
            console.error(`❌ Error refrescando token: ${error.message} - IP: ${req.ip}`);
            
            res.status(401).json({
                success: false,
                message: 'Error refrescando token'
            });
        }
    }

    // GET /api/auth/me - Obtener información del usuario actual
    async me(req, res) {
        try {
            // El middleware de autenticación ya validó el token y agregó req.user
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'No autenticado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Información del usuario',
                data: {
                    user: req.user
                }
            });

        } catch (error) {
            console.error(`❌ Error obteniendo usuario: ${error.message} - IP: ${req.ip}`);
            
            res.status(500).json({
                success: false,
                message: 'Error obteniendo información del usuario'
            });
        }
    }

    // POST /api/auth/change-password - Cambiar contraseña
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'No autenticado'
                });
            }

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Contraseña actual y nueva contraseña son requeridas'
                });
            }

            // Validar formato de nueva contraseña
            const passwordValidation = validarPassword(newPassword);
            if (!passwordValidation.esValido) {
                return res.status(400).json({
                    success: false,
                    message: 'Nueva contraseña no cumple los requisitos',
                    errors: passwordValidation.errores || [passwordValidation.error]
                });
            }

            // TODO: Implementar lógica para cambiar contraseña
            // Esto requeriría agregar método al User model
            
            res.status(501).json({
                success: false,
                message: 'Funcionalidad por implementar'
            });

        } catch (error) {
            console.error(`❌ Error cambiando contraseña: ${error.message} - IP: ${req.ip}`);
            
            res.status(500).json({
                success: false,
                message: 'Error cambiando contraseña'
            });
        }
    }

    // GET /api/auth/stats - Estadísticas de autenticación (solo admin)
    async getStats(req, res) {
        try {
            // Verificar que el usuario esté autenticado
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            // Verificar que sea administrador
            if (req.user.rol_nombre !== 'administrador') {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado. Solo administradores'
                });
            }

            // TODO: Implementar estadísticas reales
            const stats = {
                total_usuarios: 0,
                usuarios_activos: 0,
                logins_hoy: 0,
                ultimo_login: new Date().toISOString()
            };

            res.status(200).json({
                success: true,
                message: 'Estadísticas de autenticación',
                data: stats
            });

        } catch (error) {
            console.error(`❌ Error obteniendo estadísticas: ${error.message} - IP: ${req.ip}`);
            
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas'
            });
        }
    }

    // Middleware para manejo de errores async
    asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
}

// Exportar instancia única del controlador
module.exports = new AuthController();