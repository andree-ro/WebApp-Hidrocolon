// src/middleware/authMiddleware.js
// VERSIÓN ULTRA SIMPLE - Sin dependencia de validators complejos

const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthMiddleware {
    constructor() {
        console.log('🛡️ AuthMiddleware inicializado');
    }

    // Middleware principal - Verificar token JWT (VERSIÓN SIMPLE)
    authenticate() {
        return async (req, res, next) => {
            try {
                // 1. Obtener header de autorización
                const authHeader = req.headers.authorization;
                
                if (!authHeader) {
                    return res.status(401).json({
                        success: false,
                        message: 'Token de autorización requerido',
                        code: 'AUTH_REQUIRED'
                    });
                }

                // 2. Verificar formato "Bearer token"
                if (!authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({
                        success: false,
                        message: 'Formato de autorización inválido. Use: Bearer <token>',
                        code: 'INVALID_FORMAT'
                    });
                }

                // 3. Extraer token
                const token = authHeader.substring(7);
                
                if (!token) {
                    return res.status(401).json({
                        success: false,
                        message: 'Token no proporcionado',
                        code: 'NO_TOKEN'
                    });
                }

                // 4. Verificar token con JWT
                const decoded = jwt.verify(
                    token,
                    process.env.JWT_SECRET || 'hidrocolon-secret-key'
                );

                // 5. Verificar que el usuario aún existe y está activo
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

                // 6. Agregar información del usuario al request
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

                // 7. Log de acceso exitoso
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

    // Middleware para validar roles específicos (SIMPLE)
    requireRole(requiredRoles) {
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida',
                    code: 'AUTH_REQUIRED'
                });
            }

            const hasRole = roles.some(role => 
                req.user.rol_nombre.toLowerCase() === role.toLowerCase()
            );

            if (!hasRole) {
                return res.status(403).json({
                    success: false,
                    message: `Acceso denegado. Roles requeridos: ${roles.join(', ')}`,
                    code: 'INSUFFICIENT_ROLE'
                });
            }

            console.log(`✅ Acceso autorizado: ${req.user.usuario} (${req.user.rol_nombre})`);
            next();
        };
    }

    // Middleware solo para administradores
    requireAdmin() {
        return this.requireRole('administrador');
    }

    // Middleware para administrador O vendedor
    requireAdminOrVendedor() {
        return this.requireRole(['administrador', 'vendedor']);
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

    // Combinador de middlewares para uso común
    protect(roles = null) {
        const middlewares = [this.authenticate()];

        if (roles) {
            middlewares.push(this.requireRole(roles));
        }

        return middlewares;
    }

    // Middleware para rutas que requieren solo autenticación
    authenticated() {
        return [this.authenticate(), this.logActivity()];
    }

    // Middleware para rutas de administrador
    admin() {
        return [this.authenticate(), this.requireAdmin(), this.logActivity()];
    }

    // Middleware para rutas de vendedor o admin
    seller() {
        return [this.authenticate(), this.requireAdminOrVendedor(), this.logActivity()];
    }
}

// Exportar instancia única del middleware
const authMiddleware = new AuthMiddleware();

// Exportar funciones helper individuales para uso en rutas
module.exports = authMiddleware;
module.exports.verifyToken = authMiddleware.authenticate();
module.exports.isAdmin = authMiddleware.requireAdmin();