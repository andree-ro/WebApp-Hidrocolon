<!-- frontend/src/components/comisiones/ModalDetallePago.vue -->
<template>
  <!-- Overlay -->
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" @click.self="cerrar">
    <!-- Modal -->
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold">🔍 Detalle de Pago</h2>
          <p class="text-blue-100 text-sm mt-1">Pago #{{ pago.id }}</p>
        </div>
        <button
          @click="cerrar"
          class="text-white hover:bg-blue-500 rounded-full p-2 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-6">
        
        <!-- Información General -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📋 Información General</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Card Doctora -->
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p class="text-sm text-purple-700 font-medium mb-1">Doctora</p>
              <p class="text-lg font-bold text-purple-900">{{ pago.doctora_nombre }}</p>
            </div>

            <!-- Card Monto -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <p class="text-sm text-green-700 font-medium mb-1">Monto Total</p>
              <p class="text-2xl font-bold text-green-900">Q{{ parseFloat(pago.monto_total).toFixed(2) }}</p>
            </div>

            <!-- Card Estado -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="text-sm text-blue-700 font-medium mb-1">Estado</p>
              <span :class="getBadgeClass(pago.estado)">
                {{ getEstadoTexto(pago.estado) }}
              </span>
            </div>

            <!-- Card Fecha -->
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p class="text-sm text-orange-700 font-medium mb-1">Fecha de Pago</p>
              <p class="text-lg font-bold text-orange-900">{{ formatearFecha(pago.fecha_pago) }}</p>
            </div>
          </div>
        </div>

        <!-- Período y Ventas -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📅 Período y Ventas</h3>
          
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Fecha de Corte:</span>
              <span class="font-semibold text-gray-900">{{ formatearFecha(pago.fecha_corte) }}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Cantidad de Ventas:</span>
              <span class="font-semibold text-gray-900">{{ pago.cantidad_ventas }} ventas</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Efectivo Disponible:</span>
              <span class="font-semibold text-gray-900">
                {{ pago.efectivo_disponible ? '✅ Sí' : '❌ No' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Observaciones -->
        <div v-if="pago.observaciones" class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📝 Observaciones</h3>
          
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-900">{{ pago.observaciones }}</p>
          </div>
        </div>

        <!-- Información de Auditoría -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">🔐 Auditoría</h3>
          
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Registrado por:</span>
              <span class="font-semibold text-gray-900">
                {{ pago.usuario_nombres }} {{ pago.usuario_apellidos }}
              </span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Fecha de Registro:</span>
              <span class="font-semibold text-gray-900">
                {{ formatearFechaHora(pago.fecha_creacion) }}
              </span>
            </div>
            
            <div v-if="pago.fecha_actualizacion !== pago.fecha_creacion" class="flex justify-between">
              <span class="text-sm text-gray-600">Última Actualización:</span>
              <span class="font-semibold text-gray-900">
                {{ formatearFechaHora(pago.fecha_actualizacion) }}
              </span>
            </div>

            <div v-if="pago.turno_id" class="flex justify-between">
              <span class="text-sm text-gray-600">Turno ID:</span>
              <span class="font-semibold text-gray-900">#{{ pago.turno_id }}</span>
            </div>
          </div>
        </div>

        <!-- PDF -->
        <div v-if="pago.pdf_generado && pago.pdf_url" class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📄 Documento PDF</h3>
          
          <button
            @click="descargarPDF"
            class="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            📄 Descargar Comprobante PDF
          </button>
        </div>

        <!-- Detalles de productos (si existen) -->
        <div v-if="pago.detalles && pago.detalles.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📦 Detalles de Productos</h3>
          
          <div class="overflow-x-auto border border-gray-200 rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Comisión</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="detalle in pago.detalles" :key="detalle.id">
                  <td class="px-4 py-3 text-sm text-gray-900">{{ detalle.producto_nombre }}</td>
                  <td class="px-4 py-3 text-sm text-right text-gray-700">{{ detalle.cantidad }}</td>
                  <td class="px-4 py-3 text-sm text-right font-semibold text-green-600">
                    Q{{ detalle.monto_comision }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <button
          @click="cerrar"
          class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          ✓ Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// ============================================================================
// PROPS
// ============================================================================

const props = defineProps({
  pago: {
    type: Object,
    required: true
  }
})

// ============================================================================
// EMITS
// ============================================================================

const emit = defineEmits(['cerrar'])

// ============================================================================
// MÉTODOS
// ============================================================================

/**
 * Cierra el modal
 */
function cerrar() {
  emit('cerrar')
}

/**
 * Obtiene la clase CSS del badge según el estado
 */
function getBadgeClass(estado) {
  const classes = {
    pagado: 'px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium',
    anulado: 'px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium',
    pendiente: 'px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium',
    acumulado: 'px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium'
  }
  
  return classes[estado] || 'px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium'
}

/**
 * Obtiene el texto del estado con emoji
 */
function getEstadoTexto(estado) {
  const textos = {
    pagado: '🟢 Pagado',
    anulado: '🔴 Anulado',
    pendiente: '🟡 Pendiente',
    acumulado: '🟠 Acumulado'
  }
  
  return textos[estado] || estado
}

/**
 * Formatea una fecha a formato legible
 */
function formatearFecha(fecha) {
  if (!fecha) return '-'
  
  const date = new Date(fecha)
  const dia = String(date.getDate()).padStart(2, '0')
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const año = date.getFullYear()
  
  return `${dia}/${mes}/${año}`
}

/**
 * Formatea una fecha con hora
 */
function formatearFechaHora(fecha) {
  if (!fecha) return '-'
  
  const date = new Date(fecha)
  const dia = String(date.getDate()).padStart(2, '0')
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const año = date.getFullYear()
  const hora = String(date.getHours()).padStart(2, '0')
  const minuto = String(date.getMinutes()).padStart(2, '0')
  
  return `${dia}/${mes}/${año} ${hora}:${minuto}`
}

/**
 * Descarga el PDF del pago
 */
function descargarPDF() {
  if (!props.pago.pdf_url) {
    alert('No hay PDF disponible para este pago')
    return
  }
  
  console.log('📄 Descargando PDF:', props.pago.pdf_url)
  window.open(props.pago.pdf_url, '_blank')
}
</script>