<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🧾</span>
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

      <!-- Body -->
      <div class="p-6 space-y-4">
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
              placeholder="Ej: 123456789"
              required
            />
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Ingresa el número que aparece en el voucher físico
          </p>
        </div>

        <!-- Monto -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Monto del Voucher *
          </label>
          <div class="relative">
            <span class="absolute left-4 top-3 text-gray-500 text-lg font-semibold">Q</span>
            <input
              v-model.number="voucher.monto"
              type="number"
              step="0.01"
              min="0.01"
              class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
              placeholder="0.00"
              required
            />
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Ingresa el monto exacto del voucher
          </p>
        </div>

        <!-- Banco -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Banco (Opcional)
          </label>
          <select
            v-model="voucher.banco"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecciona un banco</option>
            <option value="BAM">🏦 BAM - Banco Agromercantil</option>
            <option value="Banrural">🏦 Banrural</option>
            <option value="Industrial">🏦 Banco Industrial</option>
            <option value="G&T Continental">🏦 G&T Continental</option>
            <option value="BAC">🏦 BAC Credomatic</option>
            <option value="Bantrab">🏦 Bantrab</option>
            <option value="Ficohsa">🏦 Ficohsa</option>
            <option value="Promerica">🏦 Promerica</option>
            <option value="Otro">🏦 Otro</option>
          </select>
        </div>

        <!-- Fecha (opcional) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Fecha del Voucher (Opcional)
          </label>
          <input
            v-model="voucher.fecha"
            type="date"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">
            Si está vacío, se usará la fecha actual
          </p>
        </div>

        <!-- Notas adicionales -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Notas Adicionales (Opcional)
          </label>
          <textarea
            v-model="voucher.notas"
            rows="2"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Observaciones sobre este voucher..."
          ></textarea>
        </div>

        <!-- Resumen visual -->
        <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="text-sm text-blue-700 font-medium">Total del Voucher</p>
              <p class="text-xs text-blue-600">
                {{ voucher.numero_voucher ? `#${voucher.numero_voucher}` : 'Sin número' }}
                {{ voucher.banco ? ` - ${voucher.banco}` : '' }}
              </p>
            </div>
            <p class="text-3xl font-bold text-blue-600">
              Q{{ formatearNumero(voucher.monto || 0) }}
            </p>
          </div>

          <!-- Información sobre comisiones -->
          <div class="bg-blue-100 rounded p-3 space-y-1">
            <div class="flex justify-between items-center text-xs">
              <span class="text-blue-700">Comisión bancaria (6%):</span>
              <span class="font-semibold text-blue-800">Q{{ formatearNumero((voucher.monto || 0) * 0.06) }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-blue-700">Monto después de comisión:</span>
              <span class="font-semibold text-blue-800">Q{{ formatearNumero((voucher.monto || 0) * 0.94) }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-blue-700">Impuesto sobre restante (16%):</span>
              <span class="font-semibold text-blue-800">Q{{ formatearNumero((voucher.monto || 0) * 0.94 * 0.16) }}</span>
            </div>
            <div class="flex justify-between items-center text-xs pt-2 border-t border-blue-300">
              <span class="text-blue-900 font-semibold">Impuesto total (21.04%):</span>
              <span class="font-bold text-blue-900">Q{{ formatearNumero((voucher.monto || 0) * 0.2104) }}</span>
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

// Estado del voucher
const voucher = ref({
  numero_voucher: '',
  monto: null,
  banco: '',
  fecha: '',
  notas: ''
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

  if (voucher.value.monto <= 0) {
    error.value = 'El monto debe ser mayor a Q0.00'
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('📤 Registrando voucher:', voucher.value)

    // Preparar datos (limpiar campos opcionales vacíos)
    const datosVoucher = {
      numero_voucher: voucher.value.numero_voucher.trim(),
      monto: voucher.value.monto,
      banco: voucher.value.banco || null,
      fecha: voucher.value.fecha || null,
      notas: voucher.value.notas || null
    }

    // Llamar al store
    await financieroStore.registrarVoucher(datosVoucher)

    console.log('✅ Voucher registrado exitosamente')

    // Emitir evento de éxito
    emit('voucher-registrado')

    // Mostrar notificación (opcional)
    alert(`¡Voucher registrado exitosamente!\nNúmero: ${voucher.value.numero_voucher}\nMonto: Q${formatearNumero(voucher.value.monto)}`)

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
    monto: null,
    banco: '',
    fecha: '',
    notas: ''
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