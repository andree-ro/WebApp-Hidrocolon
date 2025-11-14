// frontend/src/services/usuariosService.js
// Servicio para gestión de usuarios

import { api } from './authService'

const usuariosService = {
  // Obtener todos los usuarios
  async obtenerTodos() {
    try {
      console.log('📋 Obteniendo lista de usuarios...')
      const response = await api.get('/usuarios')
      console.log('✅ Usuarios obtenidos:', response.data.data.length)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error)
      throw error
    }
  },

  // Obtener usuario por ID
  async obtenerPorId(id) {
    try {
      console.log(`🔍 Obteniendo usuario ${id}...`)
      const response = await api.get(`/usuarios/${id}`)
      console.log('✅ Usuario obtenido:', response.data.data.usuario)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error)
      throw error
    }
  },

  // Crear nuevo usuario
  async crear(usuarioData) {
    try {
      console.log('➕ Creando usuario:', usuarioData.usuario)
      const response = await api.post('/usuarios', usuarioData)
      console.log('✅ Usuario creado:', response.data.data.id)
      return response.data
    } catch (error) {
      console.error('❌ Error creando usuario:', error)
      throw error
    }
  },

  // Actualizar usuario
  async actualizar(id, usuarioData) {
    try {
      console.log(`📝 Actualizando usuario ${id}...`)
      const response = await api.put(`/usuarios/${id}`, usuarioData)
      console.log('✅ Usuario actualizado')
      return response.data
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error)
      throw error
    }
  },

  // Cambiar contraseña
  async cambiarPassword(id, nuevaPassword) {
    try {
      console.log(`🔑 Cambiando contraseña de usuario ${id}...`)
      const response = await api.put(`/usuarios/${id}/password`, {
        nuevaPassword
      })
      console.log('✅ Contraseña actualizada')
      return response.data
    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error)
      throw error
    }
  },

  // Desactivar usuario
  async desactivar(id) {
    try {
      console.log(`🚫 Desactivando usuario ${id}...`)
      const response = await api.delete(`/usuarios/${id}`)
      console.log('✅ Usuario desactivado')
      return response.data
    } catch (error) {
      console.error('❌ Error desactivando usuario:', error)
      throw error
    }
  },

  // Activar usuario
  async activar(id) {
    try {
      console.log(`✅ Activando usuario ${id}...`)
      const response = await api.put(`/usuarios/${id}/activar`)
      console.log('✅ Usuario activado')
      return response.data
    } catch (error) {
      console.error('❌ Error activando usuario:', error)
      throw error
    }
  },

  // Obtener roles disponibles
  async obtenerRoles() {
    try {
      console.log('📋 Obteniendo roles...')
      const response = await api.get('/usuarios/roles')
      console.log('✅ Roles obtenidos:', response.data.data.length)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo roles:', error)
      throw error
    }
  }
}

export default usuariosService