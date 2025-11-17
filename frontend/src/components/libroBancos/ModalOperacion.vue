<!-- frontend/src/components/libroBancos/ModalOperacion.vue -->
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-900">
          {{ modoEdicion ? '✏️ Editar Operación' : '➕ Nueva Operación' }}
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
        
        <!-- Fecha -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            📅 Fecha <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.fecha"
            type="date"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Tipo de Operación -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            🔄 Tipo de Operación <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.tipo_operacion"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleccione...</option>
            <option value="ingreso">💰 Ingreso</option>
            <option value="egreso">💸 Egreso</option>
          </select>
        </div>

        <!-- Beneficiario -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            👤 Beneficiario <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.beneficiario"
            type="text"
            required
            maxlength="200"
            placeholder="Nombre del beneficiario"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Clasificación -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            🏷️ Clasificación <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.clasificacion"
            type="text"
            required
            maxlength="100"
            placeholder="Ej: Ventas, Compras, Servicios..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            📝 Descripción <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="form.descripcion"
            required
            rows="3"
            maxlength="500"
            placeholder="Detalle de la operación"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          ></textarea>
        </div>

        <!-- Grid: Números de Cheque y Depósito -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Número de Cheque -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              📄 Número de Cheque
            </label>
            <input
              v-model="form.numero_cheque"
              type="text"
              maxlength="50"
              placeholder="CHQ-001"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Número de Depósito -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              🏦 Número de Depósito
            </label>
            <input
              v-model="form.numero_deposito"
              type="text"
              maxlength="50"
              placeholder="DEP-001"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Grid: Ingreso y Egreso -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Ingreso -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              💰 Ingreso (Q)
            </label>
            <input
              v-model.number="form.ingreso"
              type="number"
              step="0.01"
              min="0"
              :disabled="form.tipo_operacion === 'egreso'"
              placeholder="0.00"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <!-- Egreso -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              💸 Egreso (Q)
            </label>
            <input
              v-model.number="form.egreso"
              type="number"
              step="0.01"
              min="0"
              :disabled="form.tipo_operacion === 'ingreso'"
              placeholder="0.00"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
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
            {{ guardando ? '⏳ Guardando...' : (modoEdicion ? '✅ Actualizar' : '✅ Registrar') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

// Props
const props = defineProps({
  operacion: {
    type: Object,
    default: null
  },
  modoEdicion: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['cerrar', 'guardar'])

// Estado local
const guardando = ref(false)
const errorLocal = ref(null)

// Formulario
const form = ref({
  fecha: '',
  beneficiario: '',
  descripcion: '',
  clasificacion: '',
  tipo_operacion: '',
  numero_cheque: '',
  numero_deposito: '',
  ingreso: 0,
  egreso: 0
})

// Inicializar formulario si es edición
if (props.modoEdicion && props.operacion) {
  form.value = {
    fecha: props.operacion.fecha?.split('T')[0] || '',
    beneficiario: props.operacion.beneficiario || '',
    descripcion: props.operacion.descripcion || '',
    clasificacion: props.operacion.clasificacion || '',
    tipo_operacion: props.operacion.tipo_operacion || '',
    numero_cheque: props.operacion.numero_cheque || '',
    numero_deposito: props.operacion.numero_deposito || '',
    ingreso: parseFloat(props.operacion.ingreso || 0),
    egreso: parseFloat(props.operacion.egreso || 0)
  }
} else {
  // Fecha por defecto: hoy
  form.value.fecha = new Date().toISOString().split('T')[0]
}

// Watch para tipo de operación
watch(() => form.value.tipo_operacion, (nuevoTipo) => {
  if (nuevoTipo === 'ingreso') {
    form.value.egreso = 0
  } else if (nuevoTipo === 'egreso') {
    form.value.ingreso = 0
  }
})

// Validación
const validarFormulario = () => {
  errorLocal.value = null

  if (!form.value.fecha) {
    errorLocal.value = 'La fecha es obligatoria'
    return false
  }

  if (!form.value.tipo_operacion) {
    errorLocal.value = 'Debe seleccionar el tipo de operación'
    return false
  }

  if (!form.value.beneficiario.trim()) {
    errorLocal.value = 'El beneficiario es obligatorio'
    return false
  }

  if (!form.value.descripcion.trim()) {
    errorLocal.value = 'La descripción es obligatoria'
    return false
  }

  if (!form.value.clasificacion.trim()) {
    errorLocal.value = 'La clasificación es obligatoria'
    return false
  }

  // Validar que tenga ingreso O egreso (no ambos)
  const ingreso = parseFloat(form.value.ingreso) || 0
  const egreso = parseFloat(form.value.egreso) || 0

  if (form.value.tipo_operacion === 'ingreso' && ingreso <= 0) {
    errorLocal.value = 'Debe ingresar un monto de ingreso mayor a 0'
    return false
  }

  if (form.value.tipo_operacion === 'egreso' && egreso <= 0) {
    errorLocal.value = 'Debe ingresar un monto de egreso mayor a 0'
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
    // Preparar datos
    const data = {
      fecha: form.value.fecha,
      beneficiario: form.value.beneficiario.trim(),
      descripcion: form.value.descripcion.trim(),
      clasificacion: form.value.clasificacion.trim(),
      tipo_operacion: form.value.tipo_operacion,
      numero_cheque: form.value.numero_cheque?.trim() || null,
      numero_deposito: form.value.numero_deposito?.trim() || null,
      ingreso: form.value.tipo_operacion === 'ingreso' ? parseFloat(form.value.ingreso) : 0,
      egreso: form.value.tipo_operacion === 'egreso' ? parseFloat(form.value.egreso) : 0
    }

    emit('guardar', data)
  } catch (error) {
    errorLocal.value = error.message || 'Error al guardar la operación'
  } finally {
    guardando.value = false
  }
}
</script>