<script setup>
import { ref, computed } from 'vue'
import { useFinancieroStore } from '@/store/financiero'
import authService from '@/services/authService'

const emit = defineEmits(['turno-cerrado', 'cancelar'])

const financieroStore = useFinancieroStore()

// Estados
const paso = ref(1) // 1: Conteo, 2: Cuadre, 3: Autorización (si es necesario)
const loadingCuadre = ref(false)
const loadingCierre = ref(false)
const error = ref(null)
const cuadre = ref(null)
const notasCierre = ref('')

// Autorización
const mostrarAutorizacion = ref(false)
const passwordAdmin = ref('')
const justificacionDiferencias = ref('')
const errorAutorizacion = ref(null)

// Denominaciones
const billetes = [200, 100, 50, 20, 10, 5, 1]
const monedas = [1, 0.50, 0.25, 0.10, 0.05]

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

const requiereAutorizacion = computed(() => {
  return cuadre.value?.requiere_autorizacion || false
})

const formularioAutorizacionValido = computed(() => {
  return passwordAdmin.value.trim() !== '' && 
         justificacionDiferencias.value.trim().length >= 10
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

/**
 * Calcular cuadre previo
 */
async function calcularCuadre() {
  loadingCuadre.value = true
  error.value = null

  try {
    const datosCierre = {
      efectivo_final_billetes: efectivoFinal.value.billetes,
      efectivo_final_monedas: efectivoFinal.value.monedas
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
 * Iniciar proceso de cierre
 */
function iniciarCierre() {
  // Si requiere autorización, mostrar formulario
  if (requiereAutorizacion.value) {
    mostrarAutorizacion.value = true
  } else {
    // Si no requiere autorización, cerrar directamente
    cerrarTurno()
  }
}

/**
 * Verificar contraseña del administrador
 */
async function verificarYCerrar() {
  errorAutorizacion.value = null
  loadingCierre.value = true

  try {
    // Validar que la justificación sea suficiente
    if (justificacionDiferencias.value.trim().length < 10) {
      errorAutorizacion.value = 'La justificación debe tener al menos 10 caracteres'
      loadingCierre.value = false
      return
    }

    // Verificar contraseña del admin
    console.log('🔐 Verificando contraseña del administrador...')
    const verificacion = await authService.verificarPasswordAdmin(passwordAdmin.value)
    
    if (!verificacion.success) {
      errorAutorizacion.value = 'Contraseña incorrecta'
      loadingCierre.value = false
      return
    }

    console.log('✅ Contraseña verificada, procediendo al cierre...')

    // Cerrar turno con autorización
    await cerrarTurno(true)

  } catch (err) {
    errorAutorizacion.value = err.message || 'Error al verificar contraseña'
    console.error('Error en verificación:', err)
  } finally {
    loadingCierre.value = false
  }
}

/**
 * Cerrar turno definitivamente
 */
async function cerrarTurno(conAutorizacion = false) {
  loadingCierre.value = true
  error.value = null

  try {
    const datosCierre = {
      efectivo_final_billetes: efectivoFinal.value.billetes,
      efectivo_final_monedas: efectivoFinal.value.monedas,
      total_comisiones_pagadas: cuadre.value?.total_comisiones_pagadas || 0, // Si usas comisiones, agregar aquí
      observaciones: notasCierre.value || null
    }

    // Si viene con autorización, agregar datos del admin
    if (conAutorizacion) {
      const usuario = authService.getUser()
      datosCierre.autorizado_por = usuario?.id
      datosCierre.justificacion_diferencias = justificacionDiferencias.value
    }

    console.log('📤 Enviando datos de cierre:', datosCierre)

    const response = await financieroStore.cerrarTurno(datosCierre)

    if (response.success) {
      console.log('✅ Turno cerrado exitosamente')

      // Descargar PDF automáticamente si está disponible
      if (response.pdf && response.pdf.disponible) {
        console.log('📄 Descargando PDF del reporte...')
        descargarPDF(response.pdf.base64, response.pdf.filename)
      } else if (response.pdf && !response.pdf.disponible) {
        console.warn('⚠️ PDF no disponible:', response.pdf.error)
      }

      // Emitir evento de cierre exitoso
      emit('turno-cerrado', response.data)
    }

  } catch (err) {
    error.value = err.message || 'Error al cerrar el turno'
    console.error('❌ Error cerrando turno:', err)
    
    // Si el error es de autorización requerida, mostrar formulario
    if (err.message?.includes('requiere autorización')) {
      mostrarAutorizacion.value = true
    }
  } finally {
    loadingCierre.value = false
  }
}

/**
 * Función para descargar el PDF desde base64
 */
function descargarPDF(base64String, filename) {
  try {
    console.log('📥 Iniciando descarga del PDF:', filename)
    
    // Convertir base64 a blob
    const byteCharacters = atob(base64String)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    
    // Crear enlace de descarga
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    
    // Simular click para descargar
    document.body.appendChild(link)
    link.click()
    
    // Limpiar
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    console.log('✅ PDF descargado exitosamente')
    
  } catch (err) {
    console.error('❌ Error descargando PDF:', err)
    error.value = 'Error al descargar el PDF del reporte'
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

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
      <!-- Header -->
      <div class="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🔒</span>
            <div>
              <h2 class="text-xl font-bold">Cierre de Turno</h2>
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
      <div class="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        
        <!-- PASO 1: Conteo de Efectivo -->
        <div v-if="paso === 1">
          <h3 class="text-lg font-bold text-gray-900 mb-4">💵 Conteo de Efectivo Final</h3>
          
          <!-- Conteo de Billetes -->
          <div class="mb-6">
            <h4 class="font-semibold text-gray-700 mb-3">Billetes</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div v-for="denom in billetes" :key="`billete-${denom}`" class="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                <label class="block text-sm font-medium text-green-700 mb-1">Q{{ denom }}</label>
                <input
                  v-model.number="efectivoFinal.billetes[denom]"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-green-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                />
                <p class="text-xs text-green-600 mt-1">
                  {{ contarBilletes(denom) }} = Q{{ formatearNumero(calcularSubtotalBillete(denom)) }}
                </p>
              </div>
            </div>
            <div class="mt-3 text-right">
              <span class="text-sm text-gray-600">Subtotal billetes:</span>
              <span class="ml-2 text-lg font-bold text-gray-900">Q{{ formatearNumero(totalBilletes) }}</span>
            </div>
          </div>

          <!-- Conteo de Monedas -->
          <div class="mb-6">
            <h4 class="font-semibold text-gray-700 mb-3">Monedas</h4>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div v-for="denom in monedas" :key="`moneda-${denom}`" class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                <label class="block text-sm font-medium text-yellow-700 mb-1">Q{{ denom }}</label>
                <input
                  v-model.number="efectivoFinal.monedas[denom]"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="0"
                />
                <p class="text-xs text-yellow-600 mt-1">
                  {{ contarMonedas(denom) }} = Q{{ formatearNumero(calcularSubtotalMoneda(denom)) }}
                </p>
              </div>
            </div>
            <div class="mt-3 text-right">
              <span class="text-sm text-gray-600">Subtotal monedas:</span>
              <span class="ml-2 text-lg font-bold text-gray-900">Q{{ formatearNumero(totalMonedas) }}</span>
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
        <div v-if="paso === 2 && cuadre && !mostrarAutorizacion">
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
                <p class="font-semibold">{{ cuadre.duracion }}</p>
              </div>
            </div>
          </div>

          <!-- Resumen de Ventas -->
          <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-blue-900 mb-4">💰 Resumen de Ventas</h3>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p class="text-sm text-blue-700">Venta Total</p>
                <p class="text-2xl font-bold text-blue-900">Q{{ formatearNumero(cuadre.venta_total) }}</p>
              </div>
              <div>
                <p class="text-sm text-blue-700">Efectivo</p>
                <p class="text-xl font-semibold text-blue-800">Q{{ formatearNumero(cuadre.ventas_efectivo) }}</p>
              </div>
              <div>
                <p class="text-sm text-blue-700">Tarjeta</p>
                <p class="text-xl font-semibold text-blue-800">Q{{ formatearNumero(cuadre.ventas_tarjeta) }}</p>
              </div>
              <div>
                <p class="text-sm text-blue-700">Transferencia</p>
                <p class="text-xl font-semibold text-blue-800">Q{{ formatearNumero(cuadre.ventas_transferencia) }}</p>
              </div>
              <div>
                <p class="text-sm text-blue-700">Depósito</p>
                <p class="text-xl font-semibold text-blue-800">Q{{ formatearNumero(cuadre.ventas_deposito || 0) }}</p>
              </div>
            </div>
          </div>

          <!-- Impuestos Desglosados -->
          <div class="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-purple-900 mb-4">📊 Impuestos Desglosados</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-purple-700">Efectivo (16%)</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.impuesto_efectivo) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-purple-700">Tarjeta (21.04%)</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.impuesto_tarjeta) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-purple-700">Transferencia (16%)</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.impuesto_transferencia) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-purple-700">Depósitos (16%)</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.impuesto_depositos || 0) }}</span>
              </div>
              <div class="flex justify-between border-t pt-2">
                <span class="font-bold text-purple-900">Total Impuestos</span>
                <span class="font-bold text-purple-900">Q{{ formatearNumero(cuadre.total_impuestos) }}</span>
              </div>
            </div>
          </div>

          <!-- Ventas Netas -->
          <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
            <div class="flex justify-between items-center">
              <span class="text-green-700 font-semibold">Ventas Netas</span>
              <span class="text-2xl font-bold text-green-900">Q{{ formatearNumero(cuadre.ventas_netas) }}</span>
            </div>
            <p class="text-xs text-green-600 mt-1">Venta total - impuestos</p>
          </div>

          <!-- Gastos y Movimientos -->
          <div class="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">💸 Gastos y Movimientos</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-700">Total Gastos</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.total_gastos) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-700">Comisiones Pagadas</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.total_comisiones_pagadas) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-700">Total Vouchers</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.total_vouchers) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-700">Total Transferencias</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.total_transferencias) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-700">Total Depósitos</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.total_depositos || 0) }}</span>
              </div>
            </div>
          </div>

          <!-- CUADRE DE EFECTIVO -->
          <div class="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-orange-900 mb-4">🔢 Cuadre de Efectivo</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2">
                <span class="text-orange-800">Efectivo Inicial</span>
                <span class="font-semibold">Q{{ formatearNumero(cuadre.efectivo_inicial ) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-orange-800">+ Ventas en Efectivo</span>
                <span class="font-semibold text-green-600">+Q{{ formatearNumero(cuadre.ventas_efectivo) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-orange-800">- Gastos</span>
                <span class="font-semibold text-red-600">-Q{{ formatearNumero(cuadre.total_gastos) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-orange-800">- Comisiones Pagadas</span>
                <span class="font-semibold text-red-600">-Q{{ formatearNumero(cuadre.total_comisiones_pagadas || 0) }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-t-2 border-orange-400 pt-3">
                <span class="font-bold text-orange-900">= Efectivo Esperado</span>
                <span class="font-bold text-xl text-orange-900">Q{{ formatearNumero(cuadre.efectivo_esperado) }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="font-bold text-orange-900">Efectivo Contado (Real)</span>
                <span class="font-bold text-xl text-orange-900">Q{{ formatearNumero(cuadre.efectivo_contado) }}</span>
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
          <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 mb-6">
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

          <!-- Botón Cerrar -->
          <div class="flex justify-end">
            <button
              @click="iniciarCierre"
              :disabled="loadingCierre"
              class="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50"
            >
              <span v-if="loadingCierre">⏳ Cerrando turno...</span>
              <span v-else>🔒 Cerrar Turno Definitivamente</span>
            </button>
          </div>
        </div>

        <!-- PASO 3: Autorización (si se requiere) -->
        <div v-if="mostrarAutorizacion && requiereAutorizacion" class="space-y-6">
          <div class="bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <div class="flex items-start gap-4">
              <span class="text-4xl">🔐</span>
              <div>
                <h3 class="text-xl font-bold text-red-800 mb-2">Autorización Requerida</h3>
                <p class="text-red-700 mb-3">
                  La diferencia de <span class="font-bold">Q{{ formatearNumero(Math.abs(cuadre.diferencia_efectivo)) }}</span>
                  requiere autorización de un administrador para proceder con el cierre.
                </p>
              </div>
            </div>
          </div>

          <!-- Formulario de Autorización -->
          <div class="bg-white border-2 border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Datos de Autorización</h3>
            
            <!-- Contraseña -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Contraseña de Administrador *
              </label>
              <input
                v-model="passwordAdmin"
                type="password"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Ingresa tu contraseña"
                @keyup.enter="verificarYCerrar"
              />
              <p class="text-xs text-gray-500 mt-1">
                Ingresa tu contraseña actual para autorizar el cierre
              </p>
            </div>

            <!-- Justificación -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Justificación de la Diferencia *
              </label>
              <textarea
                v-model="justificacionDiferencias"
                rows="4"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                placeholder="Explica por qué hay diferencia en el efectivo (mínimo 10 caracteres)..."
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">
                Mínimo 10 caracteres. Sé específico sobre la causa de la diferencia.
              </p>
            </div>

            <!-- Error de Autorización -->
            <div v-if="errorAutorizacion" class="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
              <div class="flex items-start gap-3">
                <span class="text-xl">❌</span>
                <div class="flex-1">
                  <p class="text-sm font-medium text-red-800">Error</p>
                  <p class="text-xs text-red-700 mt-1">{{ errorAutorizacion }}</p>
                </div>
              </div>
            </div>

            <!-- Botones -->
            <div class="flex gap-3">
              <button
                @click="verificarYCerrar"
                :disabled="!formularioAutorizacionValido || loadingCierre"
                class="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="loadingCierre">⏳ Verificando y cerrando...</span>
                <span v-else>✓ Autorizar y Cerrar Turno</span>
              </button>
              <button
                @click="mostrarAutorizacion = false"
                :disabled="loadingCierre"
                class="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>
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
    </div>
  </div>
</template>

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
  background: #ef4444;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #dc2626;
}
</style>