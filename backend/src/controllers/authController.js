// src/controllers/authController.js
// Controladores de autenticación para Sistema Hidrocolon
// Maneja todos los endpoints de login, logout, verify y refresh

const authService = require('../services/authService');
const validators = require('../utils/validators');

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
            const validation = validators.validateLoginData(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: validation.errors
                });
            }

            // 2. Extraer datos validados
            const { usuario, password } = validation.data;

            // 3. Intentar login con el servicio
            const loginResult = await authService.login(usuario, password);

            // 4. Respuesta exitosa
            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: {
                    user: loginResult.user,
                    accessToken: loginResult.accessToken,
                    refreshToken: loginResult.refreshToken,
                    expiresIn: loginResult.expiresIn,
                    tokenType: loginResult.tokenType
                }
            });

            // 5. Log de auditoría
            console.log(`✅ Login exitoso: ${usuario} - IP: ${req.ip}`);

        } catch (error) {
            // Log del error (sin mostrar detalles sensibles)
            console.error(`❌ Error en login: ${error.message} - IP: ${req.ip}`);

            // Determinar tipo de error
            if (error.message.includes('Usuario no encontrado') || 
                error.message.includes('Contraseña incorrecta')) {
                
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas'
                });
            }

            if (error.message.includes('desactivado')) {
                return res.status(403).json({
                    success: false,
                    message: 'Usuario desactivado. Contacte al administrador'
                });
            }

            if (error.message.includes('Formato')) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de usuario inválido'
                });
            }

            // Error genérico del servidor
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // POST /api/auth/logout - Cerrar sesión
    async logout(req, res) {
        try {
            // 1. Validar headers de autorización
            const authValidation = validators.validateAuthHeaders(req.headers);
            if (!authValidation.isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de autorización requerido',
                    errors: authValidation.errors
                });
            }

            // 2. Ejecutar logout (agregar token a blacklist)
            await authService.logout(authValidation.token);

            // 3. Respuesta exitosa
            res.status(200).json({
                success: true,
                message: 'Logout exitoso'
            });

            // 4. Log de auditoría
            console.log(`✅ Logout exitoso - Token invalidado - IP: ${req.ip}`);

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
            // 1. Validar headers de autorización
            const authValidation = validators.validateAuthHeaders(req.headers);
            if (!authValidation.isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de autorización requerido',
                    errors: authValidation.errors
                });
            }

            // 2. Verificar token con el servicio
            const decoded = authService.verifyToken(authValidation.token);

            // 3. Respuesta exitosa con datos del token
            res.status(200).json({
                success: true,
                message: 'Token válido',
                data: {
                    user: {
                        id: decoded.id,
                        usuario: decoded.usuario,
                        nombres: decoded.nombres,
                        apellidos: decoded.apellidos,
                        rol: {
                            id: decoded.rol_id,
                            nombre: decoded.rol_nombre,
                            permisos: decoded.permisos
                        }
                    },
                    tokenInfo: {
                        issuedAt: new Date(decoded.iat * 1000),
                        expiresAt: new Date(decoded.exp * 1000)
                    }
                }
            });

        } catch (error) {
            console.error(`❌ Error verificando token: ${error.message} - IP: ${req.ip}`);

            // Errores específicos de JWT
            if (error.message.includes('expirado')) {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado',
                    code: 'TOKEN_EXPIRED'
                });
            }

            if (error.message.includes('inválido') || error.message.includes('invalidado')) {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido',
                    code: 'TOKEN_INVALID'
                });
            }

            res.status(401).json({
                success: false,
                message: 'Error verificando token'
            });
        }
    }

    // POST /api/auth/refresh - Renovar token de acceso
    async refresh(req, res) {
        try {
            // 1. Validar que se envíe refresh token
            const { refreshToken } = req.body;
            
            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token requerido'
                });
            }

            // 2. Validar formato del refresh token
            const tokenValidation = validators.validateJWTToken(refreshToken);
            if (!tokenValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de refresh token inválido',
                    errors: tokenValidation.errors
                });
            }

            // 3. Renovar token con el servicio
            const newTokenData = await authService.refreshAccessToken(refreshToken);

            // 4. Respuesta exitosa
            res.status(200).json({
                success: true,
                message: 'Token renovado exitosamente',
                data: {
                    accessToken: newTokenData.accessToken,
                    expiresIn: newTokenData.expiresIn,
                    tokenType: newTokenData.tokenType
                }
            });

            console.log(`✅ Token renovado exitosamente - IP: ${req.ip}`);

        } catch (error) {
            console.error(`❌ Error renovando token: ${error.message} - IP: ${req.ip}`);

            if (error.message.includes('expirado') || error.message.includes('inválido')) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token inválido o expirado',
                    code: 'REFRESH_TOKEN_INVALID'
                });
            }

            if (error.message.includes('Usuario no encontrado') || 
                error.message.includes('desactivado')) {
                return res.status(403).json({
                    success: false,
                    message: 'Usuario no autorizado'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error renovando token'
            });
        }
    }

    // GET /api/auth/me - Obtener información del usuario actual
    async me(req, res) {
        try {
            // Este endpoint requiere middleware de autenticación
            // El middleware ya habrá validado el token y agregado req.user
            
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            // Responder con información del usuario (sin datos sensibles)
            res.status(200).json({
                success: true,
                message: 'Información del usuario',
                data: {
                    user: {
                        id: req.user.id,
                        usuario: req.user.usuario,
                        nombres: req.user.nombres,
                        apellidos: req.user.apellidos,
                        rol: {
                            id: req.user.rol_id,
                            nombre: req.user.rol_nombre,
                            permisos: req.user.permisos
                        }
                    }
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

    // POST /api/auth/change-password - Cambiar contraseña (protegido)
    async changePassword(req, res) {
        try {
            // Validar que el usuario esté autenticado
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            // Validar datos de entrada
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Contraseña actual y nueva contraseña son requeridas'
                });
            }

            // Validar formato de nueva contraseña
            const passwordValidation = validators.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Nueva contraseña no cumple los requisitos',
                    errors: passwordValidation.errors
                });
            }

            // TODO: Implementar lógica para cambiar contraseña
            // Esto requerirá agregar método al User model
            
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
            if (!authService.hasRole(req.user.rol_nombre, 'administrador')) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado. Solo administradores'
                });
            }

            // Obtener estadísticas del servicio
            const stats = authService.getStats();

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