<!-- components/ModalRegistroPacienteRapido.vue -->
<!-- Modal para registro rápido de pacientes (solo nombres, apellidos, NIT) -->

<template>
  <div v-if="mostrar" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
            <h3 class="text-xl font-bold">⚡ Registro Rápido</h3>
          </div>
          <button 
            @click="cerrar"
            class="text-white hover:text-gray-200 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <p class="text-green-100 text-sm mt-1">Solo información básica para agilizar el registro</p>
      </div>

      <!-- Body -->
      <div class="p-6">
        
        <!-- Mensaje de error -->
        <div v-if="error" class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <span class="text-sm font-medium">{{ error }}</span>
          </div>
        </div>

        <!-- Formulario -->
        <div class="space-y-4">
          
          <!-- Campo: Nombres -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Nombres <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formulario.nombres"
              type="text"
              placeholder="Ej: Juan Carlos"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              :disabled="guardando"
              @keyup.enter="guardar"
            />
          </div>

          <!-- Campo: Apellidos -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Apellidos <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formulario.apellidos"
              type="text"
              placeholder="Ej: García López"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              :disabled="guardando"
              @keyup.enter="guardar"
            />
          </div>

          <!-- Campo: NIT -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              NIT <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formulario.nit"
              type="text"
              placeholder="Ej: 12345678 o CF"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              :disabled="guardando"
              @keyup.enter="guardar"
            />
          </div>

        </div>

        <!-- Nota informativa -->
        <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div class="flex gap-2">
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <div class="text-sm text-blue-800">
              <p class="font-medium">Registro simplificado</p>
              <p class="mt-1">Podrás completar los datos restantes (teléfono, DPI, fechas) desde el módulo de Pacientes cuando sea conveniente.</p>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3 justify-end">
        <button
          @click="cerrar"
          :disabled="guardando"
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
        <button
          @click="guardar"
          :disabled="guardando || !formularioValido"
          class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="guardando" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="guardando">Guardando...</span>
          <span v-else>✓ Guardar y Continuar</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import pacientesService from '../services/pacientesService'

// Props
const props = defineProps({
  mostrar: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['cerrar', 'paciente-creado'])

// Estado
const formulario = ref({
  nombres: '',
  apellidos: '',
  nit: ''
})

const guardando = ref(false)
const error = ref('')

// Computed
const formularioValido = computed(() => {
  return formulario.value.nombres.trim() !== '' &&
         formulario.value.apellidos.trim() !== '' &&
         formulario.value.nit.trim() !== ''
})

// Watchers
watch(() => props.mostrar, (nuevoValor) => {
  if (nuevoValor) {
    // Limpiar formulario al abrir
    limpiarFormulario()
  }
})

// Métodos
function limpiarFormulario() {
  formulario.value = {
    nombres: '',
    apellidos: '',
    nit: ''
  }
  error.value = ''
  guardando.value = false
}

function cerrar() {
  if (!guardando.value) {
    limpiarFormulario()
    emit('cerrar')
  }
}

async function guardar() {
  if (!formularioValido.value || guardando.value) {
    return
  }

  guardando.value = true
  error.value = ''

  try {
    console.log('⚡ Guardando paciente rápido:', formulario.value)

    // Llamar al servicio para crear paciente rápido
    const response = await pacientesService.crearPacienteRapido(formulario.value)

    if (response.success) {
      console.log('✅ Paciente creado:', response.data)
      
      // Emitir evento con el paciente creado
      emit('paciente-creado', response.data)
      
      // Cerrar modal
      limpiarFormulario()
      emit('cerrar')
    }

  } catch (err) {
    console.error('❌ Error guardando paciente rápido:', err)
    error.value = err.message || 'Error al guardar el paciente. Intenta nuevamente.'
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
/* Animaciones para el modal */
</style>