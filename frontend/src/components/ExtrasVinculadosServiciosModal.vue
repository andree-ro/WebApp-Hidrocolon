<!-- src/components/ExtrasVinculadosServiciosModal.vue -->
<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
      <div class="p-6">
        <!-- Header -->
        <div class="flex justify-between items-start mb-6">
          <h3 class="text-lg font-semibold text-gray-900">
            🧰 Gestionar Extras - {{ servicio?.nombre }}
          </h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Loading state -->
        <div v-if="cargando" class="flex justify-center items-center py-12">
          <div class="spinner mr-3"></div>
          <span class="text-gray-600">Cargando extras...</span>
        </div>

        <!-- Content -->
        <div v-else>
          <!-- Extras ya vinculados -->
          <div class="mb-6">
            <h4 class="font-medium text-gray-900 mb-3">Extras Vinculados</h4>
            <div v-if="extrasVinculados.length" class="space-y-2">
              <div 
                v-for="extra in extrasVinculados" 
                :key="extra.id" 
                class="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <div class="flex items-center">
                  <span class="text-2xl mr-3">{{ getExtraIcon(extra.nombre) }}</span>
                  <div>
                    <p class="font-medium">{{ extra.nombre }}</p>
                    <p class="text-sm text-gray-500">Cantidad requerida: {{ extra.cantidad_requerida }}</p>
                  </div>
                </div>
                <button 
                  @click="desvincularExtra(extra.id)" 
                  class="text-red-600 hover:text-red-800 text-sm"
                  :disabled="desvinculando === extra.id"
                >
                  <span v-if="desvinculando === extra.id" class="spinner-small mr-1"></span>
                  🗑️ Quitar
                </button>
              </div>
            </div>
            <p v-else class="text-gray-500 text-sm">No hay extras vinculados</p>
          </div>

          <!-- Agregar nuevo extra -->
          <div class="border-t pt-6">
            <h4 class="font-medium text-gray-900 mb-3">Agregar Extra</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Extra</label>
                <select v-model="nuevoExtra.id" class="input-base">
                  <option value="">Seleccionar extra...</option>
                  <option 
                    v-for="extra in extrasDisponibles" 
                    :key="extra.id" 
                    :value="extra.id"
                  >
                    {{ extra.nombre }} (Stock: {{ extra.existencias }})
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input 
                  v-model.number="nuevoExtra.cantidad" 
                  type="number" 
                  min="1" 
                  max="99" 
                  class="input-base" 
                  placeholder="1"
                >
              </div>
              <div class="flex items-end">
                <button 
                  @click="vincularExtra" 
                  :disabled="!nuevoExtra.id || !nuevoExtra.cantidad || vinculando"
                  class="btn-primary w-full disabled:opacity-50"
                >
                  <span v-if="vinculando" class="spinner-small mr-2"></span>
                  {{ vinculando ? 'Agregando...' : '➕ Agregar Extra' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-6 border-t mt-6">
          <button @click="$emit('close')" class="btn-secondary">
            Cerrar
          </button>
          <button @click="guardarCambios" class="btn-primary">
            ✅ Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import extrasService from '@/services/extrasService'

export default {
  name: 'ExtrasVinculadosServiciosModal',
  
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
      extrasVinculados: [],
      extrasDisponibles: [],
      nuevoExtra: { id: '', cantidad: 1 },
      vinculando: false,
      desvinculando: null
    }
  },

  watch: {
    visible: {
      immediate: true,
      handler(newValue) {
        if (newValue && this.servicio) {
          this.cargarDatos()
        } else {
          this.limpiarDatos()
        }
      }
    }
  },

  methods: {
    async cargarDatos() {
      try {
        this.cargando = true
        
        console.log('🧰 Cargando datos para servicio:', this.servicio.id)
        
        // Cargar en paralelo extras vinculados y disponibles
        const [extrasVinculados, extrasDisponibles] = await Promise.all([
          extrasService.getExtrasDeServicio(this.servicio.id),
          extrasService.getExtras({ limit: 100 })
        ])
        
        this.extrasVinculados = extrasVinculados.data || []
        this.extrasDisponibles = extrasDisponibles.extras || []
        
        console.log('✅ Datos cargados:', {
          vinculados: this.extrasVinculados.length,
          disponibles: this.extrasDisponibles.length
        })
        
      } catch (error) {
        console.error('❌ Error cargando datos:', error)
        alert('Error cargando datos de extras')
      } finally {
        this.cargando = false
      }
    },

    limpiarDatos() {
      this.extrasVinculados = []
      this.extrasDisponibles = []
      this.nuevoExtra = { id: '', cantidad: 1 }
      this.vinculando = false
      this.desvinculando = null
    },

    async vincularExtra() {
      try {
        this.vinculando = true
        
        console.log('🔗 Vinculando extra:', {
          servicio: this.servicio.id,
          extra: this.nuevoExtra.id,
          cantidad: this.nuevoExtra.cantidad
        })
        
        await extrasService.vincularExtraConServicio(
          this.servicio.id,
          this.nuevoExtra.id,
          this.nuevoExtra.cantidad
        )
        
        // Recargar datos
        await this.cargarDatos()
        
        // Limpiar formulario
        this.nuevoExtra = { id: '', cantidad: 1 }
        
        alert('✅ Extra vinculado exitosamente')
        
      } catch (error) {
        console.error('❌ Error vinculando extra:', error)
        alert(`❌ Error: ${error.message}`)
      } finally {
        this.vinculando = false
      }
    },

    async desvincularExtra(extraId) {
      try {
        const extra = this.extrasVinculados.find(e => e.id === extraId)
        const confirmar = confirm(`¿Desvincular "${extra?.nombre}" de este servicio?`)
        if (!confirmar) return
        
        this.desvinculando = extraId
        
        console.log('🔗 Desvinculando extra:', {
          servicio: this.servicio.id,
          extra: extraId
        })
        
        await extrasService.desvincularExtraDeServicio(this.servicio.id, extraId)
        
        // Recargar datos
        await this.cargarDatos()
        
        alert('✅ Extra desvinculado exitosamente')
        
      } catch (error) {
        console.error('❌ Error desvinculando extra:', error)
        alert(`❌ Error: ${error.message}`)
      } finally {
        this.desvinculando = null
      }
    },

    guardarCambios() {
      console.log('💾 Guardando cambios...')
      this.$emit('updated')
      this.$emit('close')
    },

    getExtraIcon(nombre) {
      // Mapeo de iconos basado en el nombre
      const iconos = {
        'alcohol': '🧴',
        'algodón': '🤍',
        'jeringa': '💉',
        'agujas': '🧰',
        'gasas': '🩹',
        'guantes': '🧤',
        'cubrebocas': '😷',
        'vendas': '🎗️',
        'curitas': '🩹'
      }
      
      const nombreLower = nombre.toLowerCase()
      for (const [key, icon] of Object.entries(iconos)) {
        if (nombreLower.includes(key)) return icon
      }
      
      return '🧰' // Icono por defecto
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
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
}
</style>