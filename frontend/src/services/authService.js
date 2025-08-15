import axios from 'axios'

// Configuración base de Axios para Vercel
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
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      
      // Redirigir al login si no estamos ya ahí
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// Servicio de autenticación
export const authService = {
  // Login
  async login(usuario, password) {
    try {
      console.log('🔐 Intentando login con:', usuario)
      
      const response = await api.post('/auth/login', {
        usuario,
        password
      })
      
      const { data } = response
      
      // 🔍 DEBUG: Ver estructura completa de la respuesta
      console.log('📦 Respuesta completa del API:', JSON.stringify(data, null, 2))
      
      // Intentar diferentes estructuras posibles
      let userData = null
      let accessToken = null
      let refreshToken = null
      
      // Buscar usuario en diferentes ubicaciones
      if (data.data && data.data.user) {
        userData = data.data.user
        accessToken = data.data.accessToken
        refreshToken = data.data.refreshToken
      } else if (data.user) {
        userData = data.user
        accessToken = data.accessToken
        refreshToken = data.refreshToken
      }
      
      console.log('🔍 Datos extraídos:', {
        userData: userData,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      })
      
      // Guardar tokens si existen
      if (accessToken) {
        localStorage.setItem('access_token', accessToken)
        console.log('💾 Token guardado')
      }
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
        console.log('💾 Refresh token guardado')
      }
      
      // Guardar datos del usuario si existen
      if (userData) {
        localStorage.setItem('user_data', JSON.stringify(userData))
        console.log('💾 Datos de usuario guardados:', userData.nombres || userData.usuario || 'Usuario sin nombre')
      }
      
      // Retornar estructura consistente
      return {
        user: userData,
        accessToken: accessToken,
        refreshToken: refreshToken,
        success: true
      }
      
    } catch (error) {
      console.error('❌ Error en login:', error.response?.data)
      
      // Extraer mensaje de error del backend
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          'Error de conexión con el servidor'
      
      throw new Error(errorMessage)
    }
  },

  // Logout
  async logout() {
    try {
      console.log('🚪 Cerrando sesión...')
      
      // Llamar al endpoint de logout
      await api.post('/auth/logout')
      
    } catch (error) {
      console.error('❌ Error en logout:', error)
    } finally {
      // Limpiar datos locales siempre
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      
      console.log('✅ Sesión cerrada')
    }
  },

  // Verificar si está autenticado
  isAuthenticated() {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user_data')
    return !!(token && userData)
  },

  // Obtener datos del usuario
  getUser() {
    const userData = localStorage.getItem('user_data')
    return userData ? JSON.parse(userData) : null
  },

  // Verificar token actual
  async verifyToken() {
    try {
      const response = await api.get('/auth/verify')
      return response.data
    } catch (error) {
      console.error('❌ Token inválido:', error)
      return null
    }
  },

  // Obtener información actualizada del usuario
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me')
      
      // Actualizar datos locales
      const userData = response.data.user || response.data.usuario || response.data
      localStorage.setItem('user_data', JSON.stringify(userData))
      
      return userData
    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error)
      throw error
    }
  }
}

// Exportar también la instancia de axios configurada
export { api }