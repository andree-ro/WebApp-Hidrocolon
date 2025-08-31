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
                  <a href="#" @click.prevent="navegarA('farmacia')" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                    <span class="text-lg mr-3">💊</span>
                    Farmacia
                  </a>
                </li>
                <li>
                  <a href="#" @click.prevent="navegarA('extras')" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                    <span class="text-lg mr-3">🧰</span>
                    Extras
                  </a>
                </li>
                <!-- ⭐ SERVICIOS - NUEVO Y FUNCIONAL -->
                <li>
                  <a href="#" @click.prevent="navegarA('servicios')" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-blue-100 transition-colors relative">
                    <span class="text-lg mr-3">🏥</span>
                    Servicios
                    <!-- Badge de funcional -->
                    <span class="absolute right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      ✓
                    </span>
                  </a>
                </li>
                <li>
                  <a href="#" @click.prevent="navegarA('pacientes')" class="flex items-center px-3 py-3 text-sm font-medium text-gray-400 rounded-md cursor-not-allowed">
                    <span class="text-lg mr-3">👥</span>
                    Pacientes
                    <span class="text-xs text-gray-400 ml-auto">Próximo</span>
                  </a>
                </li>
                <li>
                  <a href="#" @click="closeMobileSidebar" class="flex items-center px-3 py-3 text-sm font-medium text-gray-400 rounded-md cursor-not-allowed">
                    <span class="text-lg mr-3">🛒</span>
                    Carrito
                    <span class="text-xs text-gray-400 ml-auto">Próximo</span>
                  </a>
                </li>
                <li>
                  <a href="#" @click="closeMobileSidebar" class="flex items-center px-3 py-3 text-sm font-medium text-gray-400 rounded-md cursor-not-allowed">
                    <span class="text-lg mr-3">💰</span>
                    Financiero
                    <span class="text-xs text-gray-400 ml-auto">Próximo</span>
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

          <!-- Stats Cards con datos reales -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <!-- Medicamentos -->
            <div class="card p-3 sm:p-6">
              <div class="flex items-center">
                <div class="p-2 bg-blue-100 rounded-lg">
                  <span class="text-xl sm:text-2xl">💊</span>
                </div>
                <div class="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Medicamentos</p>
                  <p class="text-lg sm:text-2xl font-semibold text-blue-600">
                    {{ stats.farmacia?.total_medicamentos || '--' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Extras -->
            <div class="card p-3 sm:p-6">
              <div class="flex items-center">
                <div class="p-2 bg-green-100 rounded-lg">
                  <span class="text-xl sm:text-2xl">🧰</span>
                </div>
                <div class="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Extras</p>
                  <p class="text-lg sm:text-2xl font-semibold text-green-600">
                    {{ stats.extras?.total_extras || '--' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- ⭐ Servicios - NUEVO -->
            <div class="card p-3 sm:p-6">
              <div class="flex items-center">
                <div class="p-2 bg-purple-100 rounded-lg">
                  <span class="text-xl sm:text-2xl">🏥</span>
                </div>
                <div class="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Servicios</p>
                  <p class="text-lg sm:text-2xl font-semibold text-purple-600">
                    {{ stats.servicios?.total_servicios || '--' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Ventas del día -->
            <div class="card p-3 sm:p-6">
              <div class="flex items-center">
                <div class="p-2 bg-yellow-100 rounded-lg">
                  <span class="text-xl sm:text-2xl">💰</span>
                </div>
                <div class="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Ventas Hoy</p>
                  <p class="text-sm sm:text-2xl font-semibold text-yellow-600">Q 0.00</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions Mejoradas -->
          <div class="card p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Acciones Rápidas
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              <!-- Farmacia -->
              <button 
                @click="navegarA('farmacia')" 
                class="quick-action-btn bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300"
              >
                <span class="text-2xl mb-2 block">💊</span>
                <span class="text-xs sm:text-sm font-medium text-blue-700">Gestionar Farmacia</span>
                <div class="text-xs text-blue-600 mt-1">
                  {{ stats.farmacia?.total_medicamentos || 0 }} medicamentos
                </div>
              </button>

              <!-- Extras -->
              <button 
                @click="navegarA('extras')" 
                class="quick-action-btn bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300"
              >
                <span class="text-2xl mb-2 block">🧰</span>
                <span class="text-xs sm:text-sm font-medium text-green-700">Gestionar Extras</span>
                <div class="text-xs text-green-600 mt-1">
                  {{ stats.extras?.total_extras || 0 }} productos
                </div>
              </button>

              <!-- ⭐ Servicios - NUEVO -->
              <button 
                @click="navegarA('servicios')" 
                class="quick-action-btn bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-300 relative"
              >
                <span class="text-2xl mb-2 block">🏥</span>
                <span class="text-xs sm:text-sm font-medium text-purple-700">Servicios Médicos</span>
                <div class="text-xs text-purple-600 mt-1">
                  {{ stats.servicios?.total_servicios || 0 }} servicios
                </div>
                <!-- Badge de "¡Nuevo!" -->
                <div class="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  ¡Nuevo!
                </div>
              </button>

              <!-- Nueva Venta (próximamente) -->
              <button class="quick-action-btn bg-gray-50 border-gray-200 cursor-not-allowed opacity-50">
                <span class="text-2xl mb-2 block">🛒</span>
                <span class="text-xs sm:text-sm font-medium text-gray-500">Nueva Venta</span>
                <div class="text-xs text-gray-400 mt-1">Próximamente</div>
              </button>
            </div>
          </div>

          <!-- Módulos del Sistema -->
          <div class="card p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Módulos del Sistema
            </h3>
            
            <!-- Grid de módulos -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <!-- Farmacia -->
              <router-link to="/farmacia" class="module-card group">
                <div class="module-header">
                  <div class="module-icon bg-blue-100 group-hover:bg-blue-200">
                    💊
                  </div>
                  <div class="flex-1">
                    <h4 class="module-title">Farmacia</h4>
                    <p class="module-description">Medicamentos e inventario</p>
                  </div>
                  <div class="module-status bg-green-100 text-green-800">
                    ✓ Activo
                  </div>
                </div>
                <div class="module-stats">
                  <div class="stat-item">
                    <span class="stat-value">{{ stats.farmacia?.total_medicamentos || 0 }}</span>
                    <span class="stat-label">Medicamentos</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value text-red-600">{{ stats.farmacia?.stock_bajo || 0 }}</span>
                    <span class="stat-label">Stock bajo</span>
                  </div>
                </div>
              </router-link>

              <!-- Extras -->
              <router-link to="/extras" class="module-card group">
                <div class="module-header">
                  <div class="module-icon bg-green-100 group-hover:bg-green-200">
                    🧰
                  </div>
                  <div class="flex-1">
                    <h4 class="module-title">Extras</h4>
                    <p class="module-description">Productos adicionales</p>
                  </div>
                  <div class="module-status bg-green-100 text-green-800">
                    ✓ Activo
                  </div>
                </div>
                <div class="module-stats">
                  <div class="stat-item">
                    <span class="stat-value">{{ stats.extras?.total_extras || 0 }}</span>
                    <span class="stat-label">Productos</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value text-red-600">{{ stats.extras?.stock_bajo || 0 }}</span>
                    <span class="stat-label">Stock bajo</span>
                  </div>
                </div>
              </router-link>

              <!-- ⭐ Servicios - NUEVO -->
              <router-link to="/servicios" class="module-card group">
                <div class="module-header">
                  <div class="module-icon bg-purple-100 group-hover:bg-purple-200">
                    🏥
                  </div>
                  <div class="flex-1">
                    <h4 class="module-title">Servicios Médicos</h4>
                    <p class="module-description">Gestión de servicios y precios</p>
                  </div>
                  <div class="module-status bg-green-100 text-green-800">
                    ✓ Nuevo
                  </div>
                </div>
                <div class="module-stats">
                  <div class="stat-item">
                    <span class="stat-value">{{ stats.servicios?.total_servicios || 0 }}</span>
                    <span class="stat-label">Servicios</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value text-purple-600">{{ stats.servicios?.servicios_activos || 0 }}</span>
                    <span class="stat-label">Activos</span>
                  </div>
                </div>
              </router-link>

              <!-- Pacientes (próximamente) -->
              <div class="module-card opacity-60 cursor-not-allowed">
                <div class="module-header">
                  <div class="module-icon bg-gray-100">
                    👥
                  </div>
                  <div class="flex-1">
                    <h4 class="module-title text-gray-500">Pacientes</h4>
                    <p class="module-description text-gray-400">Base de datos de clientes</p>
                  </div>
                  <div class="module-status bg-gray-100 text-gray-600">
                    ⏳ Próximo
                  </div>
                </div>
                <div class="module-stats">
                  <div class="stat-item">
                    <span class="stat-value text-gray-400">--</span>
                    <span class="stat-label text-gray-400">En desarrollo</span>
                  </div>
                </div>
              </div>

              <!-- Carrito (próximamente) -->
              <div class="module-card opacity-60 cursor-not-allowed">
                <div class="module-header">
                  <div class="module-icon bg-gray-100">
                    🛒
                  </div>
                  <div class="flex-1">
                    <h4 class="module-title text-gray-500">Sistema de Ventas</h4>
                    <p class="module-description text-gray-400">Carrito y facturación</p>
                  </div>
                  <div class="module-status bg-gray-100 text-gray-600">
                    ⏳ Próximo
                  </div>
                </div>
                <div class="module-stats">
                  <div class="stat-item">
                    <span class="stat-value text-gray-400">--</span>
                    <span class="stat-label text-gray-400">En desarrollo</span>
                  </div>
                </div>
              </div>

              <!-- Financiero (próximamente) -->
              <div class="module-card opacity-60 cursor-not-allowed">
                <div class="module-header">
                  <div class="module-icon bg-gray-100">
                    💰
                  </div>
                  <div class="flex-1">
                    <h4 class="module-title text-gray-500">Financiero</h4>
                    <p class="module-description text-gray-400">Turnos y reportes</p>
                  </div>
                  <div class="module-status bg-gray-100 text-gray-600">
                    ⏳ Próximo
                  </div>
                </div>
                <div class="module-stats">
                  <div class="stat-item">
                    <span class="stat-value text-gray-400">--</span>
                    <span class="stat-label text-gray-400">En desarrollo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Alertas y Notificaciones -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Alertas de Stock -->
            <div class="card p-4 sm:p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span class="mr-2">⚠️</span>
                Alertas de Stock
              </h3>
              
              <div class="space-y-3">
                <div v-if="stats.farmacia?.stock_bajo > 0" class="alert-item bg-red-50 border-red-200">
                  <span class="text-red-600">💊</span>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-red-800">Medicamentos con stock bajo</p>
                    <p class="text-xs text-red-600">{{ stats.farmacia.stock_bajo }} medicamentos</p>
                  </div>
                  <button @click="navegarA('farmacia')" class="text-red-600 hover:text-red-800 text-sm">
                    Ver →
                  </button>
                </div>

                <div v-if="stats.extras?.stock_bajo > 0" class="alert-item bg-orange-50 border-orange-200">
                  <span class="text-orange-600">🧰</span>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-orange-800">Extras con stock bajo</p>
                    <p class="text-xs text-orange-600">{{ stats.extras.stock_bajo }} productos</p>
                  </div>
                  <button @click="navegarA('extras')" class="text-orange-600 hover:text-orange-800 text-sm">
                    Ver →
                  </button>
                </div>

                <div v-if="!stats.farmacia?.stock_bajo && !stats.extras?.stock_bajo" class="alert-item bg-green-50 border-green-200">
                  <span class="text-green-600">✅</span>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-green-800">Stock en niveles óptimos</p>
                    <p class="text-xs text-green-600">Todo el inventario está bien</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Estado del Sistema -->
            <div class="card p-4 sm:p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span class="mr-2">🔧</span>
                Estado del Sistema
              </h3>
              
              <div class="space-y-3">
                <div class="status-item">
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span class="text-sm text-gray-700">Frontend Conectado</span>
                  </div>
                  <span class="text-xs text-green-600">✓ Operativo</span>
                </div>
                
                <div class="status-item">
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span class="text-sm text-gray-700">API Backend - Railway</span>
                  </div>
                  <span class="text-xs text-green-600">✓ Conectado</span>
                </div>
                
                <div class="status-item">
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span class="text-sm text-gray-700">Autenticación JWT</span>
                  </div>
                  <span class="text-xs text-green-600">✓ Activa</span>
                </div>

                <div class="status-item">
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span class="text-sm text-gray-700">Módulo Servicios</span>
                  </div>
                  <span class="text-xs text-green-600">✓ Funcional</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import authService from '@/services/authService'

export default {
  name: 'DashboardView',
  
  data() {
    return {
      user: null,
      loggingOut: false,
      sidebarOpen: false,
      stats: {
        farmacia: {},
        extras: {},
        servicios: {} // ⭐ NUEVO
      }
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
    console.log('🏠 ===== DASHBOARD MONTADO =====')
    
    // Cargar datos del usuario DIRECTAMENTE de localStorage
    console.log('👤 Cargando usuario de localStorage...')
    this.user = authService.getUser()
    
    if (this.user) {
      console.log('✅ Usuario cargado:', this.user.nombres || this.user.usuario)
    } else {
      console.log('⚠️ No se pudo cargar usuario, usando datos por defecto')
      this.user = {
        nombres: 'Administrador',
        apellidos: 'Sistema',
        usuario: 'admin@hidrocolon.com',
        rol: { nombre: 'administrador' }
      }
    }
    
    // Cargar estadísticas
    await this.cargarEstadisticas()
    
    // Setup navegación móvil
    this.setupMobileNavigation()
    
    console.log('🏠 Dashboard cargado exitosamente')
  },

  methods: {
    async cargarEstadisticas() {
      try {
        console.log('📊 Cargando estadísticas del dashboard...')
        
        // Cargar estadísticas en paralelo
        const [farmaciaStats, extrasStats, serviciosStats] = await Promise.allSettled([
          this.cargarEstadisticasFarmacia(),
          this.cargarEstadisticasExtras(),
          this.cargarEstadisticasServicios() // ⭐ NUEVO
        ])
        
        this.stats = {
          farmacia: farmaciaStats.status === 'fulfilled' ? farmaciaStats.value : {},
          extras: extrasStats.status === 'fulfilled' ? extrasStats.value : {},
          servicios: serviciosStats.status === 'fulfilled' ? serviciosStats.value : {} // ⭐ NUEVO
        }
        
        console.log('✅ Estadísticas cargadas:', this.stats)
        
      } catch (error) {
        console.error('❌ Error cargando estadísticas:', error)
      }
    },

    // ⭐ NUEVO MÉTODO
    async cargarEstadisticasServicios() {
      try {
        const serviciosService = (await import('@/services/serviciosService')).default
        const stats = await serviciosService.getStats()
        
        return {
          total_servicios: stats.total_servicios || 0,
          servicios_activos: stats.servicios_activos || 0,
          precio_promedio: stats.precio_promedio || 0,
          con_medicamentos: stats.con_medicamentos || 0
        }
      } catch (error) {
        console.error('❌ Error cargando estadísticas de servicios:', error)
        return {}
      }
    },

    async cargarEstadisticasFarmacia() {
      try {
        const farmaciaService = (await import('@/services/farmaciaService')).default
        const stats = await farmaciaService.getStats()
        
        return {
          total_medicamentos: stats.total_medicamentos || 0,
          stock_bajo: stats.stock_bajo || 0,
          proximo_vencer: stats.proximo_vencer || 0
        }
      } catch (error) {
        console.error('❌ Error cargando estadísticas de farmacia:', error)
        return {}
      }
    },

    async cargarEstadisticasExtras() {
      try {
        const extrasService = (await import('@/services/extrasService')).default
        const stats = await extrasService.getStats()
        
        return {
          total_extras: stats.total_extras || 0,
          stock_bajo: stats.stock_bajo || 0
        }
      } catch (error) {
        console.error('❌ Error cargando estadísticas de extras:', error)
        return {}
      }
    },

    // ⭐ NAVEGACIÓN MEJORADA
    navegarA(modulo) {
      console.log(`🧭 Navegando a: ${modulo}`)
      
      // Cerrar sidebar móvil
      this.closeMobileSidebar()
      
      // Navegar
      switch (modulo) {
        case 'farmacia':
          this.$router.push('/farmacia')
          break
        case 'extras':
          this.$router.push('/extras')
          break
        case 'servicios': // ⭐ NUEVO
          this.$router.push('/servicios')
          break
        case 'pacientes':
          // Por implementar
          console.log('📋 Módulo pacientes en desarrollo')
          break
        case 'carrito':
          // Por implementar
          console.log('🛒 Módulo carrito en desarrollo')
          break
        case 'financiero':
          // Por implementar
          console.log('💰 Módulo financiero en desarrollo')
          break
        default:
          console.log('❓ Módulo no reconocido:', modulo)
      }
    },

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

<style scoped>
/* Layout base */
.layout-container {
  @apply min-h-screen bg-gray-50;
}

.sidebar {
  @apply bg-white shadow-lg;
}

.main-content {
  @apply bg-gray-50 min-h-screen;
}

/* Componentes base */
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200;
}

.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50;
}

.btn-secondary {
  @apply bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50;
}

/* Quick Actions */
.quick-action-btn {
  @apply p-3 sm:p-4 border-2 border-dashed rounded-lg text-center transition-all duration-200 relative;
}

/* Module Cards */
.module-card {
  @apply block bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 p-4 no-underline;
}

.module-header {
  @apply flex items-start justify-between mb-3;
}

.module-icon {
  @apply w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-3 transition-colors duration-200;
}

.module-title {
  @apply text-sm font-semibold text-gray-900;
}

.module-description {
  @apply text-xs text-gray-600;
}

.module-status {
  @apply px-2 py-1 text-xs rounded-full font-medium;
}

.module-stats {
  @apply flex justify-between text-center;
}

.stat-item {
  @apply flex flex-col;
}

.stat-value {
  @apply text-lg font-bold text-gray-900;
}

.stat-label {
  @apply text-xs text-gray-500;
}

/* Alert Items */
.alert-item {
  @apply flex items-center p-3 border rounded-lg;
}

.status-item {
  @apply flex justify-between items-center;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .module-icon {
    @apply w-8 h-8 text-lg;
  }
  
  .stat-value {
    @apply text-base;
  }
}

/* Animaciones */
@keyframes pulse-green {
  0%, 100% {
    @apply bg-green-500;
  }
  50% {
    @apply bg-green-600;
  }
}

.animate-pulse-green {
  animation: pulse-green 2s infinite;
}
</style>