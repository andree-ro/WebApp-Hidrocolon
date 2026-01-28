<!-- frontend/src/views/LibroBancosView.vue -->
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
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">📚 Libro de Bancos</h1>
          <p class="text-gray-600 mt-1">Control de ingresos y egresos bancarios</p>
        </div>
        
        <!-- Acciones rápidas -->
        <div class="flex gap-2 flex-wrap">
          <button
            @click="store.abrirModalNuevaOperacion()"
            :disabled="!store.tieneSaldoInicial"
            class="btn-primary text-sm"
          >
            ➕ Nueva Operación
          </button>
          <button
            @click="store.cargarOperaciones()"
            :disabled="store.cargando"
            class="btn-secondary text-sm"
          >
            🔄 Actualizar
          </button>
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

    <!-- Alerta: Sin saldo inicial -->
    <div v-if="!store.tieneSaldoInicial && !store.cargando" class="max-w-7xl mx-auto mb-6">
      <div class="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
        <div class="flex items-start gap-4">
          <div class="text-4xl">🏦</div>
          <div class="flex-1">
            <h3 class="text-lg font-bold text-blue-900 mb-2">
              ¡Configura tu Saldo Inicial!
            </h3>
            <p class="text-blue-700 mb-4">
              Para comenzar a usar el Libro de Bancos, primero debes registrar el saldo inicial de tu cuenta bancaria.
            </p>
            <button
              @click="store.abrirModalSaldoInicial()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              📝 Registrar Saldo Inicial
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard de Saldos -->
    <div v-if="store.tieneSaldoInicial" class="max-w-7xl mx-auto mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <!-- Saldo Inicial -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-blue-700 font-medium">Saldo Inicial</p>
              <p class="text-2xl font-bold text-blue-900 mt-1">
                Q{{ formatearMoneda(store.saldoInicial) }}
              </p>
            </div>
            <div class="text-3xl">🏦</div>
          </div>
        </div>

        <!-- Total Ingresos -->
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-green-700 font-medium">Total Ingresos</p>
              <p class="text-2xl font-bold text-green-900 mt-1">
                Q{{ formatearMoneda(store.saldoActual?.total_ingresos || 0) }}
              </p>
            </div>
            <div class="text-3xl">💰</div>
          </div>
        </div>

        <!-- Total Egresos -->
        <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-red-700 font-medium">Total Egresos</p>
              <p class="text-2xl font-bold text-red-900 mt-1">
                Q{{ formatearMoneda(store.saldoActual?.total_egresos || 0) }}
              </p>
            </div>
            <div class="text-3xl">💸</div>
          </div>
        </div>

        <!-- Saldo Actual -->
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-purple-700 font-medium">Saldo Actual</p>
              <p class="text-2xl font-bold text-purple-900 mt-1">
                Q{{ formatearMoneda(store.saldoActual?.saldo_actual || 0) }}
              </p>
            </div>
            <div class="text-3xl">📊</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros y Exportación -->
    <div v-if="store.tieneSaldoInicial" class="max-w-7xl mx-auto mb-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex flex-wrap gap-4 items-end">
          
          <!-- Fecha Inicio -->
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              📅 Fecha Inicio
            </label>
            <input
              v-model="filtros.fecha_inicio"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Fecha Fin -->
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              📅 Fecha Fin
            </label>
            <input
              v-model="filtros.fecha_fin"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Tipo Operación -->
          <div class="flex-1 min-w-[150px]">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              🔄 Tipo
            </label>
            <select
              v-model="filtros.tipo_operacion"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="egreso">Egresos</option>
            </select>
          </div>

          <!-- Botones de acción -->
          <div class="flex gap-2">
            <button
              @click="aplicarFiltros"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔍 Filtrar
            </button>
            <button
              @click="limpiarFiltros"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              🗑️ Limpiar
            </button>
          </div>

          <!-- Exportación -->
          <div class="flex gap-2 ml-auto">
            <button
              @click="store.exportarPDF()"
              :disabled="store.cargando || store.operaciones.length === 0"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors"
            >
              📄 PDF
            </button>
            <button
              @click="store.exportarExcel()"
              :disabled="store.cargando || store.operaciones.length === 0"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
            >
              📊 Excel
            </button>
          </div>
        </div>
      </div>
    </div>

<!-- Tabla de Operaciones -->
    <div v-if="store.tieneSaldoInicial" class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        
        <!-- Header de la tabla -->
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">
              📋 Operaciones Registradas
              <span class="text-sm font-normal text-gray-500 ml-2">
                ({{ store.vistaAgrupada ? store.operacionesAgrupadas.length : store.totalOperaciones }} registros)
              </span>
            </h2>
          </div>
          
          <!-- Toggle Vista -->
          <button
            @click="alternarVista"
            class="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <span v-if="store.vistaAgrupada">📊 Ver Detalle</span>
            <span v-else>📅 Ver Agrupado</span>
          </button>
        </div>

        <!-- Loader -->
        <div v-if="store.cargando" class="p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p class="text-gray-600 mt-4">Cargando operaciones...</p>
        </div>

        <!-- Sin datos -->
        <div v-else-if="store.vistaAgrupada && store.operacionesAgrupadas.length === 0" class="p-8 text-center">
          <div class="text-6xl mb-4">🔭</div>
          <p class="text-gray-600 text-lg font-medium">No hay operaciones registradas</p>
          <p class="text-gray-500 text-sm mt-2">Comienza registrando tu primera operación</p>
        </div>

        <div v-else-if="!store.vistaAgrupada && store.operaciones.length === 0" class="p-8 text-center">
          <div class="text-6xl mb-4">🔭</div>
          <p class="text-gray-600 text-lg font-medium">No hay operaciones registradas</p>
          <p class="text-gray-500 text-sm mt-2">Comienza registrando tu primera operación</p>
        </div>

        <!-- VISTA AGRUPADA POR FECHA -->
        <div v-else-if="store.vistaAgrupada" class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12"></th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ingresos del Día</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Egresos del Día</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Movimiento Neto</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo Final</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Operaciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <template v-for="diaAgrupado in store.operacionesAgrupadas" :key="diaAgrupado.fecha">
                
                <!-- Fila principal agrupada -->
                <tr class="hover:bg-gray-50 cursor-pointer" @click="toggleDetalleDelDia(diaAgrupado.fecha)">
                  
                  <!-- Botón expandir/colapsar -->
                  <td class="px-4 py-3 text-center">
                    <button class="text-blue-600 hover:text-blue-800 transition-colors">
                      <span v-if="store.detallesDiaExpandidos[diaAgrupado.fecha]" class="text-xl">−</span>
                      <span v-else class="text-xl">+</span>
                    </button>
                  </td>

                  <!-- Fecha -->
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">
                    {{ formatearFecha(diaAgrupado.fecha) }}
                  </td>

                  <!-- Ingresos del día -->
                  <td class="px-4 py-3 text-right text-sm font-semibold text-green-600">
                    <span v-if="diaAgrupado.total_ingresos_dia > 0">
                      Q{{ formatearMoneda(diaAgrupado.total_ingresos_dia) }}
                    </span>
                    <span v-else class="text-gray-300">-</span>
                  </td>

                  <!-- Egresos del día -->
                  <td class="px-4 py-3 text-right text-sm font-semibold text-red-600">
                    <span v-if="diaAgrupado.total_egresos_dia > 0">
                      Q{{ formatearMoneda(diaAgrupado.total_egresos_dia) }}
                    </span>
                    <span v-else class="text-gray-300">-</span>
                  </td>

                  <!-- Movimiento neto -->
                  <td class="px-4 py-3 text-right text-sm font-bold"
                      :class="diaAgrupado.movimiento_neto_dia >= 0 ? 'text-green-700' : 'text-red-700'">
                    {{ diaAgrupado.movimiento_neto_dia >= 0 ? '+' : '' }}Q{{ formatearMoneda(diaAgrupado.movimiento_neto_dia) }}
                  </td>

                  <!-- Saldo final -->
                  <td class="px-4 py-3 text-right text-sm font-bold text-purple-600">
                    Q{{ formatearMoneda(diaAgrupado.saldo_final_dia) }}
                  </td>

                  <!-- Cantidad de operaciones -->
                  <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {{ diaAgrupado.cantidad_operaciones }}
                    </span>
                  </td>
                </tr>

                <!-- Detalle expandido del día -->
                <tr v-if="store.detallesDiaExpandidos[diaAgrupado.fecha]" class="bg-gray-50">
                  <td colspan="7" class="px-4 py-4">
                    <div class="ml-8 border-l-4 border-blue-300 pl-4">
                      <h4 class="text-sm font-semibold text-gray-700 mb-3">
                        📝 Detalle de operaciones del {{ formatearFecha(diaAgrupado.fecha) }}
                      </h4>
                      
                      <!-- Tabla de detalle -->
                      <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                          <thead class="bg-gray-100">
                            <tr>
                              <th class="px-3 py-2 text-left text-xs font-medium text-gray-600">Beneficiario</th>
                              <th class="px-3 py-2 text-left text-xs font-medium text-gray-600">Descripción</th>
                              <th class="px-3 py-2 text-left text-xs font-medium text-gray-600">Clasificación</th>
                              <th class="px-3 py-2 text-center text-xs font-medium text-gray-600">Tipo</th>
                              <th class="px-3 py-2 text-right text-xs font-medium text-gray-600">Ingreso</th>
                              <th class="px-3 py-2 text-right text-xs font-medium text-gray-600">Egreso</th>
                              <th class="px-3 py-2 text-right text-xs font-medium text-gray-600">Saldo</th>
                              <th class="px-3 py-2 text-center text-xs font-medium text-gray-600">Acciones</th>
                            </tr>
                          </thead>
                          <tbody class="bg-white divide-y divide-gray-200">
                            <tr
                              v-for="operacion in store.detallesDiaExpandidos[diaAgrupado.fecha]"
                              :key="operacion.id"
                              class="hover:bg-gray-50"
                            >
                              <!-- Beneficiario -->
                              <td class="px-3 py-2 text-gray-900">
                                {{ operacion.beneficiario }}
                              </td>

                              <!-- Descripción -->
                              <td class="px-3 py-2 text-gray-600">
                                {{ operacion.descripcion }}
                                <div v-if="operacion.numero_cheque || operacion.numero_deposito" class="text-xs text-gray-400 mt-1">
                                  <span v-if="operacion.numero_cheque">Cheque: {{ operacion.numero_cheque }}</span>
                                  <span v-if="operacion.numero_deposito">{{ operacion.numero_cheque ? ' | ' : '' }}Dep: {{ operacion.numero_deposito }}</span>
                                </div>
                              </td>

                              <!-- Clasificación -->
                              <td class="px-3 py-2">
                                <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {{ operacion.clasificacion }}
                                </span>
                              </td>

                              <!-- Tipo -->
                              <td class="px-3 py-2 text-center">
                                <span
                                  :class="[
                                    'px-2 py-1 rounded text-xs font-medium',
                                    operacion.tipo_operacion === 'ingreso'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  ]"
                                >
                                  {{ operacion.tipo_operacion === 'ingreso' ? '💰' : '💸' }}
                                </span>
                              </td>

                              <!-- Ingreso -->
                              <td class="px-3 py-2 text-right font-medium text-green-600">
                                <span v-if="parseFloat(operacion.ingreso) > 0">
                                  Q{{ formatearMoneda(operacion.ingreso) }}
                                </span>
                                <span v-else class="text-gray-300">-</span>
                              </td>

                              <!-- Egreso -->
                              <td class="px-3 py-2 text-right font-medium text-red-600">
                                <span v-if="parseFloat(operacion.egreso) > 0">
                                  Q{{ formatearMoneda(operacion.egreso) }}
                                </span>
                                <span v-else class="text-gray-300">-</span>
                              </td>

                              <!-- Saldo -->
                              <td class="px-3 py-2 text-right font-bold text-purple-600">
                                Q{{ formatearMoneda(operacion.saldo_bancos) }}
                              </td>

                              <!-- Acciones -->
                              <td class="px-3 py-2 text-center">
                                <div class="flex items-center justify-center gap-1">
                                  <button
                                    @click.stop="editarOperacion(operacion)"
                                    class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                    title="Editar"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    @click.stop="confirmarEliminarOperacion(operacion)"
                                    class="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                    title="Eliminar"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>

              </template>
            </tbody>
          </table>
        </div>

        <!-- VISTA DETALLADA (original) -->
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beneficiario</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clasificación</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ingreso</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Egreso</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="operacion in store.operacionesOrdenadas"
                :key="operacion.id"
                class="hover:bg-gray-50"
              >
                <!-- Fecha -->
                <td class="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {{ formatearFecha(operacion.fecha) }}
                </td>

                <!-- Beneficiario -->
                <td class="px-4 py-3 text-sm text-gray-900">
                  {{ operacion.beneficiario }}
                </td>

                <!-- Descripción -->
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ operacion.descripcion }}
                  <div v-if="operacion.numero_cheque || operacion.numero_deposito" class="text-xs text-gray-400 mt-1">
                    <span v-if="operacion.numero_cheque">Cheque: {{ operacion.numero_cheque }}</span>
                    <span v-if="operacion.numero_deposito">{{ operacion.numero_cheque ? ' | ' : '' }}Dep: {{ operacion.numero_deposito }}</span>
                  </div>
                </td>

                <!-- Clasificación -->
                <td class="px-4 py-3 text-sm">
                  <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {{ operacion.clasificacion }}
                  </span>
                </td>

                <!-- Tipo -->
                <td class="px-4 py-3 text-center">
                  <span
                    :class="[
                      'px-2 py-1 rounded text-xs font-medium',
                      operacion.tipo_operacion === 'ingreso'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ operacion.tipo_operacion === 'ingreso' ? '💰 Ingreso' : '💸 Egreso' }}
                  </span>
                </td>

                <!-- Ingreso -->
                <td class="px-4 py-3 text-right text-sm font-medium text-green-600">
                  <span v-if="parseFloat(operacion.ingreso) > 0">
                    Q{{ formatearMoneda(operacion.ingreso) }}
                  </span>
                  <span v-else class="text-gray-300">-</span>
                </td>

                <!-- Egreso -->
                <td class="px-4 py-3 text-right text-sm font-medium text-red-600">
                  <span v-if="parseFloat(operacion.egreso) > 0">
                    Q{{ formatearMoneda(operacion.egreso) }}
                  </span>
                  <span v-else class="text-gray-300">-</span>
                </td>

                <!-- Saldo -->
                <td class="px-4 py-3 text-right text-sm font-bold text-purple-600">
                  Q{{ formatearMoneda(operacion.saldo_bancos) }}
                </td>

                <!-- Acciones -->
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="editarOperacion(operacion)"
                      class="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      @click="confirmarEliminarOperacion(operacion)"
                      class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>

    <!-- Modal de Operación -->
    <ModalOperacion
      v-if="store.modalOperacionAbierto"
      :operacion="store.operacionSeleccionada"
      :modo-edicion="store.modoEdicion"
      @cerrar="store.cerrarModalOperacion()"
      @guardar="guardarOperacion"
    />

    <!-- Modal de Saldo Inicial -->
    <ModalSaldoInicial
      v-if="store.modalSaldoInicialAbierto"
      @cerrar="store.cerrarModalSaldoInicial()"
      @guardar="guardarSaldoInicial"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useLibroBancosStore } from '@/store/libroBancosStore'
import ModalOperacion from '@/components/libroBancos/ModalOperacion.vue'
import ModalSaldoInicial from '@/components/libroBancos/ModalSaldoInicial.vue'

const store = useLibroBancosStore()

// Filtros locales
const filtros = ref({
  fecha_inicio: null,
  fecha_fin: null,
  tipo_operacion: null
})

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(async () => {
  console.log('📚 LibroBancosView montado')
  await store.verificarSaldoInicial()
  
  if (store.tieneSaldoInicial) {
    // Cargar vista agrupada por defecto
    if (store.vistaAgrupada) {
      await store.cargarOperacionesAgrupadas()
    } else {
      await store.cargarOperaciones()
    }
  }
})

// ============================================================================
// METHODS
// ============================================================================

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
  // Agregar hora al mediodía para evitar problemas de zona horaria
  const fechaStr = fecha.includes('T') ? fecha : fecha + 'T12:00:00'
  const date = new Date(fechaStr)
  return date.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Aplicar filtros
 */
function aplicarFiltros() {
  store.aplicarFiltros(filtros.value)
}

/**
 * Limpiar filtros
 */
function limpiarFiltros() {
  filtros.value = {
    fecha_inicio: null,
    fecha_fin: null,
    tipo_operacion: null
  }
  store.limpiarFiltros()
}

/**
 * Guardar saldo inicial
 */
async function guardarSaldoInicial(data) {
  await store.registrarSaldoInicial(data)
}

/**
 * Guardar operación (crear o actualizar)
 */
async function guardarOperacion(data) {
  if (store.modoEdicion && store.operacionSeleccionada) {
    await store.actualizarOperacion(store.operacionSeleccionada.id, data)
  } else {
    await store.crearOperacion(data)
  }
}

/**
 * Editar operación
 */
function editarOperacion(operacion) {
  store.abrirModalEditarOperacion(operacion)
}

/**
 * Confirmar eliminación
 */
function confirmarEliminar(operacion) {
  if (confirm(`¿Está seguro de eliminar esta operación?\n\nBeneficiario: ${operacion.beneficiario}\nMonto: Q${formatearMoneda(operacion.ingreso || operacion.egreso)}`)) {
    store.eliminarOperacion(operacion.id)
  }
}

/**
 * Confirmar eliminación de operación (método correcto)
 */
function confirmarEliminarOperacion(operacion) {
  if (confirm(`¿Está seguro de eliminar esta operación?\n\nBeneficiario: ${operacion.beneficiario}\nMonto: Q${formatearMoneda(operacion.ingreso || operacion.egreso)}`)) {
    store.eliminarOperacion(operacion.id)
  }
}

/**
 * Alternar vista entre agrupada y detallada
 */
function alternarVista() {
  store.alternarVista()
}

/**
 * Toggle detalle del día (expandir/colapsar)
 */
async function toggleDetalleDelDia(fecha) {
  // Si ya está expandido, colapsar
  if (store.detallesDiaExpandidos[fecha]) {
    store.colapsarDetalleDelDia(fecha)
  } else {
    // Si no está expandido, cargar y expandir
    await store.obtenerDetalleDelDia(fecha)
  }
}
</script>