<!-- frontend/src/components/comisiones/ModalDetalleVentas.vue -->
<template>
  <!-- Overlay -->
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" @click.self="cerrar">
    <!-- Modal -->
    <div class="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold">🔍 Detalle de Ventas</h2>
          <p class="text-purple-100 text-sm mt-1">{{ doctora.doctora_nombre }}</p>
        </div>
        <button
          @click="cerrar"
          class="text-white hover:bg-purple-500 rounded-full p-2 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-6">
        
        <!-- Estado de carga -->
        <div v-if="cargando" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p class="text-gray-600 mt-4">Cargando ventas...</p>
        </div>

        <!-- Resumen -->
        <div v-else-if="ventasData" class="space-y-6">
          
          <!-- Cards de resumen -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="text-sm text-blue-700 font-medium mb-1">Total Ventas</p>
              <p class="text-2xl font-bold text-blue-900">Q{{ ventasData.ventas_agrupadas.totales.total_ventas.toFixed(2) }}</p>
            </div>

            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <p class="text-sm text-green-700 font-medium mb-1">Total Comisiones</p>
              <p class="text-2xl font-bold text-green-900">Q{{ ventasData.ventas_agrupadas.totales.total_comisiones.toFixed(2) }}</p>
            </div>

            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p class="text-sm text-purple-700 font-medium mb-1">Período</p>
              <p class="text-sm font-bold text-purple-900">
                {{ formatearFechaCorta(ventasData.periodo.fecha_inicio) }} - 
                {{ formatearFechaCorta(ventasData.periodo.fecha_fin) }}
              </p>
            </div>
          </div>

          <!-- Tabla de productos vendidos -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">💊 Productos/Servicios Vendidos</h3>
            
            <div class="overflow-x-auto border border-gray-200 rounded-lg">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto/Servicio
                    </th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Unit.
                    </th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Comisión
                    </th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Ventas
                    </th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Comisión
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr 
                    v-for="producto in ventasData.ventas_agrupadas.productos" 
                    :key="producto.nombre"
                    class="hover:bg-gray-50"
                  >
                    <!-- Nombre -->
                    <td class="px-4 py-3">
                      <p class="text-sm font-medium text-gray-900">{{ producto.nombre }}</p>
                    </td>

                    <!-- Precio -->
                    <td class="px-4 py-3 text-center text-sm text-gray-700">
                      Q{{ producto.precio.toFixed(2) }}
                    </td>

                    <!-- Cantidad -->
                    <td class="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      {{ producto.total_cantidad }}
                    </td>

                    <!-- % Comisión -->
                    <td class="px-4 py-3 text-center text-sm text-purple-700 font-medium">
                      {{ producto.porcentaje_comision }}%
                    </td>

                    <!-- Total Ventas -->
                    <td class="px-4 py-3 text-right text-sm font-semibold text-blue-700">
                      Q{{ producto.total_ventas.toFixed(2) }}
                    </td>

                    <!-- Total Comisión -->
                    <td class="px-4 py-3 text-right text-sm font-bold text-green-700">
                      Q{{ producto.total_comision.toFixed(2) }}
                    </td>
                  </tr>

                  <!-- Fila de totales -->
                  <tr class="bg-gray-100 font-bold">
                    <td colspan="4" class="px-4 py-3 text-sm text-gray-900">
                      TOTALES
                    </td>
                    <td class="px-4 py-3 text-right text-sm text-blue-900">
                      Q{{ ventasData.ventas_agrupadas.totales.total_ventas.toFixed(2) }}
                    </td>
                    <td class="px-4 py-3 text-right text-sm text-green-900">
                      Q{{ ventasData.ventas_agrupadas.totales.total_comisiones.toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Ventas por día (opcional, expandible) -->
          <details class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <summary class="cursor-pointer font-semibold text-gray-900 hover:text-purple-600">
              📅 Ver ventas por día
            </summary>
            <div class="mt-4 space-y-2">
              <div v-for="fecha in ventasData.ventas_agrupadas.fechas" :key="fecha" class="text-sm">
                <span class="font-medium text-gray-700">{{ formatearFecha(fecha) }}:</span>
                <span class="text-gray-600 ml-2">
                  {{ contarVentasPorDia(fecha) }} ventas
                </span>
              </div>
            </div>
          </details>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-center py-12">
          <div class="text-5xl mb-4">⚠️</div>
          <p class="text-red-600 font-medium">{{ error }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <button
          @click="cerrar"
          class="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import comisionesService from '@/services/comisionesService'

// ============================================================================
// PROPS
// ============================================================================

const props = defineProps({
  doctora: {
    type: Object,
    required: true
  }
})

// ============================================================================
// EMITS
// ============================================================================

const emit = defineEmits(['cerrar'])

// ============================================================================
// ESTADO
// ============================================================================

const ventasData = ref(null)
const cargando = ref(false)
const error = ref(null)

// ============================================================================
// CICLO DE VIDA
// ============================================================================

onMounted(async () => {
  await cargarVentas()
})

// ============================================================================
// MÉTODOS
// ============================================================================

/**
 * Carga las ventas de la doctora
 */
async function cargarVentas() {
  try {
    cargando.value = true
    error.value = null

    console.log('🔍 Cargando ventas para:', props.doctora.doctora_nombre)

    // Usar las fechas de la doctora
    const fechaInicio = props.doctora.fecha_primera_venta.split('T')[0]
    const fechaFin = props.doctora.fecha_ultima_venta.split('T')[0]

    const response = await comisionesService.obtenerVentasAgrupadas(
      props.doctora.doctora_id,
      fechaInicio,
      fechaFin
    )

    if (response.success) {
      ventasData.value = response.data
      console.log('✅ Ventas cargadas:', ventasData.value)
    } else {
      throw new Error(response.message || 'Error al cargar ventas')
    }
  } catch (err) {
    console.error('❌ Error cargando ventas:', err)
    error.value = 'Error al cargar las ventas'
  } finally {
    cargando.value = false
  }
}

/**
 * Cuenta ventas de un día específico
 */
function contarVentasPorDia(fecha) {
  let total = 0
  ventasData.value.ventas_agrupadas.productos.forEach(producto => {
    if (producto.ventas_por_dia[fecha]) {
      total += producto.ventas_por_dia[fecha].cantidad
    }
  })
  return total
}

/**
 * Formatea fecha a DD/MM/YYYY
 */
function formatearFechaCorta(fecha) {
  if (!fecha) return '-'
  const date = new Date(fecha)
  const dia = String(date.getDate()).padStart(2, '0')
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const año = date.getFullYear()
  return `${dia}/${mes}/${año}`
}

/**
 * Formatea fecha larga
 */
function formatearFecha(fecha) {
  if (!fecha) return '-'
  const date = new Date(fecha)
  return date.toLocaleDateString('es-ES', { 
    weekday: 'short',
    day: '2-digit', 
    month: 'short',
    year: 'numeric' 
  })
}

/**
 * Cierra el modal
 */
function cerrar() {
  emit('cerrar')
}
</script>