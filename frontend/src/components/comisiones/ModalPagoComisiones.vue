<!-- frontend/src/components/comisiones/ModalPagoComisiones.vue -->
<template>
  <!-- Overlay -->
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" @click.self="cerrar">
    <!-- Modal -->
    <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold">💳 Pagar Comisiones</h2>
          <p class="text-blue-100 text-sm mt-1">{{ doctora.nombre }}</p>
        </div>
        <button
          @click="cerrar"
          class="text-white hover:bg-blue-500 rounded-full p-2 transition-colors"
          :disabled="cargando"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-6">
        
        <!-- PASO 1: Seleccionar período -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📅 Seleccionar Período</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Fecha Inicio -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                v-model="fechaInicio"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="cargandoVentas || yaConsulto"
              />
            </div>

            <!-- Fecha Fin -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <input
                v-model="fechaFin"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="cargandoVentas || yaConsulto"
              />
            </div>
          </div>

          <!-- Botón consultar -->
          <div class="mt-4 flex gap-2">
            <button
              @click="consultarVentas"
              :disabled="!puedeConsultar || cargandoVentas"
              class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ cargandoVentas ? '⏳ Consultando...' : '🔍 Consultar Ventas' }}
            </button>

            <button
              v-if="yaConsulto"
              @click="reiniciarConsulta"
              class="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Cambiar fechas"
            >
              🔄
            </button>
          </div>

          <!-- Validación de fechas -->
          <div v-if="errorFechas" class="mt-2 text-sm text-red-600">
            ⚠️ {{ errorFechas }}
          </div>
        </div>

        <!-- PASO 2: Preview de ventas agrupadas -->
        <div v-if="ventasAgrupadas" class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📊 Preview de Ventas</h3>

          <!-- Alerta si existe pago previo -->
          <div v-if="ventasAgrupadas.validacion_pago?.existe_pago" class="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-start">
              <span class="text-2xl mr-3">⚠️</span>
              <div>
                <p class="font-medium text-yellow-900">Ya existe un pago para este período</p>
                <p class="text-sm text-yellow-700 mt-1">
                  Pago ID: {{ ventasAgrupadas.validacion_pago.pago.id }} | 
                  Monto: Q{{ ventasAgrupadas.validacion_pago.pago.monto_total }} |
                  Fecha: {{ formatearFecha(ventasAgrupadas.validacion_pago.pago.fecha_pago) }}
                </p>
                <p class="text-sm text-yellow-600 mt-2">
                  Si continúa, necesitará autorización de administrador.
                </p>
              </div>
            </div>
          </div>

          <!-- Tabla de ventas por día -->
          <div class="overflow-x-auto border border-gray-200 rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto/Servicio
                  </th>
                  <th 
                    v-for="fecha in ventasAgrupadas.ventas_agrupadas.fechas" 
                    :key="fecha"
                    class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {{ formatearFechaTabla(fecha) }}
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comisión
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr 
                  v-for="producto in ventasAgrupadas.ventas_agrupadas.productos" 
                  :key="producto.nombre"
                  class="hover:bg-gray-50"
                >
                  <!-- Nombre del producto -->
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">
                    {{ producto.nombre }}
                    <div class="text-xs text-gray-500">
                      Q{{ producto.precio }} | {{ producto.porcentaje_comision }}% comisión
                    </div>
                  </td>

                  <!-- Cantidad por día -->
                  <td 
                    v-for="fecha in ventasAgrupadas.ventas_agrupadas.fechas" 
                    :key="fecha"
                    class="px-3 py-3 text-center text-sm text-gray-700"
                  >
                    {{ producto.ventas_por_dia[fecha]?.cantidad || '-' }}
                  </td>

                  <!-- Total cantidad -->
                  <td class="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {{ producto.total_cantidad }} un.
                  </td>

                  <!-- Total comisión -->
                  <td class="px-4 py-3 text-right text-sm font-semibold text-green-600">
                    Q{{ producto.total_comision.toFixed(2) }}
                  </td>
                </tr>

                <!-- Fila de totales -->
                <tr class="bg-gray-100 font-bold">
                  <td class="px-4 py-3 text-sm text-gray-900" :colspan="ventasAgrupadas.ventas_agrupadas.fechas.length + 1">
                    TOTALES
                  </td>
                  <td class="px-4 py-3 text-right text-sm text-gray-900">
                    Q{{ ventasAgrupadas.ventas_agrupadas.totales.total_ventas.toFixed(2) }}
                  </td>
                  <td class="px-4 py-3 text-right text-sm text-green-700">
                    Q{{ ventasAgrupadas.ventas_agrupadas.totales.total_comisiones.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Resumen visual -->
          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="text-sm text-blue-700 font-medium">Total en Ventas</p>
              <p class="text-2xl font-bold text-blue-900 mt-1">
                Q{{ ventasAgrupadas.ventas_agrupadas.totales.total_ventas.toFixed(2) }}
              </p>
            </div>

            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <p class="text-sm text-green-700 font-medium">Total Comisiones</p>
              <p class="text-2xl font-bold text-green-900 mt-1">
                Q{{ ventasAgrupadas.ventas_agrupadas.totales.total_comisiones.toFixed(2) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Estado: Sin ventas -->
        <div v-if="yaConsulto && ventasAgrupadas && ventasAgrupadas.ventas_agrupadas.productos.length === 0" class="text-center py-8">
          <div class="text-5xl mb-3">📭</div>
          <p class="text-gray-600 font-medium">No hay ventas en el período seleccionado</p>
          <button
            @click="reiniciarConsulta"
            class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Cambiar Fechas
          </button>
        </div>

        <!-- PASO 3: Observaciones -->
        <div v-if="ventasAgrupadas && ventasAgrupadas.ventas_agrupadas.productos.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📝 Observaciones (opcional)</h3>
          
          <textarea
            v-model="observaciones"
            rows="3"
            placeholder="Ej: Pago quincenal de octubre, Pago correspondiente a la primera quincena, etc."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            :disabled="cargando"
          ></textarea>
        </div>
      </div>

      <!-- Footer con botones -->
      <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
        <button
          @click="cerrar"
          :disabled="cargando"
          class="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
        >
          ❌ Cancelar
        </button>

        <button
          @click="confirmarPago"
          :disabled="!puedeConfirmar || cargando"
          class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {{ cargando ? '⏳ Procesando...' : '✅ Confirmar Pago' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useComisionesStore } from '@/store/comisionesStore'
import { useFinancieroStore } from '@/store/financiero'

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

const emit = defineEmits(['cerrar', 'pago-exitoso'])

// ============================================================================
// ESTADO
// ============================================================================

const comisionesStore = useComisionesStore()

const fechaInicio = ref('')
const fechaFin = ref('')
const observaciones = ref('')

const cargandoVentas = ref(false)
const cargando = ref(false)
const yaConsulto = ref(false)
const errorFechas = ref('')

const ventasAgrupadas = ref(null)

// ============================================================================
// COMPUTED
// ============================================================================

/**
 * Valida si se puede consultar ventas
 */
const puedeConsultar = computed(() => {
  if (!fechaInicio.value || !fechaFin.value) return false
  if (new Date(fechaInicio.value) > new Date(fechaFin.value)) return false
  return true
})

/**
 * Valida si se puede confirmar el pago
 */
const puedeConfirmar = computed(() => {
  if (!ventasAgrupadas.value) return false
  if (ventasAgrupadas.value.ventas_agrupadas.productos.length === 0) return false
  return true
})

// ============================================================================
// MÉTODOS
// ============================================================================

/**
 * Consulta las ventas agrupadas del período seleccionado
 */
async function consultarVentas() {
  // Validar fechas
  if (!fechaInicio.value || !fechaFin.value) {
    errorFechas.value = 'Debe seleccionar ambas fechas'
    return
  }

  if (new Date(fechaInicio.value) > new Date(fechaFin.value)) {
    errorFechas.value = 'La fecha de inicio debe ser menor o igual a la fecha fin'
    return
  }

  errorFechas.value = ''
  cargandoVentas.value = true

  try {
    console.log('🔍 Consultando ventas agrupadas...')

    const response = await comisionesStore.cargarVentasAgrupadas(
      props.doctora.id,
      fechaInicio.value,
      fechaFin.value
    )

    ventasAgrupadas.value = response
    yaConsulto.value = true

    console.log('✅ Ventas consultadas:', response)
  } catch (error) {
    console.error('❌ Error consultando ventas:', error)
    errorFechas.value = error.response?.data?.message || 'Error al consultar ventas'
  } finally {
    cargandoVentas.value = false
  }
}

/**
 * Reinicia la consulta (permite cambiar fechas)
 */
function reiniciarConsulta() {
  yaConsulto.value = false
  ventasAgrupadas.value = null
  errorFechas.value = ''
  comisionesStore.limpiarVentasAgrupadas()
}

/**
 * Confirma el pago de comisiones
 */
async function confirmarPago() {
  if (!puedeConfirmar.value) return

  // Confirmar con el usuario
  const confirmacion = confirm(
    `¿Está seguro de pagar Q${ventasAgrupadas.value.ventas_agrupadas.totales.total_comisiones.toFixed(2)} ` +
    `a ${props.doctora.nombre}?\n\n` +
    `Período: ${fechaInicio.value} al ${fechaFin.value}`
  )

  if (!confirmacion) return

  cargando.value = true

  try {
    console.log('💰 Confirmando pago...')

    // ✅ OBTENER TURNO DEL STORE DE FINANCIERO
    const financieroStore = useFinancieroStore()

    // Si no hay turno en el store, cargarlo
    if (!financieroStore.turnoActivo) {
      await financieroStore.verificarTurnoActivo()
    }

    const turnoActivo = financieroStore.turnoActivo
    console.log('🎯 Turno activo obtenido del store:', turnoActivo?.id)

    const resultado = await comisionesStore.pagarComisiones({
      doctora_id: props.doctora.id,
      fecha_inicio: fechaInicio.value,
      fecha_fin: fechaFin.value,
      observaciones: observaciones.value.trim() || null,
      turno_id: turnoActivo?.id || null,
      autorizado_por_admin: false
    })

    let pagoIdFinal = null

    // Si es pago duplicado, preguntar al admin
    if (resultado.esPagoDuplicado) {
      const autorizacion = confirm(
        '⚠️ YA EXISTE UN PAGO PARA ESTE PERÍODO\n\n' +
        `Pago ID: ${resultado.pagoExistente.id}\n` +
        `Monto: Q${resultado.pagoExistente.monto_total}\n\n` +
        '¿Desea continuar de todas formas?\n' +
        '(Requiere autorización de administrador)'
      )

      if (autorizacion) {
        // Reintentar con autorización
        const resultadoAutorizado = await comisionesStore.pagarComisiones({
          doctora_id: props.doctora.id,
          fecha_inicio: fechaInicio.value,
          fecha_fin: fechaFin.value,
          observaciones: observaciones.value.trim() || null,
          turno_id: turnoActivo?.id || null,
          autorizado_por_admin: true
        })
        pagoIdFinal = resultadoAutorizado.data?.pago_id
      } else {
        cargando.value = false
        return
      }
    } else {
      pagoIdFinal = resultado.data?.pago_id
    }

    console.log('✅ Pago registrado exitosamente')

    // ✅ DESCARGAR PDF AUTOMÁTICAMENTE
    if (pagoIdFinal) {
      console.log('📄 Descargando PDF de comisiones...')
      await descargarPDFComisiones(pagoIdFinal)
    }
    
    emit('pago-exitoso', resultado)
  } catch (error) {
    console.error('❌ Error confirmando pago:', error)
    alert(`Error al registrar el pago:\n${error.response?.data?.message || error.message}`)
  } finally {
    cargando.value = false
  }
}

/**
 * Descargar PDF de comisiones desde el backend
 */
async function descargarPDFComisiones(pagoId) {
  try {
    const response = await comisionesStore.descargarPDFComision(pagoId)
    console.log('✅ PDF descargado exitosamente')
  } catch (error) {
    console.error('❌ Error descargando PDF:', error)
    alert('El pago se registró correctamente, pero hubo un error al generar el PDF.')
  }
}

/**
 * Cierra el modal
 */
function cerrar() {
  if (cargando.value) {
    alert('Espere a que termine el proceso...')
    return
  }
  
  emit('cerrar')
}

/**
 * Formatea una fecha completa
 */
function formatearFecha(fecha) {
  if (!fecha) return '-'
  const date = new Date(fecha)
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

/**
 * Formatea una fecha para la tabla (Día DD-MMM)
 */
function formatearFechaTabla(fecha) {
  if (!fecha) return '-'
  
  const date = new Date(fecha)
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  
  const diaSemana = dias[date.getDay()]
  const dia = date.getDate()
  const mes = meses[date.getMonth()]
  
  return `${diaSemana} ${dia}-${mes}`
}
</script>