<!-- src/components/ExtrasModal.vue -->
<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-start mb-6">
          <h3 class="text-lg font-semibold text-gray-900">
            🧰 Gestionar Extras - {{ medicamento?.nombre }}
          </h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Extras ya vinculados -->
        <div class="mb-6">
          <h4 class="font-medium text-gray-900 mb-3">Extras Vinculados</h4>
          <div v-if="extrasVinculados.length" class="space-y-2">
            <div v-for="extra in extrasVinculados" :key="extra.id" 
                 class="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div class="flex items-center">
                <span class="text-2xl mr-3">{{ getExtraIcon(extra.nombre) }}</span>
                <div>
                  <p class="font-medium">{{ extra.nombre }}</p>
                  <p class="text-sm text-gray-500">Cantidad requerida: {{ extra.cantidad_requerida }}</p>
                </div>
              </div>
              <button @click="desvincularExtra(extra.id)" 
                      class="text-red-600 hover:text-red-800 text-sm">
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
                <option v-for="extra in extrasDisponibles" :key="extra.id" :value="extra.id">
                  {{ extra.nombre }} (Stock: {{ extra.existencias }})
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input v-model.number="nuevoExtra.cantidad" type="number" min="1" max="99" 
                     class="input-base" placeholder="1">
            </div>
            <div class="flex items-end">
              <button @click="vincularExtra" :disabled="!nuevoExtra.id || !nuevoExtra.cantidad"
                      class="btn-primary w-full disabled:opacity-50">
                ➕ Agregar Extra
              </button>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-6 border-t">
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
  name: 'ExtrasModal',
  props: {
    visible: { type: Boolean, default: false },
    medicamento: { type: Object, default: null }
  },
  emits: ['close', 'saved'],
  
  data() {
    return {
      extrasVinculados: [],
      extrasDisponibles: [],
      nuevoExtra: { id: '', cantidad: 1 },
      cargando: false
    }
  },

  watch: {
    visible: {
      immediate: true,
      handler(newValue) {
        if (newValue && this.medicamento) {
          this.cargarDatos()
        }
      }
    }
  },

  methods: {
    async cargarDatos() {
      try {
        this.cargando = true
        
        // Cargar en paralelo
        const [extrasVinculados, extrasDisponibles] = await Promise.all([
          extrasService.getExtrasDeMedicamento(this.medicamento.id),
          extrasService.getExtras({ limit: 100 })
        ])
        
        this.extrasVinculados = extrasVinculados || []
        this.extrasDisponibles = extrasDisponibles.extras || []
        
      } catch (error) {
        console.error('Error cargando datos:', error)
        alert('Error cargando datos de extras')
      } finally {
        this.cargando = false
      }
    },

    async vincularExtra() {
      try {
        await extrasService.vincularExtraConMedicamento(
          this.medicamento.id,
          this.nuevoExtra.id,
          this.nuevoExtra.cantidad
        )
        
        // Recargar datos
        await this.cargarDatos()
        
        // Limpiar formulario
        this.nuevoExtra = { id: '', cantidad: 1 }
        
        alert('✅ Extra vinculado exitosamente')
        
      } catch (error) {
        console.error('Error vinculando extra:', error)
        alert(`❌ Error: ${error.message}`)
      }
    },

    async desvincularExtra(extraId) {
      try {
        const confirmar = confirm('¿Desvincular este extra del medicamento?')
        if (!confirmar) return
        
        await extrasService.desvincularExtraDeMedicamento(this.medicamento.id, extraId)
        
        // Recargar datos
        await this.cargarDatos()
        
        alert('✅ Extra desvinculado exitosamente')
        
      } catch (error) {
        console.error('Error desvinculando extra:', error)
        alert(`❌ Error: ${error.message}`)
      }
    },

    guardarCambios() {
      this.$emit('saved')
      this.$emit('close')
    },

    getExtraIcon(nombre) {
      // Mapeo de iconos basado en el nombre
      const iconos = {
        'alcohol': '🧴',
        'algodón': '🤍',
        'jeringa': '💉',
        'gasas': '🩹',
        'guantes': '🧤',
        'cubrebocas': '😷',
        'vendas': '🎗️'
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