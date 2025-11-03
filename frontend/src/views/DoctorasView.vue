<template>
  <div class="doctoras-module">
    <!-- Header con título y botón agregar -->

<header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
  

                <!-- Botón Volver al Dashboard -->
      <button
        @click="$router.push('/')"
        class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        <span>Menú Principal</span>
      </button>
  
  
  <div class="flex items-center gap-3">
    
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">👩‍⚕️ Gestión de Doctoras</h1>
      <p class="text-gray-600 mt-1">Administra las doctoras para asignación de comisiones</p>
    </div>
  </div>

  <div class="flex gap-2">
    <!-- Botón Ver Comisiones -->
  <button
    @click="$router.push('/comisiones')"
    class="btn-secondary flex items-center space-x-2"
  >
    <span class="text-lg">💰</span>
    <span>Ver Comisiones</span>
  </button>
  
  <!-- Botón Agregar Nueva Doctora -->
  <button
    @click="abrirModalAgregar"
    class="btn-primary flex items-center space-x-2"
  >
    <span class="text-lg">➕</span>
    <span>Agregar Doctora</span>
  </button>
  </div>
  
</header>




    <!-- Mensaje de error -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex items-center">
        <span class="text-red-600 mr-2">⚠️</span>
        <span class="text-red-800">{{ error }}</span>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <div class="card p-3 sm:p-4">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 rounded-lg">
            <span class="text-lg sm:text-xl">👩‍⚕️</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Doctoras</p>
            <p class="text-lg sm:text-xl font-semibold text-blue-600">{{ stats.total || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="card p-3 sm:p-4">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 rounded-lg">
            <span class="text-lg sm:text-xl">✅</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Activas</p>
            <p class="text-lg sm:text-xl font-semibold text-green-600">{{ stats.activas || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="card p-3 sm:p-4">
        <div class="flex items-center">
          <div class="p-2 bg-red-100 rounded-lg">
            <span class="text-lg sm:text-xl">❌</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Inactivas</p>
            <p class="text-lg sm:text-xl font-semibold text-red-600">{{ stats.inactivas || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="card p-3 sm:p-4">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 rounded-lg">
            <span class="text-lg sm:text-xl">💰</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Comisiones</p>
            <p class="text-lg sm:text-xl font-semibold text-purple-600">--</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de doctoras -->
    <div class="card overflow-hidden">
      <!-- Loading state -->
      <div v-if="cargando" class="flex justify-center items-center p-8">
        <div class="flex items-center space-x-2">
          <div class="spinner"></div>
          <span class="text-gray-600">Cargando doctoras...</span>
        </div>
      </div>

      <!-- Tabla -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doctora
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Creación
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="doctora in doctoras" :key="doctora.id" class="hover:bg-gray-50">
              <!-- ID -->
              <td class="px-6 py-4">
                <span class="text-sm font-medium text-gray-900">#{{ doctora.id }}</span>
              </td>

              <!-- Nombre -->
              <td class="px-6 py-4">
                <p class="text-sm font-medium text-gray-900">{{ doctora.nombre }}</p>
              </td>

              <!-- Estado -->
              <td class="px-6 py-4">
                <span 
                  :class="[
                    'px-2 py-1 text-xs rounded-full',
                    doctora.activo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ doctora.activo ? 'Activa' : 'Inactiva' }}
                </span>
              </td>

              <!-- Fecha Creación -->
              <td class="px-6 py-4">
                <span class="text-sm text-gray-600">{{ formatearFecha(doctora.fecha_creacion) }}</span>
              </td>

              <!-- Acciones -->
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <!-- Editar -->
                  <button
                    @click="abrirModalEditar(doctora)"
                    class="btn-icon btn-green"
                    title="Editar doctora"
                  >
                    ✏️
                  </button>

                  <!-- Desactivar/Reactivar -->
                  <button
                    v-if="doctora.activo"
                    @click="confirmarDesactivar(doctora)"
                    class="btn-icon btn-red"
                    title="Desactivar doctora"
                  >
                    ❌
                  </button>
                  <button
                    v-else
                    @click="reactivarDoctora(doctora.id)"
                    class="btn-icon btn-green"
                    title="Reactivar doctora"
                  >
                    ✅
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Estado vacío -->
        <div v-if="!doctoras.length && !cargando" class="text-center py-8">
          <span class="text-4xl mb-4 block">👩‍⚕️</span>
          <p class="text-gray-500 text-lg">No hay doctoras registradas</p>
          <p class="text-gray-400 text-sm mt-2">Agrega la primera doctora para comenzar</p>
          <button
            @click="abrirModalAgregar"
            class="mt-4 btn-primary"
          >
            ➕ Agregar Primera Doctora
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Agregar/Editar Doctora -->
    <div v-if="modalFormulario.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-md w-full">
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ modalFormulario.editando ? '✏️ Editar Doctora' : '➕ Agregar Nueva Doctora' }}
            </h3>
            <button @click="cerrarModalFormulario" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="guardarDoctora" class="space-y-4">
            <!-- Nombre -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Doctora <span class="text-red-500">*</span>
              </label>
              <input
                v-model="modalFormulario.datos.nombre"
                type="text"
                required
                maxlength="100"
                class="input-base"
                placeholder="Ej: Doctora María López"
              />
            </div>

            <!-- Estado (solo en edición) -->
            <div v-if="modalFormulario.editando" class="flex items-center">
              <input
                v-model="modalFormulario.datos.activo"
                type="checkbox"
                id="activo"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label for="activo" class="ml-2 text-sm text-gray-700">
                Doctora activa
              </label>
            </div>

            <!-- Error -->
            <div v-if="errorFormulario" class="bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-sm text-red-700">{{ errorFormulario }}</p>
            </div>

            <!-- Botones -->
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                @click="cerrarModalFormulario"
                class="btn-secondary"
                :disabled="modalFormulario.guardando"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary"
                :disabled="modalFormulario.guardando"
              >
                <span v-if="modalFormulario.guardando" class="spinner mr-2"></span>
                {{ modalFormulario.guardando 
                   ? 'Guardando...' 
                   : modalFormulario.editando 
                     ? 'Actualizar Doctora' 
                     : 'Crear Doctora' 
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar Desactivación -->
    <div v-if="modalConfirmacion.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-md w-full">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">⚠️ Confirmar Desactivación</h3>
          
          <p class="text-gray-700 mb-2">
            ¿Estás seguro de que deseas desactivar a:
          </p>
          <p class="font-semibold text-gray-900 mb-4">{{ modalConfirmacion.doctora?.nombre }}?</p>
          
          <p class="text-sm text-gray-600 mb-6">
            La doctora no se eliminará permanentemente, solo se desactivará y no aparecerá 
            en el selector de ventas.
          </p>

          <div class="flex justify-end space-x-3">
            <button
              @click="cerrarModalConfirmacion"
              class="btn-secondary"
              :disabled="modalConfirmacion.procesando"
            >
              Cancelar
            </button>
            <button
              @click="desactivarDoctora"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
              :disabled="modalConfirmacion.procesando"
            >
              <span v-if="modalConfirmacion.procesando" class="spinner mr-2"></span>
              {{ modalConfirmacion.procesando ? 'Desactivando...' : 'Sí, Desactivar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import doctorasService from '@/services/doctorasService'

// Estado
const doctoras = ref([])
const cargando = ref(true)
const error = ref(null)

// Modales
const modalFormulario = ref({
  visible: false,
  editando: false,
  guardando: false,
  datos: {
    id: null,
    nombre: '',
    activo: true
  }
})

const modalConfirmacion = ref({
  visible: false,
  procesando: false,
  doctora: null
})

const errorFormulario = ref(null)

// Computed - Estadísticas
const stats = computed(() => {
  return {
    total: doctoras.value.length,
    activas: doctoras.value.filter(d => d.activo).length,
    inactivas: doctoras.value.filter(d => !d.activo).length
  }
})

// Cargar doctoras al montar
onMounted(async () => {
  await cargarDoctoras()
})

/**
 * Cargar todas las doctoras
 */
async function cargarDoctoras() {
  try {
    cargando.value = true
    error.value = null
    
    const response = await doctorasService.obtenerDoctoras()
    doctoras.value = response.data
    
    console.log('✅ Doctoras cargadas:', doctoras.value.length)
  } catch (err) {
    console.error('❌ Error cargando doctoras:', err)
    error.value = 'Error al cargar las doctoras. Por favor, intenta nuevamente.'
  } finally {
    cargando.value = false
  }
}

/**
 * Abrir modal para agregar
 */
function abrirModalAgregar() {
  modalFormulario.value = {
    visible: true,
    editando: false,
    guardando: false,
    datos: {
      id: null,
      nombre: '',
      activo: true
    }
  }
  errorFormulario.value = null
}

/**
 * Abrir modal para editar
 */
function abrirModalEditar(doctora) {
  modalFormulario.value = {
    visible: true,
    editando: true,
    guardando: false,
    datos: {
      id: doctora.id,
      nombre: doctora.nombre,
      activo: doctora.activo === 1 || doctora.activo === true
    }
  }
  errorFormulario.value = null
}

/**
 * Cerrar modal formulario
 */
function cerrarModalFormulario() {
  modalFormulario.value.visible = false
  errorFormulario.value = null
}

/**
 * Guardar doctora (crear o actualizar)
 */
async function guardarDoctora() {
  try {
    modalFormulario.value.guardando = true
    errorFormulario.value = null

    const datos = {
      nombre: modalFormulario.value.datos.nombre.trim(),
      activo: modalFormulario.value.datos.activo
    }

    if (modalFormulario.value.editando) {
      // Actualizar
      await doctorasService.actualizarDoctora(modalFormulario.value.datos.id, datos)
      console.log('✅ Doctora actualizada')
    } else {
      // Crear
      await doctorasService.crearDoctora(datos)
      console.log('✅ Doctora creada')
    }

    cerrarModalFormulario()
    await cargarDoctoras()

  } catch (err) {
    console.error('❌ Error guardando doctora:', err)
    errorFormulario.value = err.response?.data?.message || 'Error al guardar la doctora'
  } finally {
    modalFormulario.value.guardando = false
  }
}

/**
 * Confirmar desactivación
 */
function confirmarDesactivar(doctora) {
  modalConfirmacion.value = {
    visible: true,
    procesando: false,
    doctora: doctora
  }
}

/**
 * Cerrar modal confirmación
 */
function cerrarModalConfirmacion() {
  modalConfirmacion.value.visible = false
  modalConfirmacion.value.doctora = null
}

/**
 * Desactivar doctora
 */
async function desactivarDoctora() {
  try {
    modalConfirmacion.value.procesando = true
    
    await doctorasService.eliminarDoctora(modalConfirmacion.value.doctora.id)
    console.log('✅ Doctora desactivada')
    
    cerrarModalConfirmacion()
    await cargarDoctoras()

  } catch (err) {
    console.error('❌ Error desactivando doctora:', err)
    alert('Error al desactivar la doctora')
  } finally {
    modalConfirmacion.value.procesando = false
  }
}

/**
 * Reactivar doctora
 */
async function reactivarDoctora(id) {
  try {
    await doctorasService.actualizarDoctora(id, { activo: true })
    console.log('✅ Doctora reactivada')
    await cargarDoctoras()
  } catch (err) {
    console.error('❌ Error reactivando doctora:', err)
    alert('Error al reactivar la doctora')
  }
}

/**
 * Formatear fecha
 */
function formatearFecha(fecha) {
  if (!fecha) return '--'
  try {
    return new Date(fecha).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return '--'
  }
}

/**
 * Ver comisiones y ventas de la doctora
 */
function verComisiones(doctora) {
  console.log('💰 Ver comisiones de:', doctora.nombre)
  
  // Redirigir al módulo de comisiones con filtro de doctora
  window.location.href = `/comisiones?doctora_id=${doctora.id}&doctora_nombre=${encodeURIComponent(doctora.nombre)}`
}

</script>

<style scoped>
/* Inherit styles from global CSS */
</style>