<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
      <div class="p-6">
        <!-- Header -->
        <div class="flex justify-between items-start mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              Medicamentos del Servicio
            </h3>
            <p class="text-sm text-gray-600 mt-1">
              Servicio: <span class="font-medium">{{ servicio?.nombre || servicio?.nombre_servicio || 'Sin nombre' }}</span>
            </p>
          </div>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Loading state -->
        <div v-if="cargando" class="flex justify-center items-center py-12">
          <div class="spinner mr-3"></div>
          <span class="text-gray-600">Cargando medicamentos...</span>
        </div>

        <!-- Content -->
        <div v-else class="space-y-6">
          <!-- Medicamentos vinculados actuales -->
          <div>
            <h4 class="text-md font-medium text-gray-900 mb-3">
              Medicamentos Vinculados ({{ medicamentosVinculados.length }})
            </h4>
            
            <div v-if="medicamentosVinculados.length > 0" class="space-y-3">
              <div 
                v-for="medicamento in medicamentosVinculados" 
                :key="medicamento.id"
                class="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <div class="flex items-center space-x-3">
                  <div class="text-2xl">💊</div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {{ medicamento.nombre }}
                    </p>
                    <p class="text-xs text-gray-600">
                      {{ medicamento.presentacion_nombre }} - {{ medicamento.laboratorio_nombre }}
                    </p>
                    <p class="text-xs text-blue-600">
                      Cantidad requerida: {{ medicamento.cantidad_requerida || 1 }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <!-- Cambiar cantidad -->
                  <button
                    @click="cambiarCantidad(medicamento)"
                    class="btn-icon btn-blue"
                    title="Cambiar cantidad"
                  >
                    📝
                  </button>
                  <!-- Desvincular -->
                  <button
                    @click="desvincularMedicamento(medicamento)"
                    class="btn-icon btn-red"
                    title="Quitar medicamento"
                    :disabled="desvinculando === medicamento.id"
                  >
                    <span v-if="desvinculando === medicamento.id" class="spinner-small"></span>
                    <span v-else>❌</span>
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 bg-gray-50 rounded-lg">
              <div class="text-4xl mb-2">💊</div>
              <p class="text-gray-600">No hay medicamentos vinculados</p>
              <p class="text-sm text-gray-500">Agrega medicamentos que requiere este servicio</p>
            </div>
          </div>

          <!-- Agregar nuevos medicamentos -->
          <div class="border-t pt-6">
            <h4 class="text-md font-medium text-gray-900 mb-3">
              Agregar Medicamentos
            </h4>
            
            <!-- Búsqueda de medicamentos -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Buscar Medicamento
                </label>
                <input
                  v-model="busquedaMedicamento"
                  type="text"
                  class="input-base"
                  placeholder="Nombre del medicamento..."
                  @input="buscarMedicamentos"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad Requerida
                </label>
                <input
                  v-model.number="cantidadNueva"
                  type="number"
                  min="1"
                  max="999"
                  class="input-base"
                  placeholder="1"
                />
              </div>
            </div>

            <!-- Lista de medicamentos disponibles -->
            <div v-if="medicamentosDisponibles.length > 0" class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="medicamento in medicamentosDisponibles"
                :key="medicamento.id"
                class="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
              >
                <div class="flex items-center space-x-3">
                  <div class="text-lg">💊</div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {{ medicamento.nombre }}
                    </p>
                    <p class="text-xs text-gray-600">
                      {{ medicamento.presentacion_nombre }} - {{ medicamento.laboratorio_nombre }}
                    </p>
                    <p class="text-xs text-green-600">
                      Stock: {{ medicamento.existencias }} - 💰 {{ formatPrice(medicamento.precio) }}
                    </p>
                  </div>
                </div>
                <button
                  @click="vincularMedicamento(medicamento)"
                  class="btn-small btn-primary"
                  :disabled="vinculando === medicamento.id"
                >
                  <span v-if="vinculando === medicamento.id" class="spinner-small mr-2"></span>
                  {{ vinculando === medicamento.id ? 'Agregando...' : 'Agregar' }}
                </button>
              </div>
            </div>

            <!-- Estado de búsqueda -->
            <div v-else-if="busquedaMedicamento && busquedaMedicamento.length > 2" class="text-center py-8 text-gray-500">
              <div class="text-2xl mb-2">🔍</div>
              <p>No se encontraron medicamentos con "{{ busquedaMedicamento }}"</p>
            </div>

            <div v-else-if="!busquedaMedicamento" class="text-center py-6 text-gray-400">
              <p class="text-sm">Escribe al menos 3 caracteres para buscar medicamentos</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-between items-center pt-6 border-t mt-6">
          <div class="text-sm text-gray-600">
            {{ medicamentosVinculados.length }} medicamento(s) vinculado(s)
          </div>
          <div class="flex space-x-3">
            <button @click="$emit('close')" class="btn-secondary">
              Cerrar
            </button>
            <button @click="guardarCambios" class="btn-primary" :disabled="!cambiosRealizados">
              ✅ Listo
            </button>
          </div>
        </div>
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
    visible: {
      type: Boolean,
      default: false
    },
    servicio: {
      type: Object,
      required: true
    }
  },
  
  emits: ['close', 'updated'],
  
  data() {
    return {
      cargando: false,
      medicamentosVinculados: [],
      medicamentosDisponibles: [],
      busquedaMedicamento: '',
      cantidadNueva: 1,
      vinculando: null,
      desvinculando: null,
      cambiosRealizados: false,
      searchTimeout: null
    }
  },
  
  watch: {
    visible(newVal) {
      console.log('👀 WATCH VISIBLE CAMBIÓ A:', newVal)
      console.log('👀 SERVICIO DISPONIBLE:', !!this.servicio)
      console.log('👀 SERVICIO ID:', this.servicio?.id)
      
      if (newVal) {
        console.log('🚀 EJECUTANDO INICIALIZAR...')
        this.inicializar()
      } else {
        console.log('🧹 LIMPIANDO DATOS...')
        this.limpiarDatos()
      }
    }
  },
  
  beforeUnmount() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }
  },
  
  methods: {
    async inicializar() {
      console.log('🔧 DENTRO DE INICIALIZAR')
      console.log('🔧 SERVICIO EN INICIALIZAR:', this.servicio)
      console.log('🔧 SERVICIO ID EN INICIALIZAR:', this.servicio?.id)
      
      await this.cargarMedicamentosVinculados()
    },

    async cargarMedicamentosVinculados() {
      console.log('💊 ENTRANDO A CARGAR MEDICAMENTOS VINCULADOS')
      
      try {
        this.cargando = true
        
        if (!this.servicio?.id) {
          console.log('❌ SERVICIO NO VÁLIDO:', this.servicio)
          throw new Error('Servicio no válido')
        }
        
        console.log('📞 LLAMANDO AL SERVICIO CON ID:', this.servicio.id)
        
        const response = await serviciosService.getMedicamentosVinculados(this.servicio.id)
        
        console.log('📦 RESPUESTA RECIBIDA:', response)
        
        this.medicamentosVinculados = response.data || []
        
        console.log('✅ MEDICAMENTOS ASIGNADOS:', this.medicamentosVinculados.length)
        
      } catch (error) {
        console.error('❌ ERROR EN CARGAR MEDICAMENTOS:', error)
        this.medicamentosVinculados = []
      } finally {
        this.cargando = false
      }
    },
    
    limpiarDatos() {
      this.medicamentosVinculados = []
      this.medicamentosDisponibles = []
      this.busquedaMedicamento = ''
      this.cantidadNueva = 1
      this.cambiosRealizados = false
    },

    buscarMedicamentos() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      this.searchTimeout = setTimeout(async () => {
        if (this.busquedaMedicamento.length < 3) {
          this.medicamentosDisponibles = []
          return
        }
        
        try {
          console.log('Buscando medicamentos:', this.busquedaMedicamento)
          
          const response = await farmaciaService.getMedicamentos({
            search: this.busquedaMedicamento,
            limit: 20,
            activo: true
          })
          
          const todosMedicamentos = response.data?.medicamentos || []
          
          // Filtrar medicamentos que ya están vinculados
          const idsVinculados = this.medicamentosVinculados.map(m => m.id)
          this.medicamentosDisponibles = todosMedicamentos.filter(
            medicamento => !idsVinculados.includes(medicamento.id)
          )
          
          console.log('Medicamentos disponibles:', this.medicamentosDisponibles.length)
          
        } catch (error) {
          console.error('Error buscando medicamentos:', error)
          this.medicamentosDisponibles = []
        }
      }, 500)
    },
    
    async vincularMedicamento(medicamento) {
      try {
        this.vinculando = medicamento.id
        
        const cantidad = this.cantidadNueva || 1
        
        console.log('Vinculando medicamento:', {
          servicio: this.servicio.id,
          medicamento: medicamento.id,
          cantidad
        })
        
        await serviciosService.vincularMedicamento(this.servicio.id, {
          medicamento_id: medicamento.id,
          cantidad_requerida: cantidad
        })
        
        // Agregar a la lista local
        this.medicamentosVinculados.push({
          ...medicamento,
          cantidad_requerida: cantidad
        })
        
        // Quitar de disponibles
        this.medicamentosDisponibles = this.medicamentosDisponibles.filter(
          m => m.id !== medicamento.id
        )
        
        this.cambiosRealizados = true
        
        console.log('Medicamento vinculado exitosamente')
        
      } catch (error) {
        console.error('Error vinculando medicamento:', error)
        alert(`Error: ${error.message}`)
      } finally {
        this.vinculando = null
      }
    },
    
    async desvincularMedicamento(medicamento) {
      if (!confirm(`¿Quitar "${medicamento.nombre}" de este servicio?`)) {
        return
      }
      
      try {
        this.desvinculando = medicamento.id
        
        console.log('Desvinculando medicamento:', {
          servicio: this.servicio.id,
          medicamento: medicamento.id
        })
        
        await serviciosService.desvincularMedicamento(this.servicio.id, medicamento.id)
        
        // Quitar de la lista local
        this.medicamentosVinculados = this.medicamentosVinculados.filter(
          m => m.id !== medicamento.id
        )
        
        this.cambiosRealizados = true
        
        console.log('Medicamento desvinculado exitosamente')
        
      } catch (error) {
        console.error('Error desvinculando medicamento:', error)
        alert(`Error: ${error.message}`)
      } finally {
        this.desvinculando = null
      }
    },
    
    async cambiarCantidad(medicamento) {
      const nuevaCantidad = prompt(
        `Cantidad requerida de "${medicamento.nombre}":`,
        medicamento.cantidad_requerida || 1
      )
      
      if (!nuevaCantidad || nuevaCantidad <= 0) return
      
      try {
        console.log('Cambiando cantidad:', {
          medicamento: medicamento.id,
          cantidad: nuevaCantidad
        })
        
        // Desvincular y volver a vincular con nueva cantidad
        await serviciosService.desvincularMedicamento(this.servicio.id, medicamento.id)
        await serviciosService.vincularMedicamento(this.servicio.id, {
          medicamento_id: medicamento.id,
          cantidad_requerida: parseInt(nuevaCantidad)
        })
        
        // Actualizar en lista local
        const index = this.medicamentosVinculados.findIndex(m => m.id === medicamento.id)
        if (index !== -1) {
          this.medicamentosVinculados[index].cantidad_requerida = parseInt(nuevaCantidad)
        }
        
        this.cambiosRealizados = true
        
        console.log('Cantidad actualizada exitosamente')
        
      } catch (error) {
        console.error('Error cambiando cantidad:', error)
        alert(`Error: ${error.message}`)
      }
    },
    
    guardarCambios() {
      console.log('Cambios guardados en medicamentos vinculados')
      this.$emit('updated')
      this.$emit('close')
    },
    
    formatPrice(precio) {
      if (!precio) return 'Q 0.00'
      return `Q ${parseFloat(precio).toFixed(2)}`
    }
  }
}
</script>

<style scoped>
.spinner {
  @apply inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin;
}

.spinner-small {
  @apply inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin;
}

.input-base {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50;
}

.btn-secondary {
  @apply bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50;
}

.btn-small {
  @apply px-3 py-1 text-sm rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50;
}

.btn-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors;
}

.btn-blue { @apply bg-blue-100 hover:bg-blue-200 text-blue-700; }
.btn-red { @apply bg-red-100 hover:bg-red-200 text-red-700; }
</style>