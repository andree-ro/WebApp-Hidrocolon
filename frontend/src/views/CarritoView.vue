<!-- frontend/src/views/CarritoView.vue -->
<!-- ✅ VERSIÓN CON TODOS LOS FIXES APLICADOS -->

<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6">
    <!-- Header -->
    <div class="max-w-7xl mx-auto mb-6">
      <div class="flex items-center justify-between justify-between relative">
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

        <div class="absolute left-1/2 transform -translate-x-1/2 text-center">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">🛒 Sistema de Ventas</h1>
          <p class="text-gray-600 mt-1">Gestión de ventas y comprobantes</p>
        </div>

        
        
        <!-- Info del turno -->
        <div v-if="turnoActivo" class="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          <div class="text-sm text-green-800">
            <div class="font-semibold">✅ Turno Activo #{{ turnoActivo.id }}</div>
            <div class="text-xs mt-1">{{ turnoActivo.usuario_nombre }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenedor principal -->
    <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- COLUMNA IZQUIERDA -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Selector de paciente -->
        <div class="card p-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">👤 Paciente</h3>
          
          <div class="flex gap-2">
            <div class="flex-1">
              <input
                v-model="busquedaPaciente"
                @input="buscarPacientes"
                type="text"
                placeholder="Buscar paciente por nombre, apellido o teléfono..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <!-- Lista de resultados - FIX: usar nombres/apellidos en lugar de nombre/apellido -->
              <div v-if="pacientesEncontrados.length > 0" class="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <button
                  v-for="paciente in pacientesEncontrados"
                  :key="paciente.id"
                  @click="seleccionarPaciente(paciente)"
                  class="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                >
                  <div class="font-medium text-gray-900">{{ paciente.nombres || paciente.nombre }} {{ paciente.apellidos || paciente.apellido }}</div>
                  <div class="text-sm text-gray-500">📞 {{ paciente.telefono }}</div>
                </button>
              </div>
            </div>

            <button 
              @click="mostrarModalRegistroRapido = true"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              ⚡ Registro Rápido
            </button>
            
            <button 
              v-if="carritoStore.pacienteSeleccionado"
              @click="carritoStore.setPaciente(null)"
              class="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
            >
              Limpiar
            </button>
          </div>
          
          <!-- Paciente seleccionado - FIX: usar nombres/apellidos -->
          <div v-if="carritoStore.pacienteSeleccionado" class="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-semibold text-blue-900">
                  {{ carritoStore.pacienteSeleccionado.nombres || carritoStore.pacienteSeleccionado.nombre }} 
                  {{ carritoStore.pacienteSeleccionado.apellidos || carritoStore.pacienteSeleccionado.apellido }}
                </div>
                <div class="text-sm text-blue-700">
                  📞 {{ carritoStore.pacienteSeleccionado.telefono }}
                  <span v-if="carritoStore.pacienteSeleccionado.dpi" class="ml-3">
                    🆔 {{ carritoStore.pacienteSeleccionado.dpi }}
                  </span>
                  <span v-if="carritoStore.pacienteSeleccionado.nit" class="ml-3">
                    💳 NIT: {{ carritoStore.pacienteSeleccionado.nit }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <!-- AGREGAR AQUÍ ↓ -->
        <SelectorDoctora />
        <!-- AGREGAR AQUÍ ↑ -->



        <!-- Buscador de productos -->
        <div class="card p-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">🔍 Buscar Productos</h3>
          
          <!-- Tabs -->
          <div class="flex gap-2 mb-3">
            <button
              v-for="tipo in ['medicamento', 'servicio', 'extra']"
              :key="tipo"
              @click="cambiarTipoProducto(tipo)"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-colors',
                tipoProductoSeleccionado === tipo
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              {{ tipo === 'medicamento' ? '💊 Medicamentos' : tipo === 'servicio' ? '🏥 Servicios' : '' }}
            </button>
          </div>
          
          <!-- Búsqueda -->
          <input
            v-model="busquedaProducto"
            @input="buscarProductos"
            :disabled="!carritoStore.pacienteSeleccionado"
            type="text"
            placeholder="Buscar productos..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <!-- Resultados -->
          <div v-if="productosEncontrados.length > 0" class="mt-3 space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="producto in productosEncontrados"
              :key="`${tipoProductoSeleccionado}-${producto.id}`"
              @click="agregarAlCarrito(producto)"
              class="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="font-medium text-gray-900">{{ producto.nombre }}</div>
                  <div class="text-sm text-gray-500 mt-1">
                    <span v-if="tipoProductoSeleccionado === 'medicamento'" class="mr-3">
                      📦 Stock: {{ producto.existencias || 0 }}
                    </span>
                    <span class="text-blue-700 font-semibold text-base">Q{{ producto.precio }}</span>
                  </div>
                </div>
                
                <!-- Indicador visual de click -->
                <div class="text-blue-600 text-xl">
                  ➕
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="busquedaProducto" class="mt-3 text-center text-gray-500 py-4">
            No se encontraron productos
          </div>
        </div>

        <!-- Lista del carrito -->
        <div class="card p-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">
            🛒 Carrito ({{ carritoStore.cantidadTotal }} items)
          </h3>
          
          <div v-if="!carritoStore.carritoVacio" class="space-y-2">
            <div
              v-for="item in carritoStore.items"
              :key="item.id"
              class="bg-white border border-gray-200 rounded-lg p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="font-medium text-gray-900">{{ item.producto_nombre }}</div>
                  <div class="text-sm text-gray-500 mt-1">
                    {{ item.tipo_producto }}
                    <span v-if="item.presentacion" class="ml-2">• {{ item.presentacion }}</span>
                  </div>
                  <div class="text-sm mt-1">
                    <span class="font-medium text-gray-900">Q{{ item.precio_unitario }}</span>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <button
                    @click="cambiarCantidad(item.id, item.cantidad - 1)"
                    class="w-8 h-8 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    -
                  </button>
                  <span class="w-12 text-center font-medium">{{ item.cantidad }}</span>
                  <button
                    @click="cambiarCantidad(item.id, item.cantidad + 1)"
                    class="w-8 h-8 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    +
                  </button>
                  
                  <button
                    @click="carritoStore.eliminarItem(item.id)"
                    class="ml-2 w-8 h-8 bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div class="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                <span class="text-sm text-gray-600">Subtotal:</span>
                <span class="font-semibold text-gray-900">Q{{ formatearNumero(item.subtotal) }}</span>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">🛒</div>
            <p>El carrito está vacío</p>
            <p class="text-sm mt-1">Busca productos para agregar</p>
          </div>
        </div>
      </div>

      <!-- COLUMNA DERECHA -->
      <div class="space-y-6">
        <div class="card p-4 sticky top-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">💰 Resumen</h3>
          
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Subtotal:</span>
              <span class="font-medium">Q{{ formatearNumero(carritoStore.subtotal) }}</span>
            </div>
            
            <!-- FIX: Descuento requiere contraseña admin -->
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Descuento:</span>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="descuentoTemporal"
                  @blur="aplicarDescuentoConPassword"
                  type="number"
                  min="0"
                  max="100"
                  class="w-16 px-2 py-1 border border-gray-300 rounded text-right"
                  placeholder="0"
                />
                <span>%</span>
              </div>
            </div>
            
            <div class="border-t border-gray-200 pt-2 mt-2">
              <div class="flex justify-between text-lg font-bold">
                <span class="text-gray-900">Total:</span>
                <span class="text-blue-600">Q{{ formatearNumero(carritoStore.total) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Método de pago -->
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Método de pago</label>
            <select
              v-model="carritoStore.metodoPago"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="efectivo">💵 Efectivo</option>
              <option value="tarjeta">💳 Tarjeta</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="deposito">🏧 Depósito</option>
              <option value="mixto">💰 Pago Mixto</option>
            </select>
          </div>
          
          <!-- Campos según método -->
          <div class="mt-3 space-y-2">
            <div v-if="carritoStore.metodoPago === 'efectivo'">
              <label class="block text-sm font-medium text-gray-700 mb-1">Efectivo recibido</label>
              <input
                v-model.number="carritoStore.montoEfectivo"
                type="text"
                @input="formatearInputEfectivo"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="0.00"
              />
              <div v-if="carritoStore.montoEfectivo > 0 && carritoStore.montoEfectivo >= carritoStore.total" class="mt-1 text-sm text-green-600">
                Cambio: Q{{ formatearNumero(carritoStore.montoEfectivo - carritoStore.total) }}
              </div>
              <div v-else-if="carritoStore.montoEfectivo > 0 && carritoStore.montoEfectivo < carritoStore.total" class="mt-1 text-sm text-red-600">
                Falta: Q{{ formatearNumero(carritoStore.total - carritoStore.montoEfectivo) }}
              </div>
            </div>
            
            <div v-if="carritoStore.metodoPago === 'mixto'" class="space-y-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">💵 Efectivo</label>
                <input
                  v-model.number="carritoStore.montoEfectivo"
                  type="text"
                  @input="formatearInputEfectivo"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">💳 Tarjeta</label>
                <input
                  v-model.number="carritoStore.montoTarjeta"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">🏦 Transferencia</label>
                <input
                  v-model.number="carritoStore.montoTransferencia"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">🏧 Depósito</label>
                <input
                  v-model.number="carritoStore.montoDeposito"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div class="text-sm">
                Total ingresado: Q{{ formatearNumero(carritoStore.montoEfectivo + carritoStore.montoTarjeta + carritoStore.montoTransferencia + carritoStore.montoDeposito) }}
              </div>
            </div>
          </div>
          
          <!-- Observaciones -->
          <div class="mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
            <textarea
              v-model="carritoStore.observaciones"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
              placeholder="Notas adicionales..."
            ></textarea>
          </div>
          
          <!-- Botones -->
          <div class="mt-4 space-y-2">
            <button
              @click="procesarVenta"
              :disabled="!carritoStore.pacienteSeleccionado || carritoStore.carritoVacio || procesandoVenta"
              class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {{ procesandoVenta ? '⏳ Procesando...' : '✅ Procesar Venta (Testing)' }}
            </button>
            
            <button
              @click="carritoStore.vaciarCarrito()"
              :disabled="carritoStore.carritoVacio"
              class="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ Vaciar Carrito
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Abrir Turno -->
    <div v-if="mostrarModalAbrirTurno" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">🔓 Abrir Turno</h3>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Efectivo inicial en caja
          </label>
          <input
            v-model.number="efectivoInicial"
            type="number"
            step="0.01"
            min="0"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="0.00"
          />
        </div>
        
        <div class="flex gap-3">
          <button
            @click="abrirTurno"
            :disabled="efectivoInicial < 0"
            class="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Abrir Turno
          </button>
          <button
            @click="mostrarModalAbrirTurno = false"
            class="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================================ -->
    <!-- MODAL: VOUCHER DE TARJETA -->
    <!-- ============================================================================ -->
    <div v-if="mostrarModalVoucher" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-t-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-3xl">💳</span>
              <div>
                <h2 class="text-xl font-bold">Datos del Voucher</h2>
                <p class="text-sm text-blue-100">Pago con tarjeta</p>
              </div>
            </div>
            <button
              @click="cancelarModal"
              class="text-white hover:text-blue-100 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4">
          <!-- Monto (prellenado y deshabilitado) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Monto de la venta
            </label>
            <div class="relative">
              <span class="absolute left-4 top-3 text-gray-500 text-lg">Q</span>
              <input
                :value="formatearNumero(datosVoucher.monto)"
                type="text"
                disabled
                class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-lg font-bold text-gray-700"
              />
            </div>
          </div>

          <!-- Nombre del paciente (prellenado y deshabilitado) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nombre del paciente
            </label>
            <div class="relative">
              <span class="absolute left-4 top-3 text-gray-500 text-lg">👤</span>
              <input
                :value="carritoStore.pacienteSeleccionado ? `${carritoStore.pacienteSeleccionado.nombres || carritoStore.pacienteSeleccionado.nombre} ${carritoStore.pacienteSeleccionado.apellidos || carritoStore.pacienteSeleccionado.apellido}` : 'Sin paciente'"
                type="text"
                disabled
                class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-lg text-gray-700"
              />
            </div>
          </div>

          <!-- Número de Voucher (ÚNICO CAMPO EDITABLE) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Número de Voucher *
            </label>
            <div class="relative">
              <span class="absolute left-4 top-3 text-gray-500 text-lg">#</span>
              <input
                v-model="datosVoucher.numero"
                type="text"
                class="w-full pl-10 pr-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                placeholder="Ej: VOUCH-123456"
                required
                autofocus
              />
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Ingresa el número del voucher físico de la terminal POS
            </p>
          </div>

          <!-- Info -->
          <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <span class="text-xl">💡</span>
              <div class="flex-1">
                <p class="text-sm font-medium text-blue-800">Importante</p>
                <p class="text-xs text-blue-700 mt-1">
                  Este voucher se registrará automáticamente en el módulo financiero vinculado a esta venta.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
          <div class="flex gap-3">
            <button
              @click="confirmarVoucher"
              :disabled="!datosVoucher.numero || datosVoucher.numero.trim() === ''"
              class="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ✅ Confirmar y Procesar Venta
            </button>
            <button
              @click="cancelarModal"
              class="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================================ -->
    <!-- MODAL: TRANSFERENCIA BANCARIA -->
    <!-- ============================================================================ -->
    <div v-if="mostrarModalTransferencia" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <!-- Header -->
        <div class="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-t-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-3xl">🏦</span>
              <div>
                <h2 class="text-xl font-bold">Datos de la Transferencia</h2>
                <p class="text-sm text-green-100">Pago por transferencia bancaria</p>
              </div>
            </div>
            <button
              @click="cancelarModal"
              class="text-white hover:text-green-100 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4">
          <!-- Monto (prellenado y deshabilitado) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Monto de la venta
            </label>
            <div class="relative">
              <span class="absolute left-4 top-3 text-gray-500 text-lg">Q</span>
              <input
                :value="formatearNumero(datosTransferencia.monto)"
                type="text"
                disabled
                class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-lg font-bold text-gray-700"
              />
            </div>
          </div>

          <!-- Nombre del paciente (prellenado y deshabilitado) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nombre del paciente
            </label>
            <div class="relative">
              <span class="absolute left-4 top-3 text-gray-500 text-lg">👤</span>
              <input
                :value="carritoStore.pacienteSeleccionado ? `${carritoStore.pacienteSeleccionado.nombres || carritoStore.pacienteSeleccionado.nombre} ${carritoStore.pacienteSeleccionado.apellidos || carritoStore.pacienteSeleccionado.apellido}` : 'Sin paciente'"
                type="text"
                disabled
                class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-lg text-gray-700"
              />
            </div>
          </div>

          <!-- Número de Boleta (ÚNICO CAMPO EDITABLE) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Número de Boleta *
            </label>
            <div class="relative">
              <span class="absolute left-4 top-3 text-gray-500 text-lg">#</span>
              <input
                v-model="datosTransferencia.numero"
                type="text"
                class="w-full pl-10 pr-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
                placeholder="Ej: TRANS-987654"
                required
                autofocus
              />
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Ingresa el número de boleta o referencia de la transferencia
            </p>
          </div>

          <!-- Info -->
          <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <span class="text-xl">💡</span>
              <div class="flex-1">
                <p class="text-sm font-medium text-green-800">Importante</p>
                <p class="text-xs text-green-700 mt-1">
                  Esta transferencia se registrará automáticamente en el módulo financiero vinculada a esta venta.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
          <div class="flex gap-3">
            <button
              @click="confirmarTransferencia"
              :disabled="!datosTransferencia.numero || datosTransferencia.numero.trim() === ''"
              class="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ✅ Confirmar y Procesar Venta
            </button>
            <button
              @click="cancelarModal"
              class="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================================ -->
    <!-- MODAL: DEPÓSITO BANCARIO -->
    <!-- ============================================================================ -->
    <div v-if="mostrarModalDeposito" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-t-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-3xl">🏧</span>
              <div>
                <h2 class="text-xl font-bold">Datos del Depósito</h2>
                <p class="text-sm text-purple-100">Pago por depósito bancario</p>
              </div>
            </div>
            <button
              @click="cancelarModal"
              class="text-white hover:text-purple-100 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4">
          <!-- Monto (prellenado y deshabilitado) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Monto de la venta
            </label>
            <div class="relative">
              <span class="absolute left-4 top-3 text-gray-500 text-lg">Q</span>
              <input
                :value="formatearNumero(datosDeposito.monto)"
                type="text"
                disabled
                class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-lg font-bold text-gray-700"
              />
            </div>
          </div>

          <!-- Nombre del paciente (prellenado y deshabilitado) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nombre del paciente
            </label>
            <div class="relative">
              <span class="absolute left-4 top-3 text-gray-500 text-lg">👤</span>
              <input
                :value="carritoStore.pacienteSeleccionado ? `${carritoStore.pacienteSeleccionado.nombres || carritoStore.pacienteSeleccionado.nombre} ${carritoStore.pacienteSeleccionado.apellidos || carritoStore.pacienteSeleccionado.apellido}` : 'Sin paciente'"
                type="text"
                disabled
                class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-lg text-gray-700"
              />
            </div>
          </div>

          <!-- Número de Depósito (ÚNICO CAMPO EDITABLE) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Número de Depósito *
            </label>
            <div class="relative">
              <span class="absolute left-4 top-3 text-gray-500 text-lg">#</span>
              <input
                v-model="datosDeposito.numero"
                type="text"
                class="w-full pl-10 pr-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold"
                placeholder="Ej: DEP-456789"
                required
                autofocus
              />
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Ingresa el número de boleta del depósito bancario
            </p>
          </div>

          <!-- Info -->
          <div class="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <span class="text-xl">💡</span>
              <div class="flex-1">
                <p class="text-sm font-medium text-purple-800">Importante</p>
                <p class="text-xs text-purple-700 mt-1">
                  Este depósito se registrará automáticamente en el módulo financiero vinculado a esta venta.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
          <div class="flex gap-3">
            <button
              @click="confirmarDeposito"
              :disabled="!datosDeposito.numero || datosDeposito.numero.trim() === ''"
              class="flex-1 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ✅ Confirmar y Procesar Venta
            </button>
            <button
              @click="cancelarModal"
              class="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
    <ModalRegistroPacienteRapido
      :mostrar="mostrarModalRegistroRapido"
      @cerrar="mostrarModalRegistroRapido = false"
      @paciente-creado="manejarPacienteCreado"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCarritoStore } from '../store/carritoStore'
import ventasService from '../services/ventasService'
import turnosService from '../services/turnosService'
import pacientesService from '../services/pacientesService'
import farmaciaService from '../services/farmaciaService'
import serviciosService from '../services/serviciosService'
import extrasService from '../services/extrasService'
import authService from '../services/authService'
import SelectorDoctora from '@/components/SelectorDoctora.vue'
import ModalRegistroPacienteRapido from '@/components/ModalRegistroPacienteRapido.vue'


const carritoStore = useCarritoStore()

// Estado
const turnoActivo = ref(null)
const mostrarModalAbrirTurno = ref(false)
const efectivoInicial = ref(0)
const busquedaPaciente = ref('')
const pacientesEncontrados = ref([])
const tipoProductoSeleccionado = ref('medicamento')
const busquedaProducto = ref('')
const productosEncontrados = ref([])
const procesandoVenta = ref(false)
const descuentoTemporal = ref(0)

// ============================================================================
// NUEVAS VARIABLES PARA MODALES DE VOUCHERS/TRANSFERENCIAS/DEPÓSITOS
// ============================================================================
const mostrarModalVoucher = ref(false)
const mostrarModalTransferencia = ref(false)
const mostrarModalDeposito = ref(false)
const mostrarModalRegistroRapido = ref(false)

const datosVoucher = ref({
  numero: '',
  monto: 0
})

const datosTransferencia = ref({
  numero: '',
  monto: 0
})

const datosDeposito = ref({
  numero: '',
  monto: 0
})

// ============================================================================
// VARIABLES PARA PAGO MIXTO
// ============================================================================
const modalesToShow = ref([]) // Array con los modales a mostrar: ['voucher', 'transferencia', 'deposito']
const currentModalIndex = ref(0) // Índice del modal actual
const datosPagoMixto = ref({
  voucher_numero: null,
  transferencia_numero: null,
  deposito_numero: null,
  tarjeta: 0,
  transferencia: 0,
  deposito: 0
})

onMounted(async () => {
  console.log('🛒 ===== CARRITO MONTADO =====')
  console.log('✅ CARRITO LISTO (modo testing)')
})

// Gestión de turnos
async function abrirTurno() {
  try {
    console.log('🔓 Intentando abrir turno con efectivo:', efectivoInicial.value)
    const resultado = await turnosService.abrirTurno(efectivoInicial.value)
    if (resultado.success) {
      turnoActivo.value = resultado.data
      mostrarModalAbrirTurno.value = false
      efectivoInicial.value = 0
      alert('✅ Turno abierto exitosamente')
    }
  } catch (error) {
    console.error('❌ Error completo:', error)
    alert('❌ Error al abrir turno: ' + error.message)
  }
}

// Búsqueda de pacientes
let timeoutBusquedaPaciente = null

async function buscarPacientes() {
  clearTimeout(timeoutBusquedaPaciente)
  
  if (busquedaPaciente.value.length < 2) {
    pacientesEncontrados.value = []
    return
  }
  
  timeoutBusquedaPaciente = setTimeout(async () => {
    try {
      console.log('🔍 Buscando pacientes:', busquedaPaciente.value)
      const response = await pacientesService.getPacientes({
        search: busquedaPaciente.value,
        limit: 5
      })
      console.log('📦 Pacientes encontrados:', response.data)
      pacientesEncontrados.value = response.data || []
    } catch (error) {
      console.error('❌ Error buscando pacientes:', error)
    }
  }, 300)
}

function seleccionarPaciente(paciente) {
  // Normalizar nombres
  const pacienteNormalizado = {
    ...paciente,
    nombre: paciente.nombres || paciente.nombre,
    apellido: paciente.apellidos || paciente.apellido
  }
  carritoStore.setPaciente(pacienteNormalizado)
  busquedaPaciente.value = ''
  pacientesEncontrados.value = []
}

// Función para manejar el paciente creado desde el modal rápido
function manejarPacienteCreado(paciente) {
  console.log('✅ Paciente creado desde modal rápido:', paciente)
  
  // Normalizar nombres para el carrito
  const pacienteNormalizado = {
    ...paciente,
    nombre: paciente.nombres || paciente.nombre,
    apellido: paciente.apellidos || paciente.apellido
  }
  
  // Seleccionar el paciente recién creado
  carritoStore.setPaciente(pacienteNormalizado)
  
  // Limpiar búsqueda
  busquedaPaciente.value = ''
  pacientesEncontrados.value = []
  
  console.log('✅ Paciente seleccionado en el carrito')
}

// Búsqueda de productos
let timeoutBusquedaProducto = null

function cambiarTipoProducto(tipo) {
  tipoProductoSeleccionado.value = tipo
  productosEncontrados.value = []
  busquedaProducto.value = ''
}

async function buscarProductos() {
  clearTimeout(timeoutBusquedaProducto)
  
  if (busquedaProducto.value.length < 2) {
    productosEncontrados.value = []
    return
  }
  
  timeoutBusquedaProducto = setTimeout(async () => {
    try {
      console.log(`🔍 Buscando ${tipoProductoSeleccionado.value}:`, busquedaProducto.value)
      let response
      let productos = []
      
      if (tipoProductoSeleccionado.value === 'medicamento') {
        response = await farmaciaService.getMedicamentos({
          search: busquedaProducto.value,
          limit: 10
        })
        // El backend devuelve { data: { medicamentos: [...] } }
        productos = response.data?.medicamentos || response.medicamentos || []
        
        // Normalizar: asegurar que tenga campo 'nombre'
        productos = productos.map(m => ({
          ...m,
          nombre: m.nombre || m.nombre_medicamento
        }))
        
      } else if (tipoProductoSeleccionado.value === 'servicio') {
        response = await serviciosService.getServicios({
          search: busquedaProducto.value,
          limit: 10
        })
        // El backend devuelve { data: [...] } (array directo) o { data: { servicios: [...] } }
        if (Array.isArray(response.data)) {
          productos = response.data
        } else {
          productos = response.data?.servicios || response.servicios || []
        }
        
        // 🔧 FIX CRÍTICO: Servicios usan 'nombre_servicio' en lugar de 'nombre'
        productos = productos.map(s => ({
          ...s,
          nombre: s.nombre_servicio || s.nombre
        }))
        
      } else if (tipoProductoSeleccionado.value === 'extra') {
        response = await extrasService.getExtras({
          search: busquedaProducto.value,
          limit: 10
        })
        // El backend devuelve { data: { extras: [...] } } o { extras: [...] }
        productos = response.data?.extras || response.extras || []
        
        // Normalizar: asegurar que tenga campo 'nombre'
        productos = productos.map(e => ({
          ...e,
          nombre: e.nombre || e.nombre_extra
        }))
      }
      
      productosEncontrados.value = productos
      console.log(`✅ ${productos.length} productos encontrados`)
      
      // Debug: mostrar primer producto
      if (productos.length > 0) {
        console.log('📦 Primer producto:', productos[0])
      }
      
    } catch (error) {
      console.error('❌ Error buscando productos:', error)
      console.error('📋 Detalles del error:', error.response?.data)
      productosEncontrados.value = []
    }
  }, 300)
}

// Gestión del carrito
function agregarAlCarrito(producto) {
  // ✅ Siempre usar precio de TARJETA
  const precioUnitario = producto.precio
  
  // 🔧 Normalizar nombre del producto
  const nombreProducto = producto.nombre || producto.nombre_servicio || producto.nombre_medicamento || producto.nombre_extra
  
  const productoParaCarrito = {
    tipo_producto: tipoProductoSeleccionado.value,
    producto_id: producto.id,
    producto_nombre: nombreProducto,
    cantidad: 1,
    precio_unitario: precioUnitario,
    precio_tipo: 'tarjeta', // ✅ Siempre tarjeta
    comision_porcentaje: producto.porcentaje_comision || producto.comision_venta || 0,
    presentacion: producto.presentacion_nombre || null,
    laboratorio: producto.laboratorio_nombre || null,
    existencias: producto.existencias || null
  }
  
  console.log('🛒 Agregando al carrito:', productoParaCarrito)
  
  const resultado = carritoStore.agregarProducto(productoParaCarrito)
  
  if (resultado.success) {
    console.log('✅ Producto agregado al carrito')
    // Opcional: mostrar feedback visual
    // Puedes agregar una notificación toast aquí si quieres
  } else {
    console.error('❌ Error agregando producto:', resultado.message)
    alert('❌ ' + resultado.message)
  }
}

// FIX: Descuento requiere contraseña admin
async function aplicarDescuentoConPassword() {
  // Si el descuento es 0 o no cambió, no hacer nada
  if (descuentoTemporal.value === 0 || descuentoTemporal.value === carritoStore.descuentoGlobal) {
    return
  }
  
  // Si intenta REDUCIR el descuento (ej: de 10% a 5%), permitir sin contraseña
  if (descuentoTemporal.value < carritoStore.descuentoGlobal) {
    carritoStore.setDescuento(descuentoTemporal.value)
    console.log('✅ Descuento reducido sin contraseña:', descuentoTemporal.value)
    return
  }
  
  // Si intenta AUMENTAR el descuento (ej: de 0% a 10%), SIEMPRE pedir contraseña
  if (descuentoTemporal.value > carritoStore.descuentoGlobal) {
    const usuario = authService.getUser()
    console.log('👤 Usuario actual:', usuario)
    console.log('📊 Descuento actual:', carritoStore.descuentoGlobal, '% → Nuevo:', descuentoTemporal.value, '%')
    
    // 🔐 IMPORTANTE: Pedir contraseña SIEMPRE (incluso si es admin)
    const password = prompt(
      '🔐 Se requiere contraseña de ADMINISTRADOR para aplicar/aumentar descuentos:\n\n' +
      (usuario.rol_nombre === 'administrador' 
        ? '(Ingresa TU contraseña de admin para confirmar)' 
        : '(Ingresa la contraseña de cualquier administrador)')
    )
    
    // Si el usuario cancela el prompt
    if (password === null) {
      descuentoTemporal.value = carritoStore.descuentoGlobal
      console.log('❌ Usuario canceló ingreso de contraseña')
      alert('❌ Descuento cancelado')
      return
    }
    
    // Si el usuario ingresa una contraseña vacía
    if (password.trim().length === 0) {
      descuentoTemporal.value = carritoStore.descuentoGlobal
      alert('❌ Contraseña no puede estar vacía')
      return
    }
    
    // Guardar descuento anterior para revertir en caso de error
    const descuentoAnterior = carritoStore.descuentoGlobal
    console.log('🔄 Verificando contraseña con el servidor...')
    
    try {
      // ✅ Verificar contraseña contra el backend
      const validacion = await authService.verificarPasswordAdmin(password)
      
      if (validacion.success) {
        // ✅ Contraseña válida - aplicar descuento
        carritoStore.setDescuento(descuentoTemporal.value)
        console.log('✅ Descuento aplicado:', descuentoTemporal.value, '%')
        console.log('👤 Autorizado por:', validacion.data?.admin_verificado || 'Administrador')
        
        alert(
          `✅ Descuento del ${descuentoTemporal.value}% aplicado correctamente\n\n` +
          `Autorizado por: ${validacion.data?.admin_verificado || 'Administrador'}`
        )
      } else {
        // ❌ Contraseña incorrecta - revertir descuento
        descuentoTemporal.value = descuentoAnterior
        console.error('❌ Contraseña incorrecta')
        
        alert(
          `❌ ${validacion.message || 'Contraseña incorrecta'}\n\n` +
          'El descuento NO fue aplicado.'
        )
      }
    } catch (error) {
      // ❌ Error de conexión u otro error
      descuentoTemporal.value = descuentoAnterior
      console.error('❌ Error verificando contraseña:', error)
      
      alert(
        '❌ Error al verificar la contraseña\n\n' +
        'Por favor verifica tu conexión e intenta nuevamente.'
      )
    }
  }
}

// Procesar venta - MODIFICADO para capturar datos de vouchers/transferencias/depósitos
async function procesarVenta() {
  console.log('🛒 INICIANDO PROCESO DE VENTA')
  
  // ✅ PASO 1: Validar carrito
  const validacion = carritoStore.validarCarrito()
  if (!validacion.valido) {
    alert('❌ Errores:\n' + validacion.errores.join('\n'))
    return
  }
  
  // ✅ PASO 2: VERIFICAR TURNO ACTIVO (CRÍTICO)
  try {
    console.log('🔍 Verificando turno activo...')
    const resultadoTurno = await turnosService.obtenerTurnoActivo()
    
    if (!resultadoTurno.success || !resultadoTurno.data) {
      console.log('⚠️ No hay turno activo')
      
      const abrirTurnoAhora = confirm(
        '⚠️ No hay un turno activo\n\n' +
        'Debe abrir un turno antes de realizar ventas.\n\n' +
        '¿Desea abrir un turno ahora?'
      )
      
      if (abrirTurnoAhora) {
        mostrarModalAbrirTurno.value = true
      }
      
      return
    }
    
    turnoActivo.value = resultadoTurno.data
    console.log('✅ Turno activo encontrado:', turnoActivo.value.id)
    
  } catch (error) {
    console.error('❌ Error verificando turno:', error)
    alert('❌ Error al verificar turno. Intente nuevamente.')
    return
  }
  
  // ✅ PASO 3: CAPTURAR DATOS DE VOUCHER/TRANSFERENCIA/DEPÓSITO SEGÚN MÉTODO DE PAGO
  const metodoPago = carritoStore.metodoPago
  
  // 3.1 Si es TARJETA - solicitar número de voucher
  if (metodoPago === 'tarjeta') {
    datosVoucher.value.monto = carritoStore.total
    mostrarModalVoucher.value = true
    return // Esperar a que se complete el modal
  }
  
  // 3.2 Si es TRANSFERENCIA - solicitar número de boleta
  if (metodoPago === 'transferencia') {
    datosTransferencia.value.monto = carritoStore.total
    mostrarModalTransferencia.value = true
    return // Esperar a que se complete el modal
  }
  
  // 3.3 Si es DEPÓSITO - solicitar número de depósito
  if (metodoPago === 'deposito') {
    datosDeposito.value.monto = carritoStore.total
    mostrarModalDeposito.value = true
    return // Esperar a que se complete el modal
  }
  
  // 3.4 Si es MIXTO - solicitar datos según los métodos usados
  if (metodoPago === 'mixto') {
    // Validar que los montos sumen el total
    const totalIngresado = 
      (carritoStore.montoEfectivo || 0) + 
      (carritoStore.montoTarjeta || 0) + 
      (carritoStore.montoTransferencia || 0) + 
      (carritoStore.montoDeposito || 0)
    
    if (Math.abs(totalIngresado - carritoStore.total) > 0.01) {
      alert(
        `❌ Error en montos\n\n` +
        `Total de la venta: Q${carritoStore.total.toFixed(2)}\n` +
        `Total ingresado: Q${totalIngresado.toFixed(2)}\n\n` +
        `Los montos deben sumar exactamente el total de la venta.`
      )
      return
    }
    
    // Inicializar objeto para recolectar datos
    datosPagoMixto.value = {
      tarjeta: carritoStore.montoTarjeta || 0,
      transferencia: carritoStore.montoTransferencia || 0,
      deposito: carritoStore.montoDeposito || 0
    }
    
    // Determinar qué modales mostrar según los montos
    modalesToShow.value = []
    
    if (carritoStore.montoTarjeta > 0) {
      modalesToShow.value.push('voucher')
    }
    if (carritoStore.montoTransferencia > 0) {
      modalesToShow.value.push('transferencia')
    }
    if (carritoStore.montoDeposito > 0) {
      modalesToShow.value.push('deposito')
    }
    
    // Si no hay métodos no-efectivo, procesar directamente
    if (modalesToShow.value.length === 0) {
      const confirmar = confirm(
        `¿Confirmar venta por Q${carritoStore.total.toFixed(2)}?\n\n` +
        `Pago 100% en efectivo`
      )
      if (!confirmar) return
      await ejecutarVenta()
      return
    }
    
    // Mostrar el primer modal
    currentModalIndex.value = 0
    mostrarSiguienteModalMixto()
    return
  }
  
  // ✅ PASO 4: Si es EFECTIVO, confirmar y procesar directamente
  if (metodoPago === 'efectivo') {
    const confirmar = confirm(
      `¿Confirmar venta por Q${carritoStore.total.toFixed(2)}?`
    )
    if (!confirmar) return
  }
  
  // ✅ PASO 5: Ejecutar la venta
  await ejecutarVenta()
}

// Nueva función auxiliar para ejecutar la venta
async function ejecutarVenta(datosAdicionales = {}) {
  procesandoVenta.value = true
  
  try {
    const usuario = authService.getUser()
    console.log('👤 Usuario para venta:', usuario)
    
    if (!usuario || !usuario.id) {
      throw new Error('No se pudo obtener información del usuario. Por favor inicie sesión nuevamente.')
    }
    
    const datosVenta = carritoStore.obtenerDatosVenta(turnoActivo.value.id, usuario.id)
    
    if (!datosVenta.success) {
      throw new Error(datosVenta.message)
    }
    
    // Agregar datos de voucher/transferencia/depósito si existen
    const ventaConDatos = {
      ...datosVenta.data,
      ...datosAdicionales
    }
    
    console.log('📦 Enviando venta con datos:', ventaConDatos)
    const response = await ventasService.crearVenta(ventaConDatos)
    
    if (response.success) {
      console.log('✅ Venta exitosa:', response.data)
      
      // ✅ DESCARGA AUTOMÁTICA DEL PDF
      if (response.data.pdf) {
        console.log('📄 Descargando PDF automáticamente...')
        
        try {
          // Convertir base64 a blob
          const byteCharacters = atob(response.data.pdf)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: 'application/pdf' })
          
          // Crear enlace de descarga
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `Comprobante-${response.data.numero_factura}.pdf`
          document.body.appendChild(a)
          a.click()
          
          // Limpiar
          setTimeout(() => {
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
          }, 100)
          
          console.log('✅ PDF descargado automáticamente')
          
        } catch (pdfError) {
          console.error('❌ Error descargando PDF:', pdfError)
          alert('⚠️ Venta exitosa pero hubo un error al descargar el PDF.\nPuede generarlo desde el historial de ventas.')
        }
      }
      
      // Mostrar mensaje de éxito
      alert(
        '✅ Venta realizada exitosamente!\n\n' +
        `📋 Factura: ${response.data.numero_factura}\n` +
        `💰 Total: Q${parseFloat(response.data.total).toFixed(2)}\n` +
        `💳 Método: ${response.data.metodo_pago.toUpperCase()}\n\n` +
        '📄 El comprobante se descargó automáticamente'
      )
      
      // Limpiar carrito y formulario
      carritoStore.vaciarCarrito()
      busquedaProducto.value = ''
      productosEncontrados.value = []
      descuentoTemporal.value = 0
      
      // Limpiar datos de vouchers/transferencias/depósitos
      datosVoucher.value = { numero: '', monto: 0 }
      datosTransferencia.value = { numero: '', monto: 0 }
      datosDeposito.value = { numero: '', monto: 0 }
    }
    
  } catch (error) {
    console.error('❌ Error completo:', error)
    
    let mensajeError = error.message
    
    if (error.response?.status === 403) {
      const errorData = error.response.data
      if (errorData.codigo === 'TURNO_NO_ABIERTO') {
        mensajeError = '⚠️ ' + errorData.message + '\n\n' + 
                      'Acción requerida: ' + errorData.accion_requerida
        
        const abrirTurno = confirm(mensajeError + '\n\n¿Abrir turno ahora?')
        if (abrirTurno) {
          mostrarModalAbrirTurno.value = true
        }
      } else {
        mensajeError = errorData.message || 'No tiene permisos para realizar esta acción'
      }
    } else if (error.response?.status === 401) {
      mensajeError = 'Error de autenticación. Verifique que su sesión esté activa.'
    } else if (error.response?.data?.message) {
      mensajeError = error.response.data.message
    }
    
    alert('❌ Error: ' + mensajeError)
    
  } finally {
    procesandoVenta.value = false
  }
}


// ============================================================================
// FUNCIONES PARA MANEJAR MODALES DE VOUCHERS/TRANSFERENCIAS/DEPÓSITOS
// ============================================================================

function confirmarVoucher() {
  // Si estamos en modo pago mixto
  if (modalesToShow.value.length > 0) {
    confirmarVoucherMixto()
    return
  }
  
  // Si es pago simple (solo tarjeta)
  if (!datosVoucher.value.numero || datosVoucher.value.numero.trim() === '') {
    alert('❌ Debe ingresar el número de voucher')
    return
  }
  
  mostrarModalVoucher.value = false
  
  // Ejecutar venta con datos del voucher
  ejecutarVenta({
    voucher_numero: datosVoucher.value.numero.trim()
  })
}

function confirmarTransferencia() {
  // Si estamos en modo pago mixto
  if (modalesToShow.value.length > 0) {
    confirmarTransferenciaMixto()
    return
  }
  
  // Si es pago simple (solo transferencia)
  if (!datosTransferencia.value.numero || datosTransferencia.value.numero.trim() === '') {
    alert('❌ Debe ingresar el número de boleta')
    return
  }
  
  mostrarModalTransferencia.value = false
  
  // Ejecutar venta con datos de la transferencia
  ejecutarVenta({
    transferencia_numero: datosTransferencia.value.numero.trim()
  })
}

function confirmarDeposito() {
  // Si estamos en modo pago mixto
  if (modalesToShow.value.length > 0) {
    confirmarDepositoMixto()
    return
  }
  
  // Si es pago simple (solo depósito)
  if (!datosDeposito.value.numero || datosDeposito.value.numero.trim() === '') {
    alert('❌ Debe ingresar el número de depósito')
    return
  }
  
  mostrarModalDeposito.value = false
  
  // Ejecutar venta con datos del depósito
  ejecutarVenta({
    deposito_numero: datosDeposito.value.numero.trim()
  })
}

function cancelarModal() {
  // Si estamos en pago mixto, usar función específica
  if (modalesToShow.value.length > 0) {
    cancelarModalMixto()
    return
  }
  
  // Si es pago simple
  mostrarModalVoucher.value = false
  mostrarModalTransferencia.value = false
  mostrarModalDeposito.value = false
  
  datosVoucher.value = { numero: '', monto: 0 }
  datosTransferencia.value = { numero: '', monto: 0 }
  datosDeposito.value = { numero: '', monto: 0 }
}

// ============================================================================
// FUNCIONES PARA PAGO MIXTO
// ============================================================================

function mostrarSiguienteModalMixto() {
  if (currentModalIndex.value >= modalesToShow.value.length) {
    // Ya se completaron todos los modales, procesar venta
    procesarVentaMixta()
    return
  }
  
  const modalActual = modalesToShow.value[currentModalIndex.value]
  
  if (modalActual === 'voucher') {
    datosVoucher.value.monto = datosPagoMixto.value.tarjeta
    mostrarModalVoucher.value = true
  } else if (modalActual === 'transferencia') {
    datosTransferencia.value.monto = datosPagoMixto.value.transferencia
    mostrarModalTransferencia.value = true
  } else if (modalActual === 'deposito') {
    datosDeposito.value.monto = datosPagoMixto.value.deposito
    mostrarModalDeposito.value = true
  }
}

function confirmarVoucherMixto() {
  if (!datosVoucher.value.numero || datosVoucher.value.numero.trim() === '') {
    alert('❌ Debe ingresar el número de voucher')
    return
  }
  
  // Guardar datos
  datosPagoMixto.value.voucher_numero = datosVoucher.value.numero.trim()
  
  // Cerrar modal
  mostrarModalVoucher.value = false
  datosVoucher.value = { numero: '', monto: 0 }
  
  // Siguiente modal
  currentModalIndex.value++
  mostrarSiguienteModalMixto()
}

function confirmarTransferenciaMixto() {
  if (!datosTransferencia.value.numero || datosTransferencia.value.numero.trim() === '') {
    alert('❌ Debe ingresar el número de boleta')
    return
  }
  
  // Guardar datos
  datosPagoMixto.value.transferencia_numero = datosTransferencia.value.numero.trim()
  
  // Cerrar modal
  mostrarModalTransferencia.value = false
  datosTransferencia.value = { numero: '', monto: 0 }
  
  // Siguiente modal
  currentModalIndex.value++
  mostrarSiguienteModalMixto()
}

function confirmarDepositoMixto() {
  if (!datosDeposito.value.numero || datosDeposito.value.numero.trim() === '') {
    alert('❌ Debe ingresar el número de depósito')
    return
  }
  
  // Guardar datos
  datosPagoMixto.value.deposito_numero = datosDeposito.value.numero.trim()
  
  // Cerrar modal
  mostrarModalDeposito.value = false
  datosDeposito.value = { numero: '', monto: 0 }
  
  // Siguiente modal
  currentModalIndex.value++
  mostrarSiguienteModalMixto()
}

async function procesarVentaMixta() {
  // Preparar datos adicionales
  const datosAdicionales = {}
  
  if (datosPagoMixto.value.voucher_numero) {
    datosAdicionales.voucher_numero = datosPagoMixto.value.voucher_numero
  }
  if (datosPagoMixto.value.transferencia_numero) {
    datosAdicionales.transferencia_numero = datosPagoMixto.value.transferencia_numero
  }
  if (datosPagoMixto.value.deposito_numero) {
    datosAdicionales.deposito_numero = datosPagoMixto.value.deposito_numero
  }
  
  // Ejecutar venta
  await ejecutarVenta(datosAdicionales)
  
  // Limpiar datos de pago mixto
  datosPagoMixto.value = {
    voucher_numero: null,
    transferencia_numero: null,
    deposito_numero: null,
    tarjeta: 0,
    transferencia: 0,
    deposito: 0
  }
  modalesToShow.value = []
  currentModalIndex.value = 0
}

function cancelarModalMixto() {
  mostrarModalVoucher.value = false
  mostrarModalTransferencia.value = false
  mostrarModalDeposito.value = false
  
  datosVoucher.value = { numero: '', monto: 0 }
  datosTransferencia.value = { numero: '', monto: 0 }
  datosDeposito.value = { numero: '', monto: 0 }
  
  // Limpiar datos de pago mixto
  datosPagoMixto.value = {
    voucher_numero: null,
    transferencia_numero: null,
    deposito_numero: null,
    tarjeta: 0,
    transferencia: 0,
    deposito: 0
  }
  modalesToShow.value = []
  currentModalIndex.value = 0
}

// Función para manejar cambio de cantidad con validación
function cambiarCantidad(itemId, nuevaCantidad) {
  const resultado = carritoStore.actualizarCantidad(itemId, nuevaCantidad)
  
  if (resultado && !resultado.success) {
    alert(resultado.message)
  }
}

// Función para formatear números con comas
function formatearNumero(numero) {
  return numero.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}

// Formatear input de efectivo mientras se escribe
function formatearInputEfectivo(event) {
  const valor = event.target.value.replace(/,/g, '')
  const numero = parseFloat(valor)
  
  if (!isNaN(numero)) {
    carritoStore.montoEfectivo = numero
  } else {
    carritoStore.montoEfectivo = 0
  }
}
</script>

<style scoped>
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200;
}
</style>