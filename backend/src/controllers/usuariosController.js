// src/controllers/usuariosController.js
// Controlador para gestión de usuarios en Sistema Hidrocolon
// Solo accesible por administradores

const User = require('../models/User');
const bcrypt = require('bcryptjs');

class UsuariosController {
    constructor() {
        // Bind de métodos para mantener contexto
        this.obtenerTodos = this.obtenerTodos.bind(this);
        this.obtenerPorId = this.obtenerPorId.bind(this);
        this.crear = this.crear.bind(this);
        this.actualizar = this.actualizar.bind(this);
        this.cambiarPassword = this.cambiarPassword.bind(this);
        this.desactivar = this.desactivar.bind(this);
        this.activar = this.activar.bind(this);
        this.obtenerRoles = this.obtenerRoles.bind(this);
        
        console.log('👥 UsuariosController inicializado');
    }

    // GET /api/usuarios - Obtener todos los usuarios
    async obtenerTodos(req, res) {
        try {
            console.log('📋 Obteniendo lista de usuarios...');
            
            const usuarios = await User.getAll();
            
            return res.status(200).json({
                success: true,
                message: 'Usuarios obtenidos correctamente',
                data: usuarios
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo usuarios:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener usuarios',
                error: error.message
            });
        }
    }

    // GET /api/usuarios/:id - Obtener usuario por ID
    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`🔍 Buscando usuario con ID: ${id}`);
            
            const usuario = await User.findById(id);
            
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            
            return res.status(200).json({
                success: true,
                message: 'Usuario encontrado',
                data: usuario
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener usuario',
                error: error.message
            });
        }
    }

    // POST /api/usuarios - Crear nuevo usuario
    async crear(req, res) {
        try {
            const { usuario, password, rol_id, nombres, apellidos } = req.body;
            
            console.log('➕ Creando nuevo usuario:', usuario);
            
            // Validaciones
            if (!usuario || !password || !rol_id || !nombres || !apellidos) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son requeridos'
                });
            }

            // Validar formato de usuario
            const emailRegex = /^[a-zA-Z]+[a-zA-Z0-9]*@hidrocolon\.com$/;
            if (!emailRegex.test(usuario)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de usuario inválido. Debe ser [nombre]@hidrocolon.com'
                });
            }

            // Validar longitud de contraseña
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            // Validar que el rol existe
            if (rol_id !== 1 && rol_id !== 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Rol inválido. Use 1 para Administrador o 2 para Vendedor'
                });
            }

            // Crear usuario
            const nuevoUsuarioId = await User.create({
                usuario: usuario.toLowerCase().trim(),
                password,
                rol_id,
                nombres: nombres.trim(),
                apellidos: apellidos.trim()
            });

            console.log('✅ Usuario creado con ID:', nuevoUsuarioId);

            // Obtener el usuario creado
            const usuarioCreado = await User.findById(nuevoUsuarioId);

            return res.status(201).json({
                success: true,
                message: 'Usuario creado correctamente',
                data: usuarioCreado
            });
            
        } catch (error) {
            console.error('❌ Error creando usuario:', error);
            
            if (error.message === 'El usuario ya existe') {
                return res.status(409).json({
                    success: false,
                    message: 'El usuario ya existe'
                });
            }
            
            return res.status(500).json({
                success: false,
                message: 'Error al crear usuario',
                error: error.message
            });
        }
    }

    // PUT /api/usuarios/:id - Actualizar usuario
    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { usuario, rol_id, nombres, apellidos, activo } = req.body;
            
            console.log(`📝 Actualizando usuario ID: ${id}`);
            
            // Verificar que el usuario existe
            const usuarioExistente = await User.findById(id);
            if (!usuarioExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Actualizar usuario
            const actualizado = await User.update(id, {
                usuario: usuario?.toLowerCase().trim(),
                rol_id,
                nombres: nombres?.trim(),
                apellidos: apellidos?.trim(),
                activo
            });

            if (!actualizado) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al actualizar usuario'
                });
            }

            // Obtener usuario actualizado
            const usuarioActualizado = await User.findById(id);

            return res.status(200).json({
                success: true,
                message: 'Usuario actualizado correctamente',
                data: usuarioActualizado
            });
            
        } catch (error) {
            console.error('❌ Error actualizando usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar usuario',
                error: error.message
            });
        }
    }

    // PUT /api/usuarios/:id/password - Cambiar contraseña
    async cambiarPassword(req, res) {
        try {
            const { id } = req.params;
            const { nuevaPassword } = req.body;
            
            console.log(`🔑 Cambiando contraseña para usuario ID: ${id}`);
            
            // Validaciones
            if (!nuevaPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva contraseña es requerida'
                });
            }

            if (nuevaPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            // Verificar que el usuario existe
            const usuario = await User.findById(id);
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Cambiar contraseña
            const actualizado = await User.updatePassword(id, nuevaPassword);

            if (!actualizado) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al cambiar contraseña'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Contraseña actualizada correctamente'
            });
            
        } catch (error) {
            console.error('❌ Error cambiando contraseña:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al cambiar contraseña',
                error: error.message
            });
        }
    }

    // DELETE /api/usuarios/:id - Desactivar usuario
    async desactivar(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`🚫 Desactivando usuario ID: ${id}`);
            
            // Verificar que el usuario existe
            const usuario = await User.findById(id);
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // No permitir desactivar al usuario actual
            if (req.user && req.user.id === parseInt(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'No puedes desactivar tu propio usuario'
                });
            }

            // Desactivar usuario
            const desactivado = await User.deactivate(id);

            if (!desactivado) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al desactivar usuario'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Usuario desactivado correctamente'
            });
            
        } catch (error) {
            console.error('❌ Error desactivando usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al desactivar usuario',
                error: error.message
            });
        }
    }

    // PUT /api/usuarios/:id/activar - Activar usuario
    async activar(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`✅ Activando usuario ID: ${id}`);
            
            // Activar usuario
            const activado = await User.activate(id);

            if (!activado) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Usuario activado correctamente'
            });
            
        } catch (error) {
            console.error('❌ Error activando usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al activar usuario',
                error: error.message
            });
        }
    }

    // GET /api/usuarios/roles - Obtener roles disponibles
    async obtenerRoles(req, res) {
        try {
            console.log('📋 Obteniendo roles disponibles...');
            
            const roles = await User.getRoles();
            
            return res.status(200).json({
                success: true,
                message: 'Roles obtenidos correctamente',
                data: roles
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo roles:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener roles',
                error: error.message
            });
        }
    }
}

module.exports = new UsuariosController();