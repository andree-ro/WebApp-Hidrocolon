<template>
  <div class="selector-doctora bg-white rounded-lg shadow-md p-6 mb-6">
    <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
      <span class="text-2xl">👩‍⚕️</span>
      <span>¿A quién se atribuye esta venta?</span>
    </h3>
    
    <!-- Loading -->
    <div v-if="cargando" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="text-gray-500 mt-2">Cargando doctoras...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-600">⚠️ {{ error }}</p>
      <button 
        @click="cargarDoctoras" 
        class="mt-2 text-sm text-red-700 underline hover:text-red-800"
      >
        Intentar nuevamente
      </button>
    </div>

    <!-- Selector de doctoras -->
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <button
        v-for="doctora in doctoras"
        :key="doctora.id"
        @click="seleccionarDoctora(doctora)"
        :class="[
          'p-4 rounded-lg border-2 transition-all duration-200 text-center',
          doctoraSeleccionada?.id === doctora.id
            ? 'border-blue-500 bg-blue-50 shadow-md'
            : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
        ]"
      >
        <p class="font-medium text-gray-800">{{ doctora.nombre }}</p>
        <p 
          v-if="doctoraSeleccionada?.id === doctora.id" 
          class="text-sm text-blue-600 mt-1 font-semibold"
        >
          ✓ Seleccionada
        </p>
      </button>
    </div>

    <!-- Mensaje informativo -->
    <div 
      v-if="!doctoraSeleccionada" 
      class="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3"
    >
      <p class="text-sm text-orange-700 flex items-center gap-2">
        <span class="text-lg">⚠️</span>
        <span>
          <strong>Importante:</strong> Si no seleccionas ninguna doctora, 
          la venta se atribuirá a <strong>"Clínica"</strong> por defecto.
        </span>
      </p>
    </div>

    <!-- Doctora seleccionada (resumen) -->
    <div 
      v-else 
      class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3"
    >
      <p class="text-sm text-blue-700 flex items-center gap-2">
        <span class="text-lg">✓</span>
        <span>
          Las comisiones se atribuirán a: <strong>{{ doctoraSeleccionada.nombre }}</strong>
        </span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCarritoStore } from '@/store/carritoStore'
import doctorasService from '@/services/doctorasService'

// Store
const carritoStore = useCarritoStore()

// Estado local
const doctoras = ref([])
const cargando = ref(true)
const error = ref(null)

// Computed
const doctoraSeleccionada = computed(() => carritoStore.doctoraSeleccionada)

// Cargar doctoras al montar
onMounted(async () => {
  await cargarDoctoras()
})

/**
 * Cargar lista de doctoras desde el backend
 */
async function cargarDoctoras() {
  try {
    cargando.value = true
    error.value = null
    
    const response = await doctorasService.obtenerDoctoras()
    doctoras.value = response.data
    
    console.log('✅ Doctoras cargadas:', doctoras.value.length)
    
    // Seleccionar "Clínica" por defecto si existe
    const clinica = doctoras.value.find(d => d.nombre === 'Clínica')
    if (clinica && !doctoraSeleccionada.value) {
      carritoStore.setDoctora(clinica)
    }
    
  } catch (err) {
    console.error('❌ Error cargando doctoras:', err)
    error.value = 'No se pudieron cargar las doctoras. Verifica tu conexión.'
  } finally {
    cargando.value = false
  }
}

/**
 * Seleccionar una doctora
 */
function seleccionarDoctora(doctora) {
  carritoStore.setDoctora(doctora)
  console.log('👩‍⚕️ Doctora seleccionada:', doctora.nombre)
}
</script>

<style scoped>
/* Animación para los botones */
button {
  position: relative;
  overflow: hidden;
}

button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.1);
  transform: translate(-50%, -50%);
  transition: width 0.4s, height 0.4s;
}

button:active::before {
  width: 300px;
  height: 300px;
}
</style>