<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full">
      <!-- Header -->
      <div class="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl">💸</span>
            <div>
              <h2 class="text-xl font-bold">Registrar Gasto</h2>
              <p class="text-sm text-red-100">Egresos y salidas de efectivo</p>
            </div>
          </div>
          <button
            @click="$emit('cancelar')"
            class="text-white hover:text-red-100 text-2xl"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4">
        <!-- Categoría del Gasto -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Categoría del Gasto *
          </label>



          <select
            v-model="gasto.categoria"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            required
          >
            <option value="">Selecciona una categoría</option>
            <option value="servicios">🔌 Servicios (luz, agua, internet)</option>
            <option value="compras">📦 Compras y suministros</option>
            <option value="mantenimiento">🔧 Mantenimiento</option>
            <option value="administrativo">📋 Administrativo</option>
            <option value="otros">📌 Otros</option>
          </select>


        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Descripción *
          </label>
          <textarea
            v-model="gasto.descripcion"
            rows="3"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            placeholder="Describe el motivo del gasto..."
            required
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            {{ gasto.descripcion.length }}/200 caracteres
          </p>
        </div>

        <!-- Monto -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Monto *
          </label>
          <div class="relative">
            <span class="absolute left-4 top-3 text-gray-500 text-lg font-semibold">Q</span>
            <input
              v-model.number="gasto.monto"
              type="number"
              step="0.01"
              min="0.01"
              class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-semibold"
              placeholder="0.00"
              required
            />
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Ingresa el monto exacto del gasto
          </p>
        </div>

        <!-- Nota sobre efectivo -->
        <div v-if="gasto.metodo_pago === 'efectivo'" class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <span class="text-xl">⚠️</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-yellow-800">Gasto en efectivo</p>
              <p class="text-xs text-yellow-700 mt-1">
                Este gasto se restará del efectivo disponible en caja.
              </p>
            </div>
          </div>
        </div>

        <!-- Resumen visual -->
        <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-red-700 font-medium">Total del Gasto</p>
              <p class="text-xs text-red-600">
                {{ gasto.categoria || 'Sin categoría' }} - {{ gasto.metodo_pago ? (gasto.metodo_pago === 'efectivo' ? 'Efectivo' : 'Transferencia') : 'Sin método' }}
              </p>
            </div>
            <p class="text-3xl font-bold text-red-600">
              Q{{ formatearNumero(gasto.monto || 0) }}
            </p>
          </div>
        </div>

        <!-- Validaciones -->
        <div v-if="error" class="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <span class="text-xl">❌</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-red-800">Error de validación</p>
              <p class="text-xs text-red-700 mt-1">{{ error }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
        <div class="flex gap-3">
          <button
            @click="registrarGasto"
            :disabled="loading || !esValido"
            class="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span v-if="loading">⏳ Registrando...</span>
            <span v-else>✓ Registrar Gasto</span>
          </button>
          <button
            @click="$emit('cancelar')"
            :disabled="loading"
            class="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFinancieroStore } from '@/store/financiero'

const emit = defineEmits(['gasto-registrado', 'cancelar'])

const financieroStore = useFinancieroStore()
const loading = ref(false)
const error = ref(null)

// Estado del gasto
const gasto = ref({
  categoria: '',
  descripcion: '',
  monto: null,
  metodo_pago: 'efectivo'
})

// ============================================================================
// COMPUTED
// ============================================================================

/**
 * Validar si el formulario es válido
 */
const esValido = computed(() => {
  return (
    gasto.value.categoria !== '' &&
    gasto.value.descripcion.trim() !== '' &&
    gasto.value.monto > 0 &&
    gasto.value.metodo_pago !== ''
  )
})

// ============================================================================
// METHODS
// ============================================================================

/**
 * Registrar el gasto
 */
async function registrarGasto() {
  if (!esValido.value || loading.value) return

  // Validaciones adicionales
  if (gasto.value.descripcion.length > 200) {
    error.value = 'La descripción no puede exceder los 200 caracteres'
    return
  }

  if (gasto.value.monto <= 0) {
    error.value = 'El monto debe ser mayor a Q0.00'
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('📤 Registrando gasto:', gasto.value)

    // Llamar al store
    await financieroStore.registrarGasto(gasto.value)

    console.log('✅ Gasto registrado exitosamente')

    // Emitir evento de éxito
    emit('gasto-registrado')

    // Mostrar notificación (opcional)
    alert(`¡Gasto registrado exitosamente!\nMonto: Q${formatearNumero(gasto.value.monto)}`)

    // Limpiar formulario
    limpiarFormulario()

  } catch (err) {
    console.error('❌ Error al registrar gasto:', err)
    error.value = err.message || 'Error al registrar el gasto'
  } finally {
    loading.value = false
  }
}

/**
 * Limpiar formulario
 */
function limpiarFormulario() {
  gasto.value = {
    categoria: '',
    descripcion: '',
    monto: null,
    metodo_pago: 'efectivo'
  }
  error.value = null
}

/**
 * Formatear número
 */
function formatearNumero(numero) {
  return new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero || 0)
}
</script>

<style scoped>
/* Quitar spinner de input number */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>