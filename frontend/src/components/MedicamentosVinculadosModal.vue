<!-- frontend/src/components/MedicamentosVinculadosModal.vue -->
<template>
  <div class="modal-overlay" @click="cerrarModal">
    <div class="modal-content-large" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div>
          <h3 class="text-lg font-medium text-gray-900">
            💊 Medicamentos Vinculados
          </h3>
          <p class="text-sm text-gray-600 mt-1">
            Servicio: {{ servicio?.nombre_servicio }}
          </p>
        </div>
        <button @click="cerrarModal" class="modal-close-btn">
          ❌
        </button>
      </div>

      <!-- Contenido del modal -->
      <div class="modal-body">
        <!-- Mensaje de error -->
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div class="flex items-center">
            <span class="text-red-600 mr-2">⚠️</span>
            <span class="text-red-800">{{ error }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Panel izquierdo: Medicamentos vinculados -->
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h4 class="text-md font-medium text-gray-900">
                🔗 Medicamentos Vinculados ({{ medicamentosVinculados.length }})
              </h4>
              
              <button
                @click="recargarMedicamentosVinculados"
                class="btn-secondary-sm"
                :disabled="cargandoVinculados"
                title="Recargar lista"
              >
                🔄
              </button>
            </div>

            <!-- Lista de medicamentos vinculados -->
            <div class="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <!-- Estado de carga -->
              <div v-if="cargandoVinculados" class="text-center py-8">
                <div class="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-r-transparent rounded-full"></div>
                <p class="mt-2 text-sm text-gray-600">Cargando medicamentos...</p>
              </div>

              <!-- Lista -->
              <div v-else-if="medicamentosVinculados.length > 0" class="space-y-3">
                <div
                  v-for="medicamento in medicamentosVinculados"
                  :key="medicamento.id"
                  class="bg-white rounded-lg p-3 border border-gray-200"
                >
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h5 class="font-medium text-gray-900 text-sm">
                        {{ medicamento.nombre }}
                      </h5>
                      <div class="text-xs text-gray-500 mt-1 space-y-1">
                        <div>Presentación: {{ medicamento.presentacion || 'N/A' }}</div>
                        <div>Cantidad requerida: {{ medicamento.cantidad_requerida }}</div>
                        <div class="flex items-center gap-2">
                          <span>Stock: {{ medicamento.stock }}</span>
                          <span 
                            :class="{
                              'text-red-500': medicamento.stock < 11,
                              'text-yellow-500': medicamento.stock >= 11 && medicamento.stock <= 50,
                              'text-green-500': medicamento.stock > 50
                            }"
                          >
                            {{ 
                              medicamento.stock < 11 ? '⚠️ Bajo' : 
                              medicamento.stock <= 50 ? '⚡ Medio' : '✅ Alto'
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      @click="desvincularMedicamento(medicamento)"
                      class="text-red-600 hover:text-red-800 p-1 rounded"
                      :disabled="eliminandoMedicamento"
                      title="Desvincular medicamento"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              <!-- Estado vacío -->
              <div v-else class="text-center py-8">
                <div class="text-4xl mb-2">💊</div>
                <p class="text-gray-600 text-sm">
                  No hay medicamentos vinculados a este servicio
                </p>
              </div>
            </div>
          </div>

          <!-- Panel derecho: Agregar medicamentos -->
          <div class="space-y-4">
            <h4 class="text-md font-medium text-gray-900">
              ➕ Vincular Nuevo Medicamento
            </h4>

            <!-- Formulario de vinculación -->
            <div class="bg-blue-50 rounded-lg p-4 space-y-4">
              <!-- Búsqueda de medicamentos -->
              <div>
                <label class="form-label">
                  🔍 Buscar Medicamento
                </label>
                <div class="relative">
                  <input
                    v-model="busquedaMedicamento"
                    @input="buscarMedicamentos"
                    type="text"
                    class="input-field"
                    placeholder="Buscar por nombre de medicamento..."
                    :disabled="vinculandoMedicamento"
                  />
                  
                  <!-- Dropdown de resultados -->
                  <div v-if="mostrarResultados && resultadosBusqueda.length > 0" 
                       class="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                    <div
                      v-for="medicamento in resultadosBusqueda"
                      :key="medicamento.id"
                      @click="seleccionarMedicamento(medicamento)"
                      class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div class="font-medium text-sm">{{ medicamento.nombre }}</div>
                      <div class="text-xs text-gray-500">
                        {{ medicamento.presentacion }} - Stock: {{ medicamento.stock }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Sin resultados -->
                  <div v-else-if="mostrarResultados && busquedaMedicamento && resultadosBusqueda.length === 0"
                       class="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 p-3 shadow-lg">
                    <div class="text-sm text-gray-500 text-center">
                      No se encontraron medicamentos
                    </div>
                  </div>
                </div>
              </div>

              <!-- Medicamento seleccionado -->
              <div v-if="medicamentoSeleccionado" class="bg-white rounded-lg p-3 border border-blue-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <h5 class="font-medium text-gray-900 text-sm">
                      {{ medicamentoSeleccionado.nombre }}
                    </h5>
                    <div class="text-xs text-gray-500">
                      {{ medicamentoSeleccionado.presentacion }} - Stock: {{ medicamentoSeleccionado.stock }}
                    </div>
                  </div>
                  <button
                    @click="limpiarSeleccion"
                    class="text-gray-400 hover:text-gray-600"
                    title="Limpiar selección"
                  >
                    ❌
                  </button>
                </div>

                <!-- Cantidad requerida -->
                <div>
                  <label class="form-label text-sm">
                    📦 Cantidad Requerida
                  </label>
                  <input
                    v-model="cantidadRequerida"
                    type="number"
                    min="1"
                    max="999"
                    class="input-field"
                    placeholder="1"
                    :disabled="vinculandoMedicamento"
                  />
                  <div class="text-xs text-gray-500 mt-1">
                    Cantidad necesaria de este medicamento para el servicio
                  </div>
                </div>

                <!-- Botón vincular -->
                <button
                  @click="vincularMedicamento"
                  class="btn-primary w-full mt-4"
                  :disabled="vinculandoMedicamento || !cantidadRequerida"
                >
                  <span v-if="vinculandoMedicamento" class="animate-spin inline-block w-4 h-4 border-2 border-white border-r-transparent rounded-full mr-2"></span>
                  {{ vinculandoMedicamento ? 'Vinculando...' : '🔗 Vincular Medicamento' }}
                </button>
              </div>

              <!-- Instrucciones -->
              <div v-else class="text-center py-6 text-gray-500 text-sm">
                <div class="text-2xl mb-2">💊</div>
                <p>Busca y selecciona un medicamento para vincularlo</p>
              </div>
            </div>

            <!-- Medicamentos disponibles (muestra) -->
            <div>
              <h5 class="text-sm font-medium text-gray-700 mb-2">
                📋 Medicamentos Disponibles (últimos agregados)
              </h5>
              <div class="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div v-if="cargandoDisponibles" class="text-center py-4">
                  <div class="animate-spin inline-block w-4 h-4 border-2 border-gray-400 border-r-transparent rounded-full"></div>
                </div>
                
                <div v-else-if="medicamentosDisponibles.length > 0" class="space-y-2">
                  <div
                    v-for="medicamento in medicamentosDisponibles.slice(0, 5)"
                    :key="medicamento.id"
                    @click="seleccionarMedicamento(medicamento)"
                    class="text-xs p-2 bg-white rounded border cursor-pointer hover:bg-blue-50"
                  >
                    <div class="font-medium">{{ medicamento.nombre }}</div>
                    <div class="text-gray-500">Stock: {{ medicamento.stock }}</div>
                  </div>
                </div>
                
                <div v-else class="text-center py-4 text-xs text-gray-500">
                  No hay medicamentos disponibles
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button
          @click="cerrarModal"
          class="btn-secondary"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import serviciosService from '@/services/serviciosService'
import farmaciaService from '@/services/farmaciaService'

export default {
  name: 'MedicamentosVinculadosModal',
  
  props: {
    servicio: {
      type: Object,
      required: true
    }
  },

  emits: ['cerrar', 'actualizado'],

  data() {
    return {
      // Estados principales
      medicamentosVinculados: [],
      medicamentosDisponibles: [],
      
      // Estados de carga
      cargandoVinculados: false,
      cargandoDisponibles: false,
      vinculandoMedicamento: false,
      eliminandoMedicamento: false,
      
      // Búsqueda y selección
      busquedaMedicamento: '',
      resultadosBusqueda: [],
      mostrarResultados: false,
      medicamentoSeleccionado: null,
      cantidadRequerida: 1,
      
      // Error
      error: null,
      
      // Timeouts
      busquedaTimeout: null
    }
  },

  async mounted() {
    console.log('💊 Inicializando modal de medicamentos vinculados...')
    await this.inicializarModal()
  },

  beforeUnmount() {
    if (this.busquedaTimeout) {
      clearTimeout(this.busquedaTimeout)
    }
  },

  methods: {
    async inicializarModal() {
      try {
        await Promise.all([
          this.cargarMedicamentosVinculados(),
          this.cargarMedicamentosDisponibles()
        ])
      } catch (error) {
        console.error('❌ Error inicializando modal:', error)
        this.error = error.message
      }
    },

    async cargarMedicamentosVinculados() {
      try {
        this.cargandoVinculados = true
        this.error = null
        
        console.log('📋 Cargando medicamentos vinculados...')
        
        const response = await serviciosService.getMedicamentosVinculados(this.servicio.id)
        
        this.medicamentosVinculados = response.data || []
        
        console.log('✅ Medicamentos vinculados cargados:', this.medicamentosVinculados.length)
        
      } catch (error) {
        console.error('❌ Error cargando medicamentos vinculados:', error)
        this.error = error.message
        this.medicamentosVinculados = []
      } finally {
        this.cargandoVinculados = false
      }
    },

    async cargarMedicamentosDisponibles() {
      try {
        this.cargandoDisponibles = true
        
        console.log('📋 Cargando medicamentos disponibles...')
        
        const response = await farmaciaService.getMedicamentos({
          limit: 20,
          page: 1
        })
        
        this.medicamentosDisponibles = response.data?.medicamentos || []
        
        console.log('✅ Medicamentos disponibles cargados:', this.medicamentosDisponibles.length)
        
      } catch (error) {
        console.error('❌ Error cargando medicamentos disponibles:', error)
        this.medicamentosDisponibles = []
      } finally {
        this.cargandoDisponibles = false
      }
    },

    async buscarMedicamentos() {
      if (this.busquedaTimeout) {
        clearTimeout(this.busquedaTimeout)
      }

      this.busquedaTimeout = setTimeout(async () => {
        const query = this.busquedaMedicamento.trim()
        
        if (query.length < 2) {
          this.resultadosBusqueda = []
          this.mostrarResultados = false
          return
        }

        try {
          console.log('🔍 Buscando medicamentos:', query)
          
          const response = await farmaciaService.getMedicamentos({
            search: query,
            limit: 10,
            page: 1
          })
          
          this.resultadosBusqueda = response.data?.medicamentos || []
          this.mostrarResultados = true
          
          console.log('✅ Resultados de búsqueda:', this.resultadosBusqueda.length)
          
        } catch (error) {
          console.error('❌ Error buscando medicamentos:', error)
          this.resultadosBusqueda = []
          this.mostrarResultados = false
        }
      }, 300)
    },

    seleccionarMedicamento(medicamento) {
      console.log('👆 Medicamento seleccionado:', medicamento.nombre)
      
      // Verificar si ya está vinculado
      const yaVinculado = this.medicamentosVinculados.find(m => m.id === medicamento.id)
      if (yaVinculado) {
        this.error = 'Este medicamento ya está vinculado al servicio'
        return
      }
      
      this.medicamentoSeleccionado = medicamento
      this.busquedaMedicamento = medicamento.nombre
      this.mostrarResultados = false
      this.cantidadRequerida = 1
      this.error = null
    },

    limpiarSeleccion() {
      this.medicamentoSeleccionado = null
      this.busquedaMedicamento = ''
      this.mostrarResultados = false
      this.cantidadRequerida = 1
      this.error = null
    },

    async vincularMedicamento() {
      if (!this.medicamentoSeleccionado || !this.cantidadRequerida) {
        this.error = 'Selecciona un medicamento y especifica la cantidad'
        return
      }

      try {
        this.vinculandoMedicamento = true
        this.error = null
        
        console.log('🔗 Vinculando medicamento:', {
          servicio_id: this.servicio.id,
          medicamento_id: this.medicamentoSeleccionado.id,
          cantidad_requerida: this.cantidadRequerida
        })
        
        await serviciosService.vincularMedicamento(this.servicio.id, {
          medicamento_id: this.medicamentoSeleccionado.id,
          cantidad_requerida: parseInt(this.cantidadRequerida)
        })
        
        console.log('✅ Medicamento vinculado exitosamente')
        
        // Recargar lista y limpiar formulario
        await this.cargarMedicamentosVinculados()
        this.limpiarSeleccion()
        
        // Notificar al componente padre
        this.$emit('actualizado')
        
      } catch (error) {
        console.error('❌ Error vinculando medicamento:', error)
        this.error = error.message
      } finally {
        this.vinculandoMedicamento = false
      }
    },

    async desvincularMedicamento(medicamento) {
      if (!confirm(`¿Desvincular "${medicamento.nombre}" de este servicio?`)) {
        return
      }

      try {
        this.eliminandoMedicamento = true
        this.error = null
        
        console.log('🚫 Desvinculando medicamento:', medicamento.id)
        
        await serviciosService.desvincularMedicamento(this.servicio.id, medicamento.id)
        
        console.log('✅ Medicamento desvinculado exitosamente')
        
        // Recargar lista
        await this.cargarMedicamentosVinculados()
        
        // Notificar al componente padre
        this.$emit('actualizado')
        
      } catch (error) {
        console.error('❌ Error desvinculando medicamento:', error)
        this.error = error.message
      } finally {
        this.eliminandoMedicamento = false
      }
    },

    async recargarMedicamentosVinculados() {
      await this.cargarMedicamentosVinculados()
    },

    cerrarModal() {
      this.$emit('cerrar')
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4;
}

.modal-content-large {
  @apply bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto;
}

.modal-header {
  @apply flex justify-between items-start p-6 border-b border-gray-200;
}

.modal-body {
  @apply p-6;
}

.modal-footer {
  @apply flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50;
}

.modal-close-btn {
  @apply text-gray-400 hover:text-gray-600 focus:outline-none;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary-sm {
  @apply bg-gray-300 hover:bg-gray-400 text-gray-800 px-2 py-1 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>