// src/middleware/authMiddleware.js
// Middleware de autenticación para Sistema Hidrocolon
// Protege rutas con JWT y valida permisos/roles

// CAMBIO: Remover import de authService y usar dependencias directas
const jwt = require('jsonwebtoken');
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

                // 2. Verificar token directamente con JWT
                const decoded = jwt.verify(
                    authValidation.token,
                    process.env.JWT_SECRET || 'hidrocolon-secret-key'
                );

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
                console.log(`✅ Auth exitoso: ${user.usuario} (${user.rol_nombre}) - ${req.method} ${req.path}`);

                next();

            } catch (error) {
                console.error('❌ Error en autenticación:', error.message);

                if (error.name === 'JsonWebTokenError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Token inválido',
                        code: 'INVALID_TOKEN'
                    });
                }

                if (error.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Token expirado',
                        code: 'TOKEN_EXPIRED'
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: 'Error interno de autenticación',
                    code: 'AUTH_ERROR'
                });
            }
        };
    }

    // Middleware opcional - No requiere autenticación pero agrega info si está disponible
    optionalAuth() {
        return async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    req.user = null;
                    return next();
                }

                const token = authHeader.substring(7);
                const decoded = jwt.verify(
                    token,
                    process.env.JWT_SECRET || 'hidrocolon-secret-key'
                );

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
                        token: token
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
                this.hasRole(req.user.rol_nombre, role)
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
            const hasPermissions = this.hasAllPermissions(req.user.permisos, permissions);

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

            const hasAnyPermission = this.hasAnyPermission(req.user.permisos, permissions);

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
            if (this.hasRole(req.user.rol_nombre, 'administrador')) {
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
                // TODO: Implementar blacklist si es necesario
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

    // =====================================
    // UTILIDADES INTERNAS
    // =====================================

    // Verificar si el usuario tiene un rol específico
    hasRole(userRole, requiredRole) {
        if (!userRole || !requiredRole) return false;
        return userRole.toLowerCase() === requiredRole.toLowerCase();
    }

    // Verificar si el usuario tiene todos los permisos requeridos
    hasAllPermissions(userPermissions, requiredPermissions) {
        if (!userPermissions || !requiredPermissions) return false;
        if (!Array.isArray(requiredPermissions)) requiredPermissions = [requiredPermissions];
        
        return requiredPermissions.every(permission => 
            userPermissions[permission] === true
        );
    }

    // Verificar si el usuario tiene alguno de los permisos requeridos
    hasAnyPermission(userPermissions, requiredPermissions) {
        if (!userPermissions || !requiredPermissions) return false;
        if (!Array.isArray(requiredPermissions)) requiredPermissions = [requiredPermissions];
        
        return requiredPermissions.some(permission => 
            userPermissions[permission] === true
        );
    }
}

// Exportar instancia única del middleware
module.exports = new AuthMiddleware();