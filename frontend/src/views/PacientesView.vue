<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header principal -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
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

          <div>
            <h1 class="text-2xl font-bold text-gray-900">🏥 Gestión de Pacientes</h1>
            <p class="mt-1 text-sm text-gray-500">
              Administra información de pacientes, citas y seguimiento médico
            </p>
          </div>
          
          <!-- Botones de acción -->
          <div class="flex space-x-3">
            <button
              @click="abrirModalNuevo"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors"
              :disabled="loading"
            >
              <span>➕</span>
              <span>Nuevo Paciente</span>
            </button>
            
            <button
              @click="exportarExcel"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors"
              :disabled="loading"
            >
              <span>📊</span>
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span class="text-blue-600 text-lg">👥</span>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Pacientes</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.total || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span class="text-purple-600 text-lg">🎂</span>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Cumpleaños este mes</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.cumpleanos_mes || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span class="text-green-600 text-lg">📅</span>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Citas mañana</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.citas_manana || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span class="text-orange-600 text-lg">⏰</span>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Sin próxima cita</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.sin_proxima_cita || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros y búsqueda -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Buscador -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                🔍 Buscar pacientes
              </label>
              <input
                v-model="filtros.search"
                @input="buscarConDebounce"
                type="text"
                placeholder="Nombre, apellido, teléfono o DPI..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Filtro especial -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                📋 Filtro especial
              </label>
              <select
                v-model="filtros.filtro"
                @change="aplicarFiltros"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los pacientes</option>
                <option value="citas_hoy">Citas HOY </option>
                <option value="citas_manana">Citas mañana</option>
                <option value="cumpleanos_mes">Cumpleaños este mes</option>
                <option value="sin_proxima_cita">Sin próxima cita/Cita vencida</option>
                <option value="menores_edad">Menores de edad</option>
              </select>
            </div>

            <!-- Items por página -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                📄 Items por página
              </label>
              <select
                v-model="paginacion.limit"
                @change="cambiarLimitePagina"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="10">10 por página</option>
                <option value="25">25 por página</option>
                <option value="50">50 por página</option>
                <option value="100">100 por página</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de pacientes -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center py-12">
          <div class="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <!-- Tabla -->
        <div v-else-if="pacientes.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DPI
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Citas
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cumpleaños
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="paciente in pacientes"
                :key="paciente.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <!-- Paciente -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-blue-600 font-medium text-sm">
                          {{ paciente.nombres.charAt(0) }}{{ paciente.apellidos.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ paciente.nombre_completo }}
                      </div>
                      <div class="text-sm text-gray-500">
                        ID: {{ paciente.id }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Contacto -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    📞 {{ paciente.telefono }}
                  </div>
                </td>

                <!-- DPI -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    <span v-if="paciente.dpi">{{ paciente.dpi }}</span>
                    <span v-else class="text-gray-400 italic">👶 Menor de edad</span>
                  </div>
                </td>

                <!-- Citas -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div class="space-y-1">
                    <div>
                      <span class="text-gray-500">Primera:</span> {{ formatearFecha(paciente.fecha_primer_cita) }}
                    </div>
                    <div v-if="paciente.proxima_cita">
                      <span class="text-gray-500">Próxima:</span> {{ formatearFecha(paciente.proxima_cita) }}
                    </div>
                    <div v-else class="text-gray-400 italic">Sin cita programada</div>
                  </div>
                </td>

                <!-- Cumpleaños -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatearFecha(paciente.fecha_nacimiento) }}
                </td>

                <!-- Estado -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getEstadoCitaClass(paciente)"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{ getEstadoCitaTexto(paciente) }}
                  </span>
                </td>

                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      @click="verDetalle(paciente)"
                      class="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center transition-colors"
                      title="Ver detalle"
                    >
                      👁️
                    </button>
                    <button
                      v-if="puedeEditar('pacientes')"
                      @click="abrirModalEditar(paciente)"
                      class="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center transition-colors"
                      title="Editar paciente"
                    >
                      ✏️
                    </button>
                    <button
                      v-if="puedeEliminar('pacientes')"
                      @click="eliminarPaciente(paciente)"
                      class="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition-colors"
                      title="Eliminar paciente"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Estado vacío -->
        <div v-else class="text-center py-12">
          <div class="text-gray-400 text-6xl mb-4">👥</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No hay pacientes</h3>
          <p class="text-gray-500 mb-4">
            {{ filtros.search || filtros.filtro !== 'todos' ? 'No se encontraron pacientes con los filtros aplicados' : 'Comienza agregando tu primer paciente' }}
          </p>
          <button
            @click="abrirModalNuevo"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            ➕ Agregar Primer Paciente
          </button>
        </div>

        <!-- Paginación -->
        <div v-if="pacientes.length > 0 && paginacion.total_pages > 1" class="bg-white px-6 py-3 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Mostrando {{ ((paginacion.current_page - 1) * paginacion.per_page) + 1 }} 
              al {{ Math.min(paginacion.current_page * paginacion.per_page, paginacion.total) }} 
              de {{ paginacion.total }} pacientes
            </div>
            <div class="flex space-x-2">
              <button
                @click="cambiarPagina(paginacion.current_page - 1)"
                :disabled="!paginacion.has_prev"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              
              <template v-for="pagina in getPaginasVisibles()" :key="pagina">
                <button
                  v-if="pagina !== '...'"
                  @click="cambiarPagina(pagina)"
                  :class="[
                    'px-3 py-1 border text-sm rounded-md transition-colors',
                    pagina === paginacion.current_page 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'border-gray-300 hover:bg-gray-50'
                  ]"
                >
                  {{ pagina }}
                </button>
                <span v-else class="px-3 py-1 text-gray-500">...</span>
              </template>

              <button
                @click="cambiarPagina(paginacion.current_page + 1)"
                :disabled="!paginacion.has_next"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Crear/Editar Paciente -->
    <div
      v-if="modalVisible"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-full max-w-2xl bg-white rounded-lg shadow-lg"
      >
        <div class="flex justify-between items-center pb-4 border-b">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ modalEditando ? '✏️ Editar Paciente' : '➕ Nuevo Paciente' }}
          </h3>
          <button
            @click="cerrarModal"
            class="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="guardarPaciente" class="mt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Nombres -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombres *
              </label>
              <input
                v-model="formulario.nombre"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Juan Carlos"
              />
            </div>

            <!-- Apellidos -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Apellidos *
              </label>
              <input
                v-model="formulario.apellido"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Pérez López"
              />
            </div>

            <!-- Teléfono -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                v-model="formulario.telefono"
                type="tel"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="5551-2345"
              />
            </div>

            <!-- DPI -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                DPI <span class="text-sm text-gray-500">(opcional para menores)</span>
              </label>
              <input
                v-model="formulario.dpi"
                @input="verificarDPIExistente"
                type="text"
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500',
                  dpiExistente ? 'border-red-500 bg-red-50' : 'border-gray-300'
                ]"
                placeholder="1234567890101"
                maxlength="13"
              />
              <!-- Advertencia si el DPI ya existe -->
              <div v-if="dpiExistente" class="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p class="text-sm text-red-700 font-medium flex items-center">
                  <span class="mr-2">⚠️</span>
                  Ya existe un paciente con este DPI
                </p>
                <p class="text-xs text-red-600 mt-1">
                  {{ dpiExistente.nombres }} {{ dpiExistente.apellidos }} (ID: {{ dpiExistente.id }})
                </p>
              </div>
              <!-- Mensaje de verificación -->
              <p v-if="verificandoDPI" class="mt-1 text-xs text-gray-500">
                Verificando DPI...
              </p>
            </div>

            <!-- NIT -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                NIT *
              </label>
              <input
                v-model="formulario.nit"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="123456-7"
                maxlength="20"
              />
            </div>

            <!-- Fecha primera cita -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Fecha primera cita *
              </label>
              <input
                v-model="formulario.fecha_primer_cita"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Próxima cita -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Próxima cita <span class="text-sm text-gray-500">(opcional)</span>
              </label>
              <input
                v-model="formulario.proxima_cita"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Cumpleaños -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Fecha de nacimiento *
              </label>
              <input
                v-model="formulario.cumpleanos"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              type="button"
              @click="cerrarModal"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="guardando"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <span v-if="guardando">Guardando...</span>
              <span v-else>{{ modalEditando ? 'Actualizar' : 'Crear' }} Paciente</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Detalle Paciente -->
    <div
      v-if="modalDetalle && pacienteDetalle"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="cerrarModalDetalle"
    >
      <div
        class="relative top-10 mx-auto p-6 border w-full max-w-4xl bg-white rounded-lg shadow-xl"
        @click.stop
      >
        <!-- Header del modal -->
        <div class="flex justify-between items-center pb-4 border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-blue-600 text-xl">👤</span>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900">
                {{ pacienteDetalle.nombre_completo }}
              </h3>
              <p class="text-sm text-gray-500">
                Detalles del paciente
              </p>
            </div>
          </div>
          <button
            @click="cerrarModalDetalle"
            class="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <!-- Contenido del modal -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Información personal -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
              <span class="mr-2">👤</span>
              Información Personal
            </h4>
            <div class="space-y-2">
              <div>
                <span class="text-sm font-medium text-gray-500">Nombres:</span>
                <p class="text-gray-900">{{ pacienteDetalle.nombres }}</p>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-500">Apellidos:</span>
                <p class="text-gray-900">{{ pacienteDetalle.apellidos }}</p>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-500">Edad:</span>
                <p class="text-gray-900">
                  {{ pacienteDetalle.edad ? `${pacienteDetalle.edad} años` : 'No calculada' }}
                  <span v-if="pacienteDetalle.es_menor" class="text-orange-600 text-xs ml-2">
                    (Menor de edad)
                  </span>
                </p>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-500">Fecha de Nacimiento:</span>
                <p class="text-gray-900">{{ pacienteDetalle.cumpleanos_formateado || 'No especificada' }}</p>
              </div>
            </div>
          </div>

          <!-- Información de contacto -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
              <span class="mr-2">📞</span>
              Contacto
            </h4>
            <div class="space-y-2">
              <div>
                <span class="text-sm font-medium text-gray-500">Teléfono:</span>
                <p class="text-gray-900 font-mono">{{ pacienteDetalle.telefono_formateado }}</p>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-500">DPI:</span>
                <p class="text-gray-900 font-mono">
                  {{ pacienteDetalle.dpi || 'No registrado' }}
                  <span v-if="!pacienteDetalle.dpi" class="text-gray-500 text-xs ml-2">
                    (Común en menores)
                  </span>
                </p>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-500">NIT:</span>
                <p class="text-gray-900 font-mono">
                  {{ pacienteDetalle.nit || 'No registrado' }}
                  <span v-if="!pacienteDetalle.dpi" class="text-gray-500 text-xs ml-2">
                    (Común en menores)
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- Estado de citas -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
              <span class="mr-2">📅</span>
              Estado de Citas
            </h4>
            <div class="space-y-3">
              <div>
                <span class="text-sm font-medium text-gray-500">Primera Cita:</span>
                <p class="text-gray-900">{{ pacienteDetalle.fecha_primer_cita_formateada }}</p>
              </div>
              
              <div>
                <span class="text-sm font-medium text-gray-500">Próxima Cita:</span>
                <div class="flex items-center space-x-2 mt-1">
                  <span class="text-gray-900">
                    {{ pacienteDetalle.proxima_cita_formateada || 'Sin programar' }}
                  </span>
                  <span 
                    v-if="pacienteDetalle.estado_cita"
                    :class="pacienteDetalle.estado_cita.clase"
                    class="px-2 py-1 text-xs rounded-full"
                  >
                    {{ pacienteDetalle.estado_cita.icono }} {{ pacienteDetalle.estado_cita.texto }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Información del sistema -->
          <div class="bg-gray-50 rounded-lg p-4 md:col-span-2 lg:col-span-3">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
              <span class="mr-2">⚙️</span>
              Información del Sistema
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span class="text-sm font-medium text-gray-500">ID del Paciente:</span>
                <p class="text-gray-900 font-mono">#{{ pacienteDetalle.id }}</p>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-500">Registrado:</span>
                <p class="text-gray-900">{{ formatearFecha(pacienteDetalle.fecha_creacion) }}</p>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-500">Última Actualización:</span>
                <p class="text-gray-900">{{ formatearFecha(pacienteDetalle.fecha_actualizacion) }}</p>
              </div>
            </div>
          </div>

          <!-- Acciones rápidas -->
          <div class="bg-blue-50 rounded-lg p-4 md:col-span-2 lg:col-span-3">
            <h4 class="font-semibold text-blue-900 mb-3 flex items-center">
              <span class="mr-2">⚡</span>
              Acciones Rápidas
            </h4>
            <div class="flex flex-wrap gap-3">
              <button
                @click="abrirModalEditar(pacienteDetalle); cerrarModalDetalle()"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors"
              >
                <span>✏️</span>
                <span>Editar Paciente</span>
              </button>
            </div>
            
            <p class="text-xs text-blue-700 mt-2">
              💡 Algunas acciones estarán disponibles cuando se implementen los módulos de carrito y ventas.
            </p>
          </div>
        </div>

        <!-- Footer del modal -->
        <div class="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            @click="cerrarModalDetalle"
            class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCarritoStore } from '@/store/carritoStore'
import pacientesService from '@/services/pacientesService'
import { usePermisos } from '@/composables/usePermisos'

export default {
  name: 'PacientesView',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const carritoStore = useCarritoStore()
    const { puedeEditar, puedeEliminar } = usePermisos()
    // Estado reactivo
    const pacientes = ref([])
    const loading = ref(false)
    const guardando = ref(false)
    const modalVisible = ref(false)
    const modalEditando = ref(false)
    const pacienteEditando = ref(null)
    const error = ref('')
    const mensaje = ref('')
    const dpiExistente = ref(null)
    const verificandoDPI = ref(false)
    const modalDetalle = ref(false)
    const pacienteDetalle = ref(null)

    // Estadísticas
    const stats = reactive({
      total: 0,
      cumpleanos_mes: 0,
      citas_manana: 0,
      sin_proxima_cita: 0
    })

    // Filtros y búsqueda
    const filtros = reactive({
      search: '',
      filtro: 'todos'
    })

    // Paginación
    const paginacion = reactive({
      current_page: 1,
      per_page: 10,
      total: 0,
      total_pages: 0,
      has_next: false,
      has_prev: false,
      limit: 10
    })

    // Formulario
    const formularioBase = {
      nombre: '',
      apellido: '',
      telefono: '',
      dpi: '',
      nit: '',
      fecha_primer_cita: '',
      proxima_cita: '',
      cumpleanos: ''
    }
    const formulario = reactive({ ...formularioBase })

    // Métodos principales
    const cargarPacientes = async () => {
      loading.value = true
      error.value = ''
      
      try {
        const params = pacientesService.construirParametrosFiltro({
          page: paginacion.current_page,
          limit: paginacion.limit,
          search: filtros.search,
          filtro: filtros.filtro
        })

        const response = await pacientesService.getPacientes(params)
        
        if (response.success) {
          pacientes.value = response.data
          Object.assign(paginacion, response.pagination)
        } else {
          error.value = response.message || 'Error obteniendo pacientes'
        }
      } catch (err) {
        error.value = pacientesService.procesarError(err)
        console.error('Error cargando pacientes:', err)
      } finally {
        loading.value = false
      }
    }

    const cargarEstadisticas = async () => {
      try {
        const response = await pacientesService.getEstadisticasConCache()
        if (response.success) {
          Object.assign(stats, response.data)
        }
      } catch (err) {
        console.error('Error cargando estadísticas:', err)
      }
    }

    const abrirModalNuevo = () => {
      modalEditando.value = false
      pacienteEditando.value = null
      Object.assign(formulario, formularioBase)
      error.value = ''
      mensaje.value = ''
      modalVisible.value = true
    }

    const abrirModalEditar = (paciente) => {
      modalEditando.value = true
      pacienteEditando.value = paciente
      Object.assign(formulario, {
        nombre: paciente.nombres,
        apellido: paciente.apellidos,
        telefono: paciente.telefono,
        dpi: paciente.dpi || '',
        nit: paciente.nit || '',
        fecha_primer_cita: pacientesService.formatearFechaInput(paciente.fecha_primer_cita),
        proxima_cita: paciente.proxima_cita ? pacientesService.formatearFechaInput(paciente.proxima_cita) : '',
        cumpleanos: pacientesService.formatearFechaInput(paciente.fecha_nacimiento)
      })
      error.value = ''
      mensaje.value = ''
      modalVisible.value = true
    }

    const cerrarModal = () => {
      modalVisible.value = false
      modalEditando.value = false
      pacienteEditando.value = null
      Object.assign(formulario, formularioBase)
      error.value = ''
      mensaje.value = ''
      dpiExistente.value = null      // <--- AGREGAR ESTA LÍNEA
      verificandoDPI.value = false
    }

    const verificarDPIExistente = (() => {
      let timeout
      return async () => {
        clearTimeout(timeout)
        
        const dpi = formulario.dpi?.trim()
        
        // Limpiar advertencia si el DPI está vacío o es muy corto
        if (!dpi || dpi.length < 13) {
          dpiExistente.value = null
          return
        }
        
        // Si estamos editando, no verificar si es el mismo paciente
        if (modalEditando.value && pacienteEditando.value?.dpi === dpi) {
          dpiExistente.value = null
          return
        }
        
        // Verificar después de 500ms de que el usuario dejó de escribir
        timeout = setTimeout(async () => {
          verificandoDPI.value = true
          
          try {
            // Buscar si existe un paciente con ese DPI
            const response = await pacientesService.getPacientes({
              search: dpi,
              limit: 100
            })
            
            if (response.success && response.data) {
              // Buscar coincidencia exacta de DPI
              const pacienteConDPI = response.data.find(p => p.dpi === dpi)
              
              if (pacienteConDPI) {
                dpiExistente.value = pacienteConDPI
              } else {
                dpiExistente.value = null
              }
            }
          } catch (err) {
            console.error('Error verificando DPI:', err)
          } finally {
            verificandoDPI.value = false
          }
        }, 500)
      }
    })()

const guardarPaciente = async () => {
  // Validar datos antes de enviar
  const erroresValidacion = pacientesService.validarPaciente(formulario)
  if (erroresValidacion.length > 0) {
    error.value = erroresValidacion.join(', ')
    return
  }

  guardando.value = true
  error.value = ''
  mensaje.value = ''
  
  try {
    let response
    if (modalEditando.value) {
      response = await pacientesService.actualizarPaciente(pacienteEditando.value.id, formulario)
    } else {
      response = await pacientesService.crearPaciente(formulario)
    }

    if (response.success) {
      mensaje.value = response.message
      
      // Si es un paciente nuevo (no es edición)
      if (!modalEditando.value) {
        // Verificar de dónde viene el usuario
        const fromCarrito = route.query.from === 'carrito'
        
        if (fromCarrito) {
          // Si viene del carrito, seleccionar paciente y regresar al carrito
          carritoStore.setPaciente(response.data)
          alert('✅ Paciente creado exitosamente y seleccionado en el carrito')
          router.push('/carrito')
          return
        } else {
          // Si viene del módulo de pacientes, quedarse aquí
          alert('✅ Paciente creado exitosamente')
          cerrarModal()
          await cargarPacientes()
          await cargarEstadisticas()
          pacientesService.limpiarCache()
          return
        }
      }
      
      // Si es edición, comportamiento normal
      cerrarModal()
      await cargarPacientes()
      await cargarEstadisticas()
      pacientesService.limpiarCache()
    } else {
      error.value = response.message || 'Error guardando paciente'
    }
  } catch (err) {
    console.error('Error guardando paciente:', err)
    
    // Manejo especial para DPI duplicado
    if (err.response?.data?.error_type === 'duplicate_dpi') {
      error.value = '❌ Ya existe un paciente con ese DPI en el sistema'
    } else if (err.response?.data?.message?.includes('DPI')) {
      error.value = err.response.data.message
    } else if (err.message?.includes('DPI')) {
      error.value = err.message
    } else {
      error.value = pacientesService.procesarError(err)
    }
  } finally {
    guardando.value = false
  }
}

    const eliminarPaciente = async (paciente) => {
      const confirmacion = confirm(
        `¿Estás seguro de eliminar al paciente ${paciente.nombre_completo}?\n\nEsta acción no se puede deshacer.`
      )
      
      if (!confirmacion) return

      try {
        const response = await pacientesService.eliminarPaciente(paciente.id)
        
        if (response.success) {
          mensaje.value = `Paciente ${paciente.nombre_completo} eliminado correctamente`
          await cargarPacientes()
          await cargarEstadisticas()
          pacientesService.limpiarCache()
        } else {
          error.value = response.message || 'Error eliminando paciente'
        }
      } catch (err) {
        error.value = pacientesService.procesarError(err)
        console.error('Error eliminando paciente:', err)
      }
    }

    const buscarConDebounce = (() => {
      let timeout
      return () => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          paginacion.current_page = 1
          cargarPacientes()
        }, 500)
      }
    })()

    const aplicarFiltros = () => {
      paginacion.current_page = 1
      cargarPacientes()
    }

    const cambiarPagina = (pagina) => {
      if (pagina >= 1 && pagina <= paginacion.total_pages) {
        paginacion.current_page = pagina
        cargarPacientes()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    const cambiarLimitePagina = () => {
      paginacion.current_page = 1
      paginacion.per_page = parseInt(paginacion.limit)
      cargarPacientes()
    }

    const verDetalle = (paciente) => {
        console.log('Ver detalle de:', paciente.nombre_completo)
        
        // Normalizar datos del paciente usando el servicio
        pacienteDetalle.value = pacientesService.normalizarPaciente(paciente)
        modalDetalle.value = true
    }

    const cerrarModalDetalle = () => {
        modalDetalle.value = false
        pacienteDetalle.value = null
    }

    const verHistorial = (paciente) => {
        console.log('Ver historial de:', paciente.nombre_completo)
        
        // Por ahora mostrar mensaje informativo
        const mensaje = `El historial de compras para ${paciente.nombre_completo} estará disponible cuando se implemente el módulo de carrito/ventas.\n\nFuncionalidades pendientes:\n• Historial de compras\n• Medicamentos consumidos\n• Gráficas de consumo\n• Total invertido`
        
        alert(mensaje)
        
        // TODO: Cuando se implemente el carrito, navegar a:
        // this.$router.push(`/pacientes/${paciente.id}/historial`)
    }

    const exportarExcel = async () => {
      try {
        console.log('📊 Exportando pacientes...')
        loading.value = true
        
        // Obtener todos los pacientes para exportar
        const params = pacientesService.construirParametrosFiltro({
          limit: 1000, // Obtener muchos pacientes
          search: filtros.search,
          filtro: filtros.filtro
        })
        
        const response = await pacientesService.getPacientes(params)
        
        if (!response.success || !response.data || response.data.length === 0) {
          alert('❌ No hay pacientes para exportar')
          return
        }
        
        // Generar CSV
        const csvContent = generarCSV(response.data)
        
        // ✅ CRÍTICO: Agregar BOM para UTF-8
        const BOM = '\uFEFF'
        
        // Crear blob con BOM
        const blob = new Blob([BOM + csvContent], { 
          type: 'text/csv;charset=utf-8;' 
        })
        
        // Descargar archivo
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `pacientes_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        console.log('✅ Pacientes exportados exitosamente')
        mensaje.value = `✅ Excel exportado: ${response.data.length} pacientes`
        
        setTimeout(() => {
          alert(`✅ Excel exportado: ${response.data.length} pacientes\n\n💡 Si las columnas no se separan:\n1. Abre en Excel\n2. Selecciona columna A\n3. Datos > Texto en columnas\n4. Delimitado > Punto y coma`)
        }, 100)
        
      } catch (err) {
        error.value = pacientesService.procesarError(err)
        console.error('❌ Error exportando:', err)
        alert(`❌ Error exportando: ${error.value}`)
      } finally {
        loading.value = false
      }
    }

    const generarCSV = (pacientes) => {
      // ✅ Separador: punto y coma para Excel en español
      const SEPARADOR = ';'
      
      // ✅ Headers
      const headers = [
        'ID',
        'Nombres',
        'Apellidos',
        'Nombre Completo',
        'Teléfono',
        'DPI',
        'Edad',
        'Menor de Edad',
        'Fecha Nacimiento',
        'Primera Cita',
        'Próxima Cita',
        'Estado Cita',
        'Fecha Registro',
        'Última Actualización'
      ]
      
      // ✅ Escapar valores
      const escaparValor = (valor) => {
        if (valor === null || valor === undefined) return ''
        let valorStr = String(valor).trim()
        valorStr = valorStr.replace(/[\r\n\t]/g, ' ')
        
        if (valorStr.includes(SEPARADOR) || valorStr.includes('"')) {
          valorStr = valorStr.replace(/"/g, '""')
          return `"${valorStr}"`
        }
        return valorStr
      }
      
      // ✅ Formatear fecha
      const formatearFecha = (fecha) => {
        if (!fecha) return ''
        try {
          const date = new Date(fecha)
          const dia = String(date.getDate()).padStart(2, '0')
          const mes = String(date.getMonth() + 1).padStart(2, '0')
          const anio = date.getFullYear()
          return `${dia}/${mes}/${anio}`
        } catch {
          return ''
        }
      }
      
      // ✅ Formatear fecha con hora
      const formatearFechaHora = (fecha) => {
        if (!fecha) return ''
        try {
          const date = new Date(fecha)
          const dia = String(date.getDate()).padStart(2, '0')
          const mes = String(date.getMonth() + 1).padStart(2, '0')
          const anio = date.getFullYear()
          const hora = String(date.getHours()).padStart(2, '0')
          const minuto = String(date.getMinutes()).padStart(2, '0')
          return `${dia}/${mes}/${anio} ${hora}:${minuto}`
        } catch {
          return ''
        }
      }
      
      // ✅ Calcular edad
      const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return ''
        try {
          const hoy = new Date()
          const nacimiento = new Date(fechaNacimiento)
          let edad = hoy.getFullYear() - nacimiento.getFullYear()
          const mes = hoy.getMonth() - nacimiento.getMonth()
          if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--
          }
          return edad
        } catch {
          return ''
        }
      }
      
      // ✅ Obtener estado de cita
      const obtenerEstadoCita = (proximaCita) => {
        if (!proximaCita) return 'Sin cita'
        
        try {
          const hoy = new Date()
          hoy.setHours(0, 0, 0, 0)
          const cita = new Date(proximaCita)
          cita.setHours(0, 0, 0, 0)
          
          const diffTime = cita - hoy
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          if (diffDays < 0) return 'Vencida'
          if (diffDays === 0) return 'Hoy'
          if (diffDays === 1) return 'Mañana'
          if (diffDays <= 7) return 'Esta semana'
          if (diffDays <= 30) return 'Este mes'
          return 'Programada'
        } catch {
          return 'Sin cita'
        }
      }
      
      // ✅ Crear línea de headers
      const lineaHeaders = headers.map(h => escaparValor(h)).join(SEPARADOR)
      
      // ✅ Crear líneas de datos
      const lineasDatos = pacientes.map(paciente => {
        const edad = calcularEdad(paciente.fecha_nacimiento || paciente.cumpleanos)
        const esMenor = edad !== '' && edad < 18
        
        const valores = [
          paciente.id || '',
          paciente.nombres || paciente.nombre || '',
          paciente.apellidos || paciente.apellido || '',
          paciente.nombre_completo || `${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim(),
          paciente.telefono || '',
          paciente.dpi || 'No registrado',
          edad,
          esMenor ? 'Sí' : 'No',
          formatearFecha(paciente.fecha_nacimiento || paciente.cumpleanos),
          formatearFecha(paciente.fecha_primer_cita),
          formatearFecha(paciente.proxima_cita),
          obtenerEstadoCita(paciente.proxima_cita),
          formatearFechaHora(paciente.fecha_creacion),
          formatearFechaHora(paciente.fecha_actualizacion)
        ]
        
        return valores.map(v => escaparValor(v)).join(SEPARADOR)
      })
      
      // ✅ Combinar todo con saltos de línea CRLF (Windows)
      const csvCompleto = [lineaHeaders, ...lineasDatos].join('\r\n')
      
      console.log('📊 CSV de pacientes generado:', {
        separador: SEPARADOR,
        headers: headers.length,
        filas: lineasDatos.length
      })
      
      return csvCompleto
    }

    // Utilidades usando el servicio
    const formatearFecha = (fecha) => {
      return pacientesService.formatearFecha(fecha)
    }

    const getEstadoCitaClass = (paciente) => {
      const estado = pacientesService.getEstadoCita(paciente.proxima_cita)
      
      const clases = {
        gray: 'bg-gray-100 text-gray-800',
        blue: 'bg-blue-100 text-blue-800',
        green: 'bg-green-100 text-green-800',
        red: 'bg-red-100 text-red-800',
        purple: 'bg-purple-100 text-purple-800'
      }
      
      return clases[estado.clase] || clases.gray
    }

    const getEstadoCitaTexto = (paciente) => {
      const estado = pacientesService.getEstadoCita(paciente.proxima_cita)
      return estado.texto
    }

    const getPaginasVisibles = () => {
      const totalPaginas = paginacion.total_pages
      const paginaActual = paginacion.current_page
      const paginas = []

      if (totalPaginas <= 7) {
        for (let i = 1; i <= totalPaginas; i++) {
          paginas.push(i)
        }
      } else {
        if (paginaActual <= 4) {
          for (let i = 1; i <= 5; i++) {
            paginas.push(i)
          }
          paginas.push('...')
          paginas.push(totalPaginas)
        } else if (paginaActual >= totalPaginas - 3) {
          paginas.push(1)
          paginas.push('...')
          for (let i = totalPaginas - 4; i <= totalPaginas; i++) {
            paginas.push(i)
          }
        } else {
          paginas.push(1)
          paginas.push('...')
          for (let i = paginaActual - 1; i <= paginaActual + 1; i++) {
            paginas.push(i)
          }
          paginas.push('...')
          paginas.push(totalPaginas)
        }
      }

      return paginas
    }

    // Limpiar mensajes después de un tiempo
    const limpiarMensajes = () => {
      setTimeout(() => {
        error.value = ''
        mensaje.value = ''
      }, 5000)
    }

    // Watchers para limpiar mensajes
    const mostrarMensaje = (msg) => {
      mensaje.value = msg
      limpiarMensajes()
    }

    const mostrarError = (err) => {
      error.value = err
      limpiarMensajes()
    }

    // Ciclo de vida
    onMounted(async () => {
      await Promise.all([
        cargarPacientes(),
        cargarEstadisticas()
      ])
    })

    return {
      // Estado
      pacientes,
      loading,
      guardando,
      modalVisible,
      modalEditando,
      modalDetalle,
      pacienteDetalle,
      stats,
      filtros,
      paginacion,
      formulario,
      error,
      mensaje,
      puedeEditar,
      puedeEliminar,
      dpiExistente,
      verificandoDPI,
      // Métodos

      verificarDPIExistente,
      abrirModalNuevo,
      abrirModalEditar,
      cerrarModal,
      cerrarModalDetalle,
      guardarPaciente,
      eliminarPaciente,
      buscarConDebounce,
      aplicarFiltros,
      cambiarPagina,
      cambiarLimitePagina,
      verDetalle,
      verHistorial,
      exportarExcel,
      formatearFecha,
      getEstadoCitaClass,
      getEstadoCitaTexto,
      getPaginasVisibles,
      mostrarMensaje,
      mostrarError
    }
  }
}
</script>

<style scoped>
/* Estilos específicos para mantener consistencia visual */
.spinner {
  @apply inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin;
}

.btn-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors;
}

.transition-colors {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.hover\:bg-gray-50:hover {
  background-color: #f9fafb;
}

.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
}
</style>