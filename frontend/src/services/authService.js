// src/services/authService.js
// VERSIÓN CORREGIDA - Servicio de autenticación con login funcionando
// Arregla el problema de redirección al dashboard

import axios from 'axios'

// Configuración base de Axios para conectar con Railway
const api = axios.create({
  // En producción, conectar directamente con Railway
  baseURL: import.meta.env.PROD 
    ? 'https://webapp-hidrocolon-production.up.railway.app/api'
    : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para requests (agregar token automáticamente)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('🚀 Enviando request:', config.method.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('❌ Error en request:', error)
    return Promise.reject(error)
  }
)

// Interceptor para responses (manejar errores automáticamente)
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response exitoso:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('❌ Error en response:', error.response?.status, error.response?.data)
    
    // Si el token expiró, limpiar localStorage
    if (error.response?.status === 401) {
      console.log('🔒 Token expirado, limpiando datos...')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      
      // Redirigir al login si no estamos ya ahí
      if (window.location.pathname !== '/login') {
        console.log('↩️ Redirigiendo al login...')
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// Servicio de autenticación
const authService = {
  // Login - VERSIÓN CORREGIDA
  async login(usuario, password) {
    try {
      console.log('🔐 Intentando login con:', usuario)
      
      const response = await api.post('/auth/login', {
        usuario,
        password
      })
      
      const { data } = response
      console.log('📦 Respuesta completa del API:', JSON.stringify(data, null, 2))
      
      // Extraer datos de la respuesta
      let userData = null
      let accessToken = null
      let refreshToken = null
      
      // Buscar en diferentes estructuras posibles
      if (data.success && data.data) {
        // Estructura: { success: true, data: { user: {}, tokens: {} } }
        userData = data.data.user
        if (data.data.tokens) {
          accessToken = data.data.tokens.accessToken
          refreshToken = data.data.tokens.refreshToken
        } else {
          // Estructura alternativa: { success: true, data: { user: {}, accessToken: "", refreshToken: "" } }
          accessToken = data.data.accessToken
          refreshToken = data.data.refreshToken
        }
      } else if (data.user) {
        // Estructura directa: { user: {}, accessToken: "", refreshToken: "" }
        userData = data.user
        accessToken = data.accessToken
        refreshToken = data.refreshToken
      }
      
      console.log('🔍 Datos extraídos:', {
        userData: userData ? `${userData.nombres} ${userData.apellidos}` : 'No encontrado',
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        userKeys: userData ? Object.keys(userData) : []
      })
      
      // Validar que tenemos los datos mínimos necesarios
      if (!accessToken) {
        throw new Error('No se recibió token de acceso del servidor')
      }
      
      if (!userData) {
        throw new Error('No se recibieron datos del usuario')
      }
      
      // Guardar datos en localStorage
      localStorage.setItem('access_token', accessToken)
      console.log('💾 Token guardado en localStorage')
      
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
        console.log('💾 Refresh token guardado')
      }
      
      localStorage.setItem('user_data', JSON.stringify(userData))
      console.log('💾 Datos de usuario guardados:', userData.nombres || userData.usuario)
      
      // VERIFICACIÓN INMEDIATA - Asegurar que isAuthenticated() funcione
      const isAuthAfterLogin = this.isAuthenticated()
      console.log('🔍 Verificación post-login - isAuthenticated():', isAuthAfterLogin)
      
      if (!isAuthAfterLogin) {
        throw new Error('Error interno: usuario no queda autenticado después del login')
      }
      
      // Retornar estructura consistente
      return {
        user: userData,
        accessToken: accessToken,
        refreshToken: refreshToken,
        success: true
      }
      
    } catch (error) {
      console.error('❌ Error en login:', error)
      
      // Limpiar cualquier dato parcial
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      
      // Extraer mensaje de error del backend
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message ||
                          'Error de conexión con el servidor'
      
      throw new Error(errorMessage)
    }
  },

  // Logout
  async logout() {
    try {
      console.log('🚪 Cerrando sesión...')
      
      // Llamar al endpoint de logout si tenemos token
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          await api.post('/auth/logout')
          console.log('✅ Logout exitoso en servidor')
        } catch (error) {
          console.warn('⚠️ Error en logout del servidor (continuando):', error.message)
        }
      }
      
    } catch (error) {
      console.error('❌ Error en logout:', error)
    } finally {
      // Limpiar datos locales siempre
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      
      console.log('✅ Sesión cerrada - datos locales limpiados')
    }
  },

  // Verificar si está autenticado - VERSIÓN CORREGIDA
  isAuthenticated() {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user_data')
    
    const hasToken = !!token
    const hasUserData = !!userData
    const isAuthenticated = hasToken && hasUserData
    
    console.log('🔍 Verificando autenticación:', {
      hasToken,
      hasUserData,
      isAuthenticated,
      tokenLength: token ? token.length : 0,
      userDataKeys: userData ? Object.keys(JSON.parse(userData)).join(', ') : 'N/A'
    })
    
    return isAuthenticated
  },

  // Obtener datos del usuario autenticado
  getUser() {
    try {
      const userData = localStorage.getItem('user_data')
      if (!userData) {
        console.log('❌ No hay datos de usuario en localStorage')
        return null
      }
      
      const user = JSON.parse(userData)
      console.log('👤 Usuario obtenido:', user.nombres || user.usuario)
      return user
      
    } catch (error) {
      console.error('❌ Error obteniendo datos de usuario:', error)
      return null
    }
  },

  // Obtener token de acceso actual
  getToken() {
    const token = localStorage.getItem('access_token')
    console.log('🎫 Token obtenido:', token ? 
      `${token.substring(0, 20)}...` : 'No token')
    return token
  },

  // Verificar si el usuario tiene un rol específico
  hasRole(requiredRole) {
    const user = this.getUser()
    if (!user || !user.rol_nombre) return false
    
    const hasRole = user.rol_nombre.toLowerCase() === requiredRole.toLowerCase()
    console.log(`🔑 Verificando rol "${requiredRole}": ${hasRole}`)
    return hasRole
  },

  // Verificar si es administrador
  isAdmin() {
    return this.hasRole('administrador')
  },

  // Verificar si es vendedor
  isVendedor() {
    return this.hasRole('vendedor')
  },

  // Refrescar token de acceso
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('No hay refresh token disponible')
      }
      
      console.log('🔄 Refrescando token de acceso...')
      
      const response = await api.post('/auth/refresh', {
        refreshToken
      })
      
      const newAccessToken = response.data.data?.accessToken || response.data.accessToken
      if (newAccessToken) {
        localStorage.setItem('access_token', newAccessToken)
        console.log('✅ Token de acceso refrescado')
        return newAccessToken
      } else {
        throw new Error('No se recibió nuevo token de acceso')
      }
      
    } catch (error) {
      console.error('❌ Error refrescando token:', error)
      
      // Si no se puede refrescar, limpiar todo y forzar re-login
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      
      throw error
    }
  },

  // Verificar token en el servidor
  async verifyToken() {
    try {
      console.log('🔍 Verificando token en servidor...')
      
      const response = await api.get('/auth/verify')
      
      if (response.data.success) {
        console.log('✅ Token válido en servidor')
        return true
      } else {
        console.log('❌ Token inválido en servidor')
        return false
      }
      
    } catch (error) {
      console.error('❌ Error verificando token:', error)
      
      // Si el token no es válido, limpiar datos
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_data')
      }
      
      return false
    }
  }
}

// ✅ EXPORTACIÓN CORREGIDA - AGREGAR DEFAULT EXPORT
export default authService

// Exportar también la instancia de axios configurada
export { api }