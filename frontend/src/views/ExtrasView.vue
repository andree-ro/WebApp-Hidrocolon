<template>
  <div class="min-h-screen bg-gray-50 py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">

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



          <div>
            <h1 class="text-3xl font-bold text-gray-900 flex items-center">
              🧰 Módulo Extras
            </h1>
            <p class="mt-2 text-gray-600">Gestión de utensilios y materiales médicos</p>
          </div>
          <button
            @click="abrirModalAgregar"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <span>➕</span>
            <span>Agregar Extra</span>
          </button>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100 text-blue-600">
              🧰
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Extras Totales</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.total_extras || '--' }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
              ⚠️
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Stock Bajo</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.stock_bajo || '--' }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100 text-green-600">
              📦
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Stock Total</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.total_existencias || '--' }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-purple-100 text-purple-600">
              💰
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Precio Promedio</p>
              <p class="text-2xl font-semibold text-gray-900">Q {{ stats.precio_promedio || '--' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros de Búsqueda -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Filtros de Búsqueda</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Buscar Extra -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Buscar Extra</label>
            <input
              v-model="filtros.search"
              @input="buscarConDelay"
              type="text"
              placeholder="Nombre del extra..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>

          <!-- Filtros Rápidos -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Filtros Rápidos</label>
            <div class="flex space-x-2">
              <label class="flex items-center">
                <input
                  v-model="filtros.stock_bajo"
                  @change="aplicarFiltros"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="ml-2 text-sm text-gray-700">Stock Bajo</span>
              </label>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex items-end space-x-2">
            <button
              @click="limpiarFiltros"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              🧹 Limpiar Filtros
            </button>
            <button
              @click="exportarDatos"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              📊 Exportar Excel
            </button>
          </div>
        </div>
      </div>

      <!-- Tabla de Extras -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Lista de Extras</h3>
          <p class="text-sm text-gray-500">{{ extras.length }} extra(s) encontrado(s)</p>
        </div>

        <!-- Loading -->
        <div v-if="cargando" class="flex justify-center items-center py-12">
          <div class="spinner"></div>
          <span class="ml-2 text-gray-600">Cargando extras...</span>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="p-6 text-center text-red-600">
          ❌ {{ error }}
          <button @click="cargarExtras" class="ml-2 text-blue-600 hover:underline">
            Reintentar
          </button>
        </div>

        <!-- Tabla -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Extra
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="extra in extras" :key="extra.id" class="hover:bg-gray-50">
                <!-- Información del extra -->
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <span class="text-2xl mr-3">{{ extrasService.getExtraIcon(extra.nombre) }}</span>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ extra.nombre }}</p>
                      <p class="text-sm text-gray-500">{{ extra.descripcion || 'Sin descripción' }}</p>
                    </div>
                  </div>
                </td>

                <!-- Stock -->
                <td class="px-6 py-4">
                  <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium">{{ extra.existencias }}</span>
                    <span 
                      :class="extrasService.getStockStatus(extra.existencias, extra.stock_minimo).color"
                      class="px-2 py-1 text-xs rounded-full"
                    >
                      {{ extrasService.getStockStatus(extra.existencias, extra.stock_minimo).badge }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500">Mínimo: {{ extra.stock_minimo }}</p>
                </td>

                <!-- Precio -->
                <td class="px-6 py-4">
                  <span class="text-sm font-medium text-gray-900">
                    {{ extrasService.formatPrice(extra.costo_unitario) }}
                  </span>
                </td>

                <!-- Fecha -->
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-500">
                    {{ extrasService.formatDate(extra.fecha_creacion) }}
                  </span>
                </td>

                <!-- Acciones -->
                <td class="px-6 py-4">
                  <div class="flex space-x-1">
                    <!-- Ver detalle -->
                    <button
                      @click="verDetalle(extra)"
                      class="btn-icon btn-blue"
                      title="Ver detalle"
                    >
                      👁️
                    </button>

                    <!-- Editar -->
                    <button
                      @click="abrirModalEditar(extra)"
                      class="btn-icon btn-green"
                      title="Editar extra"
                    >
                      ✏️
                    </button>

                    <!-- Actualizar stock -->
                    <button
                      @click="abrirModalStock(extra)"
                      class="btn-icon btn-purple"
                      title="Actualizar stock"
                    >
                      📦
                    </button>

                    <!-- Eliminar -->
                    <button
                      @click="eliminarExtra(extra)"
                      class="btn-icon btn-red"
                      title="Eliminar extra"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Sin resultados -->
          <div v-if="!cargando && extras.length === 0" class="text-center py-12">
            <div class="text-gray-400 text-6xl mb-4">🧰</div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No hay extras</h3>
            <p class="text-gray-500 mb-4">No se encontraron extras con los filtros aplicados</p>
            <button
              @click="abrirModalAgregar"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              ➕ Agregar Primer Extra
            </button>
          </div>
        </div>

        <!-- Paginación -->
        <div v-if="pagination && pagination.total_pages > 1" class="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div class="flex justify-between items-center">
            <p class="text-sm text-gray-700">
              Mostrando {{ ((pagination.current_page - 1) * pagination.per_page) + 1 }} 
              a {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }} 
              de {{ pagination.total }} resultados
            </p>
            <div class="flex space-x-2">
              <button
                @click="cambiarPagina(pagination.current_page - 1)"
                :disabled="pagination.current_page <= 1"
                class="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span class="px-3 py-2 bg-blue-600 text-white rounded-md">
                {{ pagination.current_page }}
              </span>
              <button
                @click="cambiarPagina(pagination.current_page + 1)"
                :disabled="pagination.current_page >= pagination.total_pages"
                class="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Formulario (Agregar/Editar) -->
    <div v-if="modalFormulario.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-md w-full">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ modalFormulario.editando ? '✏️ Editar Extra' : '➕ Agregar Extra' }}
            </h3>
            <button @click="cerrarModalFormulario" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="guardarExtra" class="space-y-4">
            <!-- Nombre -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
              <input
                v-model="modalFormulario.datos.nombre"
                type="text"
                required
                maxlength="100"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del extra"
              >
            </div>

            <!-- Descripción -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea
                v-model="modalFormulario.datos.descripcion"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción del extra"
              ></textarea>
            </div>

            <!-- Existencias y Stock Mínimo -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Existencias *</label>
                <input
                  v-model.number="modalFormulario.datos.existencias"
                  type="number"
                  min="0"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Stock Mínimo *</label>
                <input
                  v-model.number="modalFormulario.datos.stock_minimo"
                  type="number"
                  min="1"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
              </div>
            </div>

            <!-- Precio Unitario -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Precio Unitario (Q) *</label>
              <input
                v-model.number="modalFormulario.datos.precio_unitario"
                type="number"
                step="0.01"
                min="0"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <!-- Botones -->
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="cerrarModalFormulario"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="modalFormulario.guardando"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {{ modalFormulario.guardando ? 'Guardando...' : (modalFormulario.editando ? 'Actualizar' : 'Crear') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Detalle -->
    <div v-if="modalDetalle.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <h3 class="text-lg font-semibold text-gray-900">
              👁️ Detalle del Extra
            </h3>
            <button @click="cerrarModalDetalle" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="modalDetalle.extra" class="space-y-6">
            <!-- Información general -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-medium text-gray-900 mb-3">Información General</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center">
                    <span class="text-2xl mr-2">{{ extrasService.getExtraIcon(modalDetalle.extra.nombre) }}</span>
                    <span class="font-medium">{{ modalDetalle.extra.nombre }}</span>
                  </div>
                  <div><span class="text-gray-500">Descripción:</span> {{ modalDetalle.extra.descripcion || 'Sin descripción' }}</div>
                  <div><span class="text-gray-500">ID:</span> {{ modalDetalle.extra.id }}</div>
                  <div><span class="text-gray-500">Estado:</span> 
                    <span class="text-green-600">{{ modalDetalle.extra.activo ? 'Activo' : 'Inactivo' }}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="font-medium text-gray-900 mb-3">Stock y Precios</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center">
                    <span class="text-gray-500 mr-2">Stock actual:</span>
                    <span class="font-medium mr-2">{{ modalDetalle.extra.existencias }}</span>
                    <span :class="extrasService.getStockStatus(modalDetalle.extra.existencias, modalDetalle.extra.stock_minimo).color" 
                          class="px-2 py-1 text-xs rounded-full">
                      {{ extrasService.getStockStatus(modalDetalle.extra.existencias, modalDetalle.extra.stock_minimo).badge }}
                    </span>
                  </div>
                  <div><span class="text-gray-500">Stock mínimo:</span> {{ modalDetalle.extra.stock_minimo }}</div>
                  <div><span class="text-gray-500">Precio unitario:</span> 
                    <span class="font-medium">{{ extrasService.formatPrice(modalDetalle.extra.costo_unitario) }}</span>
                  </div>
                  <div><span class="text-gray-500">Valor total inventario:</span> 
                    <span class="font-medium">{{ extrasService.formatPrice(modalDetalle.extra.existencias * modalDetalle.extra.costo_unitario) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fechas -->
            <div>
              <h4 class="font-medium text-gray-900 mb-3">Información de Registro</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span class="text-gray-500">Fecha de creación:</span> {{ extrasService.formatDate(modalDetalle.extra.fecha_creacion) }}</div>
                <div><span class="text-gray-500">Última actualización:</span> {{ extrasService.formatDate(modalDetalle.extra.fecha_actualizacion) }}</div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button @click="cerrarModalDetalle" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Cerrar
              </button>
              <button @click="abrirModalEditarDesdeDetalle" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                ✏️ Editar Extra
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Stock -->
    <div v-if="modalStock.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-md w-full">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-semibold text-gray-900">
              📦 Actualizar Stock
            </h3>
            <button @click="cerrarModalStock" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div v-if="modalStock.extra" class="space-y-4">
            <!-- Info del extra -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center">
                <span class="text-2xl mr-3">{{ extrasService.getExtraIcon(modalStock.extra.nombre) }}</span>
                <div>
                  <p class="font-medium">{{ modalStock.extra.nombre }}</p>
                  <p class="text-sm text-gray-500">Stock actual: {{ modalStock.extra.existencias }}</p>
                </div>
              </div>
            </div>

            <!-- Formulario -->
            <form @submit.prevent="actualizarStock" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nuevas Existencias *</label>
                <input
                  v-model.number="modalStock.cantidad"
                  type="number"
                  min="0"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Motivo (opcional)</label>
                <input
                  v-model="modalStock.motivo"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Compra, ajuste, pérdida, etc."
                >
              </div>

              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  @click="cerrarModalStock"
                  class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="modalStock.actualizando"
                  class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {{ modalStock.actualizando ? 'Actualizando...' : 'Actualizar Stock' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import extrasService from '@/services/extrasService'

export default {
  name: 'ExtrasView',
  
  data() {
    return {
      // Estados principales
      cargando: false,
      error: null,
      extrasService: extrasService, // ✅ Agregar al contexto
      
      // Datos
      extras: [],
      stats: {},
      pagination: {},
      
      // Filtros
      filtros: {
        search: '',
        stock_bajo: false,
        page: 1,
        limit: 20
      },
      
      // Búsqueda con delay
      searchTimeout: null,
      
      // Modal Formulario (Agregar/Editar)
      modalFormulario: {
        visible: false,
        editando: false,
        guardando: false,
        extraId: null,
        datos: {
          nombre: '',
          descripcion: '',
          existencias: 0,
          stock_minimo: 20,
          precio_unitario: 0
        }
      },
      
      // Modal Detalle
      modalDetalle: {
        visible: false,
        extra: null
      },
      
      // Modal Stock
      modalStock: {
        visible: false,
        extra: null,
        cantidad: '',
        motivo: '',
        actualizando: false
      }
    }
  },

  async mounted() {
    await this.inicializarModulo()
  },

  beforeUnmount() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }
  },

  methods: {
    // =====================================
    // INICIALIZACIÓN
    // =====================================

    async inicializarModulo() {
      try {
        console.log('🚀 Inicializando módulo extras...')
        
        // Cargar datos en paralelo
        await Promise.all([
          this.cargarExtras(),
          this.cargarEstadisticas()
        ])
        
        console.log('✅ Módulo extras inicializado exitosamente')
        
      } catch (error) {
        console.error('❌ Error inicializando extras:', error)
        this.error = 'Error cargando el módulo extras'
      }
    },

    async cargarExtras() {
      try {
        this.cargando = true
        this.error = null
        
        console.log('📊 Cargando extras con filtros:', this.filtros)
        
        const params = {
          page: this.filtros.page,
          limit: this.filtros.limit
        }
        
        if (this.filtros.search && this.filtros.search.trim()) {
          params.search = this.filtros.search.trim()
        }
        
        if (this.filtros.stock_bajo) {
          params.stock_bajo = 'true'
        }
        
        const response = await extrasService.getExtras(params)
        
        this.extras = response.extras || []
        this.pagination = response.pagination || {}
        
        console.log('✅ Extras cargados:', this.extras.length)
        
      } catch (error) {
        console.error('❌ Error cargando extras:', error)
        this.error = error.message
        this.extras = []
      } finally {
        this.cargando = false
      }
    },

    async cargarEstadisticas() {
      try {
        const stats = await extrasService.getStats()
        this.stats = stats
        console.log('✅ Estadísticas cargadas:', stats)
      } catch (error) {
        console.error('❌ Error cargando estadísticas:', error)
      }
    },

    // =====================================
    // FILTROS Y BÚSQUEDA
    // =====================================

    buscarConDelay() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      this.searchTimeout = setTimeout(() => {
        this.filtros.page = 1
        this.cargarExtras()
      }, 500)
    },

    aplicarFiltros() {
      this.filtros.page = 1
      this.cargarExtras()
    },

    limpiarFiltros() {
      this.filtros = {
        search: '',
        stock_bajo: false,
        page: 1,
        limit: 20
      }
      this.cargarExtras()
    },

    cambiarPagina(nuevaPagina) {
      if (nuevaPagina >= 1 && nuevaPagina <= this.pagination.total_pages) {
        this.filtros.page = nuevaPagina
        this.cargarExtras()
      }
    },

    // =====================================
    // MODALES
    // =====================================

    abrirModalAgregar() {
      this.modalFormulario = {
        visible: true,
        editando: false,
        guardando: false,
        extraId: null,
        datos: {
          nombre: '',
          descripcion: '',
          existencias: 0,
          stock_minimo: 20,
          precio_unitario: 0
        }
      }
    },

    abrirModalEditar(extra) {
      this.modalFormulario = {
        visible: true,
        editando: true,
        guardando: false,
        extraId: extra.id,
        datos: {
          nombre: extra.nombre,
          descripcion: extra.descripcion || '',
          existencias: extra.existencias,
          stock_minimo: extra.stock_minimo,
          precio_unitario: extra.costo_unitario // Nota: costo_unitario del backend -> precio_unitario en frontend
        }
      }
    },

    abrirModalEditarDesdeDetalle() {
      this.abrirModalEditar(this.modalDetalle.extra)
      this.cerrarModalDetalle()
    },

    cerrarModalFormulario() {
      this.modalFormulario = {
        visible: false,
        editando: false,
        guardando: false,
        extraId: null,
        datos: {
          nombre: '',
          descripcion: '',
          existencias: 0,
          stock_minimo: 20,
          precio_unitario: 0
        }
      }
    },

    verDetalle(extra) {
      this.modalDetalle = {
        visible: true,
        extra: extra
      }
    },

    cerrarModalDetalle() {
      this.modalDetalle = {
        visible: false,
        extra: null
      }
    },

    abrirModalStock(extra) {
      this.modalStock = {
        visible: true,
        extra: extra,
        cantidad: extra.existencias.toString(),
        motivo: '',
        actualizando: false
      }
      
      // Cerrar modal detalle si está abierto
      this.modalDetalle.visible = false
    },

    cerrarModalStock() {
      this.modalStock = {
        visible: false,
        extra: null,
        cantidad: '',
        motivo: '',
        actualizando: false
      }
    },

    // =====================================
    // CRUD OPERATIONS
    // =====================================

    async guardarExtra() {
      try {
        this.modalFormulario.guardando = true
        
        // Validar datos
        const validacion = extrasService.validarExtra(this.modalFormulario.datos)
        if (!validacion.valido) {
          alert(validacion.errores.join('\n'))
          return
        }
        
        if (this.modalFormulario.editando) {
          // Actualizar extra existente
          await extrasService.actualizarExtra(this.modalFormulario.extraId, this.modalFormulario.datos)
          alert('✅ Extra actualizado exitosamente')
        } else {
          // Crear nuevo extra
          await extrasService.crearExtra(this.modalFormulario.datos)
          alert('✅ Extra creado exitosamente')
        }
        
        // Recargar datos
        await Promise.all([
          this.cargarExtras(),
          this.cargarEstadisticas()
        ])
        
        this.cerrarModalFormulario()
        
      } catch (error) {
        console.error('❌ Error guardando extra:', error)
        alert(`❌ Error: ${error.message}`)
      } finally {
        this.modalFormulario.guardando = false
      }
    },

    async actualizarStock() {
      try {
        this.modalStock.actualizando = true
        
        const { extra, cantidad, motivo } = this.modalStock
        
        // Validar cantidad
        const validacion = extrasService.validarCantidad(cantidad, 9999)
        if (!validacion.valido) {
          alert(validacion.error)
          return
        }
        
        console.log('📦 Actualizando stock:', {
          id: extra.id,
          cantidad: validacion.cantidad,
          motivo: motivo || 'Ajuste manual'
        })
        
        await extrasService.actualizarStock(
          extra.id,
          validacion.cantidad,
          motivo || 'Ajuste manual'
        )
        
        // Recargar datos
        await Promise.all([
          this.cargarExtras(),
          this.cargarEstadisticas()
        ])
        
        this.cerrarModalStock()
        alert('✅ Stock actualizado exitosamente')
        
      } catch (error) {
        console.error('❌ Error actualizando stock:', error)
        alert(`❌ Error: ${error.message}`)
      } finally {
        this.modalStock.actualizando = false
      }
    },

    async eliminarExtra(extra) {
      try {
        // Confirmación doble por seguridad
        const confirmar1 = confirm(`¿Estás seguro de que deseas ELIMINAR el extra "${extra.nombre}"?`)
        if (!confirmar1) return
        
        const confirmar2 = confirm(`⚠️ ÚLTIMA CONFIRMACIÓN ⚠️\n\nEsto eliminará permanentemente:\n"${extra.nombre}"\n\n¿Continuar?`)
        if (!confirmar2) return
        
        console.log('🗑️ Eliminando extra:', extra.nombre)
        
        await extrasService.eliminarExtra(extra.id)
        
        // Recargar datos
        await Promise.all([
          this.cargarExtras(),
          this.cargarEstadisticas()
        ])
        
        alert(`✅ Extra "${extra.nombre}" eliminado exitosamente`)
        
      } catch (error) {
        console.error('❌ Error eliminando extra:', error)
        alert(`❌ Error eliminando extra: ${error.message}`)
      }
    },

    // =====================================
    // UTILIDADES
    // =====================================

    async exportarDatos() {
      try {
        // Crear CSV con todos los extras
        const todosExtras = await extrasService.getExtras({ limit: 1000 })
        const csvData = this.generarCSV(todosExtras.extras || [])
        
        // Descargar archivo
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `extras_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        console.log('✅ Datos exportados exitosamente')
        
      } catch (error) {
        console.error('❌ Error exportando datos:', error)
        alert('Error exportando datos')
      }
    },

    generarCSV(extras) {
      const headers = ['ID', 'Nombre', 'Descripción', 'Existencias', 'Stock Mínimo', 'Precio Unitario', 'Estado Stock', 'Fecha Creación']
      const csvHeaders = headers.join(',')
      
      const csvRows = extras.map(extra => 
        [
          extra.id,
          `"${extra.nombre}"`,
          `"${extra.descripcion || ''}"`,
          extra.existencias,
          extra.stock_minimo,
          extra.costo_unitario,
          extrasService.getStockStatus(extra.existencias, extra.stock_minimo).estado,
          extrasService.formatDate(extra.fecha_creacion)
        ].join(',')
      )
      
      return [csvHeaders, ...csvRows].join('\n')
    }
  }
}
</script>

<style scoped>
/* Estilos específicos del módulo extras */
.spinner {
  @apply inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin;
}

/* Botones de iconos */
.btn-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors;
}

.btn-blue { @apply bg-blue-100 hover:bg-blue-200 text-blue-700; }
.btn-green { @apply bg-green-100 hover:bg-green-200 text-green-700; }
.btn-purple { @apply bg-purple-100 hover:bg-purple-200 text-purple-700; }
.btn-red { @apply bg-red-100 hover:bg-red-200 text-red-700; }

/* Transiciones suaves para filtros */
.transition-colors {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

/* Hover effects para las filas de la tabla */
.hover\:bg-gray-50:hover {
  background-color: #f9fafb;
}

/* Scroll suave para la tabla en móvil */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
}
</style>