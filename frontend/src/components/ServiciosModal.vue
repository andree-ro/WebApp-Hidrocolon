<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-start mb-6">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ editando ? 'Editar Servicio' : 'Agregar Nuevo Servicio' }}
          </h3>
          <button @click="$emit('cerrar')" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="guardarServicio" class="space-y-6">
          <!-- Información básica -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio *</label>
              <input
                v-model="form.nombre_servicio"
                type="text"
                required
                class="input-base"
                placeholder="Ej: Hidrocolonterapia, Consulta General..."
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Precio Efectivo *</label>
              <input
                v-model.number="form.precio_efectivo"
                type="number"
                step="0.01"
                min="0"
                required
                class="input-base"
                placeholder="0.00"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Precio Tarjeta *</label>
              <input
                v-model.number="form.precio_tarjeta"
                type="number"
                step="0.01"
                min="0"
                required
                class="input-base"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Configuración financiera -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Monto Mínimo</label>
              <input
                v-model.number="form.monto_minimo"
                type="number"
                step="0.01"
                min="0"
                class="input-base"
                placeholder="0.00"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Porcentaje Comisión (%)</label>
              <input
                v-model.number="form.porcentaje_comision"
                type="number"
                step="0.01"
                min="0"
                max="100"
                class="input-base"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Configuración de medicamentos y estado -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <!-- Checkbox requiere medicamentos -->
              <div class="flex items-center">
                <input
                  v-model="form.requiere_medicamentos"
                  type="checkbox"
                  id="requiere_medicamentos"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label for="requiere_medicamentos" class="ml-2 text-sm text-gray-700">
                  Requiere medicamentos específicos
                </label>
              </div>

              <!-- Botón gestionar medicamentos -->
              <div v-if="form.requiere_medicamentos && editando">
                <button
                  type="button"
                  @click="abrirModalMedicamentos"
                  class="btn-secondary text-sm flex items-center space-x-2"
                >
                  <span>💊</span>
                  <span>Gestionar Medicamentos</span>
                </button>
                <p class="text-xs text-gray-500 mt-1">
                  {{ medicamentosVinculados.length }} medicamento(s) configurado(s)
                </p>
                <p class="text-xs text-blue-600 mt-1">
                  Los extras se toman automáticamente de cada medicamento
                </p>
              </div>

              <div v-else-if="form.requiere_medicamentos && !editando">
                <p class="text-xs text-gray-500">
                  Podrás gestionar los medicamentos después de crear el servicio
                </p>
                <p class="text-xs text-blue-600">
                  Los extras se toman automáticamente de cada medicamento
                </p>
              </div>
            </div>

            <div class="space-y-3">
              <!-- Estado activo -->
              <div class="flex items-center">
                <input
                  v-model="form.activo"
                  type="checkbox"
                  id="activo"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label for="activo" class="ml-2 text-sm text-gray-700">
                  Servicio activo
                </label>
              </div>
            </div>
          </div>

          <!-- Botones -->
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              @click="$emit('cerrar')"
              class="btn-secondary"
              :disabled="guardando"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="guardando"
            >
              <span v-if="guardando" class="spinner mr-2"></span>
              {{ guardando 
                 ? 'Guardando...' 
                 : editando 
                   ? 'Actualizar Servicio' 
                   : 'Crear Servicio' 
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Medicamentos Vinculados -->
    <MedicamentosVinculadosModal
      v-if="modalMedicamentos.visible"
      :visible="modalMedicamentos.visible"
      :servicio="servicio"
      @close="cerrarModalMedicamentos"
      @updated="recargarMedicamentos"
    />
  </div>
</template>

<script>
import serviciosService from '@/services/serviciosService'
import MedicamentosVinculadosModal from '@/components/MedicamentosVinculadosModal.vue'

export default {
  name: 'ServiciosModal',
  
  components: {
    MedicamentosVinculadosModal
  },
  
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    servicio: {
      type: Object,
      default: null
    },
    modo: {
      type: String,
      default: 'crear' // 'crear' o 'editar'
    }
  },
  
  emits: ['cerrar', 'guardado'],
  
  data() {
    return {
      guardando: false,
      medicamentosVinculados: [],
      modalMedicamentos: {
        visible: false
      },
      form: {
        nombre_servicio: '',
        precio_efectivo: 0,
        precio_tarjeta: 0,
        monto_minimo: 0,
        porcentaje_comision: 0,
        requiere_medicamentos: false,
        activo: true
      }
    }
  },
  
  computed: {
    editando() {
      return this.modo === 'editar' && this.servicio
    }
  },
  
  watch: {
    visible(newVal) {
      if (newVal) {
        this.inicializarFormulario()
      }
    },
    
    servicio: {
      handler(newVal) {
        if (newVal && this.visible) {
          this.inicializarFormulario()
        }
      },
      deep: true
    }
  },
  
  methods: {
    inicializarFormulario() {
      if (this.editando && this.servicio) {
        // Modo editar - cargar datos del servicio
        this.form = {
          nombre_servicio: this.servicio.nombre || this.servicio.nombre_servicio || '',
          precio_efectivo: parseFloat(this.servicio.precio_efectivo) || 0,
          precio_tarjeta: parseFloat(this.servicio.precio_tarjeta) || 0,
          monto_minimo: parseFloat(this.servicio.monto_minimo) || 0,
          porcentaje_comision: parseFloat(this.servicio.porcentaje_comision) || parseFloat(this.servicio.comision_venta) || 0,
          requiere_medicamentos: Boolean(this.servicio.requiere_medicamentos),
          activo: this.servicio.activo !== undefined ? Boolean(this.servicio.activo) : true
        }
        
        // Cargar medicamentos vinculados si los hay
        if (this.form.requiere_medicamentos) {
          this.cargarMedicamentosVinculados()
        }
      } else {
        // Modo crear - formulario limpio
        this.form = {
          nombre_servicio: '',
          precio_efectivo: 0,
          precio_tarjeta: 0,
          monto_minimo: 0,
          porcentaje_comision: 0,
          requiere_medicamentos: false,
          activo: true
        }
        this.medicamentosVinculados = []
      }
    },
    
    async cargarMedicamentosVinculados() {
      try {
        if (!this.servicio || !this.servicio.id) return
        
        const response = await serviciosService.getMedicamentosVinculados(this.servicio.id)
        this.medicamentosVinculados = response.data || []
        
        console.log('Medicamentos vinculados cargados:', this.medicamentosVinculados.length)
        
      } catch (error) {
        console.error('Error cargando medicamentos vinculados:', error)
        this.medicamentosVinculados = []
      }
    },
    
    abrirModalMedicamentos() {
      this.modalMedicamentos.visible = true
    },
    
    cerrarModalMedicamentos() {
      this.modalMedicamentos.visible = false
    },
    
    async recargarMedicamentos() {
      await this.cargarMedicamentosVinculados()
    },
    
    async guardarServicio() {
      try {
        this.guardando = true
        
        // Validaciones
        if (!this.form.nombre_servicio?.trim()) {
          alert('El nombre del servicio es obligatorio')
          return
        }
        
        if (!this.form.precio_efectivo || this.form.precio_efectivo <= 0) {
          alert('El precio en efectivo debe ser mayor a 0')
          return
        }
        
        if (!this.form.precio_tarjeta || this.form.precio_tarjeta <= 0) {
          alert('El precio con tarjeta debe ser mayor a 0')
          return
        }
        
        const datos = {
          nombre_servicio: this.form.nombre_servicio.trim(),
          precio_efectivo: parseFloat(this.form.precio_efectivo),
          precio_tarjeta: parseFloat(this.form.precio_tarjeta),
          monto_minimo: parseFloat(this.form.monto_minimo) || 0,
          comision_venta: parseFloat(this.form.porcentaje_comision) || 0,
          requiere_medicamentos: Boolean(this.form.requiere_medicamentos),
          activo: Boolean(this.form.activo)
        }
        
        console.log('Guardando servicio:', datos)
        
        let response
        if (this.editando) {
          response = await serviciosService.actualizarServicio(this.servicio.id, datos)
          alert('Servicio actualizado exitosamente')
        } else {
          response = await serviciosService.crearServicio(datos)
          alert('Servicio creado exitosamente')
          
          // Si requiere medicamentos y es nuevo, preguntar si quiere configurarlos
          if (datos.requiere_medicamentos && response.data?.id) {
            const configurarMedicamentos = confirm('¿Deseas configurar los medicamentos requeridos para este servicio ahora?')
            if (configurarMedicamentos) {
              // Emitir guardado y cerrar modal
              this.$emit('guardado', { abrirMedicamentos: response.data })
              return
            }
          }
        }
        
        this.$emit('guardado')
        
      } catch (error) {
        console.error('Error guardando servicio:', error)
        alert(`Error: ${error.message}`)
      } finally {
        this.guardando = false
      }
    }
  }
}
</script>

<style scoped>
.spinner {
  @apply inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin;
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
</style>