<!-- frontend/src/components/comisiones/DashboardComisiones.vue -->
<template>
  <div class="space-y-6">
    <!-- Resumen General -->
    <div v-if="comisionesStore.resumenDashboard" class="card p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">📊 Resumen General</h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Total Pendiente -->
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-green-700 font-medium">Total Pendiente</p>
              <p class="text-2xl font-bold text-green-900 mt-1">
                Q{{ formatearMoneda(comisionesStore.totalPendiente) }}
              </p>
            </div>
            <div class="text-3xl">💰</div>
          </div>
        </div>

        <!-- Doctoras con Comisiones -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-blue-700 font-medium">Doctoras</p>
              <p class="text-2xl font-bold text-blue-900 mt-1">
                {{ comisionesStore.totalDoctoras }}
              </p>
              <p class="text-xs text-blue-600 mt-1">con comisiones</p>
            </div>
            <div class="text-3xl">👩‍⚕️</div>
          </div>
        </div>

        <!-- Fecha de Corte -->
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-purple-700 font-medium">Fecha de Corte</p>
              <p class="text-lg font-bold text-purple-900 mt-1">
                {{ formatearFecha(comisionesStore.resumenDashboard.fecha_corte) }}
              </p>
            </div>
            <div class="text-3xl">📅</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado de Carga -->
    <div v-if="comisionesStore.cargando" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="text-gray-600 mt-4">Cargando comisiones...</p>
    </div>

    <!-- Lista de Doctoras con Comisiones Pendientes -->
    <div v-else-if="comisionesStore.hayComisionesPendientes" class="space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">👩‍⚕️ Comisiones Pendientes</h2>
      
      <!-- Card por cada doctora -->
      <div
        v-for="doctora in comisionesStore.comisionesPendientes"
        :key="doctora.doctora_id"
        class="card hover:shadow-lg transition-shadow duration-200"
      >
        <div class="p-6">
          <!-- Header del card -->
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <h3 class="text-xl font-semibold text-gray-900">
                {{ doctora.doctora_nombre }}
              </h3>
              <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span class="flex items-center gap-1">
                  📦 {{ doctora.cantidad_ventas }} ventas
                </span>
                <span v-if="doctora.fecha_primera_venta" class="flex items-center gap-1">
                  📅 {{ formatearFechaCorta(doctora.fecha_primera_venta) }} 
                  - 
                  {{ formatearFechaCorta(doctora.fecha_ultima_venta) }}
                </span>
              </div>
            </div>
            
            <!-- Monto destacado -->
            <div class="text-right ml-4">
              <p class="text-3xl font-bold text-green-600">
                Q{{ formatearMoneda(doctora.monto_pendiente) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">pendiente</p>
            </div>
          </div>

          <!-- Detalles adicionales (si hay) -->
          <div v-if="doctora.observaciones" class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p class="text-sm text-yellow-800">
              <span class="font-medium">📝 Nota:</span> {{ doctora.observaciones }}
            </p>
          </div>

          <!-- Botón de acción -->
          <div class="flex gap-2">
            <button
              @click="$emit('pagar-comision', doctora)"
              class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
            >
              💳 Pagar Comisiones
            </button>
            
            <button
              @click="verDetalleVentas(doctora)"
              class="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Ver detalle de ventas"
            >
              🔍
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="text-center py-12">
      <div class="text-6xl mb-4">✅</div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">
        No hay comisiones pendientes
      </h3>
      <p class="text-gray-600">
        Todas las comisiones han sido pagadas
      </p>
      <button
        @click="comisionesStore.cargarDashboard()"
        class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        🔄 Actualizar
      </button>
    </div>

        <!-- Modal de detalle de ventas -->
    <ModalDetalleVentas
      v-if="modalDetalleAbierto"
      :doctora="doctoraSeleccionada"
      @cerrar="cerrarModalDetalle"
    />
    
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useComisionesStore } from '@/store/comisionesStore'
import ModalDetalleVentas from './ModalDetalleVentas.vue'

// ============================================================================
// EMITS
// ============================================================================

const emit = defineEmits(['pagar-comision'])

// ============================================================================
// ESTADO
// ============================================================================

const comisionesStore = useComisionesStore()
const modalDetalleAbierto = ref(false)
const doctoraSeleccionada = ref(null)

// ============================================================================
// CICLO DE VIDA
// ============================================================================

onMounted(() => {
  console.log('📊 DashboardComisiones montado')
  
  // Si no hay datos, cargar
  if (!comisionesStore.hayComisionesPendientes && !comisionesStore.cargando) {
    comisionesStore.cargarDashboard()
  }
})

// ============================================================================
// MÉTODOS
// ============================================================================

/**
 * Formatea un número como moneda (sin símbolo Q)
 */
function formatearMoneda(valor) {
  if (!valor && valor !== 0) return '0.00'
  return Number(valor).toFixed(2)
}

/**
 * Formatea una fecha a formato legible
 */
function formatearFecha(fecha) {
  if (!fecha) return '-'
  
  const date = new Date(fecha)
  const opciones = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  
  return date.toLocaleDateString('es-ES', opciones)
}

/**
 * Formatea una fecha a formato corto (DD/MM/YYYY)
 */
function formatearFechaCorta(fecha) {
  if (!fecha) return '-'
  
  const date = new Date(fecha)
  const dia = String(date.getDate()).padStart(2, '0')
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const año = date.getFullYear()
  
  return `${dia}/${mes}/${año}`
}

function verDetalleVentas(doctora) {
  console.log('🔍 Viendo detalle de ventas para:', doctora.doctora_nombre)
  doctoraSeleccionada.value = doctora
  modalDetalleAbierto.value = true
}

function cerrarModalDetalle() {
  modalDetalleAbierto.value = false
  doctoraSeleccionada.value = null
}


</script>

<style scoped>
.card {
  @apply bg-white rounded-lg shadow-md;
}
</style>