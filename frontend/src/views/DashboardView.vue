<template>
  <div class="layout-container">
    <!-- Mobile Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 sm:px-6 py-3 sm:py-4">
        <div class="flex justify-between items-center">
          <!-- Mobile menu button -->
          <div class="flex items-center">
            <button
              @click="sidebarOpen = !sidebarOpen"
              class="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 class="ml-2 lg:ml-0 text-lg sm:text-2xl font-bold text-gray-900">
              Sistema Hidrocolon
            </h1>
          </div>

          <!-- User info and logout -->
          <div class="flex items-center space-x-2 sm:space-x-4">
            <div class="text-right hidden sm:block">
              <span class="text-sm text-gray-600">Bienvenido,</span>
              <span class="text-sm font-semibold text-gray-900 block sm:inline">
                {{ userDisplayName }}
              </span>
              <div class="text-xs text-gray-500">
                Rol: {{ userRole }}
              </div>
            </div>
            <!-- Mobile user info -->
            <div class="sm:hidden text-right">
              <div class="text-sm font-semibold text-gray-900">{{ userFirstName }}</div>
              <div class="text-xs text-gray-500">{{ userRole }}</div>
            </div>
            <button
              @click="handleLogout"
              class="btn-secondary text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              :disabled="loggingOut"
            >
              {{ loggingOut ? 'Cerrando...' : 'Salir' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="flex relative">
      <!-- Mobile Sidebar Overlay -->
      <div 
        v-if="sidebarOpen" 
        class="fixed inset-0 z-40 lg:hidden"
        @click="sidebarOpen = false"
      >
        <div class="absolute inset-0 bg-gray-600 opacity-75"></div>
      </div>

      <!-- Sidebar -->
      <aside 
        :class="[
          'sidebar transform transition-transform duration-200 ease-in-out z-50',
          'fixed lg:static inset-y-0 left-0 w-64',
          'lg:translate-x-0 overflow-y-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        ]"
      >
        <div class="p-4 sm:p-6 h-full">
          <!-- Close button for mobile -->
          <div class="flex justify-between items-center lg:hidden mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Menú</h2>
            <button
              @click="sidebarOpen = false"
              class="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav class="space-y-4 mb-6">
            <div>
              <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Módulos Principales
              </h3>
              <ul class="space-y-1 sm:space-y-2">
                <li>
                  <a href="#" @click="closeMobileSidebar" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                    <span class="text-lg mr-3">💊</span>
                    Farmacia
                  </a>
                </li>
                <li>
                  <a href="#" @click="closeMobileSidebar" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                    <span class="text-lg mr-3">🏥</span>
                    Servicios
                  </a>
                </li>
                <li>
                  <a href="#" @click="closeMobileSidebar" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                    <span class="text-lg mr-3">👥</span>
                    Pacientes
                  </a>
                </li>
                <li>
                  <a href="#" @click="closeMobileSidebar" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                    <span class="text-lg mr-3">🛒</span>
                    Carrito
                  </a>
                </li>
                <li>
                  <a href="#" @click="closeMobileSidebar" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                    <span class="text-lg mr-3">💰</span>
                    Financiero
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Sistema
              </h3>
              <ul class="space-y-1 sm:space-y-2">
                <li>
                  <a href="#" @click="closeMobileSidebar" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                    <span class="text-lg mr-3">🔔</span>
                    Notificaciones
                  </a>
                </li>
                <li v-if="isAdmin">
                  <a href="#" @click="closeMobileSidebar" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                    <span class="text-lg mr-3">👤</span>
                    Usuarios
                  </a>
                </li>
                <li v-if="isAdmin">
                  <a href="#" @click="closeMobileSidebar" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                    <span class="text-lg mr-3">📊</span>
                    Bitácora
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          <!-- User Info Card - Hidden on mobile, shown on tablet+ -->
          <div class="mt-6 card hidden md:block">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">Información de Usuario</h4>
            <div class="space-y-2 text-xs">
              <div>
                <span class="text-gray-500">Usuario:</span>
                <div class="font-medium break-all text-xs">{{ user?.usuario }}</div>
              </div>
              <div>
                <span class="text-gray-500">ID:</span>
                <span class="font-medium">{{ user?.id }}</span>
              </div>
              <div>
                <span class="text-gray-500">Último acceso:</span>
                <div class="font-medium text-xs">{{ lastLoginFormatted }}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content flex-1 min-w-0">
        <div class="p-4 sm:p-6">
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-2">
              Dashboard Principal
            </h2>
            <p class="text-gray-600 text-sm sm:text-base">
              Bienvenido al Sistema de Gestión Hidrocolon
            </p>
          </div>

          <!-- Stats Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div class="card p-3 sm:p-6">
              <div class="flex items-center">
                <div class="p-2 bg-primary-100 rounded-lg">
                  <span class="text-xl sm:text-2xl">💊</span>
                </div>
                <div class="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Medicamentos</p>
                  <p class="text-lg sm:text-2xl font-semibold text-gray-900">--</p>
                </div>
              </div>
            </div>

            <div class="card p-3 sm:p-6">
              <div class="flex items-center">
                <div class="p-2 bg-green-100 rounded-lg">
                  <span class="text-xl sm:text-2xl">👥</span>
                </div>
                <div class="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Pacientes</p>
                  <p class="text-lg sm:text-2xl font-semibold text-gray-900">--</p>
                </div>
              </div>
            </div>

            <div class="card p-3 sm:p-6">
              <div class="flex items-center">
                <div class="p-2 bg-yellow-100 rounded-lg">
                  <span class="text-xl sm:text-2xl">💰</span>
                </div>
                <div class="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Ventas Hoy</p>
                  <p class="text-sm sm:text-2xl font-semibold text-gray-900">Q 0.00</p>
                </div>
              </div>
            </div>

            <div class="card p-3 sm:p-6">
              <div class="flex items-center">
                <div class="p-2 bg-red-100 rounded-lg">
                  <span class="text-xl sm:text-2xl">🔔</span>
                </div>
                <div class="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Notificaciones</p>
                  <p class="text-lg sm:text-2xl font-semibold text-gray-900">--</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Acciones Rápidas
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <button class="p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <span class="text-2xl mb-2 block">💊</span>
                <span class="text-xs sm:text-sm font-medium text-gray-700">Gestionar Farmacia</span>
              </button>
              <button class="p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <span class="text-2xl mb-2 block">🛒</span>
                <span class="text-xs sm:text-sm font-medium text-gray-700">Nueva Venta</span>
              </button>
              <button class="p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <span class="text-2xl mb-2 block">👥</span>
                <span class="text-xs sm:text-sm font-medium text-gray-700">Agregar Paciente</span>
              </button>
            </div>
          </div>

          <!-- API Status -->
          <div class="card p-4 sm:p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Estado del Sistema
            </h3>
            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div class="flex items-center">
                <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span class="text-xs sm:text-sm text-gray-600">Frontend Conectado</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span class="text-xs sm:text-sm text-gray-600">API Backend - Railway</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span class="text-xs sm:text-sm text-gray-600">Autenticación JWT</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { authService } from '@/services/authService'

export default {
  name: 'DashboardView',
  data() {
    return {
      user: null,
      loggingOut: false,
      sidebarOpen: false
    }
  },
  computed: {
    userFullName() {
      if (!this.user) return 'Usuario'
      return `${this.user.nombres} ${this.user.apellidos}`.trim() || this.user.usuario
    },
    userDisplayName() {
      if (!this.user) return 'Usuario'
      const fullName = `${this.user.nombres} ${this.user.apellidos}`.trim()
      return fullName || this.user.usuario
    },
    userFirstName() {
      return this.user?.nombres || 'Usuario'
    },
    userRole() {
      return this.user?.rol?.nombre || 'Sin rol'
    },
    isAdmin() {
      return this.user?.rol?.nombre === 'administrador'
    },
    lastLoginFormatted() {
      if (!this.user?.ultimo_login) return 'N/A'
      try {
        const date = new Date(this.user.ultimo_login)
        return date.toLocaleDateString('es-GT', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (error) {
        return 'N/A'
      }
    }
  },
  async mounted() {
    // Verificar autenticación
    if (!authService.isAuthenticated()) {
      console.log('❌ No autenticado, redirigiendo al login...')
      this.$router.push('/login')
      return
    }

    // Cargar datos del usuario
    this.user = authService.getUser()
    console.log('👤 Usuario cargado en dashboard:', this.user)

    // Intentar obtener datos actualizados del usuario
    try {
      const updatedUser = await authService.getCurrentUser()
      this.user = updatedUser
      console.log('🔄 Datos de usuario actualizados')
    } catch (error) {
      console.warn('⚠️ No se pudieron actualizar los datos del usuario:', error.message)
      // No es crítico, usar datos del localStorage
    }

    // Cerrar sidebar en móvil al hacer click en enlaces
    this.setupMobileNavigation()
  },
  methods: {
    async handleLogout() {
      this.loggingOut = true
      
      try {
        console.log('🚪 Cerrando sesión...')
        await authService.logout()
        console.log('✅ Logout exitoso, redirigiendo al login...')
        this.$router.push('/login')
      } catch (error) {
        console.error('❌ Error en logout:', error)
        // Redirigir de todas formas
        this.$router.push('/login')
      } finally {
        this.loggingOut = false
      }
    },
    setupMobileNavigation() {
      // Cerrar sidebar al redimensionar ventana a desktop
      window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
          this.sidebarOpen = false
        }
      })
    },
    closeMobileSidebar() {
      // Cerrar sidebar en móvil al hacer clic en un enlace
      if (window.innerWidth < 1024) {
        this.sidebarOpen = false
      }
    }
  }
}
</script>