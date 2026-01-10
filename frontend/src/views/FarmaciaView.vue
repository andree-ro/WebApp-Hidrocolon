<template>
  <div class="farmacia-module">
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

      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">💊 Módulo Farmacia</h1>
        <p class="text-gray-600 mt-1">Gestión de medicamentos e inventario</p>
      </div>
      
      <!-- Botón Agregar Nuevo Medicamento -->
      <button
        @click="abrirModalAgregar"
        class="btn-primary flex items-center space-x-2"
      >
        <span class="text-lg">➕</span>
        <span>Agregar Medicamento</span>
      </button>
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
            <span class="text-lg sm:text-xl">💊</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Medicamentos</p>
            <p class="text-lg sm:text-xl font-semibold text-blue-600">{{ stats.total_medicamentos || '--' }}</p>
          </div>
        </div>
      </div>

      <div class="card p-3 sm:p-4">
        <div class="flex items-center">
          <div class="p-2 bg-red-100 rounded-lg">
            <span class="text-lg sm:text-xl">⚠️</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Stock Bajo</p>
            <p class="text-lg sm:text-xl font-semibold text-red-600">{{ stats.stock_bajo || '--' }}</p>
          </div>
        </div>
      </div>

      <div class="card p-3 sm:p-4">
        <div class="flex items-center">
          <div class="p-2 bg-orange-100 rounded-lg">
            <span class="text-lg sm:text-xl">⏰</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Próximo a Vencer</p>
            <p class="text-lg sm:text-xl font-semibold text-orange-600">{{ stats.proximo_vencer || '--' }}</p>
          </div>
        </div>
      </div>

      <div class="card p-3 sm:p-4">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 rounded-lg">
            <span class="text-lg sm:text-xl">📦</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Stock Total</p>
            <p class="text-lg sm:text-xl font-semibold text-green-600">{{ stats.total_existencias || '--' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros y Búsqueda -->
    <div class="card p-4 sm:p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Filtros de Búsqueda</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Búsqueda por nombre -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Buscar Medicamento</label>
          <input
            v-model="filtros.search"
            type="text"
            placeholder="Nombre, presentación..."
            class="input-base"
            @input="buscarConDelay"
          />
        </div>

        <!-- Filtro por presentación -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Presentación</label>
          <select v-model="filtros.presentacion_id" class="input-base" @change="cargarMedicamentos">
            <option value="">Todas las presentaciones</option>
            <option v-for="presentacion in presentaciones" :key="presentacion.id" :value="presentacion.id">
              {{ presentacion.nombre }}
            </option>
          </select>
        </div>

        <!-- Filtro por laboratorio -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
          <select v-model="filtros.laboratorio_id" class="input-base" @change="cargarMedicamentos">
            <option value="">Todos los laboratorios</option>
            <option v-for="laboratorio in laboratorios" :key="laboratorio.id" :value="laboratorio.id">
              {{ laboratorio.nombre }}
            </option>
          </select>
        </div>

        <!-- Filtros rápidos -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filtros Rápidos</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="toggleFiltro('stock_bajo')"
              :class="[
                'px-3 py-1 text-xs rounded-full transition-colors',
                filtros.stock_bajo 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white text-gray-700 border hover:bg-gray-100'
              ]"
            >
              Stock Bajo
            </button>
            <button
              @click="toggleFiltro('proximo_vencer')"
              :class="[
                'px-3 py-1 text-xs rounded-full transition-colors',
                filtros.proximo_vencer 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-white text-gray-700 border hover:bg-gray-100'
              ]"
            >
              Próximo Vencer
            </button>
          </div>
        </div>
      </div>

      <!-- Acciones rápidas -->
      <div class="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
        <div class="flex flex-wrap gap-2">
          <button @click="limpiarFiltros" class="btn-secondary text-sm">
            🧹 Limpiar Filtros
          </button>
          <button @click="exportarExcel" class="btn-secondary text-sm">
            📊 Exportar Excel
          </button>
        </div>
        
        <div class="text-sm text-gray-600">
          {{ medicamentos.length }} medicamento(s) encontrado(s)
        </div>
      </div>
    </div>

    <!-- Tabla de medicamentos -->
    <div class="card overflow-hidden">
      <!-- Loading state -->
      <div v-if="cargando" class="flex justify-center items-center p-8">
        <div class="flex items-center space-x-2">
          <div class="spinner"></div>
          <span class="text-gray-600">Cargando medicamentos...</span>
        </div>
      </div>

      <!-- Tabla -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medicamento
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vencimiento
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precios
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Extras
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="medicamento in medicamentos" :key="medicamento.id" class="hover:bg-gray-50">
              <!-- Información del medicamento -->
              <td class="px-6 py-4">
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ medicamento.nombre }}</p>
                  <p class="text-sm text-gray-500">{{ medicamento.presentacion_nombre }} - {{ medicamento.laboratorio_nombre }}</p>
                </div>
              </td>

              <!-- Stock -->
              <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-medium">{{ medicamento.existencias }}</span>
                  <span 
                    :class="farmaciaService.getStockStatus(medicamento.existencias).color"
                    class="px-2 py-1 text-xs rounded-full"
                  >
                    {{ farmaciaService.getStockStatus(medicamento.existencias).badge }}
                  </span>
                </div>
              </td>

              <!-- Vencimiento -->
              <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                  <span class="text-sm">{{ formatearFecha(medicamento.fecha_vencimiento) }}</span>
                  <span 
                    :class="farmaciaService.getVencimientoStatus(medicamento.fecha_vencimiento).color"
                    class="px-2 py-1 text-xs rounded-full"
                  >
                    {{ farmaciaService.getVencimientoStatus(medicamento.fecha_vencimiento).badge }}
                  </span>
                </div>
              </td>

              <!-- Precios -->
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">
                  {{ formatearPrecio(medicamento.precio) }}
                </div>
              </td>

              <!-- ✅ NUEVA COLUMNA: Extras -->
              <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                  <!-- Indicador si requiere extras -->
                  <div v-if="medicamento.requiere_extras" class="flex items-center space-x-1">
                    <span class="text-lg">🧰</span>
                    <span class="text-xs text-gray-600">{{ contarExtras(medicamento.id) }} extra(s)</span>
                  </div>
                  <div v-else class="text-xs text-gray-400">Sin extras</div>
                  
                  <!-- Botón gestionar extras -->
                  <button
                    v-if="medicamento.requiere_extras"
                    @click="abrirModalExtras(medicamento)"
                    class="btn-icon btn-orange"
                    title="Gestionar extras"
                  >
                    🔧
                  </button>
                </div>
              </td>

              <!-- Acciones -->
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <!-- Ver detalle -->
                  <button
                    @click="verDetalle(medicamento)"
                    class="btn-icon btn-blue"
                    title="Ver detalle"
                  >
                    👁️
                  </button>

                  <!-- Editar medicamento -->
                  <button
                    v-if="puedeEditar('farmacia')"
                    @click="abrirModalEditar(medicamento)"
                    class="btn-icon btn-green"
                    title="Editar medicamento"
                  >
                    ✏️
                  </button>

                  <!-- Actualizar stock -->
                  <button
                    @click="abrirModalStock(medicamento)"
                    class="btn-icon btn-purple"
                    title="Actualizar stock"
                  >
                    📦
                  </button>

                  <!-- Eliminar -->
                  <button
                    v-if="puedeEliminar('farmacia')"
                    @click="eliminarMedicamento(medicamento)"
                    class="btn-icon btn-red"
                    title="Eliminar medicamento"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Estado vacío -->
        <div v-if="!medicamentos.length && !cargando" class="text-center py-8">
          <span class="text-4xl mb-4 block">💊</span>
          <p class="text-gray-500 text-lg">No se encontraron medicamentos</p>
          <p class="text-gray-400 text-sm mt-2">Intenta ajustar los filtros o agrega un nuevo medicamento</p>
        </div>
      </div>

      <!-- Paginación -->
      <div v-if="pagination.total_pages > 1" class="px-6 py-3 border-t bg-gray-50">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Página {{ pagination.current_page }} de {{ pagination.total_pages }}
            ({{ pagination.total }} medicamentos)
          </div>
          
          <div class="flex space-x-1">
            <button
              v-for="page in Math.min(pagination.total_pages, 5)"
              :key="page"
              @click="cambiarPagina(page)"
              :class="[
                'px-3 py-1 text-sm rounded transition-colors',
                page === pagination.current_page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              ]"
              :disabled="cargando"
            >
              {{ page }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Agregar/Editar Medicamento -->
    <div v-if="modalFormulario.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ modalFormulario.editando ? '✏️ Editar Medicamento' : '➕ Agregar Nuevo Medicamento' }}
            </h3>
            <button @click="cerrarModalFormulario" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="guardarMedicamento" class="space-y-6">
            <!-- Información básica -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Medicamento *</label>
                <input
                  v-model="modalFormulario.datos.nombre"
                  type="text"
                  required
                  class="input-base"
                  placeholder="Ej: Paracetamol 500mg"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Presentación *</label>
                <div class="flex gap-2">
                  <select v-model="modalFormulario.datos.presentacion_id" required class="input-base flex-1">
                    <option value="">Seleccionar presentación</option>
                    <option v-for="presentacion in presentaciones" :key="presentacion.id" :value="presentacion.id">
                      {{ presentacion.nombre }}
                    </option>
                  </select>
                  <button 
                    type="button"
                    @click="abrirModalAgregarPresentacion" 
                    class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    title="Agregar presentación"
                  >
                    ➕
                  </button>
                  <button 
                    type="button"
                    @click="eliminarPresentacion" 
                    :disabled="!modalFormulario.datos.presentacion_id"
                    class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    title="Eliminar presentación seleccionada"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Laboratorio *</label>
                <div class="flex gap-2">
                  <select v-model="modalFormulario.datos.laboratorio_id" required class="input-base flex-1">
                    <option value="">Seleccionar laboratorio</option>
                    <option v-for="laboratorio in laboratorios" :key="laboratorio.id" :value="laboratorio.id">
                      {{ laboratorio.nombre }}
                    </option>
                  </select>
                  <button 
                    type="button"
                    @click="abrirModalAgregarLaboratorio" 
                    class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    title="Agregar casa médica"
                  >
                    ➕
                  </button>
                  <button 
                    type="button"
                    @click="eliminarLaboratorio" 
                    :disabled="!modalFormulario.datos.laboratorio_id"
                    class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    title="Eliminar casa médica seleccionada"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento *</label>
                <input
                  v-model="modalFormulario.datos.fecha_vencimiento"
                  type="date"
                  required
                  class="input-base"
                />
              </div>
            </div>

            <!-- Stock y precios -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Existencias *</label>
                <input
                  v-model.number="modalFormulario.datos.existencias"
                  type="number"
                  min="0"
                  required
                  class="input-base"
                  placeholder="0"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                <input
                  v-model.number="modalFormulario.datos.precio"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  class="input-base"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Costo Compra</label>
                <input
                  v-model.number="modalFormulario.datos.costo_compra"
                  type="number"
                  step="0.01"
                  min="0"
                  class="input-base"
                  placeholder="0.00"
                />
              </div>
            </div>

            <!-- Información médica -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Indicaciones</label>
                <textarea
                  v-model="modalFormulario.datos.indicaciones"
                  rows="3"
                  class="input-base"
                  placeholder="Indicaciones de uso del medicamento..."
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Contraindicaciones</label>
                <textarea
                  v-model="modalFormulario.datos.contraindicaciones"
                  rows="3"
                  class="input-base"
                  placeholder="Contraindicaciones del medicamento..."
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Dosis</label>
                <textarea
                  v-model="modalFormulario.datos.dosis"
                  rows="2"
                  class="input-base"
                  placeholder="Dosis recomendada..."
                ></textarea>
              </div>
            </div>

            <!-- ✅ SECCIÓN MEJORADA: Comisión y Extras -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Porcentaje Comisión (%)</label>
                <input
                  v-model.number="modalFormulario.datos.porcentaje_comision"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  class="input-base"
                  placeholder="0.00"
                />
              </div>

              <div class="space-y-3">
                <!-- Checkbox requiere extras -->
                <div class="flex items-center pt-6">
                  <input
                    v-model="modalFormulario.datos.requiere_extras"
                    type="checkbox"
                    id="requiere_extras"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label for="requiere_extras" class="ml-2 text-sm text-gray-700">
                    Requiere extras (alcohol, algodón, etc.)
                  </label>
                </div>

                <!-- ✅ NUEVO: Botón gestionar extras -->
                <div v-if="modalFormulario.datos.requiere_extras && modalFormulario.editando">
                  <button
                    type="button"
                    @click="abrirModalExtrasDesdeFormulario"
                    class="btn-secondary text-sm flex items-center space-x-2"
                  >
                    <span>🧰</span>
                    <span>Gestionar Extras</span>
                  </button>
                  <p class="text-xs text-gray-500 mt-1">
                    Configura qué extras necesita este medicamento
                  </p>
                </div>

                <div v-else-if="modalFormulario.datos.requiere_extras && !modalFormulario.editando">
                  <p class="text-xs text-gray-500">
                    💡 Podrás gestionar los extras después de crear el medicamento
                  </p>
                </div>
              </div>
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
                     ? 'Actualizar Medicamento' 
                     : 'Crear Medicamento' 
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>


    <!-- Modal Agregar Presentación -->
    <div v-if="modalPresentacion.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-semibold text-gray-900">➕ Agregar Nueva Presentación</h3>
          <button @click="cerrarModalPresentacion" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="guardarPresentacion" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la Presentación *</label>
            <input
              v-model="modalPresentacion.datos.nombre"
              type="text"
              required
              class="input-base"
              placeholder="Ej: Frasco 1000 ml"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              v-model="modalPresentacion.datos.descripcion"
              rows="2"
              class="input-base"
              placeholder="Descripción opcional..."
            ></textarea>
          </div>

          <div class="flex gap-2 justify-end">
            <button type="button" @click="cerrarModalPresentacion" class="btn-secondary">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Agregar Casa Médica -->
    <div v-if="modalLaboratorio.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-semibold text-gray-900">➕ Agregar Nueva Casa Médica</h3>
          <button @click="cerrarModalLaboratorio" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="guardarLaboratorio" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la Casa Médica *</label>
            <input
              v-model="modalLaboratorio.datos.nombre"
              type="text"
              required
              class="input-base"
              placeholder="Ej: Laboratorio Bayer"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              v-model="modalLaboratorio.datos.descripcion"
              rows="2"
              class="input-base"
              placeholder="Descripción opcional..."
            ></textarea>
          </div>

          <div class="flex gap-2 justify-end">
            <button type="button" @click="cerrarModalLaboratorio" class="btn-secondary">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>



    <!-- Modal Actualizar Stock -->
    <div v-if="modalStock.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-md w-full">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            📦 Actualizar Stock
          </h3>
          
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">Medicamento:</p>
            <p class="font-medium">{{ modalStock.medicamento?.nombre }}</p>
            <p class="text-sm text-gray-500">Stock actual: {{ modalStock.medicamento?.existencias }}</p>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Nueva Cantidad</label>
            <input
              v-model="modalStock.cantidad"
              type="number"
              min="0"
              max="9999"
              class="input-base"
              placeholder="Ingrese nueva cantidad"
            />
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Motivo (Opcional)</label>
            <input
              v-model="modalStock.motivo"
              type="text"
              class="input-base"
              placeholder="Ej: Compra nueva, ajuste inventario..."
            />
          </div>

          <div class="flex justify-end space-x-3">
            <button
              @click="cerrarModalStock"
              class="btn-secondary"
              :disabled="modalStock.actualizando"
            >
              Cancelar
            </button>
            <button
              @click="actualizarStock"
              class="btn-primary"
              :disabled="modalStock.actualizando || !modalStock.cantidad"
            >
              <span v-if="modalStock.actualizando" class="spinner mr-2"></span>
              {{ modalStock.actualizando ? 'Actualizando...' : 'Actualizar Stock' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detalle Medicamento -->
    <div v-if="modalDetalle.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <h3 class="text-lg font-semibold text-gray-900">
              👁️ Detalle del Medicamento
            </h3>
            <button @click="cerrarModalDetalle" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="modalDetalle.medicamento" class="space-y-4">
            <!-- Información básica -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 class="font-medium text-gray-900 mb-2">Información General</h4>
                <div class="space-y-2 text-sm">
                  <div><span class="text-gray-500">Nombre:</span> {{ modalDetalle.medicamento.nombre }}</div>
                  <div><span class="text-gray-500">Presentación:</span> {{ modalDetalle.medicamento.presentacion_nombre }}</div>
                  <div><span class="text-gray-500">Laboratorio:</span> {{ modalDetalle.medicamento.laboratorio_nombre }}</div>
                  <div><span class="text-gray-500">ID:</span> {{ modalDetalle.medicamento.id }}</div>
                </div>
              </div>

              <div>
                <h4 class="font-medium text-gray-900 mb-2">Stock y Precios</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center">
                    <span class="text-gray-500 mr-2">Stock:</span>
                    <span class="font-medium mr-2">{{ modalDetalle.medicamento.existencias }}</span>
                    <span :class="farmaciaService.getStockStatus(modalDetalle.medicamento.existencias).color" 
                          class="px-2 py-1 text-xs rounded-full">
                      {{ farmaciaService.getStockStatus(modalDetalle.medicamento.existencias).badge }}
                    </span>
                  </div>
                  <div><span class="text-gray-500">💰 Precio:</span> {{ farmaciaService.formatPrice(modalDetalle.medicamento.precio) }}</div>
                  <div><span class="text-gray-500">💰 Costo Compra:</span> {{ farmaciaService.formatPrice(modalDetalle.medicamento.costo_compra) }}</div>
                </div>
              </div>
            </div>

            <!-- Vencimiento -->
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Vencimiento</h4>
              <div class="flex items-center space-x-2">
                <span class="text-sm">{{ farmaciaService.formatDate(modalDetalle.medicamento.fecha_vencimiento) }}</span>
                <span :class="farmaciaService.getVencimientoStatus(modalDetalle.medicamento.fecha_vencimiento).color"
                      class="px-2 py-1 text-xs rounded-full">
                  {{ farmaciaService.getVencimientoStatus(modalDetalle.medicamento.fecha_vencimiento).badge }}
                </span>
              </div>
            </div>

            <!-- ✅ NUEVA SECCIÓN: Extras -->
            <div v-if="modalDetalle.medicamento.requiere_extras">
              <h4 class="font-medium text-gray-900 mb-2">Extras Requeridos</h4>
              <div v-if="modalDetalle.extras && modalDetalle.extras.length" class="space-y-2">
                <div v-for="extra in modalDetalle.extras" :key="extra.id" 
                     class="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div class="flex items-center">
                    <span class="text-xl mr-2">🧰</span>
                    <div>
                      <p class="text-sm font-medium">{{ extra.nombre }}</p>
                      <p class="text-xs text-gray-500">Cantidad: {{ extra.cantidad_requerida }}</p>
                    </div>
                  </div>
                  <button 
                    @click="abrirModalExtras(modalDetalle.medicamento)"
                    class="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    🔧 Gestionar
                  </button>
                </div>
              </div>
              <div v-else class="text-sm text-gray-500">
                No hay extras configurados. 
                <button 
                  @click="abrirModalExtras(modalDetalle.medicamento)"
                  class="text-blue-600 hover:underline"
                >
                  Agregar extras
                </button>
              </div>
            </div>

            <!-- Información médica -->
            <div v-if="modalDetalle.medicamento.indicaciones || modalDetalle.medicamento.contraindicaciones || modalDetalle.medicamento.dosis">
              <h4 class="font-medium text-gray-900 mb-2">Información Médica</h4>
              <div class="space-y-3">
                <div v-if="modalDetalle.medicamento.indicaciones">
                  <span class="text-sm font-medium text-gray-700">Indicaciones:</span>
                  <p class="text-sm text-gray-600 mt-1">{{ modalDetalle.medicamento.indicaciones }}</p>
                </div>
                <div v-if="modalDetalle.medicamento.contraindicaciones">
                  <span class="text-sm font-medium text-gray-700">Contraindicaciones:</span>
                  <p class="text-sm text-gray-600 mt-1">{{ modalDetalle.medicamento.contraindicaciones }}</p>
                </div>
                <div v-if="modalDetalle.medicamento.dosis">
                  <span class="text-sm font-medium text-gray-700">Dosis:</span>
                  <p class="text-sm text-gray-600 mt-1">{{ modalDetalle.medicamento.dosis }}</p>
                </div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button @click="cerrarModalDetalle" class="btn-secondary">
                Cerrar
              </button>
              <button 
                v-if="modalDetalle.medicamento.requiere_extras"
                @click="abrirModalExtrasDesdeDetalle" 
                class="btn-secondary"
              >
                🧰 Gestionar Extras
              </button>
              <button @click="abrirModalEditarDesdeDetalle" class="btn-primary">
                ✏️ Editar Medicamento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ NUEVO: Modal Extras -->
    <ExtrasModal 
      :visible="modalExtras.visible"
      :medicamento="modalExtras.medicamento"
      @close="cerrarModalExtras"
      @saved="recargarDatosExtras"
    />
  </div>
</template>

<script>
import farmaciaService from '@/services/farmaciaService'
import extrasService from '@/services/extrasService'
import ExtrasModal from '@/components/ExtrasModal.vue'
import { usePermisos } from '@/composables/usePermisos'

export default {
  name: 'FarmaciaView',
  
  components: {
    ExtrasModal
  },
  setup() {
    const { puedeEditar, puedeEliminar } = usePermisos()
    return { puedeEditar, puedeEliminar }
  },
  
  data() {
    return {
      // Estados principales
      farmaciaService: farmaciaService,
      extrasService: extrasService,
      cargando: false,
      error: null,
      
      // Datos
      medicamentos: [],
      presentaciones: [],
      laboratorios: [],
      stats: {},
      pagination: {},
      
      // ✅ NUEVO: Cache de extras por medicamento
      extrasCache: {}, // { medicamentoId: [extras] }
      
      // Filtros
      filtros: {
        search: '',
        presentacion_id: '',
        laboratorio_id: '',
        stock_bajo: false,
        proximo_vencer: false,
        page: 1,
        limit: 20
      },
      
      // Búsqueda con delay
      searchTimeout: null,
      
      // Modal Stock
      modalStock: {
        visible: false,
        medicamento: null,
        cantidad: '',
        motivo: '',
        actualizando: false
      },
      
      // Modal Detalle
      modalDetalle: {
        visible: false,
        medicamento: null,
        extras: [] // ✅ NUEVO: Extras del medicamento
      },
      
      // ✅ NUEVO: Modal Extras
      modalExtras: {
        visible: false,
        medicamento: null
      },
      
      // Modal Formulario (Agregar/Editar)
      modalFormulario: {
        visible: false,
        editando: false,
        guardando: false,
        datos: {
          nombre: '',
          presentacion_id: '',
          laboratorio_id: '',
          fecha_vencimiento: '',
          existencias: 0,
          precio: 0,
          costo_compra: 0,
          indicaciones: '',
          contraindicaciones: '',
          dosis: '',
          porcentaje_comision: 0,
          requiere_extras: false
        }
      },
      
      // ✅ NUEVOS MODALES
      modalPresentacion: {
        visible: false,
        datos: {
          nombre: '',
          descripcion: ''
        }
      },
      
      modalLaboratorio: {
        visible: false,
        datos: {
          nombre: '',
          descripcion: ''
        }
      }
    }
  },

  async mounted() {
    await this.inicializarModulo()
  },

  beforeUnmount() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }
  },

  methods: {
    async inicializarModulo() {
      try {
        console.log('🚀 Inicializando módulo farmacia...')
        
        // Cargar datos en paralelo
        await Promise.all([
          this.cargarMedicamentos(),
          this.cargarPresentaciones(),
          this.cargarLaboratorios(),
          this.cargarEstadisticas()
        ])
        
        console.log('✅ Módulo farmacia inicializado exitosamente')
        
      } catch (error) {
        console.error('❌ Error inicializando farmacia:', error)
        this.error = 'Error cargando el módulo farmacia'
      }
    },

    async cargarMedicamentos() {
      try {
        this.cargando = true
        this.error = null
        
        console.log('📊 Cargando medicamentos con filtros:', this.filtros)
        
        // Crear parámetros limpios
        const params = {
          page: this.filtros.page,
          limit: this.filtros.limit
        }
        
        // Agregar filtros solo si tienen valor
        if (this.filtros.search && this.filtros.search.trim()) {
          params.search = this.filtros.search.trim()
        }
        
        if (this.filtros.presentacion_id) {
          params.presentacion_id = this.filtros.presentacion_id
        }
        
        if (this.filtros.laboratorio_id) {
          params.laboratorio_id = this.filtros.laboratorio_id
        }
        
        if (this.filtros.stock_bajo) {
          params.stock_bajo = 'true'
        }
        
        if (this.filtros.proximo_vencer) {
          params.proximo_vencer = 'true'
        }
        
        console.log('🧹 Parámetros enviados al API:', params)
        
        const response = await farmaciaService.getMedicamentos(params)
        
        this.medicamentos = response.data?.medicamentos || []
        this.pagination = response.data?.pagination || {}
        
        console.log('✅ Medicamentos cargados:', this.medicamentos.length)
        console.log('📄 Paginación:', this.pagination)
        
        // ✅ NUEVO: Cargar extras para medicamentos que los requieren
        await this.cargarExtrasParaMedicamentos()
        
      } catch (error) {
        console.error('❌ Error cargando medicamentos:', error)
        this.error = error.message
        this.medicamentos = []
      } finally {
        this.cargando = false
      }
    },

    // ✅ NUEVO: Cargar extras para medicamentos
    async cargarExtrasParaMedicamentos() {
      try {
        const medicamentosConExtras = this.medicamentos.filter(m => m.requiere_extras)
        
        if (medicamentosConExtras.length === 0) return
        
        console.log('🧰 Cargando extras para', medicamentosConExtras.length, 'medicamentos...')
        
        // Cargar extras en paralelo
        const promesasExtras = medicamentosConExtras.map(async (medicamento) => {
          try {
            const extras = await extrasService.getExtrasDeMedicamento(medicamento.id)
            this.extrasCache[medicamento.id] = extras || []
            return { medicamentoId: medicamento.id, extras: extras || [] }
          } catch (error) {
            console.warn(`Error cargando extras para medicamento ${medicamento.id}:`, error)
            this.extrasCache[medicamento.id] = []
            return { medicamentoId: medicamento.id, extras: [] }
          }
        })
        
        const resultados = await Promise.all(promesasExtras)
        console.log('✅ Extras cargados para medicamentos:', resultados.length)
        
      } catch (error) {
        console.error('❌ Error cargando extras:', error)
      }
    },

    // ✅ NUEVO: Contar extras de un medicamento
    contarExtras(medicamentoId) {
      const extras = this.extrasCache[medicamentoId] || []
      return extras.length
    },

    async cargarPresentaciones() {
      try {
        this.presentaciones = await farmaciaService.getPresentaciones()
        console.log('✅ Presentaciones cargadas:', this.presentaciones.length)
      } catch (error) {
        console.error('❌ Error cargando presentaciones:', error)
      }
    },

    async cargarLaboratorios() {
      try {
        this.laboratorios = await farmaciaService.getLaboratorios()
        console.log('✅ Laboratorios cargados:', this.laboratorios.length)
      } catch (error) {
        console.error('❌ Error cargando laboratorios:', error)
      }
    },

    async cargarEstadisticas() {
      try {
        this.stats = await farmaciaService.getEstadisticas()
        console.log('✅ Estadísticas cargadas:', this.stats)
      } catch (error) {
        console.error('❌ Error cargando estadísticas:', error)
      }
    },

    // Búsqueda con delay para evitar muchas requests
    buscarConDelay() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      this.searchTimeout = setTimeout(() => {
        this.filtros.page = 1
        this.cargarMedicamentos()
      }, 500)
    },

    // Toggle filtros rápidos
    toggleFiltro(filtro) {
      this.filtros[filtro] = !this.filtros[filtro]
      this.filtros.page = 1
      this.cargarMedicamentos()
    },

    // Limpiar todos los filtros
    limpiarFiltros() {
      console.log('🧹 Limpiando todos los filtros...')
      
      this.filtros = {
        search: '',
        presentacion_id: '',
        laboratorio_id: '',
        stock_bajo: false,
        proximo_vencer: false,
        page: 1,
        limit: 20
      }
      
      // Recargar medicamentos inmediatamente
      this.cargarMedicamentos()
    },

    // Cambiar página
    cambiarPagina(page) {
      if (page >= 1 && page <= this.pagination.total_pages && !this.cargando) {
        this.filtros.page = page
        this.cargarMedicamentos()
      }
    },

    // =====================================
    // ✅ NUEVOS MÉTODOS: MODAL EXTRAS
    // =====================================

    abrirModalExtras(medicamento) {
      console.log('🧰 Abriendo modal extras para:', medicamento.nombre)
      
      this.modalExtras = {
        visible: true,
        medicamento: medicamento
      }
      
      // Cerrar otros modales
      this.modalDetalle.visible = false
      this.modalFormulario.visible = false
    },

    abrirModalExtrasDesdeDetalle() {
      this.abrirModalExtras(this.modalDetalle.medicamento)
    },

    abrirModalExtrasDesdeFormulario() {
      // Solo si estamos editando un medicamento
      if (this.modalFormulario.editando && this.modalFormulario.medicamentoId) {
        const medicamento = this.medicamentos.find(m => m.id === this.modalFormulario.medicamentoId)
        if (medicamento) {
          this.abrirModalExtras(medicamento)
        }
      }
    },

    cerrarModalExtras() {
      this.modalExtras = {
        visible: false,
        medicamento: null
      }
    },

    async recargarDatosExtras() {
      console.log('🔄 Recargando datos después de cambios en extras...')
      
      try {
        // Recargar datos de medicamentos y extras
        await Promise.all([
          this.cargarMedicamentos(),
          this.cargarEstadisticas()
        ])
        
        console.log('✅ Datos recargados exitosamente')
        
      } catch (error) {
        console.error('❌ Error recargando datos:', error)
      }
    },

    // =====================================
    // MODAL FORMULARIO (AGREGAR/EDITAR)
    // =====================================

    abrirModalAgregar() {
      this.modalFormulario = {
        visible: true,
        editando: false,
        guardando: false,
        datos: {
          nombre: '',
          presentacion_id: '',
          laboratorio_id: '',
          fecha_vencimiento: '',
          existencias: 0,
          precio: 0,
          costo_compra: 0,
          indicaciones: '',
          contraindicaciones: '',
          dosis: '',
          porcentaje_comision: 0,
          requiere_extras: false
        }
      }
    },

    abrirModalEditar(medicamento) {
      this.modalFormulario = {
        visible: true,
        editando: true,
        guardando: false,
        medicamentoId: medicamento.id,
        datos: {
          nombre: medicamento.nombre || '',
          presentacion_id: medicamento.presentacion_id || '',
          laboratorio_id: medicamento.laboratorio_id || '',
          fecha_vencimiento: medicamento.fecha_vencimiento || '',
          existencias: medicamento.existencias || 0,
          precio: medicamento.precio || 0,
          costo_compra: medicamento.costo_compra || 0,
          indicaciones: medicamento.indicaciones || '',
          contraindicaciones: medicamento.contraindicaciones || '',
          dosis: medicamento.dosis || '',
          porcentaje_comision: medicamento.porcentaje_comision || 0,
          requiere_extras: medicamento.requiere_extras || false
        }
      }
      
      // Cerrar otros modales
      this.modalDetalle.visible = false
      this.modalStock.visible = false
      this.modalExtras.visible = false
    },

    abrirModalEditarDesdeDetalle() {
      this.abrirModalEditar(this.modalDetalle.medicamento)
    },

    cerrarModalFormulario() {
      this.modalFormulario = {
        visible: false,
        editando: false,
        guardando: false,
        datos: {
          nombre: '',
          presentacion_id: '',
          laboratorio_id: '',
          fecha_vencimiento: '',
          existencias: 0,
          precio: 0,
          costo_compra: 0,
          indicaciones: '',
          contraindicaciones: '',
          dosis: '',
          porcentaje_comision: 0,
          requiere_extras: false
        }
      }
    },

    async guardarMedicamento() {
      try {
        this.modalFormulario.guardando = true
        
        const datos = { ...this.modalFormulario.datos }
        
        // Validaciones básicas
        if (!datos.nombre?.trim()) {
          alert('❌ El nombre del medicamento es obligatorio')
          return
        }
        
        if (!datos.presentacion_id) {
          alert('❌ Debe seleccionar una presentación')
          return
        }
        
        if (!datos.laboratorio_id) {
          alert('❌ Debe seleccionar un laboratorio')
          return
        }
        
        if (!datos.fecha_vencimiento) {
          alert('❌ La fecha de vencimiento es obligatoria')
          return
        }
        
        console.log('💾 Guardando medicamento:', datos)
        
        if (this.modalFormulario.editando) {
          // Actualizar medicamento existente
          await farmaciaService.actualizarMedicamento(this.modalFormulario.medicamentoId, datos)
          alert('✅ Medicamento actualizado exitosamente')
        } else {
          // Crear nuevo medicamento
          const response = await farmaciaService.crearMedicamento(datos)
          alert('✅ Medicamento creado exitosamente')
          
          // Si requiere extras y es nuevo, preguntar si quiere configurarlos
          if (datos.requiere_extras && response.data?.id) {
            const configurarExtras = confirm('¿Deseas configurar los extras requeridos para este medicamento ahora?')
            if (configurarExtras) {
              // Cerrar modal formulario y abrir modal extras
              this.cerrarModalFormulario()
              
              // Recargar medicamentos para obtener el nuevo
              await this.cargarMedicamentos()
              
              // Buscar el medicamento recién creado
              const nuevoMedicamento = this.medicamentos.find(m => m.id === response.data.id)
              if (nuevoMedicamento) {
                this.abrirModalExtras(nuevoMedicamento)
              }
              return
            }
          }
        }
        
        // Recargar datos
        await Promise.all([
          this.cargarMedicamentos(),
          this.cargarEstadisticas()
        ])
        
        this.cerrarModalFormulario()
        
      } catch (error) {
        console.error('❌ Error guardando medicamento:', error)
        alert(`❌ Error: ${error.message}`)
      } finally {
        this.modalFormulario.guardando = false
      }
    },

    // =====================================
    // MODAL STOCK
    // =====================================

    abrirModalStock(medicamento) {
      this.modalStock = {
        visible: true,
        medicamento: medicamento,
        cantidad: medicamento.existencias.toString(),
        motivo: '',
        actualizando: false
      }
      
      // Cerrar modal detalle si está abierto
      this.modalDetalle.visible = false
      this.modalExtras.visible = false
    },

    cerrarModalStock() {
      this.modalStock = {
        visible: false,
        medicamento: null,
        cantidad: '',
        motivo: '',
        actualizando: false
      }
    },

    async actualizarStock() {
      try {
        this.modalStock.actualizando = true
        
        const { medicamento, cantidad, motivo } = this.modalStock
        
        // Validar cantidad
        const validacion = farmaciaService.validarCantidad(cantidad, 9999)
        if (!validacion.valido) {
          alert(validacion.error)
          return
        }
        
        console.log('📦 Actualizando stock:', {
          id: medicamento.id,
          cantidad: validacion.cantidad,
          motivo: motivo || 'Ajuste manual'
        })
        
        await farmaciaService.actualizarStock(
          medicamento.id,
          validacion.cantidad,
          motivo || 'Ajuste manual'
        )
        
        // Recargar datos
        await Promise.all([
          this.cargarMedicamentos(),
          this.cargarEstadisticas()
        ])
        
        this.cerrarModalStock()
        
        // Mostrar mensaje de éxito
        this.$nextTick(() => {
          alert(`✅ Stock actualizado: ${medicamento.nombre} ahora tiene ${validacion.cantidad} unidades`)
        })
        
      } catch (error) {
        console.error('❌ Error actualizando stock:', error)
        alert(`❌ Error: ${error.message}`)
      } finally {
        this.modalStock.actualizando = false
      }
    },

    // =====================================
    // MODAL DETALLE
    // =====================================

    async verDetalle(medicamento) {
      try {
        console.log('👁️ Viendo detalle del medicamento:', medicamento.id)
        
        // Cargar extras si el medicamento los requiere
        let extras = []
        if (medicamento.requiere_extras) {
          extras = this.extrasCache[medicamento.id] || []
          
          // Si no están en cache, cargarlos
          if (extras.length === 0) {
            try {
              extras = await extrasService.getExtrasDeMedicamento(medicamento.id)
              this.extrasCache[medicamento.id] = extras
            } catch (error) {
              console.warn('Error cargando extras para detalle:', error)
              extras = []
            }
          }
        }
        
        // Si tenemos todos los datos, usar los del listado
        if (medicamento.indicaciones !== undefined) {
          this.modalDetalle = {
            visible: true,
            medicamento: medicamento,
            extras: extras
          }
        } else {
          // Si no, cargar desde el API
          const response = await farmaciaService.getMedicamento(medicamento.id)
          this.modalDetalle = {
            visible: true,
            medicamento: response.data,
            extras: extras
          }
        }
        
        // Cerrar modal stock si está abierto
        this.modalStock.visible = false
        this.modalExtras.visible = false
        
      } catch (error) {
        console.error('❌ Error cargando detalle:', error)
        alert(`❌ Error cargando detalle: ${error.message}`)
      }
    },

    cerrarModalDetalle() {
      this.modalDetalle = {
        visible: false,
        medicamento: null,
        extras: []
      }
    },

    // =====================================
    // OTRAS FUNCIONES
    // =====================================

    // Agregar al carrito (preparado para módulo carrito)
    async agregarCarrito(medicamento) {
      try {
        // Solicitar solo la cantidad
        const cantidad = prompt(`¿Cuántas unidades de "${medicamento.nombre}" agregar al carrito?`, '1')
        
        if (!cantidad || cantidad <= 0) return
        
        console.log('🛒 Agregando al carrito:', {
          medicamento: medicamento.nombre,
          cantidad: parseInt(cantidad),
          precio: medicamento.precio
        })
        
        // Validar cantidad disponible
        const cantidadNum = parseInt(cantidad)
        if (cantidadNum > medicamento.existencias) {
          alert(`❌ No hay suficiente stock. Stock disponible: ${medicamento.existencias}`)
          return
        }
        
        // TODO: Implementar cuando esté listo el módulo carrito
        alert(`✅ ${cantidadNum} unidad(es) de "${medicamento.nombre}" agregado(s) al carrito\n\n(Por implementar: integración con módulo carrito)`)
        
      } catch (error) {
        console.error('❌ Error agregando al carrito:', error)
        alert(`❌ Error: ${error.message}`)
      }
    },

    // Exportar a Excel
    async exportarExcel() {
      try {
        console.log('📊 Exportando medicamentos a Excel...')
        
        // Cargar TODOS los medicamentos sin paginación
        console.log('🔄 Cargando todos los medicamentos...')
        const response = await farmaciaService.getMedicamentos({ 
          limit: 10000,  // Límite alto para obtener todos
          page: 1,
          filtro: 'todos'
        })
        
        if (!response.data || !response.data.medicamentos || response.data.medicamentos.length === 0) {
          alert('❌ No hay medicamentos para exportar')
          return
        }
        
        console.log(`✅ ${response.data.medicamentos.length} medicamentos cargados para exportar`)
        
        const csvContent = this.convertirCSVMejorado(response.data.medicamentos)
        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        
        link.setAttribute('href', url)
        link.setAttribute('download', `medicamentos_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        console.log('✅ Excel exportado exitosamente')
        alert(`✅ Excel exportado: ${response.data.medicamentos.length} medicamentos`)
        
      } catch (error) {
        console.error('❌ Error exportando Excel:', error)
        alert(`❌ Error exportando: ${error.message}`)
      }
    },

    convertirCSVMejorado(datos) {
      const SEPARADOR = ';'
      
      const headers = [
        'ID', 'Nombre', 'Presentación', 'Laboratorio', 'Existencias',
        'Fecha Vencimiento', 'Precio', 'Costo Compra',
        'Indicaciones', 'Contraindicaciones', 'Dosis', 'Comisión (%)', 'Requiere Extras'
      ]
      
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
      
      const formatearDecimal = (numero) => {
        if (numero === null || numero === undefined) return '0,00'
        return parseFloat(numero || 0).toFixed(2).replace('.', ',')
      }
      
      const lineaHeaders = headers.map(h => escaparValor(h)).join(SEPARADOR)
      
      const lineasDatos = datos.map(med => {
        const valores = [
          med.id || '', med.nombre || '', med.presentacion_nombre || '',
          med.laboratorio_nombre || '', med.existencias || 0,
          formatearFecha(med.fecha_vencimiento), formatearDecimal(med.precio),
          formatearDecimal(med.costo_compra),
          (med.indicaciones || '').trim(), (med.contraindicaciones || '').trim(),
          (med.dosis || '').trim(), formatearDecimal(med.porcentaje_comision),
          med.requiere_extras ? 'Sí' : 'No'
        ]
        return valores.map(v => escaparValor(v)).join(SEPARADOR)
      })
      
      return [lineaHeaders, ...lineasDatos].join('\r\n')
    },

    formatearFecha(fecha) {
      return farmaciaService.formatDate(fecha)
    },

    formatearPrecio(precio) {
      return farmaciaService.formatPrice(precio)
    },

    async eliminarMedicamento(medicamento) {
      try {
        const confirmar1 = confirm(`¿Estás seguro de que deseas ELIMINAR el medicamento "${medicamento.nombre}"?`)
        if (!confirmar1) return
        
        const confirmar2 = confirm(`⚠️ ÚLTIMA CONFIRMACIÓN ⚠️\n\nEsto eliminará permanentemente:\n"${medicamento.nombre}" - ${medicamento.presentacion_nombre}\n\n¿Continuar?`)
        if (!confirmar2) return
        
        console.log('🗑️ Eliminando medicamento:', medicamento.nombre)
        
        await farmaciaService.eliminarMedicamento(medicamento.id)
        
        await Promise.all([
          this.cargarMedicamentos(),
          this.cargarEstadisticas()
        ])
        
        delete this.extrasCache[medicamento.id]
        
        alert(`✅ Medicamento "${medicamento.nombre}" eliminado exitosamente`)
        
      } catch (error) {
        console.error('❌ Error eliminando medicamento:', error)
        alert(`❌ Error eliminando medicamento: ${error.message}`)
      }
    },

    // ============================================================================
    // ✅ FUNCIONES PRESENTACIONES
    // ============================================================================
    abrirModalAgregarPresentacion() {
      this.modalPresentacion.datos.nombre = ''
      this.modalPresentacion.datos.descripcion = ''
      this.modalPresentacion.visible = true
    },

    cerrarModalPresentacion() {
      this.modalPresentacion.visible = false
    },

    async guardarPresentacion() {
      try {
        const response = await farmaciaService.crearPresentacion(this.modalPresentacion.datos)
        if (response.success) {
          await this.cargarPresentaciones()
          this.cerrarModalPresentacion()
          alert('✅ Presentación creada exitosamente')
        }
      } catch (error) {
        console.error('Error creando presentación:', error)
        alert(error.response?.data?.message || 'Error al crear presentación')
      }
    },

    async eliminarPresentacion() {
      if (!this.modalFormulario.datos.presentacion_id) return
      
      const presentacionSeleccionada = this.presentaciones.find(
        p => p.id === this.modalFormulario.datos.presentacion_id
      )
      
      if (!presentacionSeleccionada) return
      if (!confirm(`¿Eliminar la presentación "${presentacionSeleccionada.nombre}"?`)) return
      
      try {
        const response = await farmaciaService.eliminarPresentacion(this.modalFormulario.datos.presentacion_id)
        if (response.success) {
          this.modalFormulario.datos.presentacion_id = ''
          await this.cargarPresentaciones()
          alert('✅ Presentación eliminada exitosamente')
        }
      } catch (error) {
        console.error('Error eliminando presentación:', error)
        alert(error.response?.data?.message || 'Error al eliminar presentación')
      }
    },

    // ============================================================================
    // ✅ FUNCIONES LABORATORIOS
    // ============================================================================
    abrirModalAgregarLaboratorio() {
      this.modalLaboratorio.datos.nombre = ''
      this.modalLaboratorio.datos.descripcion = ''
      this.modalLaboratorio.visible = true
    },

    cerrarModalLaboratorio() {
      this.modalLaboratorio.visible = false
    },

    async guardarLaboratorio() {
      try {
        const response = await farmaciaService.crearCasaMedica(this.modalLaboratorio.datos)
        if (response.success) {
          await this.cargarLaboratorios()
          this.cerrarModalLaboratorio()
          alert('✅ Casa médica creada exitosamente')
        }
      } catch (error) {
        console.error('Error creando casa médica:', error)
        alert(error.response?.data?.message || 'Error al crear casa médica')
      }
    },

    async eliminarLaboratorio() {
      if (!this.modalFormulario.datos.laboratorio_id) return
      
      const laboratorioSeleccionado = this.laboratorios.find(
        l => l.id === this.modalFormulario.datos.laboratorio_id
      )
      
      if (!laboratorioSeleccionado) return
      if (!confirm(`¿Eliminar la casa médica "${laboratorioSeleccionado.nombre}"?`)) return
      
      try {
        const response = await farmaciaService.eliminarCasaMedica(this.modalFormulario.datos.laboratorio_id)
        if (response.success) {
          this.modalFormulario.datos.laboratorio_id = ''
          await this.cargarLaboratorios()
          alert('✅ Casa médica eliminada exitosamente')
        }
      } catch (error) {
        console.error('Error eliminando casa médica:', error)
        alert(error.response?.data?.message || 'Error al eliminar casa médica')
      }
    }
  }
}
</script>

<style scoped>
/* Estilos específicos del módulo farmacia */
.spinner {
  @apply inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin;
}

/* Botones de iconos */
.btn-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors;
}

.btn-blue { @apply bg-blue-100 hover:bg-blue-200 text-blue-700; }
.btn-green { @apply bg-green-100 hover:bg-green-200 text-green-700; }
.btn-purple { @apply bg-purple-100 hover:bg-purple-200 text-purple-700; }
.btn-orange { @apply bg-orange-100 hover:bg-orange-200 text-orange-700; }
.btn-red { @apply bg-red-100 hover:bg-red-200 text-red-700; }

/* Transiciones suaves para filtros */
.transition-colors {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

/* Hover effects para las filas de la tabla */
.hover\:bg-gray-50:hover {
  background-color: #f9fafb;
}

/* Scroll suave para la tabla en móvil */
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

/* ✅ NUEVOS ESTILOS: Para la columna de extras */
.extras-indicator {
  @apply flex items-center space-x-2 text-sm;
}

.extras-badge {
  @apply px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium;
}

.no-extras {
  @apply text-gray-400 text-xs;
}

/* Mejoras para modales */
.modal-section {
  @apply border-t pt-4 mt-4;
}

.modal-section:first-child {
  @apply border-t-0 pt-0 mt-0;
}

/* Estados de carga mejorados */
.loading-state {
  @apply flex flex-col items-center justify-center py-12 text-gray-500;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4;
}

/* Responsive improvements */
@media (max-width: 640px) {
  .btn-icon {
    @apply w-7 h-7 text-xs;
  }
  
  .extras-indicator {
    @apply flex-col items-start space-x-0 space-y-1;
  }
}

/* Animaciones sutiles */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* Mejor contraste para accesibilidad */
.text-success { @apply text-green-700; }
.text-warning { @apply text-yellow-700; }
.text-danger { @apply text-red-700; }
.text-info { @apply text-blue-700; }

/* Estados hover mejorados */
.card {
  @apply transition-shadow duration-200;
}

.card:hover {
  @apply shadow-md;
}

/* Indicadores visuales mejorados */
.status-badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.status-badge.success {
  @apply bg-green-100 text-green-800;
}

.status-badge.warning {
  @apply bg-yellow-100 text-yellow-800;
}

.status-badge.danger {
  @apply bg-red-100 text-red-800;
}

.status-badge.info {
  @apply bg-blue-100 text-blue-800;
}

/* Mejoras de accesibilidad */
.btn-icon:focus {
  @apply ring-2 ring-offset-2 ring-blue-500 outline-none;
}

.input-base:focus {
  @apply ring-2 ring-blue-500 border-blue-500;
}

/* Loading skeleton para mejor UX */
.skeleton {
  @apply animate-pulse bg-gray-200 rounded;
}

.skeleton-text {
  @apply h-4 bg-gray-200 rounded w-3/4 mb-2;
}

.skeleton-avatar {
  @apply h-8 w-8 bg-gray-200 rounded-full;
}
</style>