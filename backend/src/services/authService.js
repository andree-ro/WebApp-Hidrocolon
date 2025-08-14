// src/services/authService.js
// Servicio de autenticación JWT para Sistema Hidrocolon
// Maneja login, logout, generación de tokens y validaciones

const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
    constructor() {
        // Configuración JWT desde variables de entorno
        this.jwtSecret = process.env.JWT_SECRET || 'hidrocolon_jwt_secret_super_seguro_2025';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
        this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
        
        // Lista negra de tokens (en memoria - en producción usar Redis)
        this.tokenBlacklist = new Set();
        
        console.log('🔐 AuthService inicializado');
    }

    // Generar token JWT con información del usuario
    generateToken(user) {
        try {
            const payload = {
                id: user.id,
                usuario: user.usuario,
                rol_id: user.rol_id,
                rol_nombre: user.rol_nombre,
                nombres: user.nombres,
                apellidos: user.apellidos,
                permisos: user.rol_permisos || {},
                iat: Math.floor(Date.now() / 1000) // Issued at timestamp
            };

            const token = jwt.sign(payload, this.jwtSecret, {
                expiresIn: this.jwtExpiresIn,
                issuer: 'hidrocolon-system',
                audience: 'hidrocolon-users'
            });

            return {
                token,
                expiresIn: this.jwtExpiresIn,
                tokenType: 'Bearer'
            };
        } catch (error) {
            console.error('❌ Error generando token JWT:', error.message);
            throw new Error('Error generando token de autenticación');
        }
    }

    // Generar refresh token
    generateRefreshToken(user) {
        try {
            const payload = {
                id: user.id,
                usuario: user.usuario,
                type: 'refresh',
                iat: Math.floor(Date.now() / 1000)
            };

            const refreshToken = jwt.sign(payload, this.jwtSecret, {
                expiresIn: this.jwtRefreshExpiresIn,
                issuer: 'hidrocolon-system',
                audience: 'hidrocolon-refresh'
            });

            return refreshToken;
        } catch (error) {
            console.error('❌ Error generando refresh token:', error.message);
            throw new Error('Error generando refresh token');
        }
    }

    // Verificar y decodificar token JWT
    verifyToken(token) {
        try {
            // Verificar si el token está en la lista negra
            if (this.tokenBlacklist.has(token)) {
                throw new Error('Token invalidado');
            }

            const decoded = jwt.verify(token, this.jwtSecret, {
                issuer: 'hidrocolon-system',
                audience: 'hidrocolon-users'
            });

            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expirado');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Token inválido');
            } else if (error.name === 'NotBeforeError') {
                throw new Error('Token no válido aún');
            } else {
                console.error('❌ Error verificando token:', error.message);
                throw new Error('Error verificando token');
            }
        }
    }

    // Verificar refresh token
    verifyRefreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, this.jwtSecret, {
                issuer: 'hidrocolon-system',
                audience: 'hidrocolon-refresh'
            });

            if (decoded.type !== 'refresh') {
                throw new Error('Token de refresh inválido');
            }

            return decoded;
        } catch (error) {
            console.error('❌ Error verificando refresh token:', error.message);
            throw new Error('Refresh token inválido o expirado');
        }
    }

    // Proceso completo de login
    async login(usuario, password) {
        try {
            // 1. Validar formato de usuario
            if (!User.validateUserFormat(usuario)) {
                throw new Error('Formato de usuario inválido. Use: [rol][iniciales]@hidrocolon.com');
            }

            // 2. Buscar usuario en la base de datos
            const user = await User.findByEmail(usuario);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // 3. Verificar que el usuario esté activo
            if (!user.activo) {
                throw new Error('Usuario desactivado. Contacte al administrador');
            }

            // 4. Validar contraseña
            const isPasswordValid = await User.validatePassword(password, user.password_hash);
            if (!isPasswordValid) {
                throw new Error('Contraseña incorrecta');
            }

            // 5. Actualizar último login
            await User.updateLastLogin(user.id);

            // 6. Generar tokens
            const tokenData = this.generateToken(user);
            const refreshToken = this.generateRefreshToken(user);

            // 7. Preparar datos de respuesta (sin contraseña)
            const userData = {
                id: user.id,
                usuario: user.usuario,
                nombres: user.nombres,
                apellidos: user.apellidos,
                rol: {
                    id: user.rol_id,
                    nombre: user.rol_nombre,
                    descripcion: user.rol_descripcion,
                    permisos: user.rol_permisos
                },
                ultimo_login: new Date().toISOString()
            };

            console.log(`✅ Login exitoso para usuario: ${usuario}`);

            return {
                user: userData,
                accessToken: tokenData.token,
                refreshToken: refreshToken,
                expiresIn: tokenData.expiresIn,
                tokenType: tokenData.tokenType
            };

        } catch (error) {
            console.error(`❌ Error en login para usuario ${usuario}:`, error.message);
            throw error;
        }
    }

    // Proceso de logout
    async logout(token) {
        try {
            // Agregar token a la lista negra
            this.tokenBlacklist.add(token);
            
            console.log('✅ Logout exitoso - Token invalidado');
            return { message: 'Logout exitoso' };
        } catch (error) {
            console.error('❌ Error en logout:', error.message);
            throw new Error('Error cerrando sesión');
        }
    }

    // Refrescar token de acceso
    async refreshAccessToken(refreshToken) {
        try {
            // 1. Verificar refresh token
            const decoded = this.verifyRefreshToken(refreshToken);

            // 2. Buscar usuario actualizado
            const user = await User.findById(decoded.id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            if (!user.activo) {
                throw new Error('Usuario desactivado');
            }

            // 3. Generar nuevo access token
            const tokenData = this.generateToken(user);

            console.log(`✅ Token refrescado para usuario ID: ${user.id}`);

            return {
                accessToken: tokenData.token,
                expiresIn: tokenData.expiresIn,
                tokenType: tokenData.tokenType
            };

        } catch (error) {
            console.error('❌ Error refrescando token:', error.message);
            throw error;
        }
    }

    // Validar permisos específicos
    hasPermission(userPermissions, requiredPermission) {
        if (!userPermissions || typeof userPermissions !== 'object') {
            return false;
        }

        // Si es administrador, tiene todos los permisos
        if (userPermissions.admin === true) {
            return true;
        }

        // Verificar permiso específico
        return userPermissions[requiredPermission] === true;
    }

    // Validar múltiples permisos (AND)
    hasAllPermissions(userPermissions, requiredPermissions) {
        if (!Array.isArray(requiredPermissions)) {
            return this.hasPermission(userPermissions, requiredPermissions);
        }

        return requiredPermissions.every(permission => 
            this.hasPermission(userPermissions, permission)
        );
    }

    // Validar al menos uno de los permisos (OR)
    hasAnyPermission(userPermissions, requiredPermissions) {
        if (!Array.isArray(requiredPermissions)) {
            return this.hasPermission(userPermissions, requiredPermissions);
        }

        return requiredPermissions.some(permission => 
            this.hasPermission(userPermissions, permission)
        );
    }

    // Validar si el usuario tiene un rol específico
    hasRole(userRoleName, requiredRole) {
        return userRoleName === requiredRole;
    }

    // Obtener información del token sin verificar expiración (para debugging)
    decodeToken(token) {
        try {
            return jwt.decode(token, { complete: true });
        } catch (error) {
            console.error('❌ Error decodificando token:', error.message);
            return null;
        }
    }

    // Limpiar tokens expirados de la lista negra (ejecutar periódicamente)
    cleanExpiredTokens() {
        const now = Math.floor(Date.now() / 1000);
        const tokensToRemove = [];

        for (const token of this.tokenBlacklist) {
            try {
                const decoded = jwt.decode(token);
                if (decoded && decoded.exp && decoded.exp < now) {
                    tokensToRemove.push(token);
                }
            } catch (error) {
                // Token malformado, remover
                tokensToRemove.push(token);
            }
        }

        tokensToRemove.forEach(token => this.tokenBlacklist.delete(token));
        
        if (tokensToRemove.length > 0) {
            console.log(`🧹 Limpieza: ${tokensToRemove.length} tokens expirados removidos`);
        }
    }

    // Obtener estadísticas del servicio de autenticación
    getStats() {
        return {
            blacklistedTokens: this.tokenBlacklist.size,
            jwtExpiresIn: this.jwtExpiresIn,
            refreshExpiresIn: this.jwtRefreshExpiresIn,
            uptime: process.uptime()
        };
    }
}

// Crear instancia única del servicio (Singleton)
const authService = new AuthService();

// Limpiar tokens expirados cada 6 horas
setInterval(() => {
    authService.cleanExpiredTokens();
}, 6 * 60 * 60 * 1000);

module.exports = authService;