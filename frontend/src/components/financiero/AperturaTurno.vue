<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span class="text-3xl">🔓</span>
              Apertura de Turno
            </h2>
            <p class="text-sm text-gray-600 mt-1">Cuenta el efectivo inicial en caja</p>
          </div>
          <button
            @click="$emit('cancelar')"
            class="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-6">
        <!-- Instrucciones -->
        <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div class="flex gap-3">
            <span class="text-2xl">ℹ️</span>
            <div class="flex-1">
              <h3 class="font-semibold text-blue-900 mb-1">¿Cómo funciona?</h3>
              <ul class="text-sm text-blue-800 space-y-1">
                <li>• Cuenta la cantidad de billetes y monedas que hay en la caja</li>
                <li>• El sistema calculará automáticamente el total</li>
                <li>• Este será tu efectivo inicial del turno</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- BILLETES -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span class="text-2xl">💵</span>
            Billetes
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            <div 
              v-for="denominacion in billetes" 
              :key="denominacion"
              class="flex flex-col"
            >
              <label class="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                <span>Q{{ denominacion }}</span>
                <span class="text-xs text-gray-500">{{ contarBilletes(denominacion) }}</span>
              </label>
              <input
                v-model.number="efectivo.billetes[denominacion]"
                type="number"
                min="0"
                step="1"
                @input="calcularTotal"
                class="border-2 border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0"
              />
              <span class="text-xs text-gray-500 mt-1 text-center font-medium">
                Q{{ formatearNumero(calcularSubtotalBillete(denominacion)) }}
              </span>
            </div>
          </div>
          
          <!-- Subtotal Billetes -->
          <div class="mt-4 flex justify-end">
            <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <span class="text-sm text-gray-600">Subtotal billetes:</span>
              <span class="ml-2 text-lg font-bold text-gray-900">Q{{ formatearNumero(totalBilletes) }}</span>
            </div>
          </div>
        </div>

        <!-- MONEDAS -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span class="text-2xl">🪙</span>
            Monedas
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div 
              v-for="denominacion in monedas" 
              :key="denominacion"
              class="flex flex-col"
            >
              <label class="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                <span>Q{{ denominacion }}</span>
                <span class="text-xs text-gray-500">{{ contarMonedas(denominacion) }}</span>
              </label>
              <input
                v-model.number="efectivo.monedas[denominacion]"
                type="number"
                min="0"
                step="1"
                @input="calcularTotal"
                class="border-2 border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0"
              />
              <span class="text-xs text-gray-500 mt-1 text-center font-medium">
                Q{{ formatearNumero(calcularSubtotalMoneda(denominacion)) }}
              </span>
            </div>
          </div>
          
          <!-- Subtotal Monedas -->
          <div class="mt-4 flex justify-end">
            <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <span class="text-sm text-gray-600">Subtotal monedas:</span>
              <span class="ml-2 text-lg font-bold text-gray-900">Q{{ formatearNumero(totalMonedas) }}</span>
            </div>
          </div>
        </div>

        <!-- TOTAL GENERAL -->
        <div class="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-orange-700 font-medium mb-1">Efectivo Inicial Total</p>
              <p class="text-xs text-orange-600">Este será el monto con el que inicia el turno</p>
            </div>
            <div class="text-right">
              <p class="text-4xl font-bold text-orange-600">
                Q{{ formatearNumero(totalEfectivo) }}
              </p>
              <p class="text-xs text-orange-600 mt-1">
                {{ totalBilletes > 0 ? `${totalBilletes.toFixed(2)} billetes` : '' }}
                {{ totalBilletes > 0 && totalMonedas > 0 ? ' + ' : '' }}
                {{ totalMonedas > 0 ? `${totalMonedas.toFixed(2)} monedas` : '' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Validación -->
        <div v-if="totalEfectivo === 0" class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <span class="text-2xl">⚠️</span>
            <div>
              <p class="text-sm font-medium text-yellow-800">Efectivo inicial en Q0.00</p>
              <p class="text-xs text-yellow-700 mt-1">
                ¿Estás seguro de querer abrir el turno sin efectivo inicial? 
                Esto es válido si la caja está vacía.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
        <div class="flex gap-4">
          <button
            @click="abrirTurno"
            :disabled="loading || !esValido"
            class="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            <span v-if="loading">⏳ Abriendo turno...</span>
            <span v-else>✓ Abrir Turno</span>
          </button>
          <button
            @click="$emit('cancelar')"
            :disabled="loading"
            class="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

const emit = defineEmits(['turno-abierto', 'cancelar'])

const financieroStore = useFinancieroStore()
const loading = ref(false)

// Denominaciones disponibles
const billetes = [200, 100, 50, 20, 10, 5, 1]
const monedas = [1, 0.50, 0.25, 0.10, 0.05]

// Estado del efectivo
const efectivo = ref({
  billetes: {
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    1: 0
  },
  monedas: {
    1: 0,
    0.50: 0,
    0.25: 0,
    0.10: 0,
    0.05: 0
  }
})

// ============================================================================
// COMPUTED
// ============================================================================

/**
 * Calcular total de billetes
 */
const totalBilletes = computed(() => {
  let total = 0
  billetes.forEach(denom => {
    const cantidad = efectivo.value.billetes[denom] || 0
    total += denom * cantidad
  })
  return total
})

/**
 * Calcular total de monedas
 */
const totalMonedas = computed(() => {
  let total = 0
  monedas.forEach(denom => {
    const cantidad = efectivo.value.monedas[denom] || 0
    total += denom * cantidad
  })
  return total
})

/**
 * Calcular total general
 */
const totalEfectivo = computed(() => {
  return totalBilletes.value + totalMonedas.value
})

/**
 * Validar si se puede abrir el turno
 */
const esValido = computed(() => {
  // Siempre es válido, incluso con Q0.00
  return true
})

// ============================================================================
// METHODS
// ============================================================================

/**
 * Calcular subtotal de un billete específico
 */
function calcularSubtotalBillete(denominacion) {
  const cantidad = efectivo.value.billetes[denominacion] || 0
  return denominacion * cantidad
}

/**
 * Calcular subtotal de una moneda específica
 */
function calcularSubtotalMoneda(denominacion) {
  const cantidad = efectivo.value.monedas[denominacion] || 0
  return denominacion * cantidad
}

/**
 * Contar cantidad de billetes
 */
function contarBilletes(denominacion) {
  const cantidad = efectivo.value.billetes[denominacion] || 0
  return cantidad > 0 ? `×${cantidad}` : ''
}

/**
 * Contar cantidad de monedas
 */
function contarMonedas(denominacion) {
  const cantidad = efectivo.value.monedas[denominacion] || 0
  return cantidad > 0 ? `×${cantidad}` : ''
}

/**
 * Calcular total (se llama en cada input)
 */
function calcularTotal() {
  // Los computed ya se actualizan automáticamente
  // Esta función existe por si necesitamos hacer algo adicional
}

/**
 * Abrir turno
 */
async function abrirTurno() {
  if (!esValido.value || loading.value) return

  loading.value = true

  try {
    // Preparar datos para el backend
    const datosApertura = {
      efectivo_billetes: efectivo.value.billetes,
      efectivo_monedas: efectivo.value.monedas
    }

    console.log('📤 Enviando datos de apertura:', datosApertura)

    // Llamar al store
    await financieroStore.abrirTurno(datosApertura)

    console.log('✅ Turno abierto exitosamente')

    // Emitir evento de éxito
    emit('turno-abierto')

    // Mostrar notificación (opcional)
    alert(`¡Turno abierto exitosamente!\nEfectivo inicial: Q${formatearNumero(totalEfectivo.value)}`)

  } catch (error) {
    console.error('❌ Error al abrir turno:', error)
    alert(`Error al abrir turno: ${error.message}`)
  } finally {
    loading.value = false
  }
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

/**
 * Limpiar formulario (si se necesita)
 */
function limpiarFormulario() {
  efectivo.value = {
    billetes: {
      200: 0,
      100: 0,
      50: 0,
      20: 0,
      10: 0,
      5: 0,
      1: 0
    },
    monedas: {
      1: 0,
      0.50: 0,
      0.25: 0,
      0.10: 0,
      0.05: 0
    }
  }
}
</script>

<style scoped>
/* Estilos personalizados si son necesarios */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>