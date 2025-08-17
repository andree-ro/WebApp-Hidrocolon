// src/services/authService.js
// VERSIÓN CON LOGS BRUTALES PARA DEBUGGEAR

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.PROD 
    ? 'https://webapp-hidrocolon-production.up.railway.app/api'
    : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('🚀 REQUEST:', config.method.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('❌ REQUEST ERROR:', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    console.log('✅ RESPONSE:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('❌ RESPONSE ERROR:', error.response?.status, error.response?.data)
    
    if (error.response?.status === 401) {
      console.log('🔥 TOKEN EXPIRADO - LIMPIANDO DATOS')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      
      if (window.location.pathname !== '/login') {
        console.log('🔄 REDIRIGIENDO AL LOGIN')
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export const authService = {
  async login(usuario, password) {
    try {
      console.log('🔐 ===== INICIANDO LOGIN =====')
      console.log('👤 Usuario:', usuario)
      
      const response = await api.post('/auth/login', { usuario, password })
      const { data } = response
      
      console.log('📦 ===== RESPUESTA COMPLETA =====')
      console.log(JSON.stringify(data, null, 2))
      
      // Extraer datos
      let userData = null
      let accessToken = null
      let refreshToken = null
      
      if (data.success && data.data) {
        userData = data.data.user
        if (data.data.tokens) {
          accessToken = data.data.tokens.accessToken
          refreshToken = data.data.tokens.refreshToken
        } else {
          accessToken = data.data.accessToken
          refreshToken = data.data.refreshToken
        }
      } else if (data.user) {
        userData = data.user
        accessToken = data.accessToken
        refreshToken = data.refreshToken
      }
      
      console.log('🔍 ===== DATOS EXTRAÍDOS =====')
      console.log('userData:', userData)
      console.log('accessToken length:', accessToken?.length)
      console.log('refreshToken length:', refreshToken?.length)
      
      if (!accessToken) {
        throw new Error('No se recibió token de acceso')
      }
      if (!userData) {
        throw new Error('No se recibieron datos del usuario')
      }
      
      // Guardar en localStorage
      console.log('💾 ===== GUARDANDO EN LOCALSTORAGE =====')
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('user_data', JSON.stringify(userData))
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
      }
      
      // VERIFICACIÓN INMEDIATA BRUTAL
      console.log('🔥 ===== VERIFICACIÓN INMEDIATA =====')
      const tokenGuardado = localStorage.getItem('access_token')
      const userDataGuardado = localStorage.getItem('user_data')
      
      console.log('Token guardado:', !!tokenGuardado, tokenGuardado?.length)
      console.log('UserData guardado:', !!userDataGuardado)
      console.log('isAuthenticated() resultado:', this.isAuthenticated())
      
      if (!this.isAuthenticated()) {
        console.error('🚨 FALLO CRÍTICO: isAuthenticated() = false después del login')
        console.log('localStorage.access_token:', localStorage.getItem('access_token'))
        console.log('localStorage.user_data:', localStorage.getItem('user_data'))
      } else {
        console.log('✅ ÉXITO: isAuthenticated() = true')
      }
      
      return {
        user: userData,
        accessToken: accessToken,
        refreshToken: refreshToken,
        success: true
      }
      
    } catch (error) {
      console.error('❌ ===== ERROR EN LOGIN =====')
      console.error(error)
      
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message ||
                          'Error de conexión'
      throw new Error(errorMessage)
    }
  },

  async logout() {
    try {
      console.log('🚪 ===== LOGOUT =====')
      const token = localStorage.getItem('access_token')
      if (token) {
        await api.post('/auth/logout')
      }
    } catch (error) {
      console.error('❌ Error en logout:', error)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      console.log('🧹 Datos locales limpiados')
    }
  },

  isAuthenticated() {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user_data')
    
    const hasToken = !!token
    const hasUserData = !!userData
    const isAuthenticated = hasToken && hasUserData
    
    console.log('🔍 ===== isAuthenticated() CHECK =====')
    console.log('hasToken:', hasToken, 'length:', token?.length)
    console.log('hasUserData:', hasUserData)
    console.log('resultado final:', isAuthenticated)
    
    // LOG ADICIONAL si está fallando
    if (!isAuthenticated) {
      console.log('❌ FALLÓ isAuthenticated():')
      console.log('  - access_token en localStorage:', localStorage.getItem('access_token'))
      console.log('  - user_data en localStorage:', localStorage.getItem('user_data'))
    }
    
    return isAuthenticated
  },

  getUser() {
    try {
      const userData = localStorage.getItem('user_data')
      if (!userData) {
        console.log('❌ No hay user_data en localStorage')
        return null
      }
      
      const user = JSON.parse(userData)
      console.log('👤 Usuario obtenido:', user.nombres || user.usuario)
      return user
    } catch (error) {
      console.error('❌ Error parseando user_data:', error)
      localStorage.removeItem('user_data')
      return null
    }
  },

  async verifyToken() {
    try {
      const response = await api.get('/auth/verify')
      console.log('✅ Token verificado con servidor')
      return response.data
    } catch (error) {
      console.error('❌ Token inválido:', error.response?.data)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      return null
    }
  },

  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me')
      const userData = response.data.data?.user || response.data.user || response.data
      if (userData) {
        localStorage.setItem('user_data', JSON.stringify(userData))
        console.log('🔄 Datos de usuario actualizados')
      }
      return userData
    } catch (error) {
      console.error('❌ Error obteniendo usuario actual:', error)
      throw error
    }
  }
}

export { api }