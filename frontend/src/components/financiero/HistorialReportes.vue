<!-- frontend/src/components/financiero/HistorialReportes.vue -->
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">

      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-xl font-bold">📋 Historial de Reportes de Cierre</h3>
            <p class="text-blue-100 text-sm mt-1">Descarga los reportes PDF de turnos cerrados</p>
          </div>
          <button @click="$emit('cerrar')" class="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div class="flex flex-wrap gap-4 items-end">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              v-model="filtros.fecha_inicio"
              type="date"
              class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              @change="cargarTurnos"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              v-model="filtros.fecha_fin"
              type="date"
              class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              @change="cargarTurnos"
            />
          </div>
          <button
            @click="limpiarFiltros"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm transition-colors"
          >
            🧹 Limpiar
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="cargando" class="p-8 text-center">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
        <p class="text-gray-600 mt-3">Cargando reportes...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="p-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800 font-medium">❌ Error al cargar reportes</p>
          <p class="text-red-600 text-sm mt-1">{{ error }}</p>
        </div>
      </div>

      <!-- Sin datos -->
      <div v-else-if="turnos.length === 0" class="p-8 text-center">
        <div class="text-6xl mb-4">📭</div>
        <p class="text-gray-600 font-medium">No hay turnos cerrados en este período</p>
      </div>

      <!-- Tabla -->
      <div v-else class="overflow-y-auto max-h-[calc(90vh-260px)]">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Turno #</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Usuario</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Apertura</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Cierre</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Venta Total</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Reporte</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="turno in turnos"
              :key="turno.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                #{{ turno.id }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">
                {{ turno.nombres }} {{ turno.apellidos }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {{ formatearFecha(turno.fecha_apertura) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {{ formatearFecha(turno.fecha_cierre) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                Q{{ formatearMoneda(turno.venta_total) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-center">
                <button
                  @click="descargarReporte(turno.id)"
                  :disabled="descargando === turno.id"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span v-if="descargando === turno.id">⏳</span>
                  <span v-else>📄</span>
                  {{ descargando === turno.id ? 'Generando...' : 'PDF' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-between items-center">
        <p class="text-sm text-gray-500">{{ turnos.length }} turno(s) encontrado(s)</p>
        <button @click="$emit('cerrar')" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
          Cerrar
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/services/authService'

defineEmits(['cerrar'])

const cargando = ref(false)
const error = ref(null)
const turnos = ref([])
const descargando = ref(null)

const filtros = ref({
  fecha_inicio: '',
  fecha_fin: ''
})

onMounted(async () => {
  // Fechas por defecto: último mes
  const hoy = new Date()
  const hace30Dias = new Date(hoy)
  hace30Dias.setDate(hoy.getDate() - 30)
  filtros.value.fecha_inicio = hace30Dias.toISOString().split('T')[0]
  filtros.value.fecha_fin = hoy.toISOString().split('T')[0]
  await cargarTurnos()
})

async function cargarTurnos() {
  try {
    cargando.value = true
    error.value = null

    const params = { estado: 'cerrado' }
    if (filtros.value.fecha_inicio) params.fecha_inicio = filtros.value.fecha_inicio
    if (filtros.value.fecha_fin) params.fecha_fin = filtros.value.fecha_fin

    const response = await api.get('/turnos', { params })
    turnos.value = response.data.data || []
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Error al cargar turnos'
  } finally {
    cargando.value = false
  }
}

async function descargarReporte(turnoId) {
  try {
    descargando.value = turnoId

    const response = await api.get(`/turnos/${turnoId}/reporte-pdf`, {
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte_cierre_turno_${turnoId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

  } catch (err) {
    alert('❌ Error al generar el reporte: ' + (err.response?.data?.message || err.message))
  } finally {
    descargando.value = null
  }
}

function limpiarFiltros() {
  filtros.value = { fecha_inicio: '', fecha_fin: '' }
  cargarTurnos()
}

function formatearMoneda(valor) {
  return parseFloat(valor || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatearFecha(fecha) {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleString('es-GT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Guatemala'
  })
}
</script>