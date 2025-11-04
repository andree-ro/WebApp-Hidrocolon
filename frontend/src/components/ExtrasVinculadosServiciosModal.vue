<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
      <div class="p-6">
        <!-- Header -->
        <div class="flex justify-between items-start mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              🧰 Extras del Servicio
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
          <span class="text-gray-600">Cargando extras...</span>
        </div>

        <!-- Content -->
        <div v-else class="space-y-6">
          <!-- Extras vinculados actuales -->
          <div>
            <h4 class="text-md font-medium text-gray-900 mb-3">
              Extras Vinculados ({{ extrasVinculados.length }})
            </h4>

            <div v-if="extrasVinculados.length > 0" class="space-y-3">
              <div
                v-for="extra in extrasVinculados"
                :key="extra.id"
                class="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-4"
              >
                <div class="flex items-center space-x-3">
                  <div class="text-2xl">🧰</div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {{ extra.nombre }}
                    </p>
                    <p class="text-xs text-gray-600">
                      Stock: {{ extra.existencias }}
                    </p>
                    <p class="text-xs text-orange-600">
                      Cantidad requerida: {{ extra.cantidad_requerida || 1 }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center space-x-2">
                  <!-- Cambiar cantidad -->
                  <button
                    @click="cambiarCantidad(extra)"
                    class="btn-icon btn-blue"
                    title="Cambiar cantidad"
                  >
                    📝
                  </button>
                  <!-- Desvincular -->
                  <button
                    @click="desvincularExtra(extra)"
                    class="btn-icon btn-red"
                    title="Quitar extra"
                    :disabled="desvinculando === extra.id"
                  >
                    <span v-if="desvinculando === extra.id" class="spinner-small"></span>
                    <span v-else>❌</span>
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 bg-gray-50 rounded-lg">
              <div class="text-4xl mb-2">🧰</div>
              <p class="text-gray-600">No hay extras vinculados</p>
              <p class="text-sm text-gray-500">Agrega extras que requiere este servicio</p>
            </div>
          </div>

          <!-- Agregar nuevos extras -->
          <div class="border-t pt-6">
            <h4 class="text-md font-medium text-gray-900 mb-3">
              Agregar Extras
            </h4>

            <!-- Búsqueda de extras -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Buscar Extra
                </label>
                <input
                  v-model="busquedaExtra"
                  type="text"
                  class="input-base"
                  placeholder="Nombre del extra..."
                  @input="buscarExtras"
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

            <!-- Lista de extras disponibles -->
            <div v-if="extrasDisponibles.length > 0" class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="extra in extrasDisponibles"
                :key="extra.id"
                class="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
              >
                <div class="flex items-center space-x-3">
                  <div class="text-lg">🧰</div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {{ extra.nombre }}
                    </p>
                    <p class="text-xs text-gray-600">
                      Stock: {{ extra.existencias }}
                    </p>
                  </div>
                </div>
                <button
                  @click="vincularExtra(extra)"
                  class="btn-small btn-primary"
                  :disabled="vinculando === extra.id"
                >
                  <span v-if="vinculando === extra.id" class="spinner-small mr-2"></span>
                  {{ vinculando === extra.id ? 'Agregando...' : 'Agregar' }}
                </button>
              </div>
            </div>

            <!-- Estado de búsqueda -->
            <div v-else-if="busquedaExtra && busquedaExtra.length > 2" class="text-center py-8 text-gray-500">
              <div class="text-2xl mb-2">🔍</div>
              <p>No se encontraron extras con "{{ busquedaExtra }}"</p>
            </div>
            <div v-else-if="!busquedaExtra" class="text-center py-6 text-gray-400">
              <p class="text-sm">Escribe al menos 3 caracteres para buscar extras</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-between items-center pt-6 border-t mt-6">
          <div class="text-sm text-gray-600">
            {{ extrasVinculados.length }} extra(s) vinculado(s)
          </div>
          <div class="flex space-x-3">
            <button @click="$emit('close')" class="btn-secondary">
              Cerrar
            </button>
            <button
              @click="guardarCambios"
              class="btn-primary"
              :disabled="!cambiosRealizados"
            >
              ✅ Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import extrasService from '@/services/extrasService'

export default {
  name: 'ExtrasVinculadosModal',
  
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
      busquedaExtra: '',
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
      await this.cargarExtrasVinculados()
    },
    
    async cargarExtrasVinculados() {
      console.log('🧰 ENTRANDO A CARGAR EXTRAS VINCULADOS')
      try {
        this.cargando = true
        
        if (!this.servicio?.id) {
          console.log('❌ SERVICIO NO VÁLIDO:', this.servicio)
          throw new Error('Servicio no válido')
        }
        
        console.log('📞 LLAMANDO AL SERVICIO CON ID:', this.servicio.id)
        const response = await extrasService.getExtrasDeServicio(this.servicio.id)
        
        console.log('📦 RESPUESTA RECIBIDA:', response)
        this.extrasVinculados = response.data || []
        console.log('✅ EXTRAS ASIGNADOS:', this.extrasVinculados.length)
        
      } catch (error) {
        console.error('❌ ERROR EN CARGAR EXTRAS:', error)
        this.extrasVinculados = []
      } finally {
        this.cargando = false
      }
    },
    
    limpiarDatos() {
      this.extrasVinculados = []
      this.extrasDisponibles = []
      this.busquedaExtra = ''
      this.cantidadNueva = 1
      this.cambiosRealizados = false
    },
    
    buscarExtras() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      this.searchTimeout = setTimeout(async () => {
        if (this.busquedaExtra.length < 3) {
          this.extrasDisponibles = []
          return
        }
        
        try {
          console.log('Buscando extras:', this.busquedaExtra)
          const response = await extrasService.getExtras({
            search: this.busquedaExtra,
            limit: 20
          })
          
          const todosExtras = response.data?.extras || []
          
          // Filtrar extras que ya están vinculados
          const idsVinculados = this.extrasVinculados.map(e => e.id)
          this.extrasDisponibles = todosExtras.filter(
            extra => !idsVinculados.includes(extra.id)
          )
          
          console.log('Extras disponibles:', this.extrasDisponibles.length)
        } catch (error) {
          console.error('Error buscando extras:', error)
          this.extrasDisponibles = []
        }
      }, 500)
    },
    
    async vincularExtra(extra) {
      try {
        this.vinculando = extra.id
        const cantidad = this.cantidadNueva || 1
        
        console.log('Vinculando extra:', {
          servicio: this.servicio.id,
          extra: extra.id,
          cantidad
        })
        
        await extrasService.vincularExtraConServicio(
          this.servicio.id,
          extra.id,
          cantidad
        )
        
        // Agregar a la lista local
        this.extrasVinculados.push({
          ...extra,
          cantidad_requerida: cantidad
        })
        
        // Quitar de disponibles
        this.extrasDisponibles = this.extrasDisponibles.filter(
          e => e.id !== extra.id
        )
        
        this.cambiosRealizados = true
        console.log('Extra vinculado exitosamente')
        
      } catch (error) {
        console.error('Error vinculando extra:', error)
        alert(`Error: ${error.message}`)
      } finally {
        this.vinculando = null
      }
    },
    
    async desvincularExtra(extra) {
      if (!confirm(`¿Quitar "${extra.nombre}" de este servicio?`)) {
        return
      }
      
      try {
        this.desvinculando = extra.id
        
        console.log('Desvinculando extra:', {
          servicio: this.servicio.id,
          extra: extra.id
        })
        
        await extrasService.desvincularExtraDeServicio(this.servicio.id, extra.id)
        
        // Quitar de la lista local
        this.extrasVinculados = this.extrasVinculados.filter(
          e => e.id !== extra.id
        )
        
        this.cambiosRealizados = true
        console.log('Extra desvinculado exitosamente')
        
      } catch (error) {
        console.error('Error desvinculando extra:', error)
        alert(`Error: ${error.message}`)
      } finally {
        this.desvinculando = null
      }
    },
    
    async cambiarCantidad(extra) {
      const nuevaCantidad = prompt(
        `Cantidad requerida de "${extra.nombre}":`,
        extra.cantidad_requerida || 1
      )
      
      if (!nuevaCantidad || nuevaCantidad <= 0) return
      
      try {
        console.log('Cambiando cantidad:', {
          extra: extra.id,
          cantidad: nuevaCantidad
        })
        
        // Desvincular y volver a vincular con nueva cantidad
        await extrasService.desvincularExtraDeServicio(this.servicio.id, extra.id)
        await extrasService.vincularExtraConServicio(
          this.servicio.id,
          extra.id,
          parseInt(nuevaCantidad)
        )
        
        // Actualizar en lista local
        const index = this.extrasVinculados.findIndex(e => e.id === extra.id)
        if (index !== -1) {
          this.extrasVinculados[index].cantidad_requerida = parseInt(nuevaCantidad)
        }
        
        this.cambiosRealizados = true
        console.log('Cantidad actualizada exitosamente')
        
      } catch (error) {
        console.error('Error cambiando cantidad:', error)
        alert(`Error: ${error.message}`)
      }
    },
    
    guardarCambios() {
      console.log('Cambios guardados en extras vinculados')
      this.$emit('updated')
      this.$emit('close')
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

.btn-blue {
  @apply bg-blue-100 hover:bg-blue-200 text-blue-700;
}

.btn-red {
  @apply bg-red-100 hover:bg-red-200 text-red-700;
}
</style>