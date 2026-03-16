<!-- frontend/src/components/estadoResultados/ModalDetalleServiciosER.vue -->
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">

      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-xl font-bold">🩺 Detalle de Servicios — {{ nombreDoctora }}</h3>
            <p class="text-blue-100 text-sm mt-1">
              Período: {{ formatearFecha(periodo.fecha_inicio) }} - {{ formatearFecha(periodo.fecha_fin) }}
            </p>
          </div>
          <button @click="$emit('cerrar')" class="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="cargando" class="p-8 text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <p class="text-gray-600 mt-4">Cargando servicios...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="p-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800 font-medium">❌ Error al cargar servicios</p>
          <p class="text-red-600 text-sm mt-1">{{ error }}</p>
        </div>
      </div>

      <!-- Contenido -->
      <div v-else class="overflow-y-auto max-h-[calc(90vh-180px)]">

        <!-- Resumen -->
        <div class="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-sm text-blue-700 font-medium">Total de Servicios</p>
              <p class="text-2xl font-bold text-blue-900">Q{{ formatearMoneda(datos.total) }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-blue-700 font-medium">Transacciones</p>
              <p class="text-2xl font-bold text-blue-900">{{ datos.cantidad }}</p>
            </div>
          </div>
        </div>

        <!-- Sin servicios -->
        <div v-if="datos.servicios.length === 0" class="p-8 text-center">
          <div class="text-6xl mb-4">📭</div>
          <p class="text-gray-600 font-medium">No hay servicios registrados en este período</p>
        </div>

        <!-- Tabla -->
        <div v-else class="p-6">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Fecha</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Paciente</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Servicio</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Cant.</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">P. Unit.</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Total</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Pago</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="(servicio, index) in datos.servicios"
                  :key="index"
                  class="hover:bg-gray-50"
                >
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ formatearFechaCorta(servicio.fecha) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ servicio.paciente }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ servicio.servicio }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900 text-center">{{ servicio.cantidad }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">Q{{ formatearMoneda(servicio.precio_unitario) }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">Q{{ formatearMoneda(servicio.precio_total) }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {{ servicio.metodo_pago }}
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td colspan="5" class="px-4 py-3 text-sm font-bold text-gray-900 text-right">TOTAL:</td>
                  <td class="px-4 py-3 text-sm font-bold text-gray-900 text-right">Q{{ formatearMoneda(datos.total) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
        <button @click="$emit('cerrar')" class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
          Cerrar
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/services/authService'

const props = defineProps({
  periodo: { type: Object, required: true },
  doctoraId: { type: [Number, String], required: true },
  nombreDoctora: { type: String, default: 'Clínica' }
})

defineEmits(['cerrar'])

const cargando = ref(false)
const error = ref(null)
const datos = ref({ servicios: [], total: 0, cantidad: 0 })

onMounted(async () => {
  try {
    cargando.value = true
    error.value = null
    const response = await api.get('/estado-resultados/detalle/servicios', {
      params: {
        fecha_inicio: props.periodo.fecha_inicio,
        fecha_fin: props.periodo.fecha_fin,
        doctora_id: props.doctoraId
      }
    })
    if (!response.data.success) throw new Error(response.data.message)
    datos.value = response.data.data
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Error al cargar servicios'
  } finally {
    cargando.value = false
  }
})

function formatearMoneda(valor) {
  return parseFloat(valor || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatearFecha(fecha) {
  if (!fecha) return '-'
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })
}
function formatearFechaCorta(fecha) {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>