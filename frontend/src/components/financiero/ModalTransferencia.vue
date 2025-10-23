<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🏦</span>
            <div>
              <h2 class="text-xl font-bold">Registrar Transferencia Bancaria</h2>
              <p class="text-sm text-purple-100">Comprobantes de pagos por transferencia</p>
            </div>
          </div>
          <button
            @click="$emit('cancelar')"
            class="text-white hover:text-purple-100 text-2xl"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Body con Scroll -->
      <div class="p-6 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        <!-- Número de Boleta -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Número de Boleta *
          </label>
          <div class="relative">
            <span class="absolute left-4 top-3 text-gray-500 text-lg">#</span>
            <input
              v-model="transferencia.numero_boleta"
              type="text"
              class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold"
              placeholder="Ej: BOL-123456"
              required
            />
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Ingresa el número de boleta de la transferencia
          </p>
        </div>

        <!-- Nombre del Paciente -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Paciente *
          </label>
          <div class="relative">
            <span class="absolute left-4 top-3 text-gray-500 text-lg">👤</span>
            <input
              v-model="transferencia.paciente_nombre"
              type="text"
              class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
              placeholder="Ej: María López"
              required
            />
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Nombre completo del paciente que realizó la transferencia
          </p>
        </div>

        <!-- Monto -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Monto de la Transferencia *
          </label>
          <div class="relative">
            <span class="absolute left-4 top-3 text-gray-500 text-lg">Q</span>
            <input
              v-model.number="transferencia.monto"
              type="number"
              step="0.01"
              min="0"
              class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold"
              placeholder="0.00"
              required
            />
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Ingresa el monto exacto de la transferencia
          </p>
        </div>

        <!-- Resumen visual -->
        <div class="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="text-sm text-purple-700 font-medium">Total de la Transferencia</p>
              <p class="text-xs text-purple-600">
                {{ transferencia.numero_boleta ? `#${transferencia.numero_boleta}` : 'Sin número' }}
                {{ transferencia.paciente_nombre ? ` - ${transferencia.paciente_nombre}` : '' }}
              </p>
            </div>
            <p class="text-3xl font-bold text-purple-600">
              Q{{ formatearNumero(transferencia.monto || 0) }}
            </p>
          </div>

          <!-- Información sobre impuestos -->
          <div class="bg-purple-100 rounded p-3 space-y-1">
            <div class="flex justify-between items-center text-xs">
              <span class="text-purple-700">Monto de transferencia:</span>
              <span class="font-semibold text-purple-800">Q{{ formatearNumero(transferencia.monto || 0) }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-purple-700">Impuesto (16%):</span>
              <span class="font-semibold text-purple-800">Q{{ formatearNumero((transferencia.monto || 0) * 0.16) }}</span>
            </div>
            <div class="flex justify-between items-center text-xs pt-2 border-t border-purple-300">
              <span class="text-purple-900 font-semibold">Monto neto recibido:</span>
              <span class="font-bold text-purple-900">Q{{ formatearNumero((transferencia.monto || 0) * 0.84) }}</span>
            </div>
          </div>
        </div>

        <!-- Info sobre cuadre -->
        <div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <span class="text-xl">ℹ️</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-yellow-800">Verificación de Cuadre</p>
              <p class="text-xs text-yellow-700 mt-1">
                El sistema verificará automáticamente que el total de transferencias coincida con las ventas realizadas por transferencia bancaria.
              </p>
            </div>
          </div>
        </div>

        <!-- Nota sobre comprobante -->
        <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <span class="text-xl">💡</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-blue-800">Tip</p>
              <p class="text-xs text-blue-700 mt-1">
                Asegúrate de tener el comprobante físico o digital de la transferencia para futuras referencias o auditorías.
              </p>
            </div>
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
            @click="registrarTransferencia"
            :disabled="loading || !esValido"
            class="flex-1 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span v-if="loading">⏳ Registrando...</span>
            <span v-else>✓ Registrar Transferencia</span>
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

const emit = defineEmits(['transferencia-registrada', 'cancelar'])

const financieroStore = useFinancieroStore()
const loading = ref(false)
const error = ref(null)

// Estado de la transferencia - SOLO CAMPOS QUE EXISTEN EN BD
const transferencia = ref({
  numero_boleta: '',
  paciente_nombre: '',
  monto: null
})

// ============================================================================
// COMPUTED
// ============================================================================

/**
 * Validar si el formulario es válido
 */
const esValido = computed(() => {
  return (
    transferencia.value.numero_boleta.trim() !== '' &&
    transferencia.value.paciente_nombre.trim() !== '' &&
    transferencia.value.monto > 0
  )
})

// ============================================================================
// METHODS
// ============================================================================

/**
 * Registrar la transferencia
 */
async function registrarTransferencia() {
  if (!esValido.value || loading.value) return

  // Validaciones adicionales
  if (transferencia.value.numero_boleta.trim().length < 3) {
    error.value = 'El número de boleta debe tener al menos 3 caracteres'
    return
  }

  if (transferencia.value.paciente_nombre.trim().length < 3) {
    error.value = 'El nombre del paciente debe tener al menos 3 caracteres'
    return
  }

  if (transferencia.value.monto <= 0) {
    error.value = 'El monto debe ser mayor a Q0.00'
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('📤 Registrando transferencia:', transferencia.value)

    // Preparar datos - SOLO CAMPOS QUE EXISTEN EN BD
    const datosTransferencia = {
      numero_boleta: transferencia.value.numero_boleta.trim(),
      paciente_nombre: transferencia.value.paciente_nombre.trim(),
      monto: parseFloat(transferencia.value.monto)
    }

    console.log('📦 Datos a enviar:', datosTransferencia)

    // Llamar al store
    await financieroStore.registrarTransferencia(datosTransferencia)

    console.log('✅ Transferencia registrada exitosamente')

    // Emitir evento de éxito
    emit('transferencia-registrada')

    // Mostrar notificación
    alert(`¡Transferencia registrada exitosamente!\nBoleta: ${transferencia.value.numero_boleta}\nPaciente: ${transferencia.value.paciente_nombre}\nMonto: Q${formatearNumero(transferencia.value.monto)}`)

    // Limpiar formulario
    limpiarFormulario()

  } catch (err) {
    console.error('❌ Error al registrar transferencia:', err)
    error.value = err.message || 'Error al registrar la transferencia'
  } finally {
    loading.value = false
  }
}

/**
 * Limpiar formulario
 */
function limpiarFormulario() {
  transferencia.value = {
    numero_boleta: '',
    paciente_nombre: '',
    monto: null
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

/* Estilos para el scroll */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #a855f7;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9333ea;
}
</style>