<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8">
      <!-- Header -->
      <div class="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-t-lg z-10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🔒</span>
            <div>
              <h2 class="text-2xl font-bold">Cierre de Turno</h2>
              <p class="text-sm text-red-100">Cuadre de caja y reporte de cierre</p>
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
      <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        
        <!-- PASO 1: Conteo de Efectivo Final -->
        <div v-if="paso === 1">
          <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <div class="flex items-start gap-3">
              <span class="text-2xl">📋</span>
              <div>
                <h3 class="font-semibold text-blue-900">Paso 1: Conteo de Efectivo</h3>
                <p class="text-sm text-blue-700 mt-1">
                  Cuenta el efectivo físico que hay actualmente en la caja
                </p>
              </div>
            </div>
          </div>

          <!-- Billetes -->
          <div class="mb-6">
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
                  v-model.number="efectivoFinal.billetes[denominacion]"
                  type="number"
                  min="0"
                  step="1"
                  @input="calcularTotalFinal"
                  class="border-2 border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="0"
                />
                <span class="text-xs text-gray-500 mt-1 text-center font-medium">
                  Q{{ formatearNumero(calcularSubtotalBillete(denominacion)) }}
                </span>
              </div>
            </div>
            <div class="mt-4 flex justify-end">
              <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                <span class="text-sm text-gray-600">Subtotal billetes:</span>
                <span class="ml-2 text-lg font-bold text-gray-900">Q{{ formatearNumero(totalBilletes) }}</span>
              </div>
            </div>
          </div>

          <!-- Monedas -->
          <div class="mb-6">
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
                  v-model.number="efectivoFinal.monedas[denominacion]"
                  type="number"
                  min="0"
                  step="1"
                  @input="calcularTotalFinal"
                  class="border-2 border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="0"
                />
                <span class="text-xs text-gray-500 mt-1 text-center font-medium">
                  Q{{ formatearNumero(calcularSubtotalMoneda(denominacion)) }}
                </span>
              </div>
            </div>
            <div class="mt-4 flex justify-end">
              <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                <span class="text-sm text-gray-600">Subtotal monedas:</span>
                <span class="ml-2 text-lg font-bold text-gray-900">Q{{ formatearNumero(totalMonedas) }}</span>
              </div>
            </div>
          </div>

          <!-- Total Efectivo Final -->
          <div class="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-red-700 font-medium mb-1">Efectivo Final Contado</p>
                <p class="text-xs text-red-600">Este es el efectivo físico en caja ahora</p>
              </div>
              <div class="text-right">
                <p class="text-4xl font-bold text-red-600">
                  Q{{ formatearNumero(totalEfectivoFinal) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Botón Continuar -->
          <div class="mt-6 flex justify-end">
            <button
              @click="calcularCuadre"
              :disabled="loadingCuadre"
              class="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
            >
              <span v-if="loadingCuadre">⏳ Calculando cuadre...</span>
              <span v-else>Continuar → Ver Cuadre</span>
            </button>
          </div>
        </div>

        <!-- PASO 2: Reporte de Cuadre -->
        <div v-if="paso === 2 && cuadre">
          <!-- Botón Volver -->
          <button
            @click="paso = 1"
            class="mb-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            ← Volver al conteo
          </button>

          <!-- Información del Turno -->
          <div class="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">📋 Información del Turno</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p class="text-gray-600">Turno #</p>
                <p class="font-semibold">{{ financieroStore.turnoActivo?.id }}</p>
              </div>
              <div>
                <p class="text-gray-600">Usuario</p>
                <p class="font-semibold">{{ financieroStore.turnoActivo?.usuario_nombre }}</p>
              </div>
              <div>
                <p class="text-gray-600">Apertura</p>
                <p class="font-semibold">{{ formatearFechaCorta(financieroStore.turnoActivo?.fecha_apertura) }}</p>
              </div>
              <div>
                <p class="text-gray-600">Duración</p>
                <p class="font-semibold">{{ financieroStore.duracionTurno }}</p>
              </div>
            </div>
          </div>

          <!-- Resumen de Ventas -->
          <div class="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">💰 Resumen de Ventas</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b">
                <span class="text-gray-700">Venta Total</span>
                <span class="font-bold text-lg">Q{{ formatearNumero(cuadre.venta_total) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-700 flex items-center gap-2">
                  <span class="w-3 h-3 bg-green-500 rounded-full"></span>
                  Efectivo
                </span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.ventas_efectivo) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-700 flex items-center gap-2">
                  <span class="w-3 h-3 bg-blue-500 rounded-full"></span>
                  Tarjeta
                </span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.ventas_tarjeta) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-700 flex items-center gap-2">
                  <span class="w-3 h-3 bg-purple-500 rounded-full"></span>
                  Transferencia
                </span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.ventas_transferencia) }}</span>
              </div>
            </div>
          </div>

          <!-- Impuestos -->
          <div class="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">📊 Impuestos Desglosados</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-700">Efectivo (16%)</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.impuesto_efectivo) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-700">Tarjeta (21.04%)</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.impuesto_tarjeta) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-700">Transferencia (16%)</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.impuesto_transferencia) }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-t-2 border-gray-300 pt-3">
                <span class="font-bold text-gray-900">Total Impuestos</span>
                <span class="font-bold text-lg">Q{{ formatearNumero(cuadre.impuesto_efectivo + cuadre.impuesto_tarjeta + cuadre.impuesto_transferencia) }}</span>
              </div>
            </div>
          </div>

          <!-- Ventas Netas -->
          <div class="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-lg font-bold text-green-800">Ventas Netas</h3>
                <p class="text-sm text-green-600">Venta total - impuestos</p>
              </div>
              <p class="text-3xl font-bold text-green-700">
                Q{{ formatearNumero(cuadre.ventas_netas) }}
              </p>
            </div>
          </div>

          <!-- Gastos y Otros -->
          <div class="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">💸 Gastos y Movimientos</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-700">Total Gastos</span>
                <span class="font-semibold text-red-600">Q{{ formatearNumero(cuadre.total_gastos) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-700">Comisiones Pagadas</span>
                <span class="font-semibold text-red-600">Q{{ formatearNumero(cuadre.total_comisiones_pagadas) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-700">Total Vouchers</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.total_vouchers) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-700">Total Transferencias</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.total_transferencias) }}</span>
              </div>
            </div>
          </div>

          <!-- CUADRE DE EFECTIVO -->
          <div class="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-orange-900 mb-4">🔢 Cuadre de Efectivo</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2">
                <span class="text-orange-800">Efectivo Inicial</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.efectivo_inicial_total) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-orange-800">+ Ventas en Efectivo</span>
                <span class="font-semibold text-green-600">+Q{{ formatearNumero(cuadre.ventas_efectivo) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-orange-800">- Gastos</span>
                <span class="font-semibold text-red-600">-Q{{ formatearNumero(cuadre.total_gastos) }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-t-2 border-orange-400 pt-3">
                <span class="font-bold text-orange-900">= Efectivo Esperado</span>
                <span class="font-bold text-xl text-orange-900">Q{{ formatearNumero(cuadre.efectivo_esperado) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="font-bold text-orange-900">Efectivo Contado (Real)</span>
                <span class="font-bold text-xl text-orange-900">Q{{ formatearNumero(cuadre.efectivo_final_total) }}</span>
              </div>
              <div 
                class="flex justify-between items-center py-3 border-t-2 border-orange-400 pt-3"
                :class="cuadre.diferencia_efectivo === 0 ? 'bg-green-100' : 'bg-red-100'"
              >
                <span class="font-bold text-lg">DIFERENCIA</span>
                <span 
                  class="font-bold text-2xl"
                  :class="cuadre.diferencia_efectivo === 0 ? 'text-green-700' : 'text-red-700'"
                >
                  {{ cuadre.diferencia_efectivo >= 0 ? '+' : '' }}Q{{ formatearNumero(cuadre.diferencia_efectivo) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Estado del Cuadre -->
          <div 
            v-if="cuadre.diferencia_efectivo === 0"
            class="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-6"
          >
            <div class="flex items-center gap-4">
              <span class="text-5xl">✅</span>
              <div>
                <h3 class="text-xl font-bold text-green-800">¡Caja Cuadrada!</h3>
                <p class="text-green-700">El efectivo contado coincide exactamente con el esperado.</p>
              </div>
            </div>
          </div>

          <div 
            v-else
            class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"
          >
            <div class="flex items-start gap-4">
              <span class="text-5xl">⚠️</span>
              <div>
                <h3 class="text-xl font-bold text-yellow-800">Diferencia Detectada</h3>
                <p class="text-yellow-700 mb-2">
                  Hay una diferencia de 
                  <span class="font-bold">Q{{ formatearNumero(Math.abs(cuadre.diferencia_efectivo)) }}</span>
                  {{ cuadre.diferencia_efectivo > 0 ? '(sobrante)' : '(faltante)' }}
                </p>
                <p class="text-sm text-yellow-600">
                  {{ cuadre.requiere_autorizacion ? '⚠️ Esta diferencia requiere autorización de un supervisor.' : 'ℹ️ Diferencia dentro del margen permitido.' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Notas del Cierre -->
          <div class="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">📝 Notas del Cierre (Opcional)</h3>
            <textarea
              v-model="notasCierre"
              rows="3"
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              placeholder="Observaciones, incidencias o comentarios sobre el turno..."
            ></textarea>
          </div>

          <!-- Total a Depositar -->
          <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-xl font-bold mb-1">Total a Depositar</h3>
                <p class="text-sm text-blue-100">Monto que debe ir al banco</p>
              </div>
              <p class="text-4xl font-bold">
                Q{{ formatearNumero(cuadre.total_a_depositar) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <span class="text-xl">❌</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-red-800">Error</p>
              <p class="text-xs text-red-700 mt-1">{{ error }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
        <div v-if="paso === 1" class="flex gap-3">
          <button
            @click="$emit('cancelar')"
            class="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100"
          >
            Cancelar
          </button>
        </div>

        <div v-if="paso === 2" class="flex gap-3">
          <button
            @click="cerrarTurno"
            :disabled="loadingCierre"
            class="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span v-if="loadingCierre">⏳ Cerrando turno...</span>
            <span v-else>🔒 Cerrar Turno Definitivamente</span>
          </button>
          <button
            @click="$emit('cancelar')"
            :disabled="loadingCierre"
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

const emit = defineEmits(['turno-cerrado', 'cancelar'])

const financieroStore = useFinancieroStore()

// Denominaciones
const billetes = [200, 100, 50, 20, 10, 5, 1]
const monedas = [1, 0.50, 0.25, 0.10, 0.05]

// Estado
const paso = ref(1)
const loadingCuadre = ref(false)
const loadingCierre = ref(false)
const error = ref(null)
const cuadre = ref(null)
const notasCierre = ref('')

// Efectivo final
const efectivoFinal = ref({
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

const totalBilletes = computed(() => {
  let total = 0
  billetes.forEach(denom => {
    const cantidad = efectivoFinal.value.billetes[denom] || 0
    total += denom * cantidad
  })
  return total
})

const totalMonedas = computed(() => {
  let total = 0
  monedas.forEach(denom => {
    const cantidad = efectivoFinal.value.monedas[denom] || 0
    total += denom * cantidad
  })
  return total
})

const totalEfectivoFinal = computed(() => {
  return totalBilletes.value + totalMonedas.value
})

// ============================================================================
// METHODS
// ============================================================================

function calcularSubtotalBillete(denominacion) {
  const cantidad = efectivoFinal.value.billetes[denominacion] || 0
  return denominacion * cantidad
}

function calcularSubtotalMoneda(denominacion) {
  const cantidad = efectivoFinal.value.monedas[denominacion] || 0
  return denominacion * cantidad
}

function contarBilletes(denominacion) {
  const cantidad = efectivoFinal.value.billetes[denominacion] || 0
  return cantidad > 0 ? `×${cantidad}` : ''
}

function contarMonedas(denominacion) {
  const cantidad = efectivoFinal.value.monedas[denominacion] || 0
  return cantidad > 0 ? `×${cantidad}` : ''
}

function calcularTotalFinal() {
  // Los computed se actualizan automáticamente
}

/**
 * Calcular cuadre previo
 */
async function calcularCuadre() {
  loadingCuadre.value = true
  error.value = null

  try {
    const datosCierre = {
      efectivo_billetes: efectivoFinal.value.billetes,
      efectivo_monedas: efectivoFinal.value.monedas
    }

    cuadre.value = await financieroStore.calcularCuadrePrevio(datosCierre)
    paso.value = 2

  } catch (err) {
    error.value = err.message
    console.error('Error al calcular cuadre:', err)
  } finally {
    loadingCuadre.value = false
  }
}

/**
 * Cerrar turno definitivamente
 */
async function cerrarTurno() {
  if (!confirm('¿Estás seguro de cerrar el turno? Esta acción no se puede deshacer.')) {
    return
  }

  loadingCierre.value = true
  error.value = null

  try {
    const datosCierre = {
      efectivo_billetes: efectivoFinal.value.billetes,
      efectivo_monedas: efectivoFinal.value.monedas,
      notas: notasCierre.value || null
    }

    await financieroStore.cerrarTurno(datosCierre)

    alert('¡Turno cerrado exitosamente!')
    emit('turno-cerrado')

  } catch (err) {
    error.value = err.message
    console.error('Error al cerrar turno:', err)
    alert(`Error al cerrar turno: ${err.message}`)
  } finally {
    loadingCierre.value = false
  }
}

function formatearNumero(numero) {
  return new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero || 0)
}

function formatearFechaCorta(fecha) {
  if (!fecha) return ''
  return new Intl.DateTimeFormat('es-GT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(fecha))
}
</script>