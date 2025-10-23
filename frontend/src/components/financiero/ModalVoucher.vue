<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl">💳</span>
            <div>
              <h2 class="text-xl font-bold">Registrar Voucher de Tarjeta</h2>
              <p class="text-sm text-blue-100">Comprobantes de pagos con tarjeta</p>
            </div>
          </div>
          <button
            @click="$emit('cancelar')"
            class="text-white hover:text-blue-100 text-2xl"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Body con Scroll -->
      <div class="p-6 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        <!-- Número de Voucher -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Número de Voucher *
          </label>
          <div class="relative">
            <span class="absolute left-4 top-3 text-gray-500 text-lg">#</span>
            <input
              v-model="voucher.numero_voucher"
              type="text"
              class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
              placeholder="Ej: VOUCH-123456"
              required
            />
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Ingresa el número del voucher de la tarjeta
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
              v-model="voucher.paciente_nombre"
              type="text"
              class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Nombre completo del paciente que pagó con tarjeta
          </p>
        </div>

        <!-- Monto -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Monto del Voucher *
          </label>
          <div class="relative">
            <span class="absolute left-4 top-3 text-gray-500 text-lg">Q</span>
            <input
              v-model.number="voucher.monto"
              type="number"
              step="0.01"
              min="0"
              class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
              placeholder="0.00"
              required
            />
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Ingresa el monto exacto del voucher
          </p>
        </div>

        <!-- Resumen visual -->
        <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="text-sm text-blue-700 font-medium">Total del Voucher</p>
              <p class="text-xs text-blue-600">
                {{ voucher.numero_voucher ? `#${voucher.numero_voucher}` : 'Sin número' }}
                {{ voucher.paciente_nombre ? ` - ${voucher.paciente_nombre}` : '' }}
              </p>
            </div>
            <p class="text-3xl font-bold text-blue-600">
              Q{{ formatearNumero(voucher.monto || 0) }}
            </p>
          </div>

          <!-- Información sobre comisiones -->
          <div class="bg-blue-100 rounded p-3 space-y-1">
            <div class="flex justify-between items-center text-xs">
              <span class="text-blue-700">Monto del voucher:</span>
              <span class="font-semibold text-blue-800">Q{{ formatearNumero(voucher.monto || 0) }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-blue-700">Comisión bancaria (6%):</span>
              <span class="font-semibold text-blue-800">Q{{ formatearNumero((voucher.monto || 0) * 0.06) }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-blue-700">Impuesto (21.04%):</span>
              <span class="font-semibold text-blue-800">Q{{ formatearNumero((voucher.monto || 0) * 0.2104) }}</span>
            </div>
            <div class="flex justify-between items-center text-xs pt-2 border-t border-blue-300">
              <span class="text-blue-900 font-semibold">Monto neto recibido:</span>
              <span class="font-bold text-blue-900">Q{{ formatearNumero((voucher.monto || 0) * 0.7296) }}</span>
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
                El sistema verificará automáticamente que el total de vouchers coincida con las ventas realizadas con tarjeta.
              </p>
            </div>
          </div>
        </div>

        <!-- Nota sobre voucher -->
        <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <span class="text-xl">💡</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-green-800">Tip</p>
              <p class="text-xs text-green-700 mt-1">
                Asegúrate de tener el voucher físico de la terminal POS para futuras referencias o auditorías.
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
            @click="registrarVoucher"
            :disabled="loading || !esValido"
            class="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span v-if="loading">⏳ Registrando...</span>
            <span v-else>✓ Registrar Voucher</span>
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

const emit = defineEmits(['voucher-registrado', 'cancelar'])

const financieroStore = useFinancieroStore()
const loading = ref(false)
const error = ref(null)

// Estado del voucher - SOLO CAMPOS QUE EXISTEN EN BD
const voucher = ref({
  numero_voucher: '',
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
    voucher.value.numero_voucher.trim() !== '' &&
    voucher.value.paciente_nombre.trim() !== '' &&
    voucher.value.monto > 0
  )
})

// ============================================================================
// METHODS
// ============================================================================

/**
 * Registrar el voucher
 */
async function registrarVoucher() {
  if (!esValido.value || loading.value) return

  // Validaciones adicionales
  if (voucher.value.numero_voucher.trim().length < 3) {
    error.value = 'El número de voucher debe tener al menos 3 caracteres'
    return
  }

  if (voucher.value.paciente_nombre.trim().length < 3) {
    error.value = 'El nombre del paciente debe tener al menos 3 caracteres'
    return
  }

  if (voucher.value.monto <= 0) {
    error.value = 'El monto debe ser mayor a Q0.00'
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('📤 Registrando voucher:', voucher.value)

    // Preparar datos - SOLO CAMPOS QUE EXISTEN EN BD
    const datosVoucher = {
      numero_voucher: voucher.value.numero_voucher.trim(),
      paciente_nombre: voucher.value.paciente_nombre.trim(),
      monto: parseFloat(voucher.value.monto)
    }

    console.log('📦 Datos a enviar:', datosVoucher)

    // Llamar al store
    await financieroStore.registrarVoucher(datosVoucher)

    console.log('✅ Voucher registrado exitosamente')

    // Emitir evento de éxito
    emit('voucher-registrado')

    // Mostrar notificación
    alert(`¡Voucher registrado exitosamente!\nVoucher: ${voucher.value.numero_voucher}\nPaciente: ${voucher.value.paciente_nombre}\nMonto: Q${formatearNumero(voucher.value.monto)}`)

    // Limpiar formulario
    limpiarFormulario()

  } catch (err) {
    console.error('❌ Error al registrar voucher:', err)
    error.value = err.message || 'Error al registrar el voucher'
  } finally {
    loading.value = false
  }
}

/**
 * Limpiar formulario
 */
function limpiarFormulario() {
  voucher.value = {
    numero_voucher: '',
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
  background: #3b82f6;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #2563eb;
}
</style>