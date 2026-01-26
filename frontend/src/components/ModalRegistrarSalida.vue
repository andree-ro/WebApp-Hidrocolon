<template>
  <div v-if="mostrar" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      
      <!-- Header -->
      <div class="bg-red-600 text-white px-6 py-4 rounded-t-lg">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">🔙 Registrar Salida de Inventario</h2>
          <button @click="cerrar" class="text-white hover:text-gray-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="p-6">
        
        <!-- Mensaje de error -->
        <div v-if="error" class="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800 text-sm">{{ error }}</p>
        </div>

        <!-- Mensaje de éxito -->
        <div v-if="mensajeExito" class="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p class="text-green-800 text-sm">{{ mensajeExito }}</p>
        </div>

        <form @submit.prevent="registrarSalida">
          
          

          <!-- Producto -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Producto <span class="text-red-500">*</span>
            </label>
            <select 
              v-model="formulario.producto_id" 
              @change="seleccionarProducto"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              :disabled="!formulario.tipo_producto || cargandoProductos"
              required
            >
              <option value="">{{ cargandoProductos ? 'Cargando...' : 'Seleccione producto' }}</option>
              <option v-for="producto in productos" :key="producto.id" :value="producto.id">
                {{ producto.nombre }} - Stock actual: {{ producto.existencias }}
              </option>
            </select>
            
            <!-- Alerta de stock -->
            <div v-if="productoSeleccionado" class="mt-2 text-sm">
              <span class="text-gray-600">Stock disponible: </span>
              <span class="font-semibold" :class="productoSeleccionado.existencias > 0 ? 'text-green-600' : 'text-red-600'">
                {{ productoSeleccionado.existencias }} unidades
              </span>
            </div>
          </div>

          <!-- Cantidad -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Cantidad a Retirar <span class="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              v-model.number="formulario.cantidad"
              min="1"
              :max="productoSeleccionado ? productoSeleccionado.existencias : 999999"
              step="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Ejemplo: 20"
              required
            />
            <p v-if="formulario.cantidad && productoSeleccionado && formulario.cantidad > productoSeleccionado.existencias" 
               class="mt-1 text-xs text-red-600">
              ⚠️ La cantidad excede el stock disponible
            </p>
          </div>

          <!-- Tipo de salida -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Salida <span class="text-red-500">*</span>
            </label>
            <select 
              v-model="formulario.tipo_salida" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="">Seleccione tipo</option>
              <option value="vencimiento">Vencimiento</option>
              <option value="devolucion">Devolución a proveedor</option>
              <option value="dañado">Producto dañado</option>
              <option value="ajuste">Ajuste de inventario</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <!-- Motivo -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Motivo Detallado <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              v-model="formulario.motivo"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Ejemplo: Lote vencido ABC123"
              required
            />
          </div>

          <!-- Número de documento (opcional) -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Número de Documento (Opcional)
            </label>
            <input 
              type="text" 
              v-model="formulario.numero_documento"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Ejemplo: Nota de crédito NC-12345"
            />
          </div>

          <!-- Detalle/Observaciones (opcional) -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Observaciones (Opcional)
            </label>
            <textarea 
              v-model="formulario.detalle"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Detalles adicionales sobre esta salida..."
            ></textarea>
          </div>

          <!-- Resumen -->
          <div v-if="productoSeleccionado && formulario.cantidad" 
               class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 class="font-semibold text-gray-800 mb-2">📊 Resumen de la operación:</h3>
            <div class="text-sm space-y-1">
              <p><span class="text-gray-600">Stock actual:</span> <span class="font-semibold">{{ productoSeleccionado.existencias }}</span></p>
              <p><span class="text-gray-600">Cantidad a retirar:</span> <span class="font-semibold text-red-600">-{{ formulario.cantidad }}</span></p>
              <p class="pt-2 border-t border-gray-300">
                <span class="text-gray-600">Stock resultante:</span> 
                <span class="font-bold text-lg" :class="stockResultante >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ stockResultante }}
                </span>
              </p>
            </div>
          </div>

          <!-- Botones -->
          <div class="flex justify-end gap-3">
            <button 
              type="button"
              @click="cerrar"
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              :disabled="guardando"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
              :disabled="guardando || (formulario.cantidad && productoSeleccionado && formulario.cantidad > productoSeleccionado.existencias)"
            >
              {{ guardando ? 'Registrando...' : '✅ Registrar Salida' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import historialInventarioService from '../services/historialInventarioService';
import farmaciaService from '../services/farmaciaService';
import extrasService from '../services/extrasService';

export default {
  name: 'ModalRegistrarSalida',
  props: {
    mostrar: {
      type: Boolean,
      default: false
    }
  },
emits: ['cerrar', 'salida-registrada'],
  mounted() {
    // Cargar medicamentos al montar el componente
    this.cargarProductos();
  },
  data() {
    return {
      formulario: {
        tipo_producto: 'medicamento',
        producto_id: '',
        cantidad: null,
        tipo_salida: '',
        motivo: '',
        numero_documento: '',
        detalle: ''
      },
      productos: [],
      productoSeleccionado: null,
      cargandoProductos: false,
      guardando: false,
      error: null,
      mensajeExito: null
    };
  },
  computed: {
    stockResultante() {
      if (!this.productoSeleccionado || !this.formulario.cantidad) return 0;
      return this.productoSeleccionado.existencias - this.formulario.cantidad;
    }
  },
  methods: {
    async cargarProductos() {
      this.cargandoProductos = true;
      this.error = null;
      this.productoSeleccionado = null;

      try {
        const response = await farmaciaService.getMedicamentos({ limit: 1000 });
        this.productos = response.data.medicamentos || response.data || [];
      } catch (error) {
        console.error('Error cargando productos:', error);
        this.error = 'Error al cargar los medicamentos';
        this.productos = [];
      } finally {
        this.cargandoProductos = false;
      }
    },

    seleccionarProducto() {
      if (!this.formulario.producto_id) {
        this.productoSeleccionado = null;
        return;
      }

      this.productoSeleccionado = this.productos.find(
        p => p.id === parseInt(this.formulario.producto_id)
      );
    },

    async registrarSalida() {
      this.error = null;
      this.mensajeExito = null;

      // Validación adicional de stock
      if (this.formulario.cantidad > this.productoSeleccionado.existencias) {
        this.error = 'La cantidad a retirar excede el stock disponible';
        return;
      }

      this.guardando = true;

      try {
        const datos = {
          tipo_producto: this.formulario.tipo_producto,
          producto_id: parseInt(this.formulario.producto_id),
          cantidad: parseInt(this.formulario.cantidad),
          tipo_salida: this.formulario.tipo_salida,
          motivo: this.formulario.motivo,
          detalle: this.formulario.detalle || null,
          numero_documento: this.formulario.numero_documento || null
        };

        const response = await historialInventarioService.registrarSalida(datos);

        this.mensajeExito = `✅ Salida registrada exitosamente. Stock nuevo: ${response.data.stock_nuevo}`;

        // Emitir evento de éxito
        this.$emit('salida-registrada', response.data);

        // Cerrar modal después de 1.5 segundos
        setTimeout(() => {
          this.cerrar();
        }, 1500);

      } catch (error) {
        console.error('Error registrando salida:', error);
        this.error = error.message || 'Error al registrar la salida';
      } finally {
        this.guardando = false;
      }
    },

    cerrar() {
      // Limpiar formulario
      this.formulario = {
        tipo_producto: 'medicamento',
        producto_id: '',
        cantidad: null,
        tipo_salida: '',
        motivo: '',
        numero_documento: '',
        detalle: ''
      };
      this.productos = [];
      this.productoSeleccionado = null;
      this.error = null;
      this.mensajeExito = null;
      
      this.$emit('cerrar');
    }
  }
};
</script>