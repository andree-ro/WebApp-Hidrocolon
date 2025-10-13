// src/services/authService.js
// VERSIÓN CORREGIDA - Solución para error 405

import axios from 'axios'

// Detectar el entorno y configurar la URL base correctamente
const getBaseURL = () => {
  // Si estamos en producción (Vercel), usar Railway directamente
  if (import.meta.env.PROD) {
    return 'https://webapp-hidrocolon-production.up.railway.app/api'
  }
  
  // Si estamos en desarrollo local
  if (import.meta.env.DEV) {
    // Intentar usar proxy primero, si falla usar Railway directamente
    return window.location.hostname === 'localhost' 
      ? 'https://webapp-hidrocolon-production.up.railway.app/api'  // Cambio aquí
      : '/api'
  }
  
  return '/api'
}

// Configuración base de Axios
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,  // Aumentar timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false  // Agregar esto para CORS
})

console.log('🌐 API Base URL configurada:', api.defaults.baseURL)

// Interceptor para requests (agregar token automáticamente)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    console.log('🚀 Enviando request:', {
      method: config.method.toUpperCase(), 
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers
    })
    
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
    console.error('❌ Error en response:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    })
    
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
      console.log('🌐 URL de login:', `${api.defaults.baseURL}/auth/login`)
      
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

  // Resto de métodos iguales...
  async logout() {
    try {
      console.log('🚪 Cerrando sesión...')
      
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
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      
      console.log('✅ Sesión cerrada - datos locales limpiados')
    }
  },

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

  getToken() {
    const token = localStorage.getItem('access_token')
    console.log('🎫 Token obtenido:', token ? 
      `${token.substring(0, 20)}...` : 'No token')
    return token
  },

  hasRole(requiredRole) {
    const user = this.getUser()
    if (!user || !user.rol_nombre) return false
    
    const hasRole = user.rol_nombre.toLowerCase() === requiredRole.toLowerCase()
    console.log(`🔒 Verificando rol "${requiredRole}": ${hasRole}`)
    return hasRole
  },

  isAdmin() {
    return this.hasRole('administrador')
  },

  isVendedor() {
    return this.hasRole('vendedor')
  },

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
      
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      
      throw error
    }
  },

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
      
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_data')
      }
      
      return false
    }
  },

  async verificarPasswordAdmin(password) {
    try {
      if (!password || password.trim().length === 0) {
        return {
          success: false,
          message: 'Contraseña es requerida'
        }
      }

      console.log('🔐 Verificando contraseña de administrador...')
      
      const response = await api.post('/auth/verificar-password', {
        password: password.trim()
      })
      
      if (response.data.success) {
        console.log('✅ Contraseña de administrador verificada')
        console.log('👤 Admin verificado:', response.data.data?.admin_verificado)
        return {
          success: true,
          message: response.data.message,
          data: response.data.data
        }
      } else {
        console.log('❌ Contraseña incorrecta')
        return {
          success: false,
          message: response.data.message
        }
      }
      
    } catch (error) {
      console.error('❌ Error verificando contraseña admin:', error)
      
      // Manejar errores específicos
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Contraseña incorrecta'
        }
      } else if (error.response?.status === 400) {
        return {
          success: false,
          message: error.response.data?.message || 'Datos inválidos'
        }
      }
      
      return {
        success: false,
        message: 'Error al verificar contraseña. Intente nuevamente'
      }
    }
  }
}

export default authService
export { api }