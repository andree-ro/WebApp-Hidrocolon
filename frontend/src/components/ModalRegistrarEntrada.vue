<template>
  <div v-if="mostrar" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      
      <!-- Header -->
      <div class="bg-green-600 text-white px-6 py-4 rounded-t-lg">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">📦 Registrar Entrada de Inventario</h2>
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

        <form @submit.prevent="registrarEntrada">
          
          

          <!-- Producto -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Producto <span class="text-red-500">*</span>
            </label>
            <select 
              v-model="formulario.producto_id" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              :disabled="!formulario.tipo_producto || cargandoProductos"
              required
            >
              <option value="">{{ cargandoProductos ? 'Cargando...' : 'Seleccione producto' }}</option>
              <option v-for="producto in productos" :key="producto.id" :value="producto.id">
                {{ producto.nombre }} - Stock actual: {{ producto.existencias }}
              </option>
            </select>
          </div>

          <!-- Cantidad -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Cantidad a Ingresar <span class="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              v-model.number="formulario.cantidad"
              min="1"
              step="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Ejemplo: 50"
              required
            />
          </div>

          <!-- Motivo -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Motivo <span class="text-red-500">*</span>
            </label>
            <select 
              v-model="formulario.motivo" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Seleccione motivo</option>
              <option value="Compra a proveedor">Compra a proveedor</option>
              <option value="Recepción de mercadería">Recepción de mercadería</option>
              <option value="Devolución de cliente">Devolución de cliente</option>
              <option value="Ajuste de inventario">Ajuste de inventario</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <!-- Proveedor (opcional) -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Proveedor (Opcional)
            </label>
            <input 
              type="text" 
              v-model="formulario.proveedor"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Nombre del proveedor"
            />
          </div>

          <!-- Número de documento (opcional) -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Número de Factura/Documento (Opcional)
            </label>
            <input 
              type="text" 
              v-model="formulario.numero_documento"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Ejemplo: FACT-12345"
            />
          </div>

          <!-- Costo unitario (opcional) -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Costo Unitario (Opcional)
            </label>
            <input 
              type="number" 
              v-model.number="formulario.costo_unitario"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Ejemplo: 15.50"
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
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Detalles adicionales sobre esta entrada..."
            ></textarea>
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
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              :disabled="guardando"
            >
              {{ guardando ? 'Registrando...' : '✅ Registrar Entrada' }}
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
  name: 'ModalRegistrarEntrada',
  props: {
    mostrar: {
      type: Boolean,
      default: false
    }
  },
  emits: ['cerrar', 'entrada-registrada'],
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
        motivo: '',
        proveedor: '',
        numero_documento: '',
        costo_unitario: null,
        detalle: ''
      },
      productos: [],
      cargandoProductos: false,
      guardando: false,
      error: null,
      mensajeExito: null
    };
  },
  methods: {
    async cargarProductos() {
      this.cargandoProductos = true;
      this.error = null;

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

    async registrarEntrada() {
      this.error = null;
      this.mensajeExito = null;
      this.guardando = true;

      try {
        const datos = {
          tipo_producto: this.formulario.tipo_producto,
          producto_id: parseInt(this.formulario.producto_id),
          cantidad: parseInt(this.formulario.cantidad),
          motivo: this.formulario.motivo,
          detalle: this.formulario.detalle || null,
          proveedor: this.formulario.proveedor || null,
          numero_documento: this.formulario.numero_documento || null,
          costo_unitario: this.formulario.costo_unitario || null
        };

        const response = await historialInventarioService.registrarEntrada(datos);

        this.mensajeExito = `✅ Entrada registrada exitosamente. Stock nuevo: ${response.data.stock_nuevo}`;

        // Emitir evento de éxito
        this.$emit('entrada-registrada', response.data);

        // Cerrar modal después de 1.5 segundos
        setTimeout(() => {
          this.cerrar();
        }, 1500);

      } catch (error) {
        console.error('Error registrando entrada:', error);
        this.error = error.message || 'Error al registrar la entrada';
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
        motivo: '',
        proveedor: '',
        numero_documento: '',
        costo_unitario: null,
        detalle: ''
      };
      this.productos = [];
      this.error = null;
      this.mensajeExito = null;
      
      this.$emit('cerrar');
    }
  }
};
</script>