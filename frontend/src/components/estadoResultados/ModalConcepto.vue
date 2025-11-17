<!-- frontend/src/components/estadoResultados/ModalConcepto.vue -->
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-900">
          {{ modoEdicion ? '✏️ Editar Concepto' : '➕ Nuevo Concepto' }}
        </h2>
        <button
          @click="$emit('cerrar')"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="guardar" class="p-6 space-y-4">
        
        <!-- Tipo de Concepto (solo lectura en edición) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            📋 Tipo de Concepto <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.tipo"
            required
            :disabled="modoEdicion"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Seleccione...</option>
            <option value="costo_operacion">💰 Costo de Operación</option>
            <option value="gasto_operacion">💸 Gasto de Operación</option>
            <option value="otro_gasto">📊 Otro Gasto/Producto Financiero</option>
          </select>
          <p v-if="modoEdicion" class="text-xs text-gray-500 mt-1">
            El tipo de concepto no se puede modificar
          </p>
        </div>

        <!-- Nombre del Concepto -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            🏷️ Nombre del Concepto <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.nombre"
            type="text"
            required
            maxlength="100"
            placeholder="Ej: Compras de Mercaderías, Sueldos, etc."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Monto -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            💵 Monto (Q) <span class="text-red-500">*</span>
          </label>
          <input
            v-model.number="form.monto"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Grid: Período -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Fecha Inicio -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              📅 Período Inicio <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.periodo_inicio"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Fecha Fin -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              📅 Período Fin <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.periodo_fin"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Descripción (opcional) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            📝 Descripción
          </label>
          <textarea
            v-model="form.descripcion"
            rows="3"
            maxlength="500"
            placeholder="Detalles adicionales del concepto..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          ></textarea>
        </div>

        <!-- Mensaje de error -->
        <div v-if="errorLocal" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-red-800 text-sm">❌ {{ errorLocal }}</p>
        </div>

        <!-- Botones -->
        <div class="flex gap-3 pt-4">
          <button
            type="button"
            @click="$emit('cerrar')"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="guardando"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {{ guardando ? '⏳ Guardando...' : (modoEdicion ? '✅ Actualizar' : '✅ Crear') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

// Props
const props = defineProps({
  concepto: {
    type: Object,
    default: null
  },
  modoEdicion: {
    type: Boolean,
    default: false
  },
  tipo: {
    type: String,
    default: null
  },
  periodo: {
    type: Object,
    default: () => ({
      fecha_inicio: null,
      fecha_fin: null
    })
  }
})

// Emits
const emit = defineEmits(['cerrar', 'guardar'])

// Estado local
const guardando = ref(false)
const errorLocal = ref(null)

// Formulario
const form = ref({
  tipo: '',
  nombre: '',
  monto: null,
  periodo_inicio: '',
  periodo_fin: '',
  descripcion: ''
})

// Inicializar formulario
function inicializarFormulario() {
  if (props.modoEdicion && props.concepto) {
    // Modo edición: cargar datos del concepto
    const fechaInicio = props.concepto.periodo_inicio 
      ? new Date(props.concepto.periodo_inicio).toISOString().split('T')[0]
      : ''
    const fechaFin = props.concepto.periodo_fin 
      ? new Date(props.concepto.periodo_fin).toISOString().split('T')[0]
      : ''

    form.value = {
      tipo: props.concepto.tipo || '',
      nombre: props.concepto.nombre || '',
      monto: parseFloat(props.concepto.monto || 0),
      periodo_inicio: fechaInicio,
      periodo_fin: fechaFin,
      descripcion: props.concepto.descripcion || ''
    }
    
    console.log('✏️ Formulario inicializado para edición:', form.value)
  } else {
    // Modo creación: usar tipo y período del store
    form.value = {
      tipo: props.tipo || '',
      nombre: '',
      monto: null,
      periodo_inicio: props.periodo.fecha_inicio || '',
      periodo_fin: props.periodo.fecha_fin || '',
      descripcion: ''
    }
    
    console.log('➕ Formulario inicializado para creación:', form.value)
  }
}

// Inicializar al montar
inicializarFormulario()

// Watch para reinicializar si cambian las props
watch(() => props.concepto, () => {
  inicializarFormulario()
}, { deep: true })

// Validación
const validarFormulario = () => {
  errorLocal.value = null

  if (!form.value.tipo) {
    errorLocal.value = 'Debe seleccionar el tipo de concepto'
    return false
  }

  if (!form.value.nombre.trim()) {
    errorLocal.value = 'El nombre del concepto es obligatorio'
    return false
  }

  if (!form.value.monto || form.value.monto < 0) {
    errorLocal.value = 'Debe ingresar un monto válido mayor o igual a 0'
    return false
  }

  if (!form.value.periodo_inicio || !form.value.periodo_fin) {
    errorLocal.value = 'Debe especificar el período (fecha inicio y fin)'
    return false
  }

  if (new Date(form.value.periodo_inicio) > new Date(form.value.periodo_fin)) {
    errorLocal.value = 'La fecha de inicio debe ser menor o igual a la fecha de fin'
    return false
  }

  return true
}

// Guardar
const guardar = async () => {
  if (!validarFormulario()) {
    return
  }

  guardando.value = true
  errorLocal.value = null

  try {
    const data = {
      tipo: form.value.tipo,
      nombre: form.value.nombre.trim(),
      monto: parseFloat(form.value.monto),
      periodo_inicio: form.value.periodo_inicio,
      periodo_fin: form.value.periodo_fin,
      descripcion: form.value.descripcion?.trim() || null
    }

    console.log('💾 Guardando concepto:', data)
    emit('guardar', data)
  } catch (error) {
    errorLocal.value = error.message || 'Error al guardar el concepto'
  } finally {
    guardando.value = false
  }
}
</script>