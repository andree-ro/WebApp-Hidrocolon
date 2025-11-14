// src/routes/usuarios.js
// Rutas para gestión de usuarios
// Solo accesible por administradores

const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN Y SER ADMIN
// ============================================

// Middleware para verificar que el usuario es administrador en todas las rutas
router.use(verifyToken);
router.use(isAdmin);

// ============================================
// RUTAS DE USUARIOS
// ============================================

// GET /api/usuarios/roles - Obtener roles disponibles
router.get('/roles', usuariosController.obtenerRoles);

// GET /api/usuarios - Obtener todos los usuarios
router.get('/', usuariosController.obtenerTodos);

// GET /api/usuarios/:id - Obtener usuario por ID
router.get('/:id', usuariosController.obtenerPorId);

// POST /api/usuarios - Crear nuevo usuario
router.post('/', usuariosController.crear);

// PUT /api/usuarios/:id - Actualizar usuario
router.put('/:id', usuariosController.actualizar);

// PUT /api/usuarios/:id/password - Cambiar contraseña
router.put('/:id/password', usuariosController.cambiarPassword);

// PUT /api/usuarios/:id/activar - Activar usuario
router.put('/:id/activar', usuariosController.activar);

// DELETE /api/usuarios/:id - Desactivar usuario (soft delete)
router.delete('/:id', usuariosController.desactivar);

module.exports = router;