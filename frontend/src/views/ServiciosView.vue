<template>
  <div class="servicios-module">
    <!-- Header con título y botón agregar -->
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <!-- Botón Volver al Dashboard -->
      <button
          @click="$router.push('/')"
          class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          <span>Menú Principal</span>
      </button>
      
      <div class="flex items-center gap-4">

        
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">🏥 Módulo Servicios</h1>
          <p class="text-gray-600 mt-1">Gestión de servicios médicos y precios</p>
        </div>
      </div>
      
      <!-- Botón Agregar Nuevo Servicio -->
      <button
        @click="abrirModalAgregar"
        class="btn-primary flex items-center space-x-2"
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

    <!-- Filtros -->
    <div class="card p-4 sm:p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <!-- Búsqueda principal -->
        <div class="md:col-span-2">
          <div class="relative">
            <input
              v-model="filtros.search"
              @input="debounceSearch"
              type="text"
              placeholder="Buscar servicios..."
              class="input-field w-full pl-10"
            />
          
            <div 
              v-if="filtros.search" 
              @click="limpiarBusqueda"
              class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
            >
              <span class="text-gray-400 hover:text-gray-600">✖</span>
            </div>
          </div>
        </div>

        <!-- Estado -->
        <div>
          <select v-model="filtros.activo" @change="aplicarFiltros" class="input-field w-full">
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <!-- Precio Mínimo -->
        <div>
          <input
            v-model="filtros.precio_min"
            @input="debounceSearch"
            type="number"
            step="0.01"
            placeholder="Precio mín"
            class="input-field w-full"
          />
        </div>

        <!-- Precio Máximo -->
        <div>
          <input
            v-model="filtros.precio_max"
            @input="debounceSearch"
            type="number"
            step="0.01"
            placeholder="Precio máx"
            class="input-field w-full"
          />
        </div>
      </div>

      <!-- Filtros aplicados -->
      <div v-if="tienesFiltrosActivos" class="flex flex-wrap gap-2 mt-4">
        <span class="text-sm text-gray-500">Filtros:</span>
        <span v-if="filtros.search" class="filter-badge">
          🔍 "{{ filtros.search }}"
          <button @click="filtros.search = ''; aplicarFiltros()" class="ml-1 text-red-500 hover:text-red-700">×</button>
        </span>
        <span v-if="filtros.activo === 'true'" class="filter-badge">
          ✅ Activos
          <button @click="filtros.activo = ''; aplicarFiltros()" class="ml-1 text-red-500 hover:text-red-700">×</button>
        </span>
        <span v-if="filtros.activo === 'false'" class="filter-badge">
          ❌ Inactivos
          <button @click="filtros.activo = ''; aplicarFiltros()" class="ml-1 text-red-500 hover:text-red-700">×</button>
        </span>
      </div>

      <!-- Controles de tabla -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
        <div class="text-sm text-gray-600">
          {{ pagination.totalItems || 0 }} servicios encontrados
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Items por página -->
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600">Items por página:</span>
            <select v-model="filtros.limit" @change="aplicarFiltros" class="input-field text-sm py-1">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
          
          <!-- Exportar -->
          <button
            @click="exportarExcel"
            class="btn-secondary text-sm"
            :disabled="cargando"
          >
            📊 Exportar
          </button>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="card overflow-hidden">
      <div v-if="cargando" class="p-8 text-center">
        <div class="spinner"></div>
        <p class="mt-2 text-gray-600">Cargando servicios...</p>
      </div>

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
              <th v-if="puede('servicios', 'verMedicamentos')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medicamentos
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Extras
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="servicio in servicios" :key="servicio.id" class="hover:bg-gray-50">
              <!-- Información del servicio -->
              <td class="px-6 py-4">
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ servicio.nombre || servicio.nombre_servicio || 'Sin nombre' }}</p>
                </div>
              </td>

              <!-- Precios -->
              <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                  
                  <span class="text-sm font-medium text-gray-900">{{ formatearPrecio(servicio.precio) }}</span>
                </div>
              </td>

              <!-- Comisión -->
              <td class="px-6 py-4">
                <span class="text-sm font-medium text-gray-900">{{ servicio.porcentaje_comision || servicio.comision_venta || 0 }}%</span>
              </td>

              <!-- Medicamentos -->
              <td v-if="puede('servicios', 'verMedicamentos')" class="px-6 py-4">
                <div class="flex items-center space-x-2">
                  <button
                    @click="verMedicamentosVinculados(servicio)"
                    :class="servicio.total_medicamentos > 0 ? 'btn-purple' : 'btn-gray'"
                    class="btn-icon"
                  >
                    💊
                  </button>
                  <span class="text-sm">{{ servicio.total_medicamentos || 0 }}</span>
                </div>
              </td>
              <!-- Extras -->
              <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                  <button
                    @click="servicio.requiere_extras ? verExtrasVinculados(servicio) : null"
                    :disabled="!servicio.requiere_extras"
                    :class="[
                      'btn-icon',
                      servicio.requiere_extras
                        ? (servicio.total_extras > 0 ? 'btn-orange' : 'btn-gray')
                        : 'btn-gray opacity-50 cursor-not-allowed'
                    ]"
                    title="Gestionar extras vinculados"
                  >
                    🧰
                  </button>
                  <span class="text-sm">
                    {{ servicio.requiere_extras ? servicio.total_extras || 0 : '-' }}
                  </span>
                </div>
              </td>


              <!-- Estado -->
              <td class="px-6 py-4">
                <span
                  :class="servicio.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  class="px-2 py-1 text-xs font-medium rounded-full"
                >
                  {{ servicio.activo ? '✅ Activo' : '❌ Inactivo' }}
                </span>
              </td>

              <!-- Acciones -->
              <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                  <!-- Ver detalles -->
                  <button
                    @click="verDetallesServicio(servicio)"
                    class="btn-icon btn-green"
                    title="Ver detalles completos"
                  >
                    👁️
                  </button>
                  
                  <button
                    v-if="puedeEditar('servicios')"
                    @click="editarServicio(servicio)"
                    class="btn-icon btn-blue"
                    title="Editar servicio"
                  >
                    ✏️
                  </button>
    
                
                  <button
                    v-if="puedeEliminar('servicios')"
                    @click="eliminarServicio(servicio)"
                    class="btn-icon btn-red"
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
      <div v-else class="text-center py-12">
        <div class="text-6xl mb-4">🏥</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No hay servicios</h3>
        <p class="text-gray-600 mb-6">
          {{ tienesFiltrosActivos ? 'No se encontraron servicios con los filtros aplicados' : 'Comienza agregando tu primer servicio médico' }}
        </p>
        <button v-if="!tienesFiltrosActivos" @click="abrirModalAgregar" class="btn-primary">
          ➕ Agregar Primer Servicio
        </button>
        <button v-else @click="limpiarFiltros" class="btn-secondary">
          🧹 Limpiar Filtros
        </button>
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="servicios.length > 0 && pagination.totalPages > 1" class="card p-4 mt-6">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="text-sm text-gray-700">
          Página {{ pagination.currentPage }} de {{ pagination.totalPages }}
          ({{ pagination.totalItems }} servicios total)
        </div>
        
        <div class="flex items-center space-x-2">
          <button
            @click="irAPagina(pagination.currentPage - 1)"
            :disabled="!pagination.hasPrevPage"
            class="pagination-btn"
          >
            ◀ Anterior
          </button>
          
          <button
            @click="irAPagina(pagination.currentPage + 1)"
            :disabled="!pagination.hasNextPage"
            class="pagination-btn"
          >
            Siguiente ▶
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Detalle Servicio -->
    <div v-if="mostrarModalDetalles" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-3xl w-full max-h-screen overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <h3 class="text-lg font-semibold text-gray-900">
              👁️ Detalles del Servicio
            </h3>
            <button @click="cerrarModalDetalles" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="servicioParaDetalles" class="space-y-6">
            <!-- Información básica -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-medium text-gray-900 mb-3">Información General</h4>
                <div class="space-y-2 text-sm">
                  <div><span class="text-gray-500">ID:</span> {{ servicioParaDetalles.id }}</div>
                  <div><span class="text-gray-500">Nombre:</span> {{ servicioParaDetalles.nombre || servicioParaDetalles.nombre_servicio }}</div>
                  <div class="flex items-center">
                    <span class="text-gray-500 mr-2">Estado:</span>
                    <span 
                      :class="servicioParaDetalles.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                      class="px-2 py-1 text-xs font-medium rounded-full"
                    >
                      {{ servicioParaDetalles.activo ? '✅ Activo' : '❌ Inactivo' }}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="font-medium text-gray-900 mb-3">Precios y Configuración</h4>
                <div class="space-y-2 text-sm">
                  <div><span class="text-gray-500">💰 Precio:</span> {{ formatearPrecio(servicioParaDetalles.precio) }}</div>
                  <div><span class="text-gray-500">💰 Monto Mínimo:</span> {{ formatearPrecio(servicioParaDetalles.monto_minimo) }}</div>
                  <div><span class="text-gray-500">📈 Comisión:</span> {{ servicioParaDetalles.porcentaje_comision || servicioParaDetalles.comision_venta || 0 }}%</div>
                </div>
              </div>
            </div>

            <!-- Medicamentos vinculados -->
            <div v-if="servicioParaDetalles.requiere_medicamentos">
              <h4 class="font-medium text-gray-900 mb-3">Medicamentos Requeridos</h4>
              
              <div v-if="detallesMedicamentos && detallesMedicamentos.length" class="space-y-3">
                <div 
                  v-for="medicamento in detallesMedicamentos" 
                  :key="medicamento.id"
                  class="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <div class="flex items-center space-x-3">
                    <div class="text-2xl">💊</div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ medicamento.nombre }}</p>
                      <p class="text-xs text-gray-600">
                        {{ medicamento.presentacion_nombre }} - {{ medicamento.laboratorio_nombre }}
                      </p>
                      <p class="text-xs text-blue-600">
                        Cantidad requerida: {{ medicamento.cantidad_requerida || 1 }}
                      </p>
                      <p class="text-xs text-green-600">
                        Precio: {{ formatearPrecio(medicamento.precio) }}
                      </p>
                    </div>
                  </div>
                  
                  <!-- Mostrar extras del medicamento -->
                  <div v-if="medicamento.requiere_extras" class="text-right">
                    <p class="text-xs text-gray-500">Incluye extras:</p>
                    <p class="text-xs text-orange-600">🧰 Materiales adicionales</p>
                  </div>
                </div>
              </div>

              <div v-else-if="cargandoDetalles" class="text-center py-4">
                <div class="spinner mr-2"></div>
                <span class="text-sm text-gray-600">Cargando medicamentos...</span>
              </div>

              <div v-else class="text-center py-6 bg-gray-50 rounded-lg">
                <p class="text-gray-600 text-sm">No hay medicamentos configurados</p>
                <button 
                  @click="abrirMedicamentosDesdeDetalle"
                  class="mt-2 text-blue-600 hover:underline text-sm"
                >
                  Configurar medicamentos
                </button>
              </div>
            </div>

            <div v-else class="bg-gray-50 rounded-lg p-4">
              <p class="text-gray-600 text-sm">Este servicio no requiere medicamentos específicos</p>
            </div>

            <!-- Extras vinculados -->
            <div v-if="servicioParaDetalles.requiere_extras" class="border-t pt-4 mt-4">
              <h4 class="font-medium text-gray-900 mb-3">Extras / Materiales Requeridos</h4>

              <div v-if="detallesExtras && detallesExtras.length" class="space-y-3">
                <div
                  v-for="extra in detallesExtras"
                  :key="extra.id"
                  class="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-4"
                >
                  <div class="flex items-center space-x-3">
                    <div class="text-2xl">🧰</div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ extra.nombre }}</p>
                      <p v-if="extra.descripcion" class="text-xs text-gray-600">
                        {{ extra.descripcion }}
                      </p>
                      <p class="text-xs text-orange-600">
                        Cantidad requerida: {{ extra.cantidad_requerida || 1 }}
                      </p>
                      <p class="text-xs text-gray-500">
                        Existencias actuales: {{ extra.existencias ?? 'N/D' }}
                      </p>
                    </div>
                  </div>

                  <div class="text-right">
                    <p class="text-xs text-gray-500">Costo unitario estimado</p>
                    <p class="text-sm font-semibold text-orange-600">
                      {{ formatearPrecio(extra.costo_unitario) }}
                    </p>
                  </div>
                </div>
              </div>

              <div v-else-if="cargandoExtras" class="text-center py-4">
                <div class="spinner mr-2"></div>
                <span class="text-sm text-gray-600">Cargando extras...</span>
              </div>

              <div v-else class="text-center py-6 bg-gray-50 rounded-lg">
                <p class="text-gray-600 text-sm">No hay extras configurados para este servicio</p>
                <button
                  @click="abrirExtrasDesdeDetalle"
                  class="mt-2 text-orange-600 hover:underline text-sm"
                >
                  Configurar extras
                </button>
              </div>
            </div>

            <div v-else class="bg-gray-50 rounded-lg p-4 mt-4">
              <p class="text-gray-600 text-sm">Este servicio no requiere materiales adicionales</p>
            </div>

            <!-- Fechas -->
            <div class="text-xs text-gray-500 border-t pt-4">
              <div><span class="font-medium">Creado:</span> {{ formatearFecha(servicioParaDetalles.fecha_creacion) }}</div>
              <div v-if="servicioParaDetalles.fecha_actualizacion">
                <span class="font-medium">Actualizado:</span> {{ formatearFecha(servicioParaDetalles.fecha_actualizacion) }}
              </div>
            </div>
          </div>

          <!-- Botones -->
          <div class="flex justify-end space-x-3 pt-6 border-t">
            <button @click="cerrarModalDetalles" class="btn-secondary">
              Cerrar
            </button>
            <button 
              v-if="servicioParaDetalles.requiere_medicamentos"
              @click="abrirMedicamentosDesdeDetalle"
              class="btn-secondary"
            >
              💊 Gestionar Medicamentos
            </button>
            <button
              v-if="servicioParaDetalles.requiere_extras"
              @click="abrirExtrasDesdeDetalle"
              class="btn-secondary"
            >
              🧰 Gestionar Extras
            </button>
            <button @click="editarDesdeDetalle" class="btn-primary">
              ✏️ Editar Servicio
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <ServiciosModal
      :visible="mostrarModal"
      :servicio="servicioSeleccionado"
      :modo="modoModal"
      @cerrar="cerrarModal"
      @guardado="onServicioGuardado"
    />

    <MedicamentosVinculadosModal
      :visible="mostrarModalMedicamentos && servicioParaMedicamentos"
      :servicio="servicioParaMedicamentos || {}"
      @close="cerrarModalMedicamentos"
      @updated="onMedicamentosActualizados"
    />


    <ExtrasVinculadosServiciosModal
      :visible="mostrarModalExtras && servicioParaExtras"
      :servicio="servicioParaExtras || {}"
      @close="cerrarModalExtras"
      @updated="onExtrasActualizados"
    />
  </div>
</template>

<script>
import serviciosService from '@/services/serviciosService'
import extrasService from '@/services/extrasService'
import ServiciosModal from '@/components/ServiciosModal.vue'
import MedicamentosVinculadosModal from '@/components/MedicamentosVinculadosModal.vue'
import ExtrasVinculadosServiciosModal from '@/components/ExtrasVinculadosServiciosModal.vue'
import { usePermisos } from '@/composables/usePermisos'

export default {
  name: 'ServiciosView',
  components: {
    ServiciosModal,
    MedicamentosVinculadosModal,
    ExtrasVinculadosServiciosModal
  },

  setup() {
    const { puedeEditar, puedeEliminar, puede } = usePermisos()
    return { puedeEditar, puedeEliminar, puede }
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
        page: 1,
        limit: 10
      },
      
      // Modales
      mostrarModal: false,
      mostrarModalMedicamentos: false,
      mostrarModalExtras: false,
      mostrarModalDetalles: false,
      servicioSeleccionado: null,
      servicioParaMedicamentos: null,
      servicioParaExtras: null,
      servicioParaDetalles: null,
      detallesMedicamentos: [],
      detallesExtras: [],
      cargandoDetalles: false,
      cargandoExtras: false,
      modoModal: 'crear',
      
      // Timeouts
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
        
        const params = {
          page: this.filtros.page,
          limit: this.filtros.limit
        }

        // Agregar filtros si tienen valor
        if (this.filtros.search?.trim()) {
          params.search = this.filtros.search.trim()
        }

        if (this.filtros.activo !== '') {
          params.activo = this.filtros.activo
        }

        if (this.filtros.precio_min) {
          params.precio_min = parseFloat(this.filtros.precio_min)
        }

        if (this.filtros.precio_max) {
          params.precio_max = parseFloat(this.filtros.precio_max)
        }

        console.log('🔍Parámetros de búsqueda:', params)

        const response = await serviciosService.getServicios(params)
        
        console.log('📋 Respuesta de servicios:', response)

        if (response.success) {
          this.servicios = response.data?.data || response.data || []
          this.pagination = response.data?.pagination || response.pagination || {}

          console.log(`✅ ${this.servicios.length} servicios cargados`)
          console.log('📊 Paginación:', this.pagination)
        } else {
          throw new Error(response.message || 'Error cargando servicios')
        }

      } catch (error) {
        console.error('❌ Error cargando servicios:', error)
        this.error = error.message || 'Error cargando servicios'
        this.servicios = []
        this.pagination = {}
      } finally {
        this.cargando = false
      }
    },

    async cargarEstadisticas() {
      try {
        console.log('📊 Cargando estadísticas...')
        
        const response = await serviciosService.getStats()
        
        console.log('📊 Estadísticas recibidas del backend:', response)
        
        this.stats = response.data || response || {}
        
        // Si no hay estadísticas del backend, calcular desde los servicios actuales
        if (!this.stats.total_servicios && this.servicios.length > 0) {
          this.stats = {
            total_servicios: this.servicios.length,
            servicios_activos: this.servicios.filter(s => s.activo).length,
            precio_promedio: this.servicios.reduce((sum, s) => sum + (s.precio || 0), 0) / this.servicios.length,
            con_medicamentos: this.servicios.filter(s => s.total_medicamentos > 0).length,
            con_extras: this.servicios.filter(s => s.requiere_extras).length
          }
          console.log('📊 Estadísticas calculadas localmente:', this.stats)
        }
        
      } catch (error) {
        console.error('❌ Error cargando estadísticas:', error)
        // Calcular estadísticas básicas desde servicios si falla
        if (this.servicios.length > 0) {
          this.stats = {
            total_servicios: this.servicios.length,
            servicios_activos: this.servicios.filter(s => s.activo).length,
            precio_promedio: this.servicios.reduce((sum, s) => sum + (s.precio || 0), 0) / this.servicios.length,
            con_medicamentos: this.servicios.filter(s => s.total_medicamentos > 0).length,
            con_extras: this.servicios.filter(s => s.requiere_extras).length            
          }
        }
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
      console.log('🔍 Aplicando filtros:', this.filtros)
      this.filtros.page = 1 // Reset a primera página
      await this.cargarServicios()
    },

    limpiarBusqueda() {
      this.filtros.search = ''
      this.aplicarFiltros()
    },

    limpiarFiltros() {
      this.filtros = {
        search: '',
        activo: '',
        precio_min: '',
        precio_max: '',
        page: 1,
        limit: this.filtros.limit
      }
      this.aplicarFiltros()
    },

    async irAPagina(page) {
      if (page >= 1 && page <= this.pagination.totalPages) {
        this.filtros.page = page
        await this.cargarServicios()
      }
    },

    // =====================================
    // MODAL CRUD SERVICIOS
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
      if (!confirm(`¿Eliminar el servicio "${servicio.nombre || servicio.nombre_servicio}"?\n\nEsta acción no se puede deshacer.`)) {
        return
      }

      try {
        console.log('🗑️ Eliminando servicio:', servicio)
        
        const response = await serviciosService.eliminarServicio(servicio.id)
        
        if (response.success) {
          console.log('✅ Servicio eliminado exitosamente')
          
          // Recargar datos
          await Promise.all([
            this.cargarServicios(),
            this.cargarEstadisticas()
          ])
          
        } else {
          throw new Error(response.message || 'Error eliminando servicio')
        }

      } catch (error) {
        console.error('❌ Error eliminando servicio:', error)
        this.error = error.message
      }
    },

    async onServicioGuardado(resultado) {
      console.log('✅ Servicio guardado, recargando datos...')
      
      this.cerrarModal()
      
      // Recargar datos
      await Promise.all([
        this.cargarServicios(),
        this.cargarEstadisticas()
      ])
      
      // Si se creó un servicio nuevo y requiere medicamentos, abrir modal medicamentos
      if (resultado?.abrirMedicamentos) {
        // Buscar el servicio recién creado
        const servicioNuevo =
          this.servicios.find(s => s.id === resultado.abrirMedicamentos.id) ||
          resultado.abrirMedicamentos
        if (servicioNuevo) {
          setTimeout(() => {
            this.verMedicamentosVinculados(servicioNuevo)
          }, 500)
        }
      }

      if (resultado?.abrirExtras) {
        const servicioNuevo =
          this.servicios.find(s => s.id === resultado.abrirExtras.id) ||
          resultado.abrirExtras
        if (servicioNuevo) {
          setTimeout(() => {
            this.verExtrasVinculados(servicioNuevo)
          }, 500)
        }
      }
    },

    cerrarModal() {
      this.mostrarModal = false
      this.servicioSeleccionado = null
      this.modoModal = 'crear'
    },

    // =====================================
    // MODAL DETALLES SERVICIO
    // =====================================

    async verDetallesServicio(servicio) {
      try {
        console.log('👁️ Abriendo detalles de servicio:', servicio)
        
        this.servicioParaDetalles = servicio
        this.mostrarModalDetalles = true
        this.detallesMedicamentos = []
        this.detallesExtras = []
        this.cargandoDetalles = false
        this.cargandoExtras = false
        
        // Si el servicio requiere medicamentos, cargar la lista
        if (servicio.requiere_medicamentos) {
          this.cargandoDetalles = true
          
          try {
            const response = await serviciosService.getMedicamentosVinculados(servicio.id)
            
            if (response.success) {
              this.detallesMedicamentos = response.data || []
              console.log(`💊 ${this.detallesMedicamentos.length} medicamentos cargados para detalles`)
            }
          } catch (error) {
            console.error('❌ Error cargando medicamentos para detalles:', error)
          } finally {
            this.cargandoDetalles = false
          }
        }
        if (servicio.requiere_extras) {
          this.cargandoExtras = true

          try {
            const response = await extrasService.getExtrasDeServicio(servicio.id)

            if (response.success) {
              this.detallesExtras = response.data || []
              console.log(`🧰 ${this.detallesExtras.length} extras cargados para detalles`)
            }
          } catch (error) {
            console.error('❌ Error cargando extras para detalles:', error)
          } finally {
            this.cargandoExtras = false
          }
        }


      } catch (error) {
        console.error('❌ Error abriendo detalles:', error)
        alert('Error cargando detalles del servicio')
      }
    },

    cerrarModalDetalles() {
      this.mostrarModalDetalles = false
      this.servicioParaDetalles = null
      this.detallesMedicamentos = []
      this.detallesExtras = []
    },

    abrirMedicamentosDesdeDetalle() {
      // Cerrar modal detalles y abrir medicamentos
      this.mostrarModalDetalles = false
      this.verMedicamentosVinculados(this.servicioParaDetalles)
    },
        abrirExtrasDesdeDetalle() {
      this.mostrarModalDetalles = false
      this.verExtrasVinculados(this.servicioParaDetalles)
    },

    editarDesdeDetalle() {
      // Cerrar modal detalles y abrir edición
      this.mostrarModalDetalles = false
      this.editarServicio(this.servicioParaDetalles)
    },

    // =====================================
    // MEDICAMENTOS VINCULADOS
    // =====================================

    verMedicamentosVinculados(servicio) {
      console.log('🎯 ABRIENDO MODAL MEDICAMENTOS PARA:', servicio)
      this.servicioParaMedicamentos = servicio
      this.mostrarModalMedicamentos = true
    },

    cerrarModalMedicamentos() {
      this.mostrarModalMedicamentos = false
      this.servicioParaMedicamentos = null
    },

    async onMedicamentosActualizados() {
      console.log('✅ Medicamentos actualizados, cerrando modal...')
      
      // Cerrar modal inmediatamente 
      this.cerrarModalMedicamentos()
      
      // Recargar datos
      await this.cargarServicios()
    },


    verExtrasVinculados(servicio) {
      console.log('🧰 Abriendo modal extras para servicio:', servicio)
      this.servicioParaExtras = servicio
      this.mostrarModalExtras = true
    },

    cerrarModalExtras() {
      this.mostrarModalExtras = false
      this.servicioParaExtras = null
    },

    async onExtrasActualizados() {
      console.log('✅ Extras actualizados, cerrando modal...')
      this.cerrarModalExtras()
      await this.cargarServicios()
    },

    // =====================================
    // NUEVAS ACCIONES
    // =====================================

    agregarAlCarrito(servicio) {
      console.log('🛒 Agregando al carrito:', servicio)
      
      if (confirm(`¿Agregar "${servicio.nombre || servicio.nombre_servicio}" al carrito?`)) {
        alert('¡Servicio agregado al carrito!\n(Funcionalidad por implementar)')
      }
    },

    // =====================================
    // UTILIDADES
    // =====================================

    formatearPrecio(precio) {
      if (!precio) return 'Q 0.00'
      return `Q ${parseFloat(precio).toFixed(2)}`
    },

    formatearFecha(fecha) {
      if (!fecha) return 'N/A'
      try {
        return new Date(fecha).toLocaleDateString('es-GT', {
          year: 'numeric',
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch {
        return 'N/A'
      }
    },

    async exportarExcel() {
      try {
        console.log('📊 Exportando servicios...')
        
        // Cargar TODOS los servicios sin paginación
        console.log('🔄 Cargando todos los servicios...')
        const response = await serviciosService.getServicios({ 
          limit: 10000,  // Límite alto para obtener todos
          page: 1,
          filtro: 'todos'
        })
        
        if (!response.data || response.data.length === 0) {
          alert('❌ No hay servicios para exportar')
          return
        }
        
        console.log(`✅ ${response.data.length} servicios cargados para exportar`)
        
        // Generar CSV con todos los servicios
        const csvContent = this.generarCSV(response.data)
        
        // ✅ CRÍTICO: Agregar BOM para UTF-8
        const BOM = '\uFEFF'
        
        // Crear blob con BOM
        const blob = new Blob([BOM + csvContent], { 
          type: 'text/csv;charset=utf-8;' 
        })
        
        // Descargar archivo
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `servicios_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        console.log('✅ Servicios exportados exitosamente')
        alert(`✅ Excel exportado: ${response.data.length} servicios`)
        
      } catch (error) {
        console.error('❌ Error exportando servicios:', error)
        this.error = error.message
        alert(`❌ Error exportando: ${error.message}`)
      }
    },


    generarCSV(servicios) {
      // ✅ Separador: punto y coma para Excel en español
      const SEPARADOR = ';'
      
      // ✅ Headers
      const headers = [
        'ID',
        'Nombre Servicio',
        'Precio',
        'Monto Mínimo',
        'Comisión (%)',
        'Requiere Medicamentos',
        'Total Medicamentos',
        'Estado',
        'Fecha Creación'
      ]
      
      // ✅ Escapar valores
      const escaparValor = (valor) => {
        if (valor === null || valor === undefined) return ''
        let valorStr = String(valor).trim()
        valorStr = valorStr.replace(/[\r\n\t]/g, ' ')
        
        if (valorStr.includes(SEPARADOR) || valorStr.includes('"')) {
          valorStr = valorStr.replace(/"/g, '""')
          return `"${valorStr}"`
        }
        return valorStr
      }
      
      // ✅ Formatear fecha
      const formatearFecha = (fecha) => {
        if (!fecha) return ''
        try {
          const date = new Date(fecha)
          const dia = String(date.getDate()).padStart(2, '0')
          const mes = String(date.getMonth() + 1).padStart(2, '0')
          const anio = date.getFullYear()
          return `${dia}/${mes}/${anio}`
        } catch {
          return ''
        }
      }
      
      // ✅ Formatear decimales con coma
      const formatearDecimal = (numero) => {
        if (numero === null || numero === undefined) return '0,00'
        return parseFloat(numero || 0).toFixed(2).replace('.', ',')
      }
      
      // ✅ Crear línea de headers
      const lineaHeaders = headers.map(h => escaparValor(h)).join(SEPARADOR)
      
      // ✅ Crear líneas de datos
      const lineasDatos = servicios.map(servicio => {
        const valores = [
          servicio.id || '',
          servicio.nombre || servicio.nombre_servicio || '',
          formatearDecimal(servicio.precio),
          formatearDecimal(servicio.monto_minimo),
          formatearDecimal(servicio.porcentaje_comision || servicio.comision_venta || 0),
          servicio.requiere_medicamentos ? 'Sí' : 'No',
          servicio.total_medicamentos || 0,
          servicio.activo ? 'Activo' : 'Inactivo',
          formatearFecha(servicio.fecha_creacion)
        ]
        
        return valores.map(v => escaparValor(v)).join(SEPARADOR)
      })
      
      // ✅ Combinar todo con saltos de línea CRLF (Windows)
      const csvCompleto = [lineaHeaders, ...lineasDatos].join('\r\n')
      
      console.log('📊 CSV de servicios generado:', {
        separador: SEPARADOR,
        headers: headers.length,
        filas: lineasDatos.length
      })
      
      return csvCompleto
    },

  }
}
</script>

<style scoped>
/* Usar los mismos estilos que farmacia */
.servicios-module {
  @apply space-y-6;
}

.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.filter-badge {
  @apply inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full;
}

.spinner {
  @apply inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin;
}

.pagination-btn {
  @apply px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Botones de iconos */
.btn-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors;
}

.btn-blue { @apply bg-blue-100 hover:bg-blue-200 text-blue-700; }
.btn-green { @apply bg-green-100 hover:bg-green-200 text-green-700; }
.btn-purple { @apply bg-purple-100 hover:bg-purple-200 text-purple-700; }
.btn-orange { @apply bg-orange-100 hover:bg-orange-200 text-orange-700; }
.btn-red { @apply bg-red-100 hover:bg-red-200 text-red-700; }
.btn-gray { @apply bg-gray-100 hover:bg-gray-200 text-gray-600; }

/* Botones principales */
.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50;
}

.btn-secondary {
  @apply bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50;
}

.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200;
}
</style>