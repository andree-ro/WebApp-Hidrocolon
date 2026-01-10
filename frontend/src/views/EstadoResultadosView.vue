<!-- frontend/src/views/EstadoResultadosView.vue -->
<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6">
    
    <!-- Botón Volver -->
    <button
      @click="$router.push('/')"
      class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium mb-6"
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
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">📊 Estado de Resultados</h1>
          <p class="text-gray-600 mt-1">Reporte financiero del período seleccionado</p>
        </div>
      </div>
    </div>

    <!-- Mensajes -->
    <div v-if="store.error" class="max-w-7xl mx-auto mb-6">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start">
          <span class="text-2xl mr-3">❌</span>
          <div class="flex-1">
            <p class="text-red-800 font-medium">Error</p>
            <p class="text-red-600 text-sm mt-1">{{ store.error }}</p>
          </div>
          <button 
            @click="store.limpiarError()"
            class="text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <div v-if="store.mensaje" class="max-w-7xl mx-auto mb-6">
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-start">
          <span class="text-2xl mr-3">✅</span>
          <div class="flex-1">
            <p class="text-green-800 font-medium">Éxito</p>
            <p class="text-green-600 text-sm mt-1">{{ store.mensaje }}</p>
          </div>
          <button 
            @click="store.limpiarMensaje()"
            class="text-green-400 hover:text-green-600"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Selector de Período -->
    <div class="max-w-7xl mx-auto mb-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">📅 Seleccionar Período</h2>
        
        <div class="flex flex-wrap gap-4 items-end">
          <!-- Fecha Inicio -->
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio <span class="text-red-500">*</span>
            </label>
            <input
              v-model="fechaInicio"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Fecha Fin -->
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin <span class="text-red-500">*</span>
            </label>
            <input
              v-model="fechaFin"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Botones -->
          <div class="flex gap-2">
            <button
              @click="generarReporte"
              :disabled="!fechaInicio || !fechaFin || store.cargando"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium"
            >
              📊 Generar Reporte
            </button>
            <button
              @click="limpiarPeriodo"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              🗑️ Limpiar
            </button>
          </div>

          <!-- Exportación -->
          <div v-if="store.estadoResultados" class="flex gap-2 ml-auto">
            <button
              @click="store.exportarPDF()"
              :disabled="store.cargando"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors"
            >
              📄 PDF
            </button>
            <button
              @click="store.exportarExcel()"
              :disabled="store.cargando"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
            >
              📊 Excel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loader -->
    <div v-if="store.cargando" class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <p class="text-gray-600 mt-4">Generando Estado de Resultados...</p>
      </div>
    </div>

    <!-- Estado de Resultados -->
    <div v-else-if="store.estadoResultados" class="max-w-7xl mx-auto space-y-6">
      
      <!-- Header del Reporte -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">ESTADO DE RESULTADOS</h2>
        <p class="text-gray-600">
          Del {{ formatearFecha(store.periodo.fecha_inicio) }} al {{ formatearFecha(store.periodo.fecha_fin) }}
        </p>
        <p class="text-sm text-gray-500 mt-1">Cifras Expresadas en Quetzales</p>
      </div>

      <!-- 1. INGRESOS -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">💰 INGRESOS</h3>
        
        <!-- Ventas -->
        <div class="mb-4">
          <h4 class="font-semibold text-gray-800 mb-2">VENTAS</h4>
          <div class="ml-4 space-y-1">
            <div
              v-for="venta in store.estadoResultados.ingresos.ventas"
              :key="venta.doctora_id || 'clinica'"
              class="flex justify-between text-sm items-center py-1"
            >
              <span class="text-gray-700 flex-1">{{ venta.nombre_doctora || venta.nombre || 'Clínica' }}</span>
              <span class="font-medium text-right min-w-[120px]">Q{{ formatearMoneda(venta.total) }}</span>
            </div>
            <div class="flex justify-between font-semibold text-gray-900 pt-2 mt-2 border-t items-center">
              <span>TOTAL VENTAS</span>
              <span class="text-right min-w-[120px]">Q{{ formatearMoneda(store.estadoResultados.ingresos.total_ventas) }}</span>
            </div>
          </div>
        </div>

        <!-- Servicios -->
        <div class="mb-4">
          <h4 class="font-semibold text-gray-800 mb-2">SERVICIOS</h4>
          <div class="ml-4 space-y-1">
            <div
              v-for="servicio in store.estadoResultados.ingresos.servicios"
              :key="servicio.doctora_id || 'clinica'"
              class="flex justify-between text-sm items-center py-1"
            >
              <span class="text-gray-700 flex-1">{{ servicio.nombre_doctora || servicio.nombre || 'Clínica' }}</span>
              <span class="font-medium text-right min-w-[120px]">Q{{ formatearMoneda(servicio.total) }}</span>
            </div>
            <div class="flex justify-between font-semibold text-gray-900 pt-2 mt-2 border-t items-center">
              <span>TOTAL SERVICIOS</span>
              <span class="text-right min-w-[120px]">Q{{ formatearMoneda(store.estadoResultados.ingresos.total_servicios) }}</span>
            </div>
          </div>
        </div>

        <!-- Total Ingresos -->
        <div class="flex justify-between text-lg font-bold text-blue-900 pt-3 border-t-2 border-blue-200 bg-blue-50 px-4 py-2 rounded">
          <span>TOTAL DE INGRESOS</span>
          <span>Q{{ formatearMoneda(store.estadoResultados.ingresos.total_ingresos) }}</span>
        </div>
      </div>

      <!-- 2. COSTOS DE OPERACIÓN -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-200">
          <h3 class="text-lg font-bold text-gray-900">💸 COSTOS DE OPERACIÓN</h3>
          <button
            @click="store.abrirModalNuevoConcepto('costo_operacion')"
            class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            ➕ Agregar
          </button>
        </div>

        <div class="space-y-2">
          <!-- Comisiones -->
          <div
            v-for="comision in store.estadoResultados.costos_operacion.comisiones"
            :key="comision.doctora_id"
            class="flex justify-between text-sm items-center py-1"
          >
            <span class="text-gray-700 flex-1">Comisiones {{ comision.nombre_doctora || comision.nombre || 'Doctora' }}</span>
            <span class="font-medium text-right min-w-[120px]">Q{{ formatearMoneda(comision.total) }}</span>
          </div>

        <!-- Gastos en clínica -->
        <div
          v-if="store.estadoResultados.costos_operacion.gastos_clinica > 0"
          class="flex justify-between text-sm items-center py-1 group"
        >
          <span class="text-gray-700 flex-1">Gastos en Clínica</span>
          <div class="flex items-center gap-2">
            <span class="font-medium text-right min-w-[120px]">Q{{ formatearMoneda(store.estadoResultados.costos_operacion.gastos_clinica) }}</span>
            <button
              @click="abrirModalGastos"
              class="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              title="Ver detalle de gastos"
            >
              ➕
            </button>
          </div>
        </div>

          <!-- Conceptos Manuales -->
          <div
            v-for="(concepto, index) in store.estadoResultados.costos_operacion.conceptos_manuales"
            :key="concepto.id || `costo-${index}`"
            class="flex justify-between items-center text-sm group py-1"
          >
            <span class="text-gray-700 flex-1">{{ concepto.nombre }}</span>
            <div class="flex items-center gap-2 min-w-[180px] justify-end">
              <span class="font-medium">Q{{ formatearMoneda(concepto.monto) }}</span>
              <button
                v-if="concepto.id"
                @click="editarConcepto(concepto)"
                class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors p-1 rounded"
                title="Editar concepto"
              >
                ✏️
              </button>
              <button
                v-if="concepto.id"
                @click="eliminarConcepto(concepto)"
                class="text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors p-1 rounded"
                title="Eliminar concepto"
              >
                🗑️
              </button>
              <span v-else class="text-xs text-gray-400 italic">(Automático)</span>
            </div>
          </div>

          <!-- Total -->
          <div class="flex justify-between font-bold text-gray-900 pt-2 mt-2 border-t items-center">
            <span>Total de costo de operación</span>
            <span class="text-right min-w-[120px]">Q{{ formatearMoneda(store.estadoResultados.costos_operacion.total_costos) }}</span>
          </div>
        </div>

        <!-- Ganancia Bruta -->
        <div class="flex justify-between text-lg font-bold text-green-900 mt-4 pt-3 border-t-2 border-green-200 bg-green-50 px-4 py-2 rounded">
          <span>GANANCIA BRUTA</span>
          <span>Q{{ formatearMoneda(store.estadoResultados.ganancia_bruta) }}</span>
        </div>
      </div>

      <!-- 3. GASTOS DE OPERACIÓN -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-200">
          <h3 class="text-lg font-bold text-gray-900">💼 GASTOS DE OPERACIÓN</h3>
          <button
            @click="store.abrirModalNuevoConcepto('gasto_operacion')"
            class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            ➕ Agregar
          </button>
        </div>

        <div class="space-y-2">
          <!-- Conceptos -->
          <div
            v-for="(concepto, index) in store.estadoResultados.gastos_operacion.conceptos"
            :key="concepto.id || `gasto-${index}`"
            class="flex justify-between items-center text-sm group py-1"
          >
            <span class="text-gray-700 flex-1">{{ concepto.nombre }}</span>
            <div class="flex items-center gap-2 min-w-[180px] justify-end">
              <span class="font-medium">Q{{ formatearMoneda(concepto.monto) }}</span>
              <button
                v-if="concepto.id"
                @click="editarConcepto(concepto)"
                class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors p-1 rounded"
                title="Editar concepto"
              >
                ✏️
              </button>
              <button
                v-if="concepto.id"
                @click="eliminarConcepto(concepto)"
                class="text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors p-1 rounded"
                title="Eliminar concepto"
              >
                🗑️
              </button>
            </div>
          </div>

          <!-- Total -->
          <div class="flex justify-between font-bold text-gray-900 pt-2 mt-2 border-t items-center">
            <span>Total Gastos de Operación</span>
            <span class="text-right min-w-[120px]">Q{{ formatearMoneda(store.estadoResultados.gastos_operacion.total_gastos) }}</span>
          </div>
        </div>

        <!-- Ganancia/Pérdida en Operación -->
        <div 
          :class="[
            'flex justify-between text-lg font-bold mt-4 pt-3 border-t-2 px-4 py-2 rounded',
            store.estadoResultados.ganancia_perdida_operacion >= 0 
              ? 'text-green-900 border-green-200 bg-green-50'
              : 'text-red-900 border-red-200 bg-red-50'
          ]"
        >
          <span>{{ store.estadoResultados.ganancia_perdida_operacion >= 0 ? 'GANANCIA' : 'PÉRDIDA' }} EN OPERACIÓN</span>
          <span>Q{{ formatearMoneda(store.estadoResultados.ganancia_perdida_operacion) }}</span>
        </div>
      </div>

      <!-- 4. OTROS GASTOS Y PRODUCTOS FINANCIEROS -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-200">
          <h3 class="text-lg font-bold text-gray-900">📈 OTROS GASTOS Y PRODUCTOS FINANCIEROS</h3>
          <button
            @click="store.abrirModalNuevoConcepto('otro_gasto')"
            class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            ➕ Agregar
          </button>
        </div>

        <div class="space-y-2">
          <!-- Impuestos (Automático) -->
          <div class="flex justify-between text-sm items-center py-1">
            <span class="text-gray-700 flex-1">Impuestos (Automático)</span>
            <span class="font-medium text-right min-w-[120px]">Q{{ formatearMoneda(store.estadoResultados.otros_gastos.impuestos) }}</span>
          </div>

          <!-- Conceptos Manuales -->
          <div
            v-for="(concepto, index) in store.estadoResultados.otros_gastos.conceptos_manuales"
            :key="concepto.id || `otro-${index}`"
            class="flex justify-between items-center text-sm group py-1"
          >
            <span class="text-gray-700 flex-1">{{ concepto.nombre }}</span>
            <div class="flex items-center gap-2 min-w-[180px] justify-end">
              <span class="font-medium">Q{{ formatearMoneda(concepto.monto) }}</span>
              <button
                v-if="concepto.id"
                @click="editarConcepto(concepto)"
                class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors p-1 rounded"
                title="Editar concepto"
              >
                ✏️
              </button>
              <button
                v-if="concepto.id"
                @click="eliminarConcepto(concepto)"
                class="text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors p-1 rounded"
                title="Eliminar concepto"
              >
                🗑️
              </button>
            </div>
          </div>

          <!-- Total -->
          <div class="flex justify-between font-bold text-gray-900 pt-2 mt-2 border-t items-center">
            <span>Total Otros Gastos</span>
            <span class="text-right min-w-[120px]">Q{{ formatearMoneda(store.estadoResultados.otros_gastos.total_otros_gastos) }}</span>
          </div>
        </div>

        <!-- UTILIDAD DEL EJERCICIO -->
        <div 
          :class="[
            'flex justify-between text-xl font-bold mt-4 pt-4 border-t-2 px-4 py-3 rounded',
            store.estadoResultados.utilidad_ejercicio >= 0 
              ? 'text-green-900 border-green-300 bg-green-100'
              : 'text-red-900 border-red-300 bg-red-100'
          ]"
        >
          <span>UTILIDAD DEL EJERCICIO</span>
          <span>Q{{ formatearMoneda(store.estadoResultados.utilidad_ejercicio) }}</span>
        </div>
      </div>

    </div>

    <!-- Sin Reporte -->
    <div v-else class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div class="text-6xl mb-4">📊</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Selecciona un período</h3>
        <p class="text-gray-600">Elige las fechas de inicio y fin para generar el Estado de Resultados</p>
      </div>
    </div>

    <!-- Modal de Concepto -->
    <ModalConcepto
      v-if="store.modalConceptoAbierto"
      :concepto="store.conceptoSeleccionado"
      :modo-edicion="store.modoEdicion"
      :tipo="store.tipoConceptoActual"
      :periodo="store.periodo"
      @cerrar="store.cerrarModalConcepto()"
      @guardar="guardarConcepto"
    />

    <!-- Modal de Detalle de Gastos -->
    <ModalDetalleGastos
      v-if="modalGastosAbierto && store.periodo"
      :periodo="store.periodo"
      @cerrar="cerrarModalGastos"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useEstadoResultadosStore } from '@/store/estadoResultadosStore'
import ModalConcepto from '@/components/estadoResultados/ModalConcepto.vue'
import ModalDetalleGastos from '@/components/estadoResultados/ModalDetalleGastos.vue'

const store = useEstadoResultadosStore()

// Fechas locales
const fechaInicio = ref(null)
const fechaFin = ref(null)

// Modal de detalle de gastos
const modalGastosAbierto = ref(false)

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  console.log('📊 EstadoResultadosView montado')
  
  // Establecer fechas por defecto (mes actual)
  const hoy = new Date()
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  
  fechaInicio.value = primerDiaMes.toISOString().split('T')[0]
  fechaFin.value = ultimoDiaMes.toISOString().split('T')[0]
})

// ============================================================================
// METHODS
// ============================================================================

/**
 * Generar reporte
 */
async function generarReporte() {
  if (!fechaInicio.value || !fechaFin.value) {
    store.error = 'Debe seleccionar ambas fechas'
    return
  }

  store.setPeriodo(fechaInicio.value, fechaFin.value)
  await store.cargarEstadoResultados()
}

/**
 * Limpiar período
 */
function limpiarPeriodo() {
  fechaInicio.value = null
  fechaFin.value = null
  store.estadoResultados = null
}

/**
 * Abrir modal de detalle de gastos
 */
function abrirModalGastos() {
  modalGastosAbierto.value = true
}

/**
 * Cerrar modal de detalle de gastos
 */
function cerrarModalGastos() {
  modalGastosAbierto.value = false
}

/**
 * Guardar concepto (crear o actualizar)
 */
async function guardarConcepto(data) {
  if (store.modoEdicion && store.conceptoSeleccionado) {
    await store.actualizarConcepto(store.conceptoSeleccionado.id, data)
  } else {
    await store.crearConcepto(data)
  }
}

/**
 * Editar concepto
 */
function editarConcepto(concepto) {
  console.log('✏️ Editando concepto:', concepto)
  
  // Validar que el concepto tenga ID
  if (!concepto.id) {
    console.error('❌ Error: El concepto no tiene ID')
    store.error = 'No se puede editar este concepto (sin ID). Puede ser un concepto automático del sistema.'
    return
  }
  
  // Crear objeto completo con todos los campos necesarios
  const conceptoCompleto = {
    id: concepto.id,
    nombre: concepto.nombre,
    monto: concepto.monto,
    tipo: concepto.tipo || detectarTipoConcepto(concepto),
    periodo_inicio: store.periodo.fecha_inicio,
    periodo_fin: store.periodo.fecha_fin,
    descripcion: concepto.descripcion || ''
  }
  
  console.log('📝 Concepto completo para editar:', conceptoCompleto)
  store.abrirModalEditarConcepto(conceptoCompleto)
}

/**
 * Eliminar concepto
 */
function eliminarConcepto(concepto) {
  console.log('🗑️ Eliminando concepto:', concepto)
  
  // Validar que tenga ID
  if (!concepto.id) {
    console.error('❌ Error: El concepto no tiene ID')
    store.error = 'No se puede eliminar este concepto (sin ID). Puede ser un concepto automático del sistema.'
    return
  }
  
  if (confirm(`¿Está seguro de eliminar el concepto "${concepto.nombre}"?\n\nMonto: Q${formatearMoneda(concepto.monto)}\n\nEsta acción no se puede deshacer.`)) {
    store.eliminarConcepto(concepto.id)
  }
}

/**
 * Detectar tipo de concepto según dónde está ubicado
 */
function detectarTipoConcepto(concepto) {
  // Buscar en qué sección está el concepto
  if (store.estadoResultados?.costos_operacion?.conceptos_manuales?.some(c => c.nombre === concepto.nombre)) {
    return 'costo_operacion'
  }
  if (store.estadoResultados?.gastos_operacion?.conceptos?.some(c => c.nombre === concepto.nombre)) {
    return 'gasto_operacion'
  }
  if (store.estadoResultados?.otros_gastos?.conceptos_manuales?.some(c => c.nombre === concepto.nombre)) {
    return 'otro_gasto'
  }
  return null
}

/**
 * Formatear moneda
 */
function formatearMoneda(valor) {
  return parseFloat(valor || 0).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Formatear fecha
 */
function formatearFecha(fecha) {
  if (!fecha) return '-'
  const date = new Date(fecha + 'T00:00:00')
  return date.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>