<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6">
    <!-- Header -->
    <header class="max-w-7xl mx-auto mb-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <!-- Botón Volver -->
        <button
          @click="$router.push('/')"
          class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          <span>Menú Principal</span>
        </button>

        <div class="text-center flex-1">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">📋 Historial de Ventas</h1>
          <p class="text-gray-600 mt-1">Consulta y descarga comprobantes de ventas anteriores</p>
        </div>

        <div class="w-32"></div> <!-- Espaciador para centrar el título -->
      </div>
    </header>

    <!-- Mensaje de error -->
    <div v-if="error" class="max-w-7xl mx-auto mb-6">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center">
          <span class="text-red-600 mr-2">⚠️</span>
          <span class="text-red-800">{{ error }}</span>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="max-w-7xl mx-auto mb-6">
      <div class="card p-4 sm:p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">🔍 Filtros de Búsqueda</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Fecha Inicio -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              v-model="filtros.fecha_inicio"
              type="date"
              class="input-base"
              @change="cargarVentas"
            />
          </div>

          <!-- Fecha Fin -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              v-model="filtros.fecha_fin"
              type="date"
              class="input-base"
              @change="cargarVentas"
            />
          </div>

          <!-- Método de Pago -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
            <select v-model="filtros.metodo_pago" class="input-base" @change="cargarVentas">
              <option value="">Todos</option>
              <option value="efectivo">💵 Efectivo</option>
              <option value="tarjeta">💳 Tarjeta</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="deposito">🏧 Depósito</option>
              <option value="mixto">🔄 Mixto</option>
            </select>
          </div>

          <!-- Número de Factura -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Número de Factura</label>
            <input
              v-model="filtros.numero_factura"
              type="text"
              placeholder="Ej: FAC-001"
              class="input-base"
              @input="buscarConDelay"
            />
          </div>
        </div>

        <!-- Acciones -->
        <div class="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
          <button @click="limpiarFiltros" class="btn-secondary text-sm">
            🧹 Limpiar Filtros
          </button>
          
          <div class="text-sm text-gray-600">
            {{ pagination.total || ventas.length }} venta(s) encontrada(s)
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de Ventas -->
    <div class="max-w-7xl mx-auto">
      <div class="card overflow-hidden">
        <!-- Loading -->
        <div v-if="cargando" class="flex justify-center items-center p-8">
          <div class="flex items-center space-x-2">
            <div class="spinner"></div>
            <span class="text-gray-600">Cargando ventas...</span>
          </div>
        </div>

        <!-- Tabla -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factura
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método Pago
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr 
                v-for="venta in ventasFormateadas" 
                :key="venta.id" 
                :class="ventaEstaAnulada(venta) 
                  ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500' 
                  : 'hover:bg-gray-50'"
              >
                <!-- Número Factura -->
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">{{ venta.numero_factura }}</div>
                  <div class="text-xs text-gray-500">ID: {{ venta.id }}</div>
                </td>

                <!-- Fecha -->
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ formatearFecha(venta.fecha_creacion) }}</div>
                </td>

                <!-- Paciente -->
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ venta.cliente_nombre || 'Sin nombre' }}</div>
                  <div v-if="venta.cliente_telefono" class="text-xs text-gray-500">
                    📞 {{ venta.cliente_telefono }}
                  </div>
                </td>

                <!-- Método de Pago -->
                <td class="px-6 py-4">
                  <span :class="getMetodoPagoColor(venta.metodo_pago)" class="px-2 py-1 text-xs rounded-full">
                    {{ getMetodoPagoTexto(venta.metodo_pago) }}
                  </span>
                </td>

                <!-- Total -->
                <td class="px-6 py-4">
                  <div class="text-sm font-semibold text-gray-900">Q {{ formatearNumero(venta.total) }}</div>
                  <div v-if="venta.descuento > 0" class="text-xs text-gray-500">
                    Desc: Q {{ formatearNumero(venta.descuento) }}
                  </div>
                </td>

                <!-- Vendedor -->
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ venta.vendedor_nombre || 'N/A' }}</div>
                </td>

                <!-- Acciones -->
                <td class="px-6 py-4">
                  <div class="flex gap-2">
                    <!-- Ver Detalle -->
                    <button
                      @click="verDetalle(venta)"
                      class="btn-icon btn-blue"
                      title="Ver detalle completo"
                    >
                      👁️
                    </button>

                    <!-- Descargar PDF -->
                    <button
                      @click="descargarPDF(venta)"
                      class="btn-icon btn-green"
                      title="Descargar comprobante PDF"
                    >
                      📄
                    </button>

                    <!-- Eliminar Venta -->
                    <button
                      @click="abrirModalAnular(venta)"
                      class="btn-icon btn-red"
                      title="Anular venta"
                      :disabled="ventaEstaAnulada(venta)"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Estado vacío -->
          <div v-if="!ventas.length && !cargando" class="text-center py-8">
            <span class="text-4xl mb-4 block">📋</span>
            <p class="text-gray-500 text-lg">No se encontraron ventas</p>
            <p class="text-gray-400 text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
          </div>
        </div>

        <!-- Paginación -->
        <div v-if="pagination.total_pages > 1" class="px-6 py-3 border-t bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Página {{ pagination.current_page }} de {{ pagination.total_pages }}
              ({{ pagination.total }} ventas)
            </div>
            
            <div class="flex space-x-1">
              <button
                v-for="page in paginasVisibles"
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
    </div>

    <!-- Modal Detalle de Venta -->
    <div v-if="modalDetalle.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div class="p-6">
          <!-- Header del Modal -->
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                📋 Detalle de Venta
              </h3>
              <p class="text-sm text-gray-500 mt-1">{{ modalDetalle.venta?.numero_factura }}</p>
            </div>
            <button @click="cerrarModalDetalle" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Contenido del Modal -->
          <div v-if="modalDetalle.venta" class="space-y-6">
            <!-- Información General -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 class="font-medium text-gray-900 mb-3">Información General</h4>
                <div class="space-y-2 text-sm">
                  <div><span class="text-gray-500">Factura:</span> {{ modalDetalle.venta.numero_factura }}</div>
                  <div><span class="text-gray-500">Fecha:</span> {{ formatearFechaCompleta(modalDetalle.venta.fecha_creacion) }}</div>
                  <div><span class="text-gray-500">Vendedor:</span> {{ modalDetalle.venta.vendedor_nombre }}</div>
                  <div><span class="text-gray-500">Turno ID:</span> {{ modalDetalle.venta.turno_id }}</div>
                </div>
              </div>

              <div>
                <h4 class="font-medium text-gray-900 mb-3">Información del Cliente</h4>
                <div class="space-y-2 text-sm">
                  <div><span class="text-gray-500">Nombre:</span> {{ modalDetalle.venta.cliente_nombre }}</div>
                  <div v-if="modalDetalle.venta.cliente_telefono">
                    <span class="text-gray-500">Teléfono:</span> {{ modalDetalle.venta.cliente_telefono }}
                  </div>
                  <div v-if="modalDetalle.venta.cliente_nit">
                    <span class="text-gray-500">NIT:</span> {{ modalDetalle.venta.cliente_nit }}
                  </div>
                  <div v-if="modalDetalle.venta.cliente_direccion">
                    <span class="text-gray-500">Dirección:</span> {{ modalDetalle.venta.cliente_direccion }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Productos Vendidos -->
            <div>
              <h4 class="font-medium text-gray-900 mb-3">Productos Vendidos</h4>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Producto</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Tipo</th>
                      <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">Cantidad</th>
                      <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">Precio Unit.</th>
                      <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="item in modalDetalle.venta.detalle" :key="item.id">
                      <td class="px-4 py-2 text-sm text-gray-900">{{ item.producto_nombre }}</td>
                      <td class="px-4 py-2 text-sm">
                        <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {{ item.tipo_producto }}
                        </span>
                      </td>
                      <td class="px-4 py-2 text-sm text-right">{{ item.cantidad }}</td>
                      <td class="px-4 py-2 text-sm text-right">Q {{ formatearNumero(item.precio_unitario) }}</td>
                      <td class="px-4 py-2 text-sm font-medium text-right">Q {{ formatearNumero(item.precio_total) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Totales -->
            <div class="border-t pt-4">
              <div class="max-w-md ml-auto space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Subtotal:</span>
                  <span class="font-medium">Q {{ formatearNumero(modalDetalle.venta.subtotal) }}</span>
                </div>
                <div v-if="modalDetalle.venta.descuento > 0" class="flex justify-between text-sm">
                  <span class="text-gray-600">Descuento:</span>
                  <span class="text-red-600 font-medium">- Q {{ formatearNumero(modalDetalle.venta.descuento) }}</span>
                </div>
                <div class="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span class="text-green-600">Q {{ formatearNumero(modalDetalle.venta.total) }}</span>
                </div>
              </div>
            </div>

            <!-- Método de Pago -->
            <div class="border-t pt-4">
              <h4 class="font-medium text-gray-900 mb-3">Método de Pago</h4>
              <div class="space-y-2 text-sm">
                <div>
                  <span class="text-gray-500">Método:</span>
                  <span :class="getMetodoPagoColor(modalDetalle.venta.metodo_pago)" class="ml-2 px-2 py-1 text-xs rounded-full">
                    {{ getMetodoPagoTexto(modalDetalle.venta.metodo_pago) }}
                  </span>
                </div>

                <!-- Detalles según método de pago -->
                <div v-if="modalDetalle.venta.metodo_pago === 'efectivo' && modalDetalle.venta.efectivo_recibido > 0">
                  <span class="text-gray-500">Efectivo recibido:</span> Q {{ formatearNumero(modalDetalle.venta.efectivo_recibido) }}
                </div>
                <div v-if="modalDetalle.venta.efectivo_cambio > 0">
                  <span class="text-gray-500">Cambio:</span> Q {{ formatearNumero(modalDetalle.venta.efectivo_cambio) }}
                </div>

                <!-- Pago Mixto -->
                <div v-if="modalDetalle.venta.metodo_pago === 'mixto'" class="mt-2 space-y-1">
                  <div v-if="modalDetalle.venta.efectivo_recibido > 0">
                    <span class="text-gray-500">💵 Efectivo:</span> Q {{ formatearNumero(modalDetalle.venta.efectivo_recibido) }}
                  </div>
                  <div v-if="modalDetalle.venta.tarjeta_monto > 0">
                    <span class="text-gray-500">💳 Tarjeta:</span> Q {{ formatearNumero(modalDetalle.venta.tarjeta_monto) }}
                  </div>
                  <div v-if="modalDetalle.venta.transferencia_monto > 0">
                    <span class="text-gray-500">🏦 Transferencia:</span> Q {{ formatearNumero(modalDetalle.venta.transferencia_monto) }}
                  </div>
                  <div v-if="modalDetalle.venta.deposito_monto > 0">
                    <span class="text-gray-500">🏧 Depósito:</span> Q {{ formatearNumero(modalDetalle.venta.deposito_monto) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Observaciones -->
            <div v-if="modalDetalle.venta.observaciones" class="border-t pt-4">
              <h4 class="font-medium text-gray-900 mb-2">Observaciones</h4>
              <p class="text-sm text-gray-600">{{ modalDetalle.venta.observaciones }}</p>
            </div>

            <!-- Botones -->
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button @click="cerrarModalDetalle" class="btn-secondary">
                Cerrar
              </button>
              <button @click="descargarPDF(modalDetalle.venta)" class="btn-primary">
                📄 Descargar Comprobante
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal de Anulación con Autorización -->
    <div
      v-if="modalAnular.visible"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="cerrarModalAnular"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">
            🗑️ Anular Venta
          </h3>
          <button
            @click="cerrarModalAnular"
            class="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <!-- Información de la venta -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p class="text-sm text-yellow-800 mb-2">
            <strong>⚠️ Advertencia:</strong> Esta acción revertirá el inventario y los montos del turno.
          </p>
          <p class="text-sm text-gray-700">
            <strong>Venta:</strong> {{ modalAnular.venta?.numero_factura }}<br>
            <strong>Total:</strong> Q {{ formatearNumero(modalAnular.venta?.total) }}<br>
            <strong>Cliente:</strong> {{ modalAnular.venta?.cliente_nombre }}
          </p>
        </div>

        <!-- Formulario de autorización -->
        <form @submit.prevent="confirmarAnulacion" class="space-y-4">
          <!-- Usuario Administrador -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              👤 Usuario Administrador *
            </label>
            <input
              v-model="modalAnular.admin_usuario"
              type="text"
              placeholder="admin@hidrocolon.com"
              class="input-base"
              required
              autocomplete="username"
            />
          </div>

          <!-- Contraseña Administrador -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              🔐 Contraseña Administrador *
            </label>
            <input
              v-model="modalAnular.admin_password"
              type="password"
              placeholder="••••••••"
              class="input-base"
              required
              autocomplete="current-password"
            />
          </div>

          <!-- Motivo -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              📝 Motivo de Anulación *
            </label>
            <textarea
              v-model="modalAnular.motivo"
              rows="3"
              placeholder="Ej: Cliente solicitó devolución, error en facturación..."
              class="input-base"
              required
            ></textarea>
          </div>

          <!-- Error message -->
          <div v-if="modalAnular.error" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-800">❌ {{ modalAnular.error }}</p>
          </div>

          <!-- Botones -->
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="cerrarModalAnular"
              class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              :disabled="modalAnular.procesando"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="modalAnular.procesando"
            >
              <span v-if="!modalAnular.procesando">🗑️ Anular Venta</span>
              <span v-else class="flex items-center justify-center gap-2">
                <div class="spinner"></div>
                Procesando...
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import ventasService from '@/services/ventasService'

export default {
  name: 'HistorialVentasView',
  
  data() {
    return {
      ventas: [],
      cargando: false,
      error: null,
      
      filtros: {
        fecha_inicio: '',
        fecha_fin: '',
        metodo_pago: '',
        numero_factura: '',
        page: 1,
        limit: 20
      },
      
      pagination: {},
      searchTimeout: null,
      
      modalDetalle: {
        visible: false,
        venta: null
      },
      
      modalAnular: {
        visible: false,
        venta: null,
        admin_usuario: '',
        admin_password: '',
        motivo: '',
        procesando: false,
        error: null
      },
    }
  },
  
  computed: {
    paginasVisibles() {
      const total = this.pagination.total_pages
      const actual = this.pagination.current_page
      const paginas = []
      
      // Mostrar máximo 5 páginas
      let inicio = Math.max(1, actual - 2)
      let fin = Math.min(total, inicio + 4)
      
      // Ajustar inicio si estamos cerca del final
      if (fin - inicio < 4) {
        inicio = Math.max(1, fin - 4)
      }
      
      for (let i = inicio; i <= fin; i++) {
        paginas.push(i)
      }
      
      return paginas
    },
    
    ventasFormateadas() {
      return this.ventas.map(venta => ({
        ...venta,
        vendedor_nombre: venta.vendedor_nombres && venta.vendedor_apellidos 
          ? `${venta.vendedor_nombres} ${venta.vendedor_apellidos}`
          : 'N/A',
        paciente_nombre_completo: venta.paciente_nombres && venta.paciente_apellidos
          ? `${venta.paciente_nombres} ${venta.paciente_apellidos}`
          : venta.cliente_nombre || 'Sin nombre'
      }))
    }
  },
  
  async mounted() {
    await this.inicializar()
  },
  
  beforeUnmount() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }
  },
  
  methods: {
    async inicializar() {
      console.log('🚀 Inicializando módulo de historial de ventas...')
      await this.cargarVentas()
    },
    
    async cargarVentas() {
      try {
        this.cargando = true
        this.error = null
        
        const params = {
          page: this.filtros.page,
          limit: this.filtros.limit
        }
        
        // Agregar filtros solo si tienen valor
        if (this.filtros.fecha_inicio) params.fecha_inicio = this.filtros.fecha_inicio
        if (this.filtros.fecha_fin) params.fecha_fin = this.filtros.fecha_fin
        if (this.filtros.metodo_pago) params.metodo_pago = this.filtros.metodo_pago
        if (this.filtros.numero_factura) params.numero_factura = this.filtros.numero_factura
        
        console.log('📋 Cargando ventas con filtros:', params)
        
        const response = await ventasService.listarVentas(params)
        
        this.ventas = response.data || []
        this.pagination = response.pagination || {}
        
        console.log('✅ Ventas cargadas:', this.ventas.length)
        
      } catch (error) {
        console.error('❌ Error cargando ventas:', error)
        this.error = error.message
        this.ventas = []
      } finally {
        this.cargando = false
      }
    },
    
    buscarConDelay() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      this.searchTimeout = setTimeout(() => {
        this.filtros.page = 1
        this.cargarVentas()
      }, 500)
    },
    
    limpiarFiltros() {
      this.filtros = {
        fecha_inicio: '',
        fecha_fin: '',
        metodo_pago: '',
        numero_factura: '',
        page: 1,
        limit: 20
      }
      this.cargarVentas()
    },
    
    cambiarPagina(page) {
      if (page >= 1 && page <= this.pagination.total_pages && !this.cargando) {
        this.filtros.page = page
        this.cargarVentas()
      }
    },
    
    async verDetalle(venta) {
        try {
            console.log('👁️ Viendo detalle de venta:', venta.id)
            
            // Siempre cargar desde el API para tener el detalle completo
            const response = await ventasService.obtenerVenta(venta.id)
            
            // Formatear nombre del vendedor
            const ventaCompleta = {
            ...response.data,
            vendedor_nombre: response.data.vendedor_nombres && response.data.vendedor_apellidos
                ? `${response.data.vendedor_nombres} ${response.data.vendedor_apellidos}`
                : 'N/A'
            }
            
            this.modalDetalle = {
            visible: true,
            venta: ventaCompleta
            }
            
        } catch (error) {
            console.error('❌ Error cargando detalle:', error)
            alert(`❌ Error: ${error.message}`)
        }
        },
    
    cerrarModalDetalle() {
      this.modalDetalle = {
        visible: false,
        venta: null
      }
    },
    
    async descargarPDF(venta) {
      try {
        console.log('📄 Descargando PDF de venta:', venta.id)
        
        await ventasService.descargarComprobante(
          venta.id,
          `Comprobante-${venta.numero_factura}.pdf`
        )
        
        console.log('✅ PDF descargado exitosamente')
        
      } catch (error) {
        console.error('❌ Error descargando PDF:', error)
        alert(`❌ Error: ${error.message}`)
      }
    },
    
    // Utilidades de formato
    formatearFecha(fecha) {
      if (!fecha) return 'N/A'
      try {
        const date = new Date(fecha)
        const dia = String(date.getDate()).padStart(2, '0')
        const mes = String(date.getMonth() + 1).padStart(2, '0')
        const anio = date.getFullYear()
        const hora = String(date.getHours()).padStart(2, '0')
        const min = String(date.getMinutes()).padStart(2, '0')
        return `${dia}/${mes}/${anio} ${hora}:${min}`
      } catch {
        return 'N/A'
      }
    },
    
    formatearFechaCompleta(fecha) {
      if (!fecha) return 'N/A'
      try {
        return new Date(fecha).toLocaleDateString('es-GT', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch {
        return 'N/A'
      }
    },
    
    formatearNumero(numero) {
      if (!numero && numero !== 0) return '0.00'
      return parseFloat(numero).toFixed(2)
    },
    
    getMetodoPagoTexto(metodo) {
      const metodos = {
        'efectivo': '💵 Efectivo',
        'tarjeta': '💳 Tarjeta',
        'transferencia': '🏦 Transferencia',
        'deposito': '🏧 Depósito',
        'mixto': '🔄 Mixto'
      }
      return metodos[metodo] || metodo
    },
    
    getMetodoPagoColor(metodo) {
      const colores = {
        'efectivo': 'bg-green-100 text-green-800',
        'tarjeta': 'bg-blue-100 text-blue-800',
        'transferencia': 'bg-purple-100 text-purple-800',
        'deposito': 'bg-orange-100 text-orange-800',
        'mixto': 'bg-gray-100 text-gray-800'
      }
      return colores[metodo] || 'bg-gray-100 text-gray-800'
    },

    // Métodos para anular venta
    ventaEstaAnulada(venta) {
      return venta.observaciones && venta.observaciones.includes('ANULADA:')
    },
    
    abrirModalAnular(venta) {
      if (this.ventaEstaAnulada(venta)) {
        alert('⚠️ Esta venta ya fue anulada anteriormente')
        return
      }
      
      this.modalAnular = {
        visible: true,
        venta: venta,
        admin_usuario: '',
        admin_password: '',
        motivo: '',
        procesando: false,
        error: null
      }
    },
    
    cerrarModalAnular() {
      this.modalAnular = {
        visible: false,
        venta: null,
        admin_usuario: '',
        admin_password: '',
        motivo: '',
        procesando: false,
        error: null
      }
    },
    
    async confirmarAnulacion() {
      try {
        this.modalAnular.procesando = true
        this.modalAnular.error = null
        
        console.log('🗑️ Iniciando anulación de venta:', this.modalAnular.venta.id)
        
        const resultado = await ventasService.anularVenta(
          this.modalAnular.venta.id,
          {
            motivo: this.modalAnular.motivo.trim(),
            admin_usuario: this.modalAnular.admin_usuario.trim(),
            admin_password: this.modalAnular.admin_password
          }
        )
        
        console.log('✅ Venta anulada exitosamente:', resultado)
        
        // Mostrar mensaje de éxito
        alert(`✅ ${resultado.message}\n\nVenta: ${resultado.data.venta_numero}\nAutorizado por: ${resultado.data.autorizador}`)
        
        // Cerrar modal
        this.cerrarModalAnular()
        
        // Recargar lista de ventas
        await this.cargarVentas()
        
      } catch (error) {
        console.error('❌ Error anulando venta:', error)
        this.modalAnular.error = error.message
      } finally {
        this.modalAnular.procesando = false
      }
    },
  }
}
</script>

<style scoped>
.spinner {
  @apply inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin;
}

.btn-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors;
}

.btn-blue { @apply bg-blue-100 hover:bg-blue-200 text-blue-700; }
.btn-green { @apply bg-green-100 hover:bg-green-200 text-green-700; }

.btn-red { 
  @apply bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed; 
}

.input-base {
  @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors;
}

.card {
  @apply bg-white rounded-lg shadow;
}
</style>