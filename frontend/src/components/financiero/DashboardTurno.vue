<template>
  <div class="space-y-6">
    <!-- Métricas Principales de Ventas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Venta Total -->
      <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
        <div class="flex items-center justify-between mb-2">
          <span class="text-gray-600 text-sm font-medium">Venta Total</span>
          <span class="text-3xl">💰</span>
        </div>
        <p class="text-3xl font-bold text-gray-900">
          Q{{ formatearNumero(resumen.ventas?.total || 0) }}
        </p>
        <p class="text-sm text-gray-500 mt-1">
          {{ resumen.ventas?.cantidad || 0 }} ventas realizadas
        </p>
      </div>

      <!-- Efectivo -->
      <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
        <div class="flex items-center justify-between mb-2">
          <span class="text-gray-600 text-sm font-medium">Efectivo</span>
          <span class="text-3xl">💵</span>
        </div>
        <p class="text-3xl font-bold text-green-600">
          Q{{ formatearNumero(resumen.ventas?.efectivo || 0) }}
        </p>
        <p class="text-sm text-gray-500 mt-1">
          Ventas en efectivo
        </p>
      </div>

      <!-- Tarjeta -->
      <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
        <div class="flex items-center justify-between mb-2">
          <span class="text-gray-600 text-sm font-medium">Tarjeta</span>
          <span class="text-3xl">💳</span>
        </div>
        <p class="text-3xl font-bold text-blue-600">
          Q{{ formatearNumero(resumen.ventas?.tarjeta || 0) }}
        </p>
        <p class="text-sm text-gray-500 mt-1">
          Ventas con tarjeta
        </p>
      </div>

      <!-- Transferencia -->
      <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
        <div class="flex items-center justify-between mb-2">
          <span class="text-gray-600 text-sm font-medium">Transferencia</span>
          <span class="text-3xl">🏦</span>
        </div>
        <p class="text-3xl font-bold text-purple-600">
          Q{{ formatearNumero(resumen.ventas?.transferencia || 0) }}
        </p>
        <p class="text-sm text-gray-500 mt-1">
          Ventas por transferencia
        </p>
      </div>
    </div>

    <!-- Sección de Impuestos y Gastos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Impuestos Desglosados -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
          <span class="text-2xl">📊</span>
          Impuestos Desglosados
        </h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-green-500 rounded-full"></span>
              <span class="text-gray-700">Efectivo (16%)</span>
            </div>
            <span class="font-semibold text-gray-900">Q{{ formatearNumero(resumen.impuestos?.efectivo || 0) }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span class="text-gray-700">Tarjeta (21.04%)</span>
            </div>
            <span class="font-semibold text-gray-900">Q{{ formatearNumero(resumen.impuestos?.tarjeta || 0) }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-purple-500 rounded-full"></span>
              <span class="text-gray-700">Transferencia (16%)</span>
            </div>
            <span class="font-semibold text-gray-900">Q{{ formatearNumero(resumen.impuestos?.transferencia || 0) }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-orange-500 rounded-full"></span>
              <span class="text-gray-700">Depósitos (16%)</span>
            </div>
            <span class="font-semibold text-gray-900">Q{{ formatearNumero(resumen.impuestos?.depositos || 0) }}</span>
          </div>
          <div class="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
            <span class="font-bold text-gray-900">Total Impuestos</span>
            <span class="font-bold text-xl text-gray-900">Q{{ formatearNumero(calcularTotalImpuestos()) }}</span>
          </div>
        </div>

        <!-- Ventas Netas -->
        <div class="mt-4 bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div class="flex justify-between items-center">
            <span class="font-semibold text-green-800">Ventas Netas</span>
            <span class="font-bold text-xl text-green-700">
              Q{{ formatearNumero((resumen.ventas?.total || 0) - calcularTotalImpuestos()) }}
            </span>
          </div>
          <p class="text-xs text-green-600 mt-1">Venta total - impuestos</p>
        </div>
      </div>

      <!-- Gastos del Turno -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <span class="text-2xl">💸</span>
            Gastos del Turno
          </h3>
          <button
            @click="$emit('registrar-gasto')"
            class="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
          >
            + Registrar Gasto
          </button>
        </div>

        <!-- Lista de Gastos -->
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div v-if="!resumen.gastos || resumen.gastos.length === 0" class="text-center py-8 text-gray-400">
            <span class="text-4xl block mb-2">📭</span>
            <p class="text-sm">No hay gastos registrados</p>
          </div>

          <div 
            v-for="gasto in resumen.gastos" 
            :key="gasto.id"
            class="flex justify-between items-start py-3 border-b border-gray-100 hover:bg-gray-50 px-2 rounded"
          >
            <div class="flex-1">
              <p class="font-medium text-gray-900">{{ gasto.descripcion }}</p>
              <div class="flex items-center gap-3 mt-1">
                <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {{ gasto.categoria }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ formatearFechaCorta(gasto.fecha_creacion) }}
                </span>
              </div>
            </div>
            <span class="font-bold text-red-600 ml-4">-Q{{ formatearNumero(gasto.monto) }}</span>
          </div>
        </div>

        <!-- Total de Gastos -->
        <div class="mt-4 pt-4 border-t-2 border-gray-300">
          <div class="flex justify-between items-center">
            <span class="font-bold text-gray-900">Total Gastos</span>
            <span class="font-bold text-xl text-red-600">
              Q{{ formatearNumero(calcularTotalGastos()) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección de Vouchers y Transferencias -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Vouchers de Tarjeta -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <span class="text-2xl">🧾</span>
            Vouchers de Tarjeta
          </h3>
          <button
            @click="$emit('registrar-voucher')"
            class="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            + Registrar Voucher
          </button>
        </div>

        <!-- Lista de Vouchers -->
        <div class="space-y-2 max-h-48 overflow-y-auto">
          <div v-if="!resumen.vouchers || resumen.vouchers.length === 0" class="text-center py-6 text-gray-400">
            <span class="text-3xl block mb-2">📋</span>
            <p class="text-sm">No hay vouchers registrados</p>
          </div>

          <div 
            v-for="voucher in resumen.vouchers" 
            :key="voucher.id"
            class="flex justify-between items-center py-2 border-b border-gray-100 hover:bg-gray-50 px-2 rounded"
          >
            <div>
              <p class="font-medium text-gray-900">Voucher #{{ voucher.numero_voucher }}</p>
              <p class="text-xs text-gray-500">{{ voucher.banco || 'Sin banco' }}</p>
            </div>
            <span class="font-semibold text-blue-600">Q{{ formatearNumero(voucher.monto) }}</span>
          </div>
        </div>

        <!-- Total y Cuadre de Vouchers -->
        <div class="mt-4 pt-4 border-t-2 border-gray-300 space-y-2">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-600">Total Vouchers:</span>
            <span class="font-semibold">Q{{ formatearNumero(calcularTotalVouchers()) }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-600">Ventas Tarjeta:</span>
            <span class="font-semibold">Q{{ formatearNumero(resumen.ventas?.tarjeta || 0) }}</span>
          </div>
          <div class="flex justify-between items-center pt-2 border-t">
            <span class="font-bold text-gray-900">Diferencia:</span>
            <span 
              class="font-bold text-lg"
              :class="calcularDiferenciaVouchers() === 0 ? 'text-green-600' : 'text-red-600'"
            >
              Q{{ formatearNumero(calcularDiferenciaVouchers()) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Transferencias Bancarias -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <span class="text-2xl">🏦</span>
            Transferencias Bancarias
          </h3>
          <button
            @click="$emit('registrar-transferencia')"
            class="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
          >
            + Registrar Transferencia
          </button>
        </div>

        <!-- Lista de Transferencias -->
        <div class="space-y-2 max-h-48 overflow-y-auto">
          <div v-if="!resumen.transferencias || resumen.transferencias.length === 0" class="text-center py-6 text-gray-400">
            <span class="text-3xl block mb-2">🏦</span>
            <p class="text-sm">No hay transferencias registradas</p>
          </div>

          <div 
            v-for="transferencia in resumen.transferencias" 
            :key="transferencia.id"
            class="flex justify-between items-center py-2 border-b border-gray-100 hover:bg-gray-50 px-2 rounded"
          >
            <div>
              <p class="font-medium text-gray-900">Boleta #{{ transferencia.numero_boleta }}</p>
              <p class="text-xs text-gray-500">{{ transferencia.banco || 'Sin banco' }}</p>
            </div>
            <span class="font-semibold text-purple-600">Q{{ formatearNumero(transferencia.monto) }}</span>
          </div>
        </div>

        <!-- Total y Cuadre de Transferencias -->
        <div class="mt-4 pt-4 border-t-2 border-gray-300 space-y-2">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-600">Total Transferencias:</span>
            <span class="font-semibold">Q{{ formatearNumero(calcularTotalTransferencias()) }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-600">Ventas Transferencia:</span>
            <span class="font-semibold">Q{{ formatearNumero(resumen.ventas?.transferencia || 0) }}</span>
          </div>
          <div class="flex justify-between items-center pt-2 border-t">
            <span class="font-bold text-gray-900">Diferencia:</span>
            <span 
              class="font-bold text-lg"
              :class="calcularDiferenciaTransferencias() === 0 ? 'text-green-600' : 'text-red-600'"
            >
              Q{{ formatearNumero(calcularDiferenciaTransferencias()) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 🏧 Depósitos Bancarios -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
            🏧 Depósitos Bancarios
          </h3>
          <button
            @click="$emit('registrar-deposito')"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            + Registrar Depósito
          </button>
        </div>

        <!-- Lista de depósitos -->
        <div v-if="resumen.depositos && resumen.depositos.length > 0" class="space-y-2 mb-4">
          <div
            v-for="deposito in resumen.depositos"
            :key="deposito.id"
            class="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100"
          >
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ deposito.numero_deposito }}</div>
              <div class="text-sm text-gray-600">{{ deposito.paciente_nombre }}</div>
              <div class="text-xs text-gray-500">
                {{ new Date(deposito.fecha_creacion).toLocaleString('es-GT') }}
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-purple-600">Q{{ formatearNumero(deposito.monto) }}</div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">🏧</div>
          <p>No hay depósitos registrados</p>
        </div>

        <!-- Resumen de depósitos -->
        <div class="border-t border-gray-200 pt-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Total Depósitos:</span>
            <span class="font-semibold text-purple-600">
              Q{{ formatearNumero(resumen.total_depositos || 0) }}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Ventas Depósito:</span>
            <span class="font-semibold">
              Q{{ formatearNumero(resumen.ventas_deposito || 0) }}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Diferencia:</span>
            <span 
              class="font-bold"
              :class="{
                'text-green-600': Math.abs((resumen.total_depositos || 0) - (resumen.ventas_deposito || 0)) < 0.01,
                'text-red-600': Math.abs((resumen.total_depositos || 0) - (resumen.ventas_deposito || 0)) >= 0.01
              }"
            >
              Q{{ formatearNumero((resumen.total_depositos || 0) - (resumen.ventas_deposito || 0)) }}
            </span>
          </div>
        </div>
      </div>


    </div>

    <!-- Resumen de Efectivo en Caja -->
    <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
      <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
        <span class="text-3xl">💰</span>
        Efectivo en Caja Actual
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="bg-white bg-opacity-20 rounded-lg p-4">
          <p class="text-sm text-green-100 mb-1">Efectivo Inicial</p>
          <p class="text-2xl font-bold">Q{{ formatearNumero(resumen.turno?.efectivo_inicial_total || 0) }}</p>
        </div>
        <div class="bg-white bg-opacity-20 rounded-lg p-4">
          <p class="text-sm text-green-100 mb-1">+ Ventas Efectivo</p>
          <p class="text-2xl font-bold">Q{{ formatearNumero(resumen.ventas?.efectivo || 0) }}</p>
        </div>
        <div class="bg-white bg-opacity-20 rounded-lg p-4">
          <p class="text-sm text-green-100 mb-1">- Gastos</p>
          <p class="text-2xl font-bold">Q{{ formatearNumero(calcularTotalGastos()) }}</p>
        </div>
        <div class="bg-white bg-opacity-20 rounded-lg p-4">
          <p class="text-sm text-green-100 mb-1">- Comisiones</p>
          <p class="text-2xl font-bold">Q{{ formatearNumero(resumen.total_comisiones_pagadas || 0) }}</p>
        </div>
        <div class="bg-white bg-opacity-30 rounded-lg p-4 border-2 border-white">
          <p class="text-sm text-green-100 mb-1">= Total en Caja</p>
          <p class="text-3xl font-bold">Q{{ formatearNumero(calcularEfectivoEnCaja()) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  resumen: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['registrar-gasto', 'registrar-voucher', 'registrar-transferencia'])

// ============================================================================
// COMPUTED
// ============================================================================

/**
 * Calcular total de impuestos
 */
function calcularTotalImpuestos() {
  const imp = props.resumen.impuestos || {}
  return (imp.efectivo || 0) + (imp.tarjeta || 0) + (imp.transferencia || 0) + (imp.depositos || 0)
}

/**
 * Calcular total de gastos
 */
function calcularTotalGastos() {
  if (!props.resumen.gastos || props.resumen.gastos.length === 0) return 0
  return props.resumen.gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto || 0), 0)
}

/**
 * Calcular total de vouchers
 */
function calcularTotalVouchers() {
  if (!props.resumen.vouchers || props.resumen.vouchers.length === 0) return 0
  return props.resumen.vouchers.reduce((sum, voucher) => sum + parseFloat(voucher.monto || 0), 0)
}

/**
 * Calcular total de transferencias
 */
function calcularTotalTransferencias() {
  if (!props.resumen.transferencias || props.resumen.transferencias.length === 0) return 0
  return props.resumen.transferencias.reduce((sum, trans) => sum + parseFloat(trans.monto || 0), 0)
}

/**
 * Calcular diferencia de vouchers
 */
function calcularDiferenciaVouchers() {
  const totalVouchers = calcularTotalVouchers()
  const ventasTarjeta = props.resumen.ventas?.tarjeta || 0
  return totalVouchers - ventasTarjeta
}

/**
 * Calcular diferencia de transferencias
 */
function calcularDiferenciaTransferencias() {
  const totalTransferencias = calcularTotalTransferencias()
  const ventasTransferencia = props.resumen.ventas?.transferencia || 0
  return totalTransferencias - ventasTransferencia
}

/**
 * Calcular efectivo en caja
 */
function calcularEfectivoEnCaja() {
  const inicial = props.resumen.turno?.efectivo_inicial_total || 0
  const ventasEfectivo = props.resumen.ventas?.efectivo || 0
  const gastos = calcularTotalGastos()
  const comisiones = props.resumen.total_comisiones_pagadas || 0
  
  return inicial + ventasEfectivo - gastos - comisiones
}

// ============================================================================
// UTILIDADES
// ============================================================================

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
 * Formatear fecha corta
 */
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