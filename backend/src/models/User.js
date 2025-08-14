// src/models/User.js
// Modelo para gestión de usuarios del Sistema Hidrocolon
// Conecta con tabla 'usuarios' existente en MySQL

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

class User {
    constructor() {
        // Configuración de conexión desde variables de entorno
        this.dbConfig = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            charset: 'utf8mb4',
            timezone: 'Z',
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true
        };
    }

    // Crear conexión a la base de datos
    async getConnection() {
        try {
            const connection = await mysql.createConnection(this.dbConfig);
            return connection;
        } catch (error) {
            console.error('❌ Error conectando a la base de datos:', error.message);
            throw new Error('Error de conexión a la base de datos');
        }
    }

    // Buscar usuario por email/usuario con información de rol
    async findByEmail(usuario) {
        const connection = await this.getConnection();
        try {
            const query = `
                SELECT 
                    u.id,
                    u.usuario,
                    u.password_hash,
                    u.rol_id,
                    u.nombres,
                    u.apellidos,
                    u.activo,
                    u.ultimo_login,
                    u.fecha_creacion,
                    u.fecha_actualizacion,
                    r.nombre as rol_nombre,
                    r.descripcion as rol_descripcion,
                    r.permisos as rol_permisos
                FROM usuarios u
                INNER JOIN roles r ON u.rol_id = r.id
                WHERE u.usuario = ? AND u.activo = 1 AND r.activo = 1
            `;
            
            const [rows] = await connection.execute(query, [usuario]);
            
            if (rows.length === 0) {
                return null;
            }

            const user = rows[0];
            // Parsear permisos JSON si existen
            if (user.rol_permisos) {
                try {
                    user.rol_permisos = JSON.parse(user.rol_permisos);
                } catch (e) {
                    user.rol_permisos = {};
                }
            }

            return user;
        } catch (error) {
            console.error('❌ Error buscando usuario:', error.message);
            throw new Error('Error buscando usuario en la base de datos');
        } finally {
            await connection.end();
        }
    }

    // Buscar usuario por ID
    async findById(id) {
        const connection = await this.getConnection();
        try {
            const query = `
                SELECT 
                    u.id,
                    u.usuario,
                    u.rol_id,
                    u.nombres,
                    u.apellidos,
                    u.activo,
                    u.ultimo_login,
                    u.fecha_creacion,
                    r.nombre as rol_nombre,
                    r.descripcion as rol_descripcion,
                    r.permisos as rol_permisos
                FROM usuarios u
                INNER JOIN roles r ON u.rol_id = r.id
                WHERE u.id = ? AND u.activo = 1 AND r.activo = 1
            `;
            
            const [rows] = await connection.execute(query, [id]);
            
            if (rows.length === 0) {
                return null;
            }

            const user = rows[0];
            // Parsear permisos JSON
            if (user.rol_permisos) {
                try {
                    user.rol_permisos = JSON.parse(user.rol_permisos);
                } catch (e) {
                    user.rol_permisos = {};
                }
            }

            return user;
        } catch (error) {
            console.error('❌ Error buscando usuario por ID:', error.message);
            throw new Error('Error buscando usuario por ID');
        } finally {
            await connection.end();
        }
    }

    // Validar contraseña
    async validatePassword(plainPassword, hashedPassword) {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            console.error('❌ Error validando contraseña:', error.message);
            throw new Error('Error validando contraseña');
        }
    }

    // Hash de contraseña
    async hashPassword(plainPassword) {
        try {
            const saltRounds = 12; // Alta seguridad
            return await bcrypt.hash(plainPassword, saltRounds);
        } catch (error) {
            console.error('❌ Error hasheando contraseña:', error.message);
            throw new Error('Error procesando contraseña');
        }
    }

    // Actualizar último login
    async updateLastLogin(userId) {
        const connection = await this.getConnection();
        try {
            const query = `
                UPDATE usuarios 
                SET ultimo_login = NOW(), 
                    fecha_actualizacion = NOW() 
                WHERE id = ?
            `;
            
            await connection.execute(query, [userId]);
            return true;
        } catch (error) {
            console.error('❌ Error actualizando último login:', error.message);
            throw new Error('Error actualizando último login');
        } finally {
            await connection.end();
        }
    }

    // Crear nuevo usuario (solo para administradores)
    async create(userData) {
        const connection = await this.getConnection();
        try {
            // Validar formato de email
            const emailRegex = /^[a-zA-Z]+[a-zA-Z0-9]*@hidrocolon\.com$/;
            if (!emailRegex.test(userData.usuario)) {
                throw new Error('Formato de usuario inválido. Debe ser [rol][iniciales]@hidrocolon.com');
            }

            // Hash de la contraseña
            const hashedPassword = await this.hashPassword(userData.password);

            const query = `
                INSERT INTO usuarios (
                    usuario, 
                    password_hash, 
                    rol_id, 
                    nombres, 
                    apellidos, 
                    activo, 
                    fecha_creacion, 
                    fecha_actualizacion
                ) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
            `;

            const [result] = await connection.execute(query, [
                userData.usuario,
                hashedPassword,
                userData.rol_id,
                userData.nombres,
                userData.apellidos
            ]);

            return result.insertId;
        } catch (error) {
            console.error('❌ Error creando usuario:', error.message);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('El usuario ya existe');
            }
            throw new Error(`Error creando usuario: ${error.message}`);
        } finally {
            await connection.end();
        }
    }

    // Desactivar usuario (soft delete)
    async deactivate(userId) {
        const connection = await this.getConnection();
        try {
            const query = `
                UPDATE usuarios 
                SET activo = 0, 
                    fecha_actualizacion = NOW() 
                WHERE id = ?
            `;
            
            const [result] = await connection.execute(query, [userId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Error desactivando usuario:', error.message);
            throw new Error('Error desactivando usuario');
        } finally {
            await connection.end();
        }
    }

    // Obtener todos los usuarios activos
    async getAll() {
        const connection = await this.getConnection();
        try {
            const query = `
                SELECT 
                    u.id,
                    u.usuario,
                    u.rol_id,
                    u.nombres,
                    u.apellidos,
                    u.activo,
                    u.ultimo_login,
                    u.fecha_creacion,
                    r.nombre as rol_nombre,
                    r.descripcion as rol_descripcion
                FROM usuarios u
                INNER JOIN roles r ON u.rol_id = r.id
                WHERE u.activo = 1 AND r.activo = 1
                ORDER BY u.fecha_creacion DESC
            `;
            
            const [rows] = await connection.execute(query);
            return rows;
        } catch (error) {
            console.error('❌ Error obteniendo usuarios:', error.message);
            throw new Error('Error obteniendo lista de usuarios');
        } finally {
            await connection.end();
        }
    }

    // Validar permisos del usuario
    hasPermission(userPermissions, requiredPermission) {
        if (!userPermissions || typeof userPermissions !== 'object') {
            return false;
        }
        
        // Si es administrador, tiene todos los permisos
        if (userPermissions.admin === true) {
            return true;
        }
        
        return userPermissions[requiredPermission] === true;
    }

    // Validar formato de usuario
    validateUserFormat(usuario) {
        // Formato: [rol][iniciales]@hidrocolon.com
        const regex = /^[a-zA-Z]+[a-zA-Z0-9]*@hidrocolon\.com$/;
        return regex.test(usuario);
    }
}

module.exports = new User();