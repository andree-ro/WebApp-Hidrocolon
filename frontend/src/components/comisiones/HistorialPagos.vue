<!-- frontend/src/components/comisiones/HistorialPagos.vue -->
<template>
  <div class="space-y-6">
    <!-- Filtros -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">🔍 Filtros</h3>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Filtro: Doctora -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Doctora
          </label>
          <select
            v-model="filtros.doctora_id"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option :value="null">Todas</option>
            <option 
              v-for="doctora in comisionesStore.doctorasActivas" 
              :key="doctora.id"
              :value="doctora.id"
            >
              {{ doctora.nombre }}
            </option>
          </select>
        </div>

        <!-- Filtro: Estado -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            v-model="filtros.estado"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option :value="null">Todos</option>
            <option value="pagado">🟢 Pagado</option>
            <option value="anulado">🔴 Anulado</option>
            <option value="pendiente">🟡 Pendiente</option>
            <option value="acumulado">🟠 Acumulado</option>
          </select>
        </div>

        <!-- Filtro: Fecha Inicio -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Desde
          </label>
          <input
            v-model="filtros.fecha_inicio"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Filtro: Fecha Fin -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Hasta
          </label>
          <input
            v-model="filtros.fecha_fin"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Botones de filtro -->
      <div class="flex gap-2 mt-4">
        <button
          @click="aplicarFiltros"
          :disabled="comisionesStore.cargando"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          🔍 Buscar
        </button>
        <button
          @click="limpiarFiltros"
          :disabled="comisionesStore.cargando"
          class="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          🗑️ Limpiar
        </button>
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="comisionesStore.cargando" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="text-gray-600 mt-4">Cargando historial...</p>
    </div>

    <!-- Lista de pagos -->
    <div v-else-if="comisionesStore.historialPagos.length > 0" class="space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">
          📚 Historial de Pagos
        </h3>
        <span class="text-sm text-gray-600">
          {{ comisionesStore.historialPagos.length }} registro(s)
        </span>
      </div>

      <!-- Card por cada pago -->
      <div
        v-for="pago in comisionesStore.historialPagos"
        :key="pago.id"
        class="card hover:shadow-lg transition-shadow duration-200"
      >
        <div class="p-6">
          <!-- Header -->
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-lg font-semibold text-gray-900">
                  Pago #{{ pago.id }}
                </span>
                <span :class="getBadgeClass(pago.estado)">
                  {{ getEstadoTexto(pago.estado) }}
                </span>
              </div>

              <div class="space-y-1 text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <span>👩‍⚕️</span>
                  <span class="font-medium">{{ pago.doctora_nombre }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span>📅</span>
                  <span>{{ formatearFecha(pago.fecha_pago) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span>📦</span>
                  <span>{{ pago.cantidad_ventas }} ventas</span>
                </div>
                <div v-if="pago.observaciones" class="flex items-start gap-2">
                  <span>📝</span>
                  <span class="text-xs">{{ pago.observaciones }}</span>
                </div>
              </div>
            </div>

            <!-- Monto -->
            <div class="text-right ml-4">
              <p :class="[
                'text-3xl font-bold',
                pago.estado === 'anulado' ? 'text-red-600 line-through' : 'text-green-600'
              ]">
                Q{{ pago.monto_total.toFixed(2) }}
              </p>
            </div>
          </div>

          <!-- Detalles adicionales -->
          <div v-if="pago.usuario_nombres" class="mb-4 text-xs text-gray-500">
            Registrado por: {{ pago.usuario_nombres }} {{ pago.usuario_apellidos }}
          </div>

          <!-- Acciones -->
          <div class="flex gap-2 flex-wrap">
            <button
              @click="$emit('ver-detalle', pago)"
              class="flex-1 min-w-[120px] px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              🔍 Ver Detalle
            </button>

            <button
              v-if="pago.puede_anular && pago.estado === 'pagado'"
              @click="$emit('anular', pago)"
              class="flex-1 min-w-[120px] px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              🗑️ Anular Pago
            </button>

            <button
              @click="reimprimirComprobante(pago)"
              class="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
            >
              📄 Reimprimir Comprobante
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="text-center py-12">
      <div class="text-6xl mb-4">📭</div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">
        No hay pagos registrados
      </h3>
      <p class="text-gray-600">
        {{ filtrosActivos ? 'Intenta cambiar los filtros de búsqueda' : 'Aún no se han realizado pagos de comisiones' }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useComisionesStore } from '@/store/comisionesStore'
import { api } from '@/services/authService'

// ============================================================================
// EMITS
// ============================================================================

const emit = defineEmits(['ver-detalle', 'anular'])

// ============================================================================
// ESTADO
// ============================================================================

const comisionesStore = useComisionesStore()

const filtros = ref({
  doctora_id: null,
  estado: null,
  fecha_inicio: null,
  fecha_fin: null
})

// ============================================================================
// COMPUTED
// ============================================================================

/**
 * Verifica si hay filtros activos
 */
const filtrosActivos = computed(() => {
  return filtros.value.doctora_id !== null ||
         filtros.value.estado !== null ||
         filtros.value.fecha_inicio !== null ||
         filtros.value.fecha_fin !== null
})

// ============================================================================
// CICLO DE VIDA
// ============================================================================

onMounted(async () => {
  console.log('📚 HistorialPagos montado')
  
  // Cargar doctoras si no están cargadas
  if (comisionesStore.doctoras.length === 0) {
    await comisionesStore.cargarDoctoras()
  }
  
  // Cargar historial inicial
  await aplicarFiltros()
})

// ============================================================================
// MÉTODOS
// ============================================================================

/**
 * Aplica los filtros y recarga el historial
 */
async function aplicarFiltros() {
  console.log('🔍 Aplicando filtros:', filtros.value)
  
  // Crear objeto con solo los filtros que tienen valor
  const filtrosLimpios = {}
  
  if (filtros.value.doctora_id) {
    filtrosLimpios.doctora_id = filtros.value.doctora_id
  }
  if (filtros.value.estado) {
    filtrosLimpios.estado = filtros.value.estado
  }
  if (filtros.value.fecha_inicio) {
    filtrosLimpios.fecha_inicio = filtros.value.fecha_inicio
  }
  if (filtros.value.fecha_fin) {
    filtrosLimpios.fecha_fin = filtros.value.fecha_fin
  }
  
  await comisionesStore.cargarHistorial(filtrosLimpios)
}

/**
 * Limpia todos los filtros
 */
async function limpiarFiltros() {
  console.log('🗑️ Limpiando filtros')
  
  filtros.value = {
    doctora_id: null,
    estado: null,
    fecha_inicio: null,
    fecha_fin: null
  }
  
  await aplicarFiltros()
}

/**
 * Obtiene la clase CSS del badge según el estado
 */
function getBadgeClass(estado) {
  const classes = {
    pagado: 'px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium',
    anulado: 'px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium',
    pendiente: 'px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium',
    acumulado: 'px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium'
  }
  
  return classes[estado] || 'px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium'
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
 * Descarga el PDF del pago (si existe)
 */
function descargarPDF(pago) {
  if (!pago.pdf_url) {
    alert('No hay PDF disponible para este pago')
    return
  }
  
  console.log('📄 Descargando PDF:', pago.pdf_url)
  window.open(pago.pdf_url, '_blank')
}

/**
 * Reimprimir comprobante (genera el PDF nuevamente desde el backend)
 */
async function reimprimirComprobante(pago) {
  try {
    console.log('📄 Reimprimiendo comprobante del pago:', pago.id)
    
    // Hacer la petición POST usando la instancia api configurada
    const response = await api.post(
      `/comisiones/pdf/${pago.id}/generar`,
      {},
      { responseType: 'blob' }
    )
    
    // Crear un URL temporal y descargarlo
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Comisiones_${pago.doctora_nombre}_Pago_${pago.id}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    console.log('✅ Comprobante descargado exitosamente')
    
  } catch (error) {
    console.error('❌ Error reimprimiendo comprobante:', error)
    alert('Error al reimprimir el comprobante. Por favor intenta nuevamente.')
  }
}
</script>

<style scoped>
.card {
  @apply bg-white rounded-lg shadow-md;
}
</style>