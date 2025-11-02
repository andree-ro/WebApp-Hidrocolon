<!-- frontend/src/components/comisiones/ModalAnularPago.vue -->
<template>
  <!-- Overlay -->
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" @click.self="cerrar">
    <!-- Modal -->
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold">⚠️ Anular Pago de Comisiones</h2>
          <p class="text-red-100 text-sm mt-1">Esta acción NO se puede revertir</p>
        </div>
        <button
          @click="cerrar"
          class="text-white hover:bg-red-500 rounded-full p-2 transition-colors"
          :disabled="cargando"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-6">
        
        <!-- Información del pago -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            📋 Información del Pago
          </h3>
          
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">ID del Pago:</span>
              <span class="font-semibold text-gray-900">#{{ pago.id }}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Doctora:</span>
              <span class="font-semibold text-gray-900">{{ pago.doctora_nombre }}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Monto:</span>
              <span class="font-semibold text-green-600 text-xl">
                Q{{ pago.monto_total.toFixed(2) }}
              </span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Fecha de Pago:</span>
              <span class="font-semibold text-gray-900">{{ formatearFecha(pago.fecha_pago) }}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Ventas incluidas:</span>
              <span class="font-semibold text-gray-900">{{ pago.cantidad_ventas }}</span>
            </div>
          </div>
        </div>

        <!-- Advertencia -->
        <div class="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div class="flex items-start">
            <div class="text-2xl mr-3">⚠️</div>
            <div>
              <h4 class="font-semibold text-yellow-900 mb-2">
                Al anular este pago:
              </h4>
              <ul class="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Las ventas quedarán libres para un nuevo pago</li>
                <li>El registro del pago permanecerá con estado "Anulado"</li>
                <li>Esta acción NO se puede revertir</li>
                <li>Se debe registrar el motivo de la anulación</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Motivo de anulación -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            📝 Motivo de Anulación <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="motivo"
            rows="4"
            placeholder="Ej: Error en el cálculo de comisiones, Pago duplicado por error, etc."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            :class="{ 'border-red-500': errorMotivo }"
            :disabled="cargando"
          ></textarea>
          
          <div class="flex justify-between items-center mt-1">
            <span v-if="errorMotivo" class="text-sm text-red-600">
              {{ errorMotivo }}
            </span>
            <span class="text-xs text-gray-500 ml-auto">
              Mínimo 10 caracteres
            </span>
          </div>
        </div>

        <!-- Confirmación adicional -->
        <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <label class="flex items-start cursor-pointer">
            <input
              v-model="confirmaAnulacion"
              type="checkbox"
              class="mt-1 mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              :disabled="cargando"
            />
            <span class="text-sm text-red-900">
              <strong>Confirmo que deseo anular este pago</strong> y entiendo que esta acción no se puede revertir.
            </span>
          </label>
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
          @click="confirmarAnulacion"
          :disabled="!puedeAnular || cargando"
          class="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {{ cargando ? '⏳ Anulando...' : '🗑️ Confirmar Anulación' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useComisionesStore } from '@/store/comisionesStore'

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

const emit = defineEmits(['cerrar', 'anulacion-exitosa'])

// ============================================================================
// ESTADO
// ============================================================================

const comisionesStore = useComisionesStore()

const motivo = ref('')
const confirmaAnulacion = ref(false)
const errorMotivo = ref('')
const cargando = ref(false)

// ============================================================================
// COMPUTED
// ============================================================================

/**
 * Valida si se puede anular el pago
 */
const puedeAnular = computed(() => {
  // Debe tener motivo con mínimo 10 caracteres
  if (!motivo.value || motivo.value.trim().length < 10) return false
  
  // Debe confirmar la anulación
  if (!confirmaAnulacion.value) return false
  
  return true
})

// ============================================================================
// MÉTODOS
// ============================================================================

/**
 * Valida el motivo de anulación
 */
function validarMotivo() {
  errorMotivo.value = ''
  
  if (!motivo.value || motivo.value.trim() === '') {
    errorMotivo.value = 'El motivo es obligatorio'
    return false
  }
  
  if (motivo.value.trim().length < 10) {
    errorMotivo.value = 'El motivo debe tener al menos 10 caracteres'
    return false
  }
  
  return true
}

/**
 * Confirma la anulación del pago
 */
async function confirmarAnulacion() {
  if (!validarMotivo()) return
  
  if (!confirmaAnulacion.value) {
    alert('Debe confirmar que desea anular el pago')
    return
  }

  // Confirmación final con el usuario
  const confirmacionFinal = confirm(
    '⚠️ ÚLTIMA CONFIRMACIÓN\n\n' +
    `¿Está COMPLETAMENTE SEGURO de anular el pago #${props.pago.id}?\n\n` +
    `Doctora: ${props.pago.doctora_nombre}\n` +
    `Monto: Q${props.pago.monto_total.toFixed(2)}\n\n` +
    'Esta acción NO se puede revertir.'
  )

  if (!confirmacionFinal) return

  cargando.value = true

  try {
    console.log('🗑️ Anulando pago:', props.pago.id)

    const resultado = await comisionesStore.anularPago(
      props.pago.id,
      motivo.value.trim()
    )

    console.log('✅ Pago anulado exitosamente')
    
    emit('anulacion-exitosa', resultado)
  } catch (error) {
    console.error('❌ Error anulando pago:', error)
    alert(`Error al anular el pago:\n${error.response?.data?.message || error.message}`)
  } finally {
    cargando.value = false
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
</script>