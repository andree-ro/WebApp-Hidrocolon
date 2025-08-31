<!-- frontend/src/views/ServiciosView.vue -->
<template>
  <div class="servicios-module">
    <!-- Header con título y botón agregar -->
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">🏥 Módulo Servicios</h1>
        <p class="text-gray-600 mt-1">Gestión de servicios médicos y precios</p>
      </div>
      
      <!-- Botón Agregar Nuevo Servicio -->
      <button
        @click="abrirModalAgregar"
        class="btn-primary flex items-center space-x-2"
        :disabled="cargando"
      >
        <span class="text-lg">➕</span>
        <span>Agregar Servicio</span>
      </button>
    </header>

    <!-- Mensaje de error -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex items-center">
        <span class="text-red-600 mr-2">⚠️</span>
        <span class="text-red-800">{{ error }}</span>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <div class="card p-3 sm:p-4">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 rounded-lg">
            <span class="text-lg sm:text-xl">🏥</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Servicios</p>
            <p class="text-lg sm:text-xl font-semibold text-blue-600">{{ stats.total_servicios || '--' }}</p>
          </div>
        </div>
      </div>

      <div class="card p-3 sm:p-4">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 rounded-lg">
            <span class="text-lg sm:text-xl">✅</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Activos</p>
            <p class="text-lg sm:text-xl font-semibold text-green-600">{{ stats.servicios_activos || '--' }}</p>
          </div>
        </div>
      </div>

      <div class="card p-3 sm:p-4">
        <div class="flex items-center">
          <div class="p-2 bg-yellow-100 rounded-lg">
            <span class="text-lg sm:text-xl">💰</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Precio Promedio</p>
            <p class="text-lg sm:text-xl font-semibold text-yellow-600">{{ formatearPrecio(stats.precio_promedio) }}</p>
          </div>
        </div>
      </div>

      <div class="card p-3 sm:p-4">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 rounded-lg">
            <span class="text-lg sm:text-xl">💊</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Con Medicamentos</p>
            <p class="text-lg sm:text-xl font-semibold text-purple-600">{{ stats.con_medicamentos || '--' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros avanzados -->
    <div class="card p-4 sm:p-6 mb-6">
      <div class="flex flex-col lg:flex-row gap-4">
        <!-- Barra de búsqueda -->
        <div class="flex-1">
          <div class="relative">
            <input
              v-model="filtros.search"
              @input="debounceSearch"
              type="text"
              placeholder="Buscar servicios por nombre..."
              class="input-field pl-10 pr-4"
            />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-400">🔍</span>
            </div>
            <div v-if="filtros.search" 
                 @click="limpiarBusqueda"
                 class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
              <span class="text-gray-400 hover:text-gray-600">❌</span>
            </div>
          </div>
        </div>

        <!-- Filtro Estado -->
        <div class="w-full sm:w-40">
          <select v-model="filtros.activo" @change="aplicarFiltros" class="input-field">
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <!-- Filtro Precio Mínimo -->
        <div class="w-full sm:w-32">
          <input
            v-model="filtros.precio_min"
            @input="debounceSearch"
            type="number"
            step="0.01"
            min="0"
            placeholder="Precio min"
            class="input-field"
          />
        </div>

        <!-- Filtro Precio Máximo -->
        <div class="w-full sm:w-32">
          <input
            v-model="filtros.precio_max"
            @input="debounceSearch"
            type="number"
            step="0.01"
            min="0"
            placeholder="Precio max"
            class="input-field"
          />
        </div>

        <!-- Botones de acción -->
        <div class="flex gap-2">
          <button
            @click="limpiarFiltros"
            class="btn-secondary px-3 py-2 text-sm"
            title="Limpiar filtros"
          >
            🧹
          </button>
          
          <button
            @click="exportarExcel"
            class="btn-secondary px-3 py-2 text-sm"
            :disabled="cargando"
            title="Exportar Excel"
          >
            📊
          </button>
        </div>
      </div>

      <!-- Filtros activos -->
      <div v-if="tienesFiltrosActivos" class="flex flex-wrap gap-2 mt-3">
        <span class="text-xs text-gray-500">Filtros activos:</span>
        
        <span v-if="filtros.search" class="badge-filter">
          🔍 "{{ filtros.search }}"
          <button @click="filtros.search = ''; aplicarFiltros()" class="ml-1 text-red-500">×</button>
        </span>
        
        <span v-if="filtros.activo === 'true'" class="badge-filter">
          ✅ Activos
          <button @click="filtros.activo = ''; aplicarFiltros()" class="ml-1 text-red-500">×</button>
        </span>
        
        <span v-if="filtros.activo === 'false'" class="badge-filter">
          ❌ Inactivos
          <button @click="filtros.activo = ''; aplicarFiltros()" class="ml-1 text-red-500">×</button>
        </span>
        
        <span v-if="filtros.precio_min" class="badge-filter">
          💰 Min: {{ formatearPrecio(filtros.precio_min) }}
          <button @click="filtros.precio_min = ''; aplicarFiltros()" class="ml-1 text-red-500">×</button>
        </span>
        
        <span v-if="filtros.precio_max" class="badge-filter">
          💰 Max: {{ formatearPrecio(filtros.precio_max) }}
          <button @click="filtros.precio_max = ''; aplicarFiltros()" class="ml-1 text-red-500">×</button>
        </span>
      </div>
    </div>

    <!-- Tabla de servicios -->
    <div class="card overflow-hidden">
      <!-- Header de tabla con ordenamiento -->
      <div class="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 class="text-lg font-medium text-gray-900">Lista de Servicios</h3>
            <p class="text-sm text-gray-600">
              {{ pagination.totalItems || 0 }} servicios encontrados
            </p>
          </div>
          
          <!-- Ordenamiento -->
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-500">Ordenar por:</span>
            <select v-model="filtros.orderBy" @change="aplicarFiltros" class="input-field text-sm py-1">
              <option value="fecha_creacion">Fecha creación</option>
              <option value="nombre">Nombre</option>
              <option value="precio_efectivo">Precio efectivo</option>
              <option value="precio_tarjeta">Precio tarjeta</option>
            </select>
            
            <button
              @click="toggleOrderDir"
              class="btn-secondary px-2 py-1 text-sm"
              :title="filtros.orderDir === 'ASC' ? 'Ascendente' : 'Descendente'"
            >
              {{ filtros.orderDir === 'ASC' ? '⬆️' : '⬇️' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Estado de carga -->
      <div v-if="cargando" class="p-8 text-center">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-r-transparent rounded-full"></div>
        <p class="mt-2 text-gray-600">Cargando servicios...</p>
      </div>

      <!-- Tabla responsive -->
      <div v-else-if="servicios.length > 0" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Servicio
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precios
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comisión
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medicamentos
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="servicio in servicios" :key="servicio.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ servicio.nombre_servicio }}
                  </div>
                  <div v-if="servicio.descripcion" class="text-sm text-gray-500 truncate max-w-xs">
                    {{ servicio.descripcion }}
                  </div>
                </div>
              </td>
              
              <td class="px-6 py-4">
                <div class="text-sm">
                  <div class="text-gray-900 font-medium">
                    💵 {{ formatearPrecio(servicio.precio_efectivo) }}
                  </div>
                  <div class="text-gray-500">
                    💳 {{ formatearPrecio(servicio.precio_tarjeta) }}
                  </div>
                </div>
              </td>
              
              <td class="px-6 py-4">
                <span class="text-sm text-gray-900">
                  {{ servicio.porcentaje_comision }}%
                </span>
              </td>
              
              <td class="px-6 py-4">
                <button
                  @click="verMedicamentosVinculados(servicio)"
                  class="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full hover:bg-purple-200"
                  :title="`Ver medicamentos vinculados`"
                >
                  💊 {{ servicio.total_medicamentos || 0 }}
                </button>
              </td>
              
              <td class="px-6 py-4">
                <span
                  :class="servicio.activo ? 'badge-success' : 'badge-error'"
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                >
                  {{ servicio.activo ? '✅ Activo' : '❌ Inactivo' }}
                </span>
              </td>
              
              <td class="px-6 py-4 text-right text-sm font-medium">
                <div class="flex justify-end gap-1">
                  <button
                    @click="editarServicio(servicio)"
                    class="text-blue-600 hover:text-blue-900 p-1"
                    title="Editar servicio"
                  >
                    ✏️
                  </button>
                  
                  <button
                    @click="verMedicamentosVinculados(servicio)"
                    class="text-purple-600 hover:text-purple-900 p-1"
                    title="Gestionar medicamentos"
                  >
                    💊
                  </button>
                  
                  <button
                    @click="eliminarServicio(servicio)"
                    class="text-red-600 hover:text-red-900 p-1"
                    title="Eliminar servicio"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Estado vacío -->
      <div v-else class="p-8 text-center">
        <div class="text-6xl mb-4">🏥</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No hay servicios</h3>
        <p class="text-gray-600 mb-4">
          {{ tienesFiltrosActivos ? 'No se encontraron servicios con los filtros aplicados' : 'Comienza agregando tu primer servicio médico' }}
        </p>
        <button v-if="!tienesFiltrosActivos" @click="abrirModalAgregar" class="btn-primary">
          ➕ Agregar Primer Servicio
        </button>
        <button v-else @click="limpiarFiltros" class="btn-secondary">
          🧹 Limpiar Filtros
        </button>
      </div>

      <!-- Paginación -->
      <div v-if="servicios.length > 0 && pagination.totalPages > 1" class="px-6 py-4 border-t border-gray-200">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <!-- Info de paginación -->
          <div class="text-sm text-gray-700">
            Mostrando {{ ((pagination.currentPage - 1) * filtros.limit) + 1 }} - 
            {{ Math.min(pagination.currentPage * filtros.limit, pagination.totalItems) }} 
            de {{ pagination.totalItems }} servicios
          </div>
          
          <!-- Controles de paginación -->
          <div class="flex items-center gap-2">
            <!-- Items por página -->
            <select v-model="filtros.limit" @change="aplicarFiltros" class="input-field text-sm py-1">
              <option value="10">10 por página</option>
              <option value="25">25 por página</option>
              <option value="50">50 por página</option>
            </select>
            
            <!-- Navegación -->
            <div class="flex items-center gap-1">
              <button
                @click="irAPagina(1)"
                :disabled="pagination.currentPage === 1"
                class="btn-pagination"
                title="Primera página"
              >
                ⏪
              </button>
              
              <button
                @click="irAPagina(pagination.currentPage - 1)"
                :disabled="!pagination.hasPrevPage"
                class="btn-pagination"
                title="Página anterior"
              >
                ⬅️
              </button>
              
              <span class="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded">
                {{ pagination.currentPage }} / {{ pagination.totalPages }}
              </span>
              
              <button
                @click="irAPagina(pagination.currentPage + 1)"
                :disabled="!pagination.hasNextPage"
                class="btn-pagination"
                title="Página siguiente"
              >
                ➡️
              </button>
              
              <button
                @click="irAPagina(pagination.totalPages)"
                :disabled="pagination.currentPage === pagination.totalPages"
                class="btn-pagination"
                title="Última página"
              >
                ⏩
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <ServiciosModal
      v-if="mostrarModal"
      :servicio="servicioSeleccionado"
      :modo="modoModal"
      @cerrar="cerrarModal"
      @guardado="onServicioGuardado"
    />

    <MedicamentosVinculadosModal
      v-if="mostrarModalMedicamentos"
      :servicio="servicioParaMedicamentos"
      @cerrar="cerrarModalMedicamentos"
      @actualizado="onMedicamentosActualizados"
    />
  </div>
</template>

<script>
import serviciosService from '@/services/serviciosService'
import ServiciosModal from '@/components/ServiciosModal.vue'
import MedicamentosVinculadosModal from '@/components/MedicamentosVinculadosModal.vue'

export default {
  name: 'ServiciosView',
  components: {
    ServiciosModal,
    MedicamentosVinculadosModal
  },

  data() {
    return {
      // Estados principales
      servicios: [],
      stats: {},
      pagination: {},
      cargando: false,
      error: null,
      
      // Filtros
      filtros: {
        search: '',
        activo: '',
        precio_min: '',
        precio_max: '',
        orderBy: 'fecha_creacion',
        orderDir: 'DESC',
        page: 1,
        limit: 10
      },
      
      // Modales
      mostrarModal: false,
      mostrarModalMedicamentos: false,
      servicioSeleccionado: null,
      servicioParaMedicamentos: null,
      modoModal: 'crear', // 'crear' | 'editar'
      
      // Debounce
      searchTimeout: null
    }
  },

  computed: {
    tienesFiltrosActivos() {
      return !!(
        this.filtros.search ||
        this.filtros.activo ||
        this.filtros.precio_min ||
        this.filtros.precio_max
      )
    }
  },

  async created() {
    console.log('🏥 Inicializando módulo servicios...')
    await this.inicializarModulo()
  },

  beforeUnmount() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }
  },

  methods: {
    async inicializarModulo() {
      try {
        console.log('🚀 Inicializando módulo servicios...')
        
        // Cargar datos en paralelo
        await Promise.all([
          this.cargarServicios(),
          this.cargarEstadisticas()
        ])
        
        console.log('✅ Módulo servicios inicializado exitosamente')
        
      } catch (error) {
        console.error('❌ Error inicializando servicios:', error)
        this.error = 'Error cargando el módulo servicios'
      }
    },

    async cargarServicios() {
      try {
        this.cargando = true
        this.error = null
        
        console.log('📊 Cargando servicios con filtros:', this.filtros)
        
        // Crear parámetros limpios
        const params = {
          page: this.filtros.page,
          limit: this.filtros.limit,
          orderBy: this.filtros.orderBy,
          orderDir: this.filtros.orderDir
        }
        
        // Agregar filtros solo si tienen valor
        if (this.filtros.search && this.filtros.search.trim()) {
          params.search = this.filtros.search.trim()
        }
        
        if (this.filtros.activo !== null && this.filtros.activo !== '') {
          params.activo = this.filtros.activo
        }
        
        if (this.filtros.precio_min && this.filtros.precio_min !== '') {
          params.precio_min = parseFloat(this.filtros.precio_min)
        }
        
        if (this.filtros.precio_max && this.filtros.precio_max !== '') {
          params.precio_max = parseFloat(this.filtros.precio_max)
        }
        
        console.log('🧹 Parámetros enviados al API:', params)
        
        const response = await serviciosService.getServicios(params)
        
        this.servicios = response.data || []
        this.pagination = response.pagination || {}
        
        console.log('✅ Servicios cargados:', this.servicios.length)
        console.log('📄 Paginación:', this.pagination)
        
      } catch (error) {
        console.error('❌ Error cargando servicios:', error)
        this.error = error.message
        this.servicios = []
      } finally {
        this.cargando = false
      }
    },

    async cargarEstadisticas() {
      try {
        console.log('📊 Cargando estadísticas...')
        
        const response = await serviciosService.getStats()
        
        this.stats = response || {}
        
        console.log('✅ Estadísticas cargadas:', this.stats)
        
      } catch (error) {
        console.error('❌ Error cargando estadísticas:', error)
        // No mostrar error, las estadísticas no son críticas
        this.stats = {}
      }
    },

    // =====================================
    // FILTROS Y BÚSQUEDA
    // =====================================

    debounceSearch() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      this.searchTimeout = setTimeout(() => {
        this.aplicarFiltros()
      }, 500)
    },

    async aplicarFiltros() {
      this.filtros.page = 1 // Reset a primera página
      await this.cargarServicios()
    },

    limpiarBusqueda() {
      this.filtros.search = ''
      this.aplicarFiltros()
    },

    async limpiarFiltros() {
      this.filtros = {
        ...this.filtros,
        search: '',
        activo: '',
        precio_min: '',
        precio_max: ''
      }
      await this.aplicarFiltros()
    },

    toggleOrderDir() {
      this.filtros.orderDir = this.filtros.orderDir === 'ASC' ? 'DESC' : 'ASC'
      this.aplicarFiltros()
    },

    async irAPagina(pagina) {
      if (pagina >= 1 && pagina <= this.pagination.totalPages) {
        this.filtros.page = pagina
        await this.cargarServicios()
      }
    },

    // =====================================
    // GESTIÓN DE SERVICIOS (CRUD)
    // =====================================

    abrirModalAgregar() {
      this.servicioSeleccionado = null
      this.modoModal = 'crear'
      this.mostrarModal = true
    },

    editarServicio(servicio) {
      this.servicioSeleccionado = { ...servicio }
      this.modoModal = 'editar'
      this.mostrarModal = true
    },

    async eliminarServicio(servicio) {
      if (!confirm(`¿Estás seguro de eliminar el servicio "${servicio.nombre_servicio}"?`)) {
        return
      }

      try {
        console.log('🗑️ Eliminando servicio:', servicio.id)
        
        await serviciosService.eliminarServicio(servicio.id)
        
        console.log('✅ Servicio eliminado exitosamente')
        
        // Recargar datos
        await Promise.all([
          this.cargarServicios(),
          this.cargarEstadisticas()
        ])
        
      } catch (error) {
        console.error('❌ Error eliminando servicio:', error)
        this.error = error.message
      }
    },

    cerrarModal() {
      this.mostrarModal = false
      this.servicioSeleccionado = null
      this.modoModal = 'crear'
    },

    async onServicioGuardado() {
      console.log('✅ Servicio guardado, recargando datos...')
      
      this.cerrarModal()
      
      // Recargar datos
      await Promise.all([
        this.cargarServicios(),
        this.cargarEstadisticas()
      ])
    },

    // =====================================
    // GESTIÓN DE MEDICAMENTOS VINCULADOS
    // =====================================

    verMedicamentosVinculados(servicio) {
      this.servicioParaMedicamentos = servicio
      this.mostrarModalMedicamentos = true
    },

    cerrarModalMedicamentos() {
      this.mostrarModalMedicamentos = false
      this.servicioParaMedicamentos = null
    },

    async onMedicamentosActualizados() {
      console.log('✅ Medicamentos actualizados, recargando datos...')
      
      // Recargar servicios para actualizar contadores
      await this.cargarServicios()
    },

    // =====================================
    // UTILIDADES
    // =====================================

    formatearPrecio(precio) {
      return serviciosService.formatearPrecio(precio)
    },

    async exportarExcel() {
      try {
        console.log('📊 Exportando servicios a Excel...')
        
        // Usar filtros actuales para exportar
        const filtrosExport = { ...this.filtros }
        delete filtrosExport.page // Exportar todos
        delete filtrosExport.limit
        
        await serviciosService.exportarExcel(filtrosExport)
        
        console.log('✅ Servicios exportados exitosamente')
        
      } catch (error) {
        console.error('❌ Error exportando servicios:', error)
        this.error = error.message
      }
    }
  }
}
</script>

<style scoped>
/* Componentes base ya definidos en style.css */
.badge-filter {
  @apply inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full;
}

.badge-success {
  @apply bg-green-100 text-green-800;
}

.badge-error {
  @apply bg-red-100 text-red-800;
}

.btn-pagination {
  @apply px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Tabla responsive mejorada */
@media (max-width: 640px) {
  .table-responsive {
    font-size: 0.875rem;
  }
  
  .table-responsive th,
  .table-responsive td {
    padding: 0.5rem 0.75rem;
  }
}

/* Animaciones suaves */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>