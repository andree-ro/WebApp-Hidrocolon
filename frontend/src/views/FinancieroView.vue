<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6">
    <!-- Header -->
    <div class="max-w-7xl mx-auto mb-6">

                    <!-- Botón Volver al Dashboard -->
      <button
        @click="$router.push('/')"
        class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        <span>Menú Principal</span>
      </button>
      <div class="flex items-center justify-between">

        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">💰 Módulo Financiero</h1>
          <p class="text-gray-600 mt-1">Control de turnos, caja y finanzas</p>
        </div>
        

      </div>
    </div>

    <!-- Loading State -->
    <div v-if="financieroStore.loading.turno" class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Verificando turno activo...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="financieroStore.error" class="max-w-7xl mx-auto">
      <div class="bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <div class="flex items-start gap-3">
          <span class="text-3xl">⚠️</span>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-red-800 mb-2">Error al cargar el módulo</h3>
            <p class="text-red-700">{{ financieroStore.error }}</p>
            <button
              @click="verificarTurno"
              class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- SIN TURNO ACTIVO -->
    <div v-else-if="!financieroStore.hayTurnoActivo" class="max-w-4xl mx-auto">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- Icono y mensaje -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
            <span class="text-4xl">🔒</span>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">No hay turno activo</h2>
          <p class="text-gray-600">Debes abrir un turno para comenzar a trabajar con el módulo financiero</p>
        </div>

        <!-- Información sobre apertura de turno -->
        <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <h3 class="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span>ℹ️</span>
            ¿Qué necesitas para abrir un turno?
          </h3>
          <ul class="space-y-2 text-blue-800">
            <li class="flex items-start gap-2">
              <span class="text-blue-600 mt-1">•</span>
              <span>Contar el efectivo inicial en caja (billetes y monedas)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-600 mt-1">•</span>
              <span>El sistema calculará automáticamente el total</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-600 mt-1">•</span>
              <span>Podrás registrar ventas, gastos, vouchers y transferencias</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-600 mt-1">•</span>
              <span>Al cerrar el turno, el sistema hará el cuadre automático</span>
            </li>
          </ul>
        </div>

        <!-- Botón para abrir turno -->
        <div class="text-center flex flex-col items-center gap-4">
          <button
            @click="financieroStore.abrirModalApertura()"
            class="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 shadow-lg transform transition-all hover:scale-105"
          >
            <span class="text-2xl">🔓</span>
            <span>Abrir Turno</span>
          </button>
          <button
            @click="mostrarHistorialReportes = true"
            class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>📋</span>
            <span>Historial de Reportes</span>
          </button>
        </div>

        <!-- Estadísticas rápidas (si existen) -->
        <div v-if="estadisticas" class="mt-8 pt-6 border-t border-gray-200">
          <h3 class="text-sm font-semibold text-gray-600 mb-4 text-center">Estadísticas Generales</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">{{ estadisticas.total_turnos || 0 }}</div>
              <div class="text-xs text-gray-500 mt-1">Turnos totales</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">Q{{ formatearNumero(estadisticas.ventas_totales || 0) }}</div>
              <div class="text-xs text-gray-500 mt-1">Ventas totales</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">Q{{ formatearNumero(estadisticas.venta_promedio || 0) }}</div>
              <div class="text-xs text-gray-500 mt-1">Venta promedio</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-orange-600">Q{{ formatearNumero(estadisticas.total_depositado || 0) }}</div>
              <div class="text-xs text-gray-500 mt-1">Total depositado</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CON TURNO ACTIVO - Dashboard del Turno -->
    <div v-else class="max-w-7xl mx-auto">
      <!-- Header del Turno Activo -->
      <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white mb-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="text-3xl">✅</span>
              <div>
                <h2 class="text-2xl font-bold">Turno Activo #{{ financieroStore.turnoActivo.id }}</h2>
                <p class="text-green-100">{{ financieroStore.infoTurno.usuario }}</p>
              </div>
            </div>
            <div class="flex items-center gap-4 text-sm text-green-100 mt-3">
              <div class="flex items-center gap-1">
                <span>📅</span>
                <span>{{ formatearFecha(financieroStore.infoTurno.fechaApertura) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <span>⏱️</span>
                <span>{{ financieroStore.duracionTurno }}</span>
              </div>
              <div class="flex items-center gap-1">
                <span>💵</span>
                <span>Inicial: Q{{ formatearNumero(financieroStore.infoTurno.efectivoInicial) }}</span>
              </div>
            </div>
          </div>
          
          <div class="flex gap-3">
            <button
              @click="refrescarDatos"
              :disabled="financieroStore.loading.resumen"
              class="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors disabled:opacity-50"
            >
              🔄 Refrescar
            </button>
            <button
              @click="mostrarHistorialReportes = true"
              class="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold rounded-lg transition-colors"
            >
              📋 Historial
            </button>
            <button
              @click="financieroStore.abrirModalCierre()"
              class="px-6 py-2 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors"
            >
              🔒 Cerrar Turno
            </button>
          </div>
        </div>
      </div>

      <!-- Dashboard de métricas -->
      <DashboardTurno 
        v-if="financieroStore.resumenTurno"
        :resumen="financieroStore.resumenTurno"
        @registrar-gasto="financieroStore.toggleModalGasto()"
        @registrar-voucher="financieroStore.toggleModalVoucher()"
        @registrar-transferencia="financieroStore.toggleModalTransferencia()"
        @registrar-deposito="financieroStore.toggleModalDeposito()"
      />

      <!-- Mensaje si no hay resumen -->
      <div v-else class="bg-white rounded-lg shadow p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Cargando datos del turno...</p>
      </div>
    </div>

    <!-- MODALES -->
    <AperturaTurno 
      v-if="financieroStore.mostrarModalApertura"
      @turno-abierto="onTurnoAbierto"
      @cancelar="financieroStore.cerrarModalApertura()"
    />

    <CierreTurno
      v-if="financieroStore.mostrarModalCierre"
      @turno-cerrado="onTurnoCerrado"
      @cancelar="financieroStore.cerrarModalCierre()"
    />

    <ModalGasto
      v-if="financieroStore.mostrarModalGasto"
      @gasto-registrado="onGastoRegistrado"
      @cancelar="financieroStore.toggleModalGasto()"
    />

    <ModalVoucher
      v-if="financieroStore.mostrarModalVoucher"
      @voucher-registrado="onVoucherRegistrado"
      @cancelar="financieroStore.toggleModalVoucher()"
    />

    <ModalTransferencia
      v-if="financieroStore.mostrarModalTransferencia"
      @transferencia-registrada="onTransferenciaRegistrada"
      @cancelar="financieroStore.toggleModalTransferencia()"
    />
    <ModalDeposito
      v-if="financieroStore.mostrarModalDeposito"
      @deposito-registrado="onDepositoRegistrado"
      @cancelar="financieroStore.toggleModalDeposito()"
    />

    <HistorialReportes
      v-if="mostrarHistorialReportes"
      @cerrar="mostrarHistorialReportes = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFinancieroStore } from '@/store/financiero'
import { useRouter } from 'vue-router'

// Importar componentes (los crearemos después)
import DashboardTurno from '@/components/financiero/DashboardTurno.vue'
import AperturaTurno from '@/components/financiero/AperturaTurno.vue'
import CierreTurno from '@/components/financiero/CierreTurno.vue'
import ModalGasto from '@/components/financiero/ModalGasto.vue'
import ModalVoucher from '@/components/financiero/ModalVoucher.vue'
import ModalTransferencia from '@/components/financiero/ModalTransferencia.vue'
import ModalDeposito from '@/components/financiero/ModalDeposito.vue'
import HistorialReportes from '@/components/financiero/HistorialReportes.vue'

const financieroStore = useFinancieroStore()
const router = useRouter()

const estadisticas = ref(null)
const mostrarHistorialReportes = ref(false)

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(async () => {
  await verificarTurno()
  await cargarEstadisticas()
})

// ============================================================================
// METHODS
// ============================================================================

/**
 * Verificar si hay turno activo
 */
async function verificarTurno() {
  try {
    await financieroStore.verificarTurnoActivo()
  } catch (error) {
    console.error('Error al verificar turno:', error)
  }
}

/**
 * Cargar estadísticas generales
 */
async function cargarEstadisticas() {
  try {
    const response = await financieroStore.obtenerEstadisticas()
    estadisticas.value = response.data
  } catch (error) {
    console.error('Error al cargar estadísticas:', error)
  }
}

/**
 * Refrescar datos del turno
 */
async function refrescarDatos() {
  try {
    await financieroStore.refrescarDatos()
  } catch (error) {
    console.error('Error al refrescar datos:', error)
  }
}

/**
 * Volver al dashboard
 */
function volverAlDashboard() {
  router.push({ name: 'Dashboard' })
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Cuando se abre un turno
 */
async function onTurnoAbierto() {
  console.log('✅✅✅ onTurnoAbierto EJECUTÁNDOSE')
    financieroStore.cerrarModalApertura()
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log('🚀 REDIRIGIENDO')
    try {
      await router.push('/')
    } catch (e) {
      window.location.href = '/'
    }
}

/**
 * Cuando se cierra un turno
 */
function onTurnoCerrado() {
  console.log('✅ Turno cerrado exitosamente')
  // Recargar estadísticas
  cargarEstadisticas()
}

/**
 * Cuando se registra un gasto
 */
function onGastoRegistrado() {
  console.log('✅ Gasto registrado exitosamente')
}

/**
 * Cuando se registra un voucher
 */
function onVoucherRegistrado() {
  console.log('✅ Voucher registrado exitosamente')
}

/**
 * Cuando se registra una transferencia
 */
function onTransferenciaRegistrada() {
  console.log('✅ Transferencia registrada exitosamente')
}

function onDepositoRegistrado() {
  console.log('✅ Depósito registrado exitosamente')
  financieroStore.toggleModalDeposito()
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Formatear número con comas
 */
function formatearNumero(numero) {
  return new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero || 0)
}

/**
 * Formatear fecha
 */
function formatearFecha(fecha) {
  if (!fecha) return ''
  return new Intl.DateTimeFormat('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(fecha))
}
</script>

<style scoped>
/* Animaciones personalizadas si las necesitas */
</style>