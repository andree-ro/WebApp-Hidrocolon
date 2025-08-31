<!-- frontend/src/components/ServiciosModal.vue -->
<template>
  <div class="modal-overlay" @click="cerrarModal">
    <div class="modal-content" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <h3 class="text-lg font-medium text-gray-900">
          {{ modo === 'crear' ? '➕ Agregar Nuevo Servicio' : '✏️ Editar Servicio' }}
        </h3>
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

        <!-- Formulario -->
        <form @submit.prevent="guardarServicio" class="space-y-6">
          <!-- Información básica -->
          <div class="grid grid-cols-1 gap-6">
            <!-- Nombre del servicio -->
            <div>
              <label class="form-label">
                🏥 Nombre del Servicio *
              </label>
              <input
                v-model="formulario.nombre_servicio"
                type="text"
                class="input-field"
                :class="{ 'border-red-500': errores.nombre_servicio }"
                placeholder="Ej: Consulta General, Ultrasonido, etc."
                maxlength="100"
                required
              />
              <div v-if="errores.nombre_servicio" class="text-red-500 text-sm mt-1">
                {{ errores.nombre_servicio }}
              </div>
            </div>

            <!-- Descripción -->
            <div>
              <label class="form-label">
                📝 Descripción
              </label>
              <textarea
                v-model="formulario.descripcion"
                class="input-field"
                rows="3"
                placeholder="Descripción detallada del servicio (opcional)"
                maxlength="255"
              ></textarea>
              <div class="text-xs text-gray-500 mt-1">
                {{ formulario.descripcion?.length || 0 }}/255 caracteres
              </div>
            </div>
          </div>

          <!-- Precios -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-900 mb-4">💰 Configuración de Precios</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Precio en efectivo -->
              <div>
                <label class="form-label">
                  💵 Precio Efectivo *
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Q</span>
                  <input
                    v-model="formulario.precio_efectivo"
                    type="number"
                    step="0.01"
                    min="0"
                    class="input-field pl-8"
                    :class="{ 'border-red-500': errores.precio_efectivo }"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div v-if="errores.precio_efectivo" class="text-red-500 text-sm mt-1">
                  {{ errores.precio_efectivo }}
                </div>
              </div>

              <!-- Precio con tarjeta -->
              <div>
                <label class="form-label">
                  💳 Precio Tarjeta *
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Q</span>
                  <input
                    v-model="formulario.precio_tarjeta"
                    type="number"
                    step="0.01"
                    min="0"
                    class="input-field pl-8"
                    :class="{ 'border-red-500': errores.precio_tarjeta }"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div v-if="errores.precio_tarjeta" class="text-red-500 text-sm mt-1">
                  {{ errores.precio_tarjeta }}
                </div>
              </div>
            </div>

            <!-- Auto-calcular precio tarjeta -->
            <div class="mt-4">
              <label class="flex items-center">
                <input
                  v-model="autoCalcularTarjeta"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="ml-2 text-sm text-gray-700">
                  Calcular precio tarjeta automáticamente (+3% del efectivo)
                </span>
              </label>
            </div>
          </div>

          <!-- Configuración adicional -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Monto mínimo -->
            <div>
              <label class="form-label">
                💎 Monto Mínimo
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Q</span>
                <input
                  v-model="formulario.monto_minimo"
                  type="number"
                  step="0.01"
                  min="0"
                  class="input-field pl-8"
                  placeholder="0.00"
                />
              </div>
              <div class="text-xs text-gray-500 mt-1">
                Monto mínimo requerido para este servicio
              </div>
            </div>

            <!-- Porcentaje de comisión -->
            <div>
              <label class="form-label">
                📊 Comisión (%)
              </label>
              <div class="relative">
                <input
                  v-model="formulario.porcentaje_comision"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  class="input-field pr-8"
                  :class="{ 'border-red-500': errores.porcentaje_comision }"
                  placeholder="0.00"
                />
                <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
              <div v-if="errores.porcentaje_comision" class="text-red-500 text-sm mt-1">
                {{ errores.porcentaje_comision }}
              </div>
            </div>
          </div>

          <!-- Configuración de medicamentos -->
          <div class="bg-purple-50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-900 mb-4">💊 Medicamentos</h4>
            
            <div class="space-y-3">
              <!-- Requiere medicamentos -->
              <label class="flex items-center">
                <input
                  v-model="formulario.requiere_medicamentos"
                  type="checkbox"
                  class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span class="ml-2 text-sm text-gray-700">
                  Este servicio requiere medicamentos específicos
                </span>
              </label>

              <!-- Descuento por medicamento -->
              <div v-if="formulario.requiere_medicamentos">
                <label class="form-label text-sm">
                  🏷️ Descuento por Medicamento (%)
                </label>
                <div class="relative">
                  <input
                    v-model="formulario.descuento_medicamento"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    class="input-field pr-8 text-sm"
                    placeholder="0.00"
                  />
                  <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  Descuento aplicado cuando se incluyen medicamentos
                </div>
              </div>
            </div>
          </div>

          <!-- Estado del servicio -->
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 class="text-sm font-medium text-gray-900">Estado del Servicio</h4>
              <p class="text-sm text-gray-600">
                {{ formulario.activo ? 'Servicio activo y disponible' : 'Servicio inactivo (no visible)' }}
              </p>
            </div>
            
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="formulario.activo"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
              </div>
            </label>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button
          @click="cerrarModal"
          type="button"
          class="btn-secondary"
          :disabled="guardando"
        >
          Cancelar
        </button>
        
        <button
          @click="guardarServicio"
          type="button"
          class="btn-primary"
          :disabled="guardando"
        >
          <span v-if="guardando" class="animate-spin inline-block w-4 h-4 border-2 border-white border-r-transparent rounded-full mr-2"></span>
          {{ guardando ? 'Guardando...' : (modo === 'crear' ? 'Crear Servicio' : 'Actualizar Servicio') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import serviciosService from '@/services/serviciosService'

export default {
  name: 'ServiciosModal',
  
  props: {
    servicio: {
      type: Object,
      default: null
    },
    modo: {
      type: String,
      required: true,
      validator: value => ['crear', 'editar'].includes(value)
    }
  },

  emits: ['cerrar', 'guardado'],

  data() {
    return {
      formulario: {
        nombre_servicio: '',
        descripcion: '',
        precio_efectivo: 0,
        precio_tarjeta: 0,
        monto_minimo: 0,
        porcentaje_comision: 0,
        requiere_medicamentos: false,
        descuento_medicamento: 0,
        activo: true
      },
      
      autoCalcularTarjeta: true,
      guardando: false,
      error: null,
      errores: {}
    }
  },

  watch: {
    // Auto-calcular precio tarjeta
    'formulario.precio_efectivo'() {
      if (this.autoCalcularTarjeta && this.formulario.precio_efectivo > 0) {
        const efectivo = parseFloat(this.formulario.precio_efectivo) || 0
        this.formulario.precio_tarjeta = (efectivo * 1.03).toFixed(2)
      }
    },

    autoCalcularTarjeta(nuevoValor) {
      if (nuevoValor && this.formulario.precio_efectivo > 0) {
        const efectivo = parseFloat(this.formulario.precio_efectivo) || 0
        this.formulario.precio_tarjeta = (efectivo * 1.03).toFixed(2)
      }
    }
  },

  mounted() {
    this.inicializarFormulario()
  },

  methods: {
    inicializarFormulario() {
      if (this.servicio && this.modo === 'editar') {
        console.log('✏️ Editando servicio:', this.servicio)
        
        this.formulario = {
          nombre_servicio: this.servicio.nombre_servicio || '',
          descripcion: this.servicio.descripcion || '',
          precio_efectivo: this.servicio.precio_efectivo || 0,
          precio_tarjeta: this.servicio.precio_tarjeta || 0,
          monto_minimo: this.servicio.monto_minimo || 0,
          porcentaje_comision: this.servicio.porcentaje_comision || 0,
          requiere_medicamentos: !!this.servicio.requiere_medicamentos,
          descuento_medicamento: this.servicio.descuento_medicamento || 0,
          activo: this.servicio.activo !== false
        }
        
        // Desactivar auto-cálculo si los precios no siguen la regla del 3%
        const esperado = (parseFloat(this.servicio.precio_efectivo) * 1.03).toFixed(2)
        this.autoCalcularTarjeta = parseFloat(esperado) === parseFloat(this.servicio.precio_tarjeta)
        
      } else {
        console.log('➕ Creando nuevo servicio')
        this.formulario = {
          nombre_servicio: '',
          descripcion: '',
          precio_efectivo: 0,
          precio_tarjeta: 0,
          monto_minimo: 0,
          porcentaje_comision: 0,
          requiere_medicamentos: false,
          descuento_medicamento: 0,
          activo: true
        }
        this.autoCalcularTarjeta = true
      }
    },

    validarFormulario() {
      this.errores = {}
      
      const validacion = serviciosService.validarServicio(this.formulario)
      
      if (!validacion.esValido) {
        validacion.errores.forEach(error => {
          if (error.includes('nombre')) {
            this.errores.nombre_servicio = error
          } else if (error.includes('efectivo')) {
            this.errores.precio_efectivo = error
          } else if (error.includes('tarjeta')) {
            this.errores.precio_tarjeta = error
          } else if (error.includes('comisión')) {
            this.errores.porcentaje_comision = error
          }
        })
      }
      
      return validacion.esValido
    },

    async guardarServicio() {
      try {
        this.error = null
        
        if (!this.validarFormulario()) {
          this.error = 'Por favor corrige los errores en el formulario'
          return
        }
        
        this.guardando = true
        console.log(`💾 ${this.modo === 'crear' ? 'Creando' : 'Actualizando'} servicio:`, this.formulario)
        
        // Preparar datos para enviar
        const datosServicio = {
          ...this.formulario,
          precio_efectivo: parseFloat(this.formulario.precio_efectivo),
          precio_tarjeta: parseFloat(this.formulario.precio_tarjeta),
          monto_minimo: parseFloat(this.formulario.monto_minimo) || 0,
          porcentaje_comision: parseFloat(this.formulario.porcentaje_comision) || 0,
          descuento_medicamento: parseFloat(this.formulario.descuento_medicamento) || 0
        }
        
        if (this.modo === 'crear') {
          await serviciosService.crearServicio(datosServicio)
          console.log('✅ Servicio creado exitosamente')
        } else {
          await serviciosService.actualizarServicio(this.servicio.id, datosServicio)
          console.log('✅ Servicio actualizado exitosamente')
        }
        
        this.$emit('guardado')
        
      } catch (error) {
        console.error('❌ Error guardando servicio:', error)
        this.error = error.message
      } finally {
        this.guardando = false
      }
    },

    cerrarModal() {
      if (!this.guardando) {
        this.$emit('cerrar')
      }
    }
  }
}
</script>

<style scoped>
/* Los estilos de modal ya están definidos en style.css */
.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto;
}

.modal-header {
  @apply flex justify-between items-center p-6 border-b border-gray-200;
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

.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>