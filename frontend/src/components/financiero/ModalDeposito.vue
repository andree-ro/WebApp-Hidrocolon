<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-lg">
        <h3 class="text-xl font-bold flex items-center gap-2">
          <span class="text-2xl">🏧</span>
          Registrar Depósito Bancario
        </h3>
        <p class="text-purple-100 text-sm mt-1">
          Ingresa los datos del comprobante de depósito
        </p>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4">
        <!-- Número de Depósito -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Número de Depósito *
          </label>
          <input
            v-model="formulario.numero_deposito"
            type="text"
            placeholder="Ej: DEP-2024-001"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            :class="{ 'border-red-500': errores.numero_deposito }"
          />
          <p v-if="errores.numero_deposito" class="text-red-500 text-xs mt-1">
            {{ errores.numero_deposito }}
          </p>
        </div>

        <!-- Nombre del Cliente -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Nombre de quien deposita *
          </label>
          <input
            v-model="formulario.paciente_nombre"
            type="text"
            placeholder="Ej: Juan Pérez"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            :class="{ 'border-red-500': errores.paciente_nombre }"
          />
          <p v-if="errores.paciente_nombre" class="text-red-500 text-xs mt-1">
            {{ errores.paciente_nombre }}
          </p>
        </div>

        <!-- Monto -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Monto del Depósito *
          </label>
          <div class="relative">
            <span class="absolute left-3 top-2.5 text-gray-500 font-semibold">Q</span>
            <input
              v-model.number="formulario.monto"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              :class="{ 'border-red-500': errores.monto }"
            />
          </div>
          <p v-if="errores.monto" class="text-red-500 text-xs mt-1">
            {{ errores.monto }}
          </p>
        </div>

        <!-- Información adicional -->
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p class="text-xs text-purple-800">
            <strong>Nota:</strong> Asegúrate de verificar que el número de depósito coincida con el comprobante físico.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3 justify-end">
        <button
          @click="$emit('cancelar')"
          :disabled="guardando"
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          @click="registrarDeposito"
          :disabled="guardando"
          class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <span v-if="guardando" class="animate-spin">⏳</span>
          <span v-else>💾</span>
          {{ guardando ? 'Guardando...' : 'Registrar Depósito' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useFinancieroStore } from '@/store/financiero'
import depositosService from '@/services/depositosService'

const emit = defineEmits(['deposito-registrado', 'cancelar'])
const financieroStore = useFinancieroStore()

const guardando = ref(false)

const formulario = reactive({
  numero_deposito: '',
  paciente_nombre: '',
  monto: 0
})

const errores = reactive({
  numero_deposito: '',
  paciente_nombre: '',
  monto: ''
})

/**
 * Validar formulario
 */
function validarFormulario() {
  let valido = true
  
  // Limpiar errores
  errores.numero_deposito = ''
  errores.paciente_nombre = ''
  errores.monto = ''

  // Validar número de depósito
  if (!formulario.numero_deposito || formulario.numero_deposito.trim() === '') {
    errores.numero_deposito = 'El número de depósito es requerido'
    valido = false
  }

  // Validar nombre
  if (!formulario.paciente_nombre || formulario.paciente_nombre.trim() === '') {
    errores.paciente_nombre = 'El nombre es requerido'
    valido = false
  }

  // Validar monto
  if (!formulario.monto || formulario.monto <= 0) {
    errores.monto = 'El monto debe ser mayor a cero'
    valido = false
  }

  return valido
}

/**
 * Registrar depósito
 */
async function registrarDeposito() {
  if (!validarFormulario()) {
    return
  }

  guardando.value = true

  try {
    const response = await depositosService.registrarDeposito({
      numero_deposito: formulario.numero_deposito.trim(),
      paciente_nombre: formulario.paciente_nombre.trim(),
      monto: parseFloat(formulario.monto)
    })

    if (response.success) {
      alert('✅ Depósito registrado exitosamente')
      
      // Refrescar datos del turno
      await financieroStore.refrescarDatos()
      
      emit('deposito-registrado')
    }

  } catch (error) {
    console.error('Error al registrar depósito:', error)
    
    const mensaje = error.message || 'Error al registrar el depósito'
    alert('❌ ' + mensaje)
    
  } finally {
    guardando.value = false
  }
}
</script>