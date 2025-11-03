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
              {{ tipo === 'medicamento' ? '💊 Medicamentos' : tipo === 'servicio' ? '🏥 Servicios' : '🧰 Extras' }}
            </button>
          </div>
          
          <!-- Búsqueda -->
          <input
            v-model="busquedaProducto"
            @input="buscarProductos"
            type="text"
            placeholder="Buscar productos..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <!-- Resultados -->
          <div v-if="productosEncontrados.length > 0" class="mt-3 space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="producto in productosEncontrados"
              :key="`${tipoProductoSeleccionado}-${producto.id}`"
              class="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="font-medium text-gray-900">{{ producto.nombre }}</div>
                  <div class="text-sm text-gray-500 mt-1">
                    <span v-if="tipoProductoSeleccionado === 'medicamento'" class="mr-3">
                      📦 Stock: {{ producto.existencias || 0 }}
                    </span>
                    <span class="text-green-700 font-medium">Q{{ producto.precio_efectivo }}</span>
                    <span class="text-blue-700 font-medium ml-2">/ Q{{ producto.precio_tarjeta }}</span>
                  </div>
                </div>
                
                <div class="flex gap-2">
                  <button
                    @click="agregarAlCarrito(producto, 'efectivo')"
                    class="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    + Efectivo
                  </button>
                  <button
                    @click="agregarAlCarrito(producto, 'tarjeta')"
                    class="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    + Tarjeta
                  </button>
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
                    <span :class="item.precio_tipo === 'efectivo' ? 'text-green-700' : 'text-blue-700'">
                      {{ item.precio_tipo === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta' }}
                    </span>
                    <span class="ml-2 font-medium">Q{{ item.precio_unitario }}</span>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <button
                    @click="carritoStore.actualizarCantidad(item.id, item.cantidad - 1)"
                    class="w-8 h-8 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    -
                  </button>
                  <span class="w-12 text-center font-medium">{{ item.cantidad }}</span>
                  <button
                    @click="carritoStore.actualizarCantidad(item.id, item.cantidad + 1)"
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
                <span class="font-semibold text-gray-900">Q{{ item.subtotal.toFixed(2) }}</span>
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
              <span class="font-medium">Q{{ carritoStore.subtotal.toFixed(2) }}</span>
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
                <span class="text-blue-600">Q{{ carritoStore.total.toFixed(2) }}</span>
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
              <option value="mixto">💰 Pago Mixto</option>
            </select>
          </div>
          
          <!-- Campos según método -->
          <div class="mt-3 space-y-2">
            <div v-if="carritoStore.metodoPago === 'efectivo'">
              <label class="block text-sm font-medium text-gray-700 mb-1">Efectivo recibido</label>
              <input
                v-model.number="carritoStore.montoEfectivo"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="0.00"
              />
              <div v-if="carritoStore.montoEfectivo >= carritoStore.total" class="mt-1 text-sm text-green-600">
                Cambio: Q{{ (carritoStore.montoEfectivo - carritoStore.total).toFixed(2) }}
              </div>
            </div>
            
            <div v-if="carritoStore.metodoPago === 'mixto'" class="space-y-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">💵 Efectivo</label>
                <input
                  v-model.number="carritoStore.montoEfectivo"
                  type="number"
                  step="0.01"
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
              <div class="text-sm">
                Total ingresado: Q{{ (carritoStore.montoEfectivo + carritoStore.montoTarjeta + carritoStore.montoTransferencia).toFixed(2) }}
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
              :disabled="carritoStore.carritoVacio || procesandoVenta"
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

console.log('🛒 ===== CARRITO VIEW CARGANDO =====')

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
function agregarAlCarrito(producto, tipoPrecio) {
  const precioUnitario = tipoPrecio === 'efectivo' ? producto.precio_efectivo : producto.precio_tarjeta
  
  // 🔧 FIX: Normalizar nombre del producto
  const nombreProducto = producto.nombre || producto.nombre_servicio || producto.nombre_medicamento || producto.nombre_extra
  
  const productoParaCarrito = {
    tipo_producto: tipoProductoSeleccionado.value,
    producto_id: producto.id,
    producto_nombre: nombreProducto, // ✅ Usar nombre normalizado
    cantidad: 1,
    precio_unitario: precioUnitario,
    precio_tipo: tipoPrecio,
    comision_porcentaje: producto.porcentaje_comision || producto.comision_venta || 0,
    presentacion: producto.presentacion_nombre || null,
    laboratorio: producto.laboratorio_nombre || null,
    existencias: producto.existencias || null
  }
  
  console.log('🛒 Agregando al carrito:', productoParaCarrito)
  
  const resultado = carritoStore.agregarProducto(productoParaCarrito)
  
  if (resultado.success) {
    console.log('✅ Producto agregado al carrito')
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

// Procesar venta - FIX: Obtener usuario correctamente
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
      // ❌ NO HAY TURNO ACTIVO
      console.log('⚠️ No hay turno activo')
      
      const abrirTurnoAhora = confirm(
        '⚠️ No hay un turno activo\n\n' +
        'Debe abrir un turno antes de realizar ventas.\n\n' +
        '¿Desea abrir un turno ahora?'
      )
      
      if (abrirTurnoAhora) {
        mostrarModalAbrirTurno.value = true
      }
      
      return // Detener el proceso de venta
    }
    
    // ✅ HAY TURNO ACTIVO
    turnoActivo.value = resultadoTurno.data
    console.log('✅ Turno activo encontrado:', turnoActivo.value.id)
    
  } catch (error) {
    console.error('❌ Error verificando turno:', error)
    alert('❌ Error al verificar turno. Intente nuevamente.')
    return
  }
  
  // ✅ PASO 3: Confirmar venta
  const confirmar = confirm(
    `¿Confirmar venta por Q${carritoStore.total.toFixed(2)}?`
  )
  if (!confirmar) return
  
  // ✅ PASO 4: Procesar venta
  procesandoVenta.value = true
  
  try {
    // Obtener usuario
    const usuario = authService.getUser()
    console.log('👤 Usuario para venta:', usuario)
    
    if (!usuario || !usuario.id) {
      throw new Error('No se pudo obtener información del usuario. Por favor inicie sesión nuevamente.')
    }
    
    // Preparar datos de venta con el turno activo
    const datosVenta = carritoStore.obtenerDatosVenta(turnoActivo.value.id, usuario.id)
    
    if (!datosVenta.success) {
      throw new Error(datosVenta.message)
    }
    
    console.log('📦 Enviando venta con datos:', datosVenta.data)
    const response = await ventasService.crearVenta(datosVenta.data)
    
    if (response.success) {
      alert('✅ Venta exitosa!\n\nFactura: ' + response.data.numero_factura)
      
      const verComprobante = confirm('¿Ver comprobante?')
      if (verComprobante) {
        await ventasService.generarComprobante(response.data.id)
      }
      
      // Limpiar carrito y formulario
      carritoStore.vaciarCarrito()
      busquedaProducto.value = ''
      productosEncontrados.value = []
      descuentoTemporal.value = 0
    }
    
  } catch (error) {
    console.error('❌ Error completo:', error)
    console.error('📋 Detalles:', {
      message: error.message,
      response: error.response,
      config: error.config
    })
    
    // Mensaje más específico según el error
    let mensajeError = error.message
    
    if (error.response?.status === 403) {
      // Error 403 - Sin turno o sin permisos
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
</script>

<style scoped>
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200;
}
</style>