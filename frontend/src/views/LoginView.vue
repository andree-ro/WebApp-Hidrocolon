<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Sistema Hidrocolon
        </h1>
        <p class="text-gray-600">
          Ingresa tus credenciales para acceder
        </p>
      </div>

      <!-- Login Form -->
      <div class="card">
        <form class="space-y-6" @submit.prevent="handleLogin">
          <!-- Usuario -->
          <div>
            <label for="usuario" class="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <input
              id="usuario"
              v-model="form.usuario"
              type="email"
              required
              class="input-base"
              placeholder="[rol][iniciales]@hidrocolon.com"
              :disabled="loading"
            />
            <p class="mt-1 text-xs text-gray-500">
              Formato: admin@hidrocolon.com
            </p>
          </div>

          <!-- Contraseña -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="input-base"
              placeholder="Ingresa tu contraseña"
              :disabled="loading"
            />
          </div>

          <!-- Error Message -->
          <div v-if="error" class="alert-error">
            {{ error }}
          </div>

          <!-- Success Message -->
          <div v-if="success" class="alert-success">
            {{ success }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn-primary w-full flex justify-center items-center"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner mr-2"></span>
            {{ loading ? 'Conectando con Railway...' : 'Iniciar Sesión' }}
          </button>

          <!-- Forgot Password -->
          <div class="text-center">
            <button
              type="button"
              class="text-sm text-primary-600 hover:text-primary-800"
              @click="showForgotPassword"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <!-- API Status -->
          <div class="text-center">
            <div class="flex items-center justify-center space-x-2 text-xs">
              <div :class="apiStatus.connected ? 'bg-green-500' : 'bg-yellow-500'" class="w-2 h-2 rounded-full"></div>
              <span :class="apiStatus.connected ? 'text-green-600' : 'text-yellow-600'">
                {{ apiStatus.message }}
              </span>
            </div>
          </div>

          <!-- Debug button -->
          <div class="text-center">
            <button
              type="button"
              @click="goToDashboard"
              class="text-xs text-gray-500 hover:text-gray-700"
            >
              🔧 Ir directamente al Dashboard
            </button>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="text-center text-xs text-gray-500">
        Sistema Hidrocolon v1.0 - Guatemala<br>
        <span class="text-primary-600">Conectado a Railway</span>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Recuperar Contraseña</h3>
        <p class="text-gray-600 mb-4">
          Por favor contacta al encargado del sistema para recuperar tu contraseña.
        </p>
        <button
          @click="showModal = false"
          class="btn-primary w-full"
        >
          Entendido
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { authService } from '@/services/authService'

export default {
  name: 'LoginView',
  data() {
    return {
      form: {
        usuario: 'admin@hidrocolon.com', // Pre-llenado para testing
        password: ''
      },
      loading: false,
      error: null,
      success: null,
      showModal: false,
      apiStatus: {
        connected: false,
        message: 'Verificando conexión...'
      }
    }
  },
  async mounted() {
    console.log('🔄 LoginView montado, verificando estado...')
    
    // Verificar conexión con API al cargar
    await this.checkApiConnection()
    
    // Si ya está autenticado, redirigir al dashboard
    if (authService.isAuthenticated()) {
      console.log('👤 Usuario ya autenticado, redirigiendo...')
      await this.redirectToDashboard()
    }
  },
  methods: {
    async checkApiConnection() {
      try {
        console.log('🔍 Verificando conexión con Railway...')
        
        // Hacer una petición simple - usar endpoint que sabemos que existe
        const response = await fetch('/api/auth/verify', { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        // Incluso si da 401 (no autorizado), significa que el server responde
        if (response.status === 401 || response.status === 200) {
          this.apiStatus = {
            connected: true,
            message: 'Conectado a Railway'
          }
          console.log('✅ Conexión con Railway exitosa')
        } else {
          throw new Error('Health check failed')
        }
      } catch (error) {
        this.apiStatus = {
          connected: false,
          message: 'Conectando...'
        }
        console.warn('⚠️ Error conectando con Railway:', error)
        // No es crítico, aún se puede intentar login
      }
    },

    async redirectToDashboard() {
      try {
        console.log('🚀 Intentando redirección al dashboard...')
        
        // Método 1: Router push
        await this.$router.push('/dashboard')
        console.log('✅ Redirección con router exitosa')
        
      } catch (error) {
        console.warn('⚠️ Router push falló, intentando redirección forzada:', error)
        
        // Método 2: Redirección forzada
        window.location.href = '/dashboard'
      }
    },

    // Método de debug para ir directamente al dashboard
    goToDashboard() {
      console.log('🔧 Redirección manual al dashboard...')
      this.$router.push('/dashboard').catch(() => {
        window.location.href = '/dashboard'
      })
    },

    async handleLogin() {
      this.loading = true
      this.error = null
      this.success = null

      try {
        console.log('🔐 Iniciando login con API real...')
        
        // Usar el servicio de autenticación
        const response = await authService.login(this.form.usuario, this.form.password)
        
        this.success = `¡Bienvenido ${response.user?.nombres || 'Usuario'}!`
        
        console.log('✅ Login exitoso, redirigiendo al dashboard...')
        console.log('🔍 Response completo:', response)
        
        // Esperar un poco para mostrar mensaje de éxito
        setTimeout(async () => {
          await this.redirectToDashboard()
        }, 800)
        
      } catch (error) {
        console.error('❌ Error en login:', error.message)
        this.error = error.message
        
        // Limpiar campos en caso de error
        this.form.password = ''
      } finally {
        this.loading = false
      }
    },

    showForgotPassword() {
      this.showModal = true
    }
  }
}
</script>