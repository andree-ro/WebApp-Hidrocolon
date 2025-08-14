// src/middleware/authMiddleware.js
// Middleware de autenticación para Sistema Hidrocolon
// Protege rutas con JWT y valida permisos/roles

const authService = require('../services/authService');
const validators = require('../utils/validators');
const User = require('../models/User');

class AuthMiddleware {
    constructor() {
        console.log('🛡️ AuthMiddleware inicializado');
    }

    // Middleware principal - Verificar token JWT
    authenticate() {
        return async (req, res, next) => {
            try {
                // 1. Validar headers de autorización
                const authValidation = validators.validateAuthHeaders(req.headers);
                if (!authValidation.isValid) {
                    return res.status(401).json({
                        success: false,
                        message: 'Token de autorización requerido',
                        code: 'AUTH_REQUIRED',
                        errors: authValidation.errors
                    });
                }

                // 2. Verificar token con el servicio
                const decoded = authService.verifyToken(authValidation.token);

                // 3. Verificar que el usuario aún existe y está activo
                const user = await User.findById(decoded.id);
                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Usuario no encontrado',
                        code: 'USER_NOT_FOUND'
                    });
                }

                if (!user.activo) {
                    return res.status(403).json({
                        success: false,
                        message: 'Usuario desactivado',
                        code: 'USER_DEACTIVATED'
                    });
                }

                // 4. Agregar información del usuario al request
                req.user = {
                    id: user.id,
                    usuario: user.usuario,
                    nombres: user.nombres,
                    apellidos: user.apellidos,
                    rol_id: user.rol_id,
                    rol_nombre: user.rol_nombre,
                    permisos: user.rol_permisos || {},
                    token: authValidation.token
                };

                // 5. Log de acceso exitoso
                console.log(`✅ Auth exitoso: ${user.usuario} - IP: ${req.ip} - Ruta: ${req.path}`);

                next();

            } catch (error) {
                console.error(`❌ Error en autenticación: ${error.message} - IP: ${req.ip}`);

                // Manejo específico de errores JWT
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

                return res.status(401).json({
                    success: false,
                    message: 'Error de autenticación',
                    code: 'AUTH_ERROR'
                });
            }
        };
    }

    // Middleware opcional - Si hay token, lo valida, si no, continúa
    optionalAuth() {
        return async (req, res, next) => {
            try {
                // Verificar si hay header de autorización
                const authHeader = req.headers.authorization || req.headers.Authorization;
                
                if (!authHeader) {
                    // No hay token, continuar sin autenticación
                    req.user = null;
                    return next();
                }

                // Si hay token, validarlo
                const authValidation = validators.validateAuthHeaders(req.headers);
                if (!authValidation.isValid) {
                    req.user = null;
                    return next();
                }

                // Verificar token
                const decoded = authService.verifyToken(authValidation.token);
                const user = await User.findById(decoded.id);

                if (user && user.activo) {
                    req.user = {
                        id: user.id,
                        usuario: user.usuario,
                        nombres: user.nombres,
                        apellidos: user.apellidos,
                        rol_id: user.rol_id,
                        rol_nombre: user.rol_nombre,
                        permisos: user.rol_permisos || {},
                        token: authValidation.token
                    };
                } else {
                    req.user = null;
                }

                next();

            } catch (error) {
                // En caso de error, continuar sin autenticación
                req.user = null;
                next();
            }
        };
    }

    // Middleware para validar roles específicos
    requireRole(requiredRoles) {
        // Aceptar string único o array de roles
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

        return (req, res, next) => {
            // Verificar que el usuario esté autenticado
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida',
                    code: 'AUTH_REQUIRED'
                });
            }

            // Verificar si el usuario tiene alguno de los roles requeridos
            const hasRole = roles.some(role => 
                authService.hasRole(req.user.rol_nombre, role)
            );

            if (!hasRole) {
                return res.status(403).json({
                    success: false,
                    message: `Acceso denegado. Roles requeridos: ${roles.join(', ')}`,
                    code: 'INSUFFICIENT_ROLE'
                });
            }

            console.log(`✅ Acceso autorizado: ${req.user.usuario} (${req.user.rol_nombre}) - Ruta: ${req.path}`);
            next();
        };
    }

    // Middleware para validar permisos específicos
    requirePermission(requiredPermissions) {
        // Aceptar string único o array de permisos
        const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

        return (req, res, next) => {
            // Verificar que el usuario esté autenticado
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida',
                    code: 'AUTH_REQUIRED'
                });
            }

            // Verificar si el usuario tiene todos los permisos requeridos
            const hasPermissions = authService.hasAllPermissions(req.user.permisos, permissions);

            if (!hasPermissions) {
                return res.status(403).json({
                    success: false,
                    message: `Permisos insuficientes. Requeridos: ${permissions.join(', ')}`,
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }

            console.log(`✅ Permisos validados: ${req.user.usuario} - Permisos: ${permissions.join(', ')}`);
            next();
        };
    }

    // Middleware para validar cualquier permiso (OR)
    requireAnyPermission(requiredPermissions) {
        const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida',
                    code: 'AUTH_REQUIRED'
                });
            }

            const hasAnyPermission = authService.hasAnyPermission(req.user.permisos, permissions);

            if (!hasAnyPermission) {
                return res.status(403).json({
                    success: false,
                    message: `Acceso denegado. Requiere al menos uno de: ${permissions.join(', ')}`,
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }

            next();
        };
    }

    // Middleware solo para administradores
    requireAdmin() {
        return this.requireRole('administrador');
    }

    // Middleware solo para vendedores
    requireVendedor() {
        return this.requireRole('vendedor');
    }

    // Middleware para administrador O vendedor
    requireAdminOrVendedor() {
        return this.requireRole(['administrador', 'vendedor']);
    }

    // Middleware para validar que el usuario puede acceder a sus propios datos
    requireOwnershipOrAdmin(userIdParam = 'id') {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida',
                    code: 'AUTH_REQUIRED'
                });
            }

            // Si es administrador, permitir acceso
            if (authService.hasRole(req.user.rol_nombre, 'administrador')) {
                return next();
            }

            // Verificar que el usuario accede a sus propios datos
            const requestedUserId = parseInt(req.params[userIdParam]);
            if (req.user.id !== requestedUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado. Solo puede acceder a sus propios datos',
                    code: 'OWNERSHIP_REQUIRED'
                });
            }

            next();
        };
    }

    // Middleware para logging de actividad
    logActivity() {
        return (req, res, next) => {
            if (req.user) {
                console.log(`📊 Actividad: ${req.user.usuario} - ${req.method} ${req.path} - IP: ${req.ip}`);
            }
            next();
        };
    }

    // Middleware para validar que el token no esté en blacklist
    checkTokenBlacklist() {
        return (req, res, next) => {
            if (req.user && req.user.token) {
                // El authService.verifyToken ya verifica la blacklist
                // Este middleware es redundante pero útil para logging
                console.log(`🔍 Token verificado: ${req.user.usuario}`);
            }
            next();
        };
    }

    // Combinador de middlewares para uso común
    // Ejemplo: authMiddleware.protect(['administrador'], ['farmacia_write'])
    protect(roles = null, permissions = null) {
        const middlewares = [this.authenticate()];

        if (roles) {
            middlewares.push(this.requireRole(roles));
        }

        if (permissions) {
            middlewares.push(this.requirePermission(permissions));
        }

        return middlewares;
    }

    // Middleware para endpoints públicos pero con logging opcional
    public() {
        return [
            this.optionalAuth(),
            this.logActivity()
        ];
    }

    // Middleware para rutas que requieren solo autenticación
    authenticated() {
        return [
            this.authenticate(),
            this.logActivity()
        ];
    }

    // Middleware para rutas de administrador
    admin() {
        return [
            this.authenticate(),
            this.requireAdmin(),
            this.logActivity()
        ];
    }

    // Middleware para rutas de vendedor o admin
    seller() {
        return [
            this.authenticate(),
            this.requireAdminOrVendedor(),
            this.logActivity()
        ];
    }
}

// Exportar instancia única del middleware
module.exports = new AuthMiddleware();