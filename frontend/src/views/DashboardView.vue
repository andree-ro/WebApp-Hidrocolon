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
              Sistema Hidrocolon/Vimesa
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
                  </a>
                </li>
                <li>
                  <a href="#" @click.prevent="navegarA('pacientes')" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                    <span class="text-lg mr-3">👥</span>
                    Pacientes
                  </a>
                </li>

    
                <li>
                  <a href="#" @click.prevent="navegarA('doctoras')" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors relative">
                    <span class="text-lg mr-3">👩‍⚕️</span>
                    Doctor(as)
                  </a>
                </li>



                <li>
                  <a href="#" @click.prevent="navegarA('carrito')" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors relative">
                    <span class="text-lg mr-3">🛒</span>
                    Carrito
                  </a>
                </li>

                <li>
                  <router-link 
                    to="/financiero" 
                    @click="closeMobileSidebar" 
                    class="flex items-center px-3 py-3 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                    active-class="bg-gray-800 text-white"
                  >
                    <span class="text-lg mr-3">💰</span>
                    Financiero
                  </router-link>
                </li>

                <li>
                  <router-link 
                    to="/libro-bancos" 
                    @click="closeMobileSidebar" 
                    class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    active-class="bg-blue-100 text-blue-700"
                  >
                    <span class="text-lg mr-3">📚</span>
                    Libro de Bancos
                  </router-link>
                </li>

                <li>
                  <router-link 
                    to="/estado-resultados" 
                    @click="closeMobileSidebar" 
                    class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    active-class="bg-blue-100 text-blue-700"
                  >
                    <span class="text-lg mr-3">📊</span>
                    Estado de Resultados
                  </router-link>
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
                  <a href="#" @click.prevent="navegarA('usuarios')" class="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
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
              Menú Principal
            </h2>
            <p class="text-gray-600 text-sm sm:text-base">
              Bienvenido al Sistema de Gestión Hidrocolon
            </p>
          </div>

          <!-- Stats Cards con datos reales -->
          

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

              </button>

              <!-- Nueva Venta (ACTIVO) -->
              <button 
                @click="navegarA('carrito')"
                class="quick-action-btn bg-gradient-to-br from-orange-500 to-orange-600 border-orange-400 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span class="text-2xl mb-2 block">🛒</span>
                <span class="text-xs sm:text-sm font-medium">Nueva Venta</span>
                <div class="text-xs mt-1 opacity-90">Sistema de ventas</div>
                <!-- Badge NUEVO -->

              </button>
              <!-- Libro de Bancos -->
              <button 
                @click="navegarA('libro-bancos')" 
                class="quick-action-btn bg-indigo-50 hover:bg-indigo-100 border-indigo-200 hover:border-indigo-300"
              >
                <span class="text-2xl mb-2 block">📚</span>
                <span class="text-xs sm:text-sm font-medium text-indigo-700">Libro de Bancos</span>
                <div class="text-xs text-indigo-600 mt-1">
                  Control bancario
                </div>
              </button>

                            <!-- Estado de Resultados -->
              <button 
                @click="navegarA('estado-resultados')" 
                class="quick-action-btn bg-teal-50 hover:bg-teal-100 border-teal-200 hover:border-teal-300"
              >
                <span class="text-2xl mb-2 block">📊</span>
                <span class="text-xs sm:text-sm font-medium text-teal-700">Estado de Resultados</span>
                <div class="text-xs text-teal-600 mt-1">
                  Reporte financiero
                </div>
              </button>
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
      return this.user?.rol_nombre || this.user?.rol?.nombre || 'Sin rol'
    },
    isAdmin() {
      const rolNombre = this.user?.rol_nombre || this.user?.rol?.nombre
      return rolNombre === 'administrador'
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

    await this.debugEstadisticas()
    
    console.log('🏠 Dashboard cargado exitosamente')
  },

  methods: {
    async cargarEstadisticas() {
      try {
        console.log('📊 Cargando estadísticas del dashboard...')
        
        // Cargar estadísticas en paralelo con manejo de errores individual
        const [farmaciaStats, extrasStats, serviciosStats, pacientesStats] = await Promise.allSettled([
          this.cargarEstadisticasFarmacia(),
          this.cargarEstadisticasExtras(),
          this.cargarEstadisticasServicios(),
          this.cargarEstadisticasPacientes()
        ])
        
        // Procesar resultados
        this.stats = {
          farmacia: farmaciaStats.status === 'fulfilled' ? farmaciaStats.value : this.getDefaultFarmaciaStats(),
          extras: extrasStats.status === 'fulfilled' ? extrasStats.value : this.getDefaultExtrasStats(),
          servicios: serviciosStats.status === 'fulfilled' ? serviciosStats.value : this.getDefaultServiciosStats(),
          pacientes: pacientesStats.status === 'fulfilled' ? pacientesStats.value : { total: 0, citas_manana: 0 }
        }
        
        console.log('✅ Estadísticas finales cargadas:', this.stats)
        
      } catch (error) {
        console.error('❌ Error cargando estadísticas:', error)
        // Usar valores por defecto
        this.stats = {
          farmacia: this.getDefaultFarmaciaStats(),
          extras: this.getDefaultExtrasStats(),
          servicios: this.getDefaultServiciosStats()
        }
      }
    },

    async cargarEstadisticasServicios() {
      try {
        console.log('🏥 Cargando estadísticas de servicios...')
        const serviciosService = (await import('@/services/serviciosService')).default
        
        // Llamar al método getStats del servicio
        const response = await serviciosService.getStats()
        console.log('📊 Respuesta raw de servicios stats:', response)
        
        // El backend puede devolver los datos en diferentes estructuras
        // Puede ser: { data: {...} } o directamente {...}
        const statsData = response.data || response || {}
        console.log('📊 Stats data procesada:', statsData)
        
        return {
          total_servicios: statsData.total_servicios || statsData.total || 0,
          servicios_activos: statsData.servicios_activos || statsData.activos || 0,
          precio_promedio: statsData.precio_promedio || 0,
          con_medicamentos: statsData.con_medicamentos || statsData.servicios_con_medicamentos || 0
        }
      } catch (error) {
        console.error('❌ Error cargando estadísticas de servicios:', error.message)
        // Intentar calcular estadísticas básicas desde el módulo servicios
        return await this.calcularEstadisticasServiciosBasicas()
      }
    },

    async cargarEstadisticasFarmacia() {
      try {
        console.log('💊 Cargando estadísticas de farmacia...')
        const farmaciaService = (await import('@/services/farmaciaService')).default
        
        // Verificar si el método getEstadisticas existe (usa el nombre correcto)
        if (typeof farmaciaService.getEstadisticas === 'function') {
          const response = await farmaciaService.getEstadisticas()
          console.log('📊 Respuesta de farmacia stats:', response)
          
          const statsData = response.data || response || {}
          
          return {
            total_medicamentos: statsData.total_medicamentos || statsData.total || 0,
            stock_bajo: statsData.stock_bajo || statsData.medicamentos_stock_bajo || 0,
            proximo_vencer: statsData.proximo_vencer || statsData.medicamentos_por_vencer || 0
          }
        } else {
          console.log('⚠️ farmaciaService.getEstadisticas no está disponible')
          return await this.calcularEstadisticasFarmaciaBasicas()
        }
      } catch (error) {
        console.error('❌ Error cargando estadísticas de farmacia:', error.message)
        return await this.calcularEstadisticasFarmaciaBasicas()
      }
    },

    async cargarEstadisticasExtras() {
      try {
        console.log('🧰 Cargando estadísticas de extras...')
        const extrasService = (await import('@/services/extrasService')).default
        
        // Verificar si el método getStats existe
        if (typeof extrasService.getStats === 'function') {
          const response = await extrasService.getStats()
          console.log('📊 Respuesta de extras stats:', response)
          
          const statsData = response.data || response || {}
          
          return {
            total_extras: statsData.total_extras || statsData.total || 0,
            stock_bajo: statsData.stock_bajo || statsData.extras_stock_bajo || 0
          }
        } else {
          console.log('⚠️ extrasService.getStats no está disponible')
          return await this.calcularEstadisticasExtrasBasicas()
        }
      } catch (error) {
        console.error('❌ Error cargando estadísticas de extras:', error.message)
        return await this.calcularEstadisticasExtrasBasicas()
      }
    },


    async calcularEstadisticasServiciosBasicas() {
      try {
        console.log('🔄 Calculando estadísticas de servicios básicas...')
        const serviciosService = (await import('@/services/serviciosService')).default
        
        // Obtener servicios directamente
        const response = await serviciosService.getServicios({ limit: 1000 })
        const servicios = response.data || []
        
        const stats = {
          total_servicios: servicios.length,
          servicios_activos: servicios.filter(s => s.activo).length,
          precio_promedio: servicios.length > 0 ? 
            servicios.reduce((sum, s) => sum + (s.precio_efectivo || 0), 0) / servicios.length : 0,
          con_medicamentos: servicios.filter(s => (s.total_medicamentos || 0) > 0).length
        }
        
        console.log('📊 Estadísticas servicios calculadas:', stats)
        return stats
      } catch (error) {
        console.error('❌ Error calculando estadísticas servicios básicas:', error)
        return this.getDefaultServiciosStats()
      }
    },

    async calcularEstadisticasFarmaciaBasicas() {
      try {
        console.log('🔄 Calculando estadísticas de farmacia básicas...')
        const farmaciaService = (await import('@/services/farmaciaService')).default
        
        // Obtener medicamentos directamente
        const response = await farmaciaService.getMedicamentos({ limit: 1000 })
        const medicamentos = response.data?.medicamentos || []
        
        const stats = {
          total_medicamentos: medicamentos.length,
          stock_bajo: medicamentos.filter(m => (m.existencias || 0) < 10).length,
          proximo_vencer: medicamentos.filter(m => {
            if (!m.fecha_vencimiento) return false
            const vencimiento = new Date(m.fecha_vencimiento)
            const hoy = new Date()
            const diasDiferencia = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))
            return diasDiferencia <= 30
          }).length
        }
        
        console.log('📊 Estadísticas farmacia calculadas:', stats)
        return stats
      } catch (error) {
        console.error('❌ Error calculando estadísticas farmacia básicas:', error)
        return this.getDefaultFarmaciaStats()
      }
    },

    async calcularEstadisticasExtrasBasicas() {
      try {
        console.log('🔄 Calculando estadísticas de extras básicas...')
        const extrasService = (await import('@/services/extrasService')).default
        
        // Obtener extras directamente
        const response = await extrasService.getExtras({ limit: 1000 })
        const extras = response.extras || []
        
        const stats = {
          total_extras: extras.length,
          stock_bajo: extras.filter(e => (e.existencias || 0) < (e.stock_minimo || 20)).length
        }
        
        console.log('📊 Estadísticas extras calculadas:', stats)
        return stats
      } catch (error) {
        console.error('❌ Error calculando estadísticas extras básicas:', error)
        return this.getDefaultExtrasStats()
      }
    },

    // VALORES POR DEFECTO - Agregar estos métodos nuevos:
    getDefaultServiciosStats() {
      return {
        total_servicios: 0,
        servicios_activos: 0,
        precio_promedio: 0,
        con_medicamentos: 0
      }
    },

    getDefaultFarmaciaStats() {
      return {
        total_medicamentos: 0,
        stock_bajo: 0,
        proximo_vencer: 0
      }
    },

    getDefaultExtrasStats() {
      return {
        total_extras: 0,
        stock_bajo: 0
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
          this.$router.push('/pacientes')
          break
        case 'doctoras':
          this.$router.push('/doctoras')
          break
        case 'carrito':
          this.$router.push('/carrito')
          break
        case 'financiero':
          this.$router.push('/financiero')
          break
        case 'libro-bancos': // ⭐ NUEVO - LIBRO DE BANCOS
          this.$router.push('/libro-bancos')
          break
        case 'estado-resultados':
          this.$router.push('/estado-resultados')
          break
        case 'usuarios':
          this.$router.push('/usuarios')
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
    },

    async debugEstadisticas() {
      console.log('🔍 === DEBUG DE ESTADÍSTICAS ===')
      
      // Test servicios
      try {
        const serviciosService = (await import('@/services/serviciosService')).default
        const serviciosResponse = await serviciosService.getStats()
        console.log('🏥 Servicios Stats Response:', serviciosResponse)
      } catch (error) {
        console.error('❌ Error servicios:', error.message)
      }
      
      // Test farmacia
      try {
        const farmaciaService = (await import('@/services/farmaciaService')).default
        const farmaciaResponse = await farmaciaService.getEstadisticas()
        console.log('💊 Farmacia Stats Response:', farmaciaResponse)
      } catch (error) {
        console.error('❌ Error farmacia:', error.message)
      }
      
      // Test extras
      try {
        const extrasService = (await import('@/services/extrasService')).default
        const extrasResponse = await extrasService.getStats()
        console.log('🧰 Extras Stats Response:', extrasResponse)
      } catch (error) {
        console.error('❌ Error extras:', error.message)
      }
      
      console.log('🔍 === FIN DEBUG ===')
    },
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