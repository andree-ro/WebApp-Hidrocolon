<!-- frontend/src/components/libroBancos/ModalSaldoInicial.vue -->
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          🏦 Registrar Saldo Inicial
        </h2>
        <p class="text-blue-100 text-sm mt-1">
          Ingresa el saldo inicial de tu cuenta bancaria
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="guardar" class="p-6 space-y-4">
        
        <!-- Saldo Inicial -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            💰 Saldo Inicial (Q) <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              Q
            </span>
            <input
              v-model.number="form.saldo_inicial"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              class="w-full pl-8 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
              autofocus
            />
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Este será el punto de partida para el control de tu saldo bancario
          </p>
        </div>

        <!-- Observaciones (opcional) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            📝 Observaciones
          </label>
          <textarea
            v-model="form.observaciones"
            rows="3"
            maxlength="500"
            placeholder="Comentarios adicionales sobre el saldo inicial..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          ></textarea>
        </div>

        <!-- Advertencia -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div class="flex gap-2">
            <span class="text-lg">⚠️</span>
            <div>
              <p class="text-sm font-medium text-yellow-800">Importante</p>
              <p class="text-xs text-yellow-700 mt-1">
                El saldo inicial solo puede registrarse una vez. Asegúrate de ingresar el monto correcto.
              </p>
            </div>
          </div>
        </div>

        <!-- Mensaje de error -->
        <div v-if="errorLocal" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-red-800 text-sm">❌ {{ errorLocal }}</p>
        </div>

        <!-- Botones -->
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            @click="$emit('cerrar')"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="guardando || !form.saldo_inicial || form.saldo_inicial <= 0"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium"
          >
            {{ guardando ? '⏳ Registrando...' : '✅ Confirmar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Emits
const emit = defineEmits(['cerrar', 'guardar'])

// Estado local
const guardando = ref(false)
const errorLocal = ref(null)

// Formulario
const form = ref({
  saldo_inicial: null,
  observaciones: ''
})

// Validación
const validarFormulario = () => {
  errorLocal.value = null

  if (!form.value.saldo_inicial || form.value.saldo_inicial <= 0) {
    errorLocal.value = 'Debe ingresar un saldo inicial mayor a 0'
    return false
  }

  return true
}

// Guardar
const guardar = async () => {
  if (!validarFormulario()) {
    return
  }

  guardando.value = true
  errorLocal.value = null

  try {
    const data = {
      saldo_inicial: parseFloat(form.value.saldo_inicial),
      observaciones: form.value.observaciones?.trim() || null
    }

    emit('guardar', data)
  } catch (error) {
    errorLocal.value = error.message || 'Error al registrar el saldo inicial'
    guardando.value = false
  }
}
</script>