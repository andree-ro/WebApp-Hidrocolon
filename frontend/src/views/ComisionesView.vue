<!-- frontend/src/views/ComisionesView.vue -->
<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6">


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


    <!-- Header -->
    <div class="max-w-7xl mx-auto mb-6">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">💰 Comisiones de Doctoras</h1>
          <p class="text-gray-600 mt-1">Gestión de comisiones y pagos</p>
        </div>
        
        <!-- Acciones rápidas -->
        <div class="flex gap-2">
          <button
            @click="comisionesStore.cargarDashboard()"
            :disabled="comisionesStore.cargando"
            class="btn-secondary text-sm"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="max-w-7xl mx-auto mb-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="flex border-b border-gray-200">
          <button
            @click="tabActivo = 'dashboard'"
            :class="[
              'flex-1 px-6 py-3 text-sm font-medium transition-colors',
              tabActivo === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
          >
            📊 Dashboard
          </button>
          <button
            @click="cambiarTab('historial')"
            :class="[
              'flex-1 px-6 py-3 text-sm font-medium transition-colors',
              tabActivo === 'historial'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
          >
            📚 Historial
          </button>
        </div>
      </div>
    </div>

    <!-- Mensajes de error/éxito -->
    <div v-if="comisionesStore.error" class="max-w-7xl mx-auto mb-6">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start">
          <span class="text-2xl mr-3">❌</span>
          <div class="flex-1">
            <p class="text-red-800 font-medium">Error</p>
            <p class="text-red-600 text-sm mt-1">{{ comisionesStore.error }}</p>
          </div>
          <button 
            @click="comisionesStore.limpiarError()"
            class="text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <div v-if="comisionesStore.mensaje" class="max-w-7xl mx-auto mb-6">
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-start">
          <span class="text-2xl mr-3">✅</span>
          <div class="flex-1">
            <p class="text-green-800 font-medium">Éxito</p>
            <p class="text-green-600 text-sm mt-1">{{ comisionesStore.mensaje }}</p>
          </div>
          <button 
            @click="comisionesStore.limpiarMensaje()"
            class="text-green-400 hover:text-green-600"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Contenido según tab activo -->
    <div class="max-w-7xl mx-auto">
      <!-- Tab Dashboard -->
      <div v-if="tabActivo === 'dashboard'">
        <DashboardComisiones @pagar-comision="abrirModalPago" />
      </div>

      <!-- Tab Historial -->
      <div v-if="tabActivo === 'historial'">
        <HistorialPagos @ver-detalle="verDetallePago" @anular="abrirModalAnular" />
      </div>
    </div>

    <!-- Modal de Pago -->
    <ModalPagoComisiones
      v-if="modalPagoAbierto"
      :doctora="doctoraSeleccionada"
      @cerrar="cerrarModalPago"
      @pago-exitoso="manejarPagoExitoso"
    />

    <!-- Modal de Anular -->
    <ModalAnularPago
      v-if="modalAnularAbierto"
      :pago="pagoAAnular"
      @cerrar="cerrarModalAnular"
      @anulacion-exitosa="manejarAnulacionExitosa"
    />

    <!-- Modal de Detalle (opcional) -->
    <ModalDetallePago
      v-if="modalDetalleAbierto"
      :pago="pagoDetalle"
      @cerrar="cerrarModalDetalle"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useComisionesStore } from '@/store/comisionesStore'
import DashboardComisiones from '@/components/comisiones/DashboardComisiones.vue'
import HistorialPagos from '@/components/comisiones/HistorialPagos.vue'
import ModalPagoComisiones from '@/components/comisiones/ModalPagoComisiones.vue'
import ModalAnularPago from '@/components/comisiones/ModalAnularPago.vue'
import ModalDetallePago from '@/components/comisiones/ModalDetallePago.vue'

// ============================================================================
// ESTADO
// ============================================================================

const comisionesStore = useComisionesStore()

const tabActivo = ref('dashboard')
const modalPagoAbierto = ref(false)
const modalAnularAbierto = ref(false)
const modalDetalleAbierto = ref(false)

const doctoraSeleccionada = ref(null)
const pagoAAnular = ref(null)
const pagoDetalle = ref(null)

// ============================================================================
// CICLO DE VIDA
// ============================================================================

onMounted(async () => {
  console.log('🎬 ComisionesView montado')
  
  // Cargar datos iniciales
  await Promise.all([
    comisionesStore.cargarDashboard(),
    comisionesStore.cargarDoctoras()
  ])
})

onUnmounted(() => {
  console.log('🎬 ComisionesView desmontado')
  // Limpiar mensajes al salir
  comisionesStore.limpiarError()
  comisionesStore.limpiarMensaje()
})

// ============================================================================
// MÉTODOS - TABS
// ============================================================================

/**
 * Cambia el tab activo y carga datos si es necesario
 */
async function cambiarTab(nuevoTab) {
  tabActivo.value = nuevoTab
  
  console.log(`📑 Cambiando a tab: ${nuevoTab}`)
  
  // Cargar datos específicos del tab
  if (nuevoTab === 'historial' && comisionesStore.historialPagos.length === 0) {
    await comisionesStore.cargarHistorial()
  }
}

// ============================================================================
// MÉTODOS - MODAL PAGO
// ============================================================================

/**
 * Abre el modal de pago con los datos de la doctora
 */
function abrirModalPago(doctora) {
  console.log('💳 Abriendo modal de pago para:', doctora.doctora_nombre)
  
  doctoraSeleccionada.value = {
    id: doctora.doctora_id,
    nombre: doctora.doctora_nombre,
    monto_pendiente: doctora.monto_pendiente,
    cantidad_ventas: doctora.cantidad_ventas,
    fecha_primera_venta: doctora.fecha_primera_venta,
    fecha_ultima_venta: doctora.fecha_ultima_venta
  }
  
  modalPagoAbierto.value = true
}

/**
 * Cierra el modal de pago
 */
function cerrarModalPago() {
  console.log('❌ Cerrando modal de pago')
  modalPagoAbierto.value = false
  doctoraSeleccionada.value = null
  comisionesStore.limpiarVentasAgrupadas()
}

/**
 * Maneja el evento de pago exitoso
 */
async function manejarPagoExitoso(resultado) {
  console.log('✅ Pago registrado exitosamente:', resultado)
  
  cerrarModalPago()
  
  // Mostrar mensaje de éxito (ya lo hace el store)
  // El dashboard ya se recargó automáticamente en el store
  
  // Opcional: cambiar a tab historial para ver el pago
  // tabActivo.value = 'historial'
  // await comisionesStore.cargarHistorial()
}

// ============================================================================
// MÉTODOS - MODAL ANULAR
// ============================================================================

/**
 * Abre el modal para anular un pago
 */
function abrirModalAnular(pago) {
  console.log('🗑️ Abriendo modal de anulación para pago:', pago.id)
  
  pagoAAnular.value = pago
  modalAnularAbierto.value = true
}

/**
 * Cierra el modal de anulación
 */
function cerrarModalAnular() {
  console.log('❌ Cerrando modal de anulación')
  modalAnularAbierto.value = false
  pagoAAnular.value = null
}

/**
 * Maneja el evento de anulación exitosa
 */
async function manejarAnulacionExitosa(resultado) {
  console.log('✅ Pago anulado exitosamente:', resultado)
  
  cerrarModalAnular()
  
  // El historial y dashboard ya se recargaron automáticamente en el store
}

// ============================================================================
// MÉTODOS - MODAL DETALLE
// ============================================================================

/**
 * Abre el modal de detalle de un pago
 */
async function verDetallePago(pago) {
  console.log('🔍 Viendo detalle de pago:', pago.id)
  
  try {
    // Cargar el pago completo con detalles
    await comisionesStore.cargarPago(pago.id)
    
    pagoDetalle.value = comisionesStore.pagoSeleccionado
    modalDetalleAbierto.value = true
  } catch (error) {
    console.error('Error cargando detalle:', error)
  }
}

/**
 * Cierra el modal de detalle
 */
function cerrarModalDetalle() {
  console.log('❌ Cerrando modal de detalle')
  modalDetalleAbierto.value = false
  pagoDetalle.value = null
}
</script>

<style scoped>
/* Estilos específicos si es necesario */
.btn-secondary {
  @apply px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>