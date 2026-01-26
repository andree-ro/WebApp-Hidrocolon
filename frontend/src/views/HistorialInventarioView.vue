<template>
  <div class="historial-inventario-module">
    <!-- Header -->
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <!-- Botón Volver -->
      <button
        @click="$router.push('/farmacia')"
        class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        <span>Volver a Farmacia</span>
      </button>

      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">📊 Historial de Inventario</h1>
        <p class="text-gray-600 mt-1">Registro completo de movimientos de stock</p>
      </div>

      <!-- Botón Exportar -->
      <button
        @click="exportarExcel"
        class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        <span class="text-lg">📥</span>
        <span>Exportar Excel</span>
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
            <span class="text-lg sm:text-xl">📋</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Movimientos</p>
            <p class="text-lg sm:text-xl font-semibold text-blue-600">{{ stats.total_movimientos || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="card p-3 sm:p-4">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 rounded-lg">
            <span class="text-lg sm:text-xl">📦</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Entradas</p>
            <p class="text-lg sm:text-xl font-semibold text-green-600">{{ stats.total_entradas || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="card p-3 sm:p-4">
        <div class="flex items-center">
          <div class="p-2 bg-red-100 rounded-lg">
            <span class="text-lg sm:text-xl">🔙</span>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-600 truncate">Salidas</p>
            <p class="text-lg sm:text-xl font-semibold text-red-600">{{ stats.total_salidas || 0 }}</p>
          </div>
        </div>
      </div>

      
    </div>

    <!-- Filtros -->
    <div class="card p-4 sm:p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Filtros de Búsqueda</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Búsqueda general -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <input
            v-model="filtros.search"
            type="text"
            placeholder="Medicamento, motivo..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            @input="buscarConDelay"
          />
        </div>

        <!-- Tipo de movimiento -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento</label>
          <select 
            v-model="filtros.tipo_movimiento" 
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            @change="cargarHistorial"
          >
            <option value="">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="vencimiento">Vencimientos</option>
            <option value="devolucion">Devoluciones</option>
            <option value="ajuste">Ajustes</option>
          </select>
        </div>

        <!-- Fecha inicio -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
          <input
            v-model="filtros.fecha_inicio"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            @change="cargarHistorial"
          />
        </div>

        <!-- Fecha fin -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
          <input
            v-model="filtros.fecha_fin"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            @change="cargarHistorial"
          />
        </div>
      </div>

      <!-- Acciones rápidas -->
      <div class="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
        <div class="flex flex-wrap gap-2">
          <button @click="limpiarFiltros" class="btn-secondary text-sm">
            🧹 Limpiar Filtros
          </button>
          <button @click="filtrarHoy" class="btn-secondary text-sm">
            📅 Hoy
          </button>
          <button @click="filtrarSemana" class="btn-secondary text-sm">
            📆 Esta Semana
          </button>
          <button @click="filtrarMes" class="btn-secondary text-sm">
            📊 Este Mes
          </button>
        </div>
        
        <div class="text-sm text-gray-600">
          {{ movimientos.length }} movimiento(s) encontrado(s)
        </div>
      </div>
    </div>

    <!-- Tabla de movimientos -->
    <div class="card overflow-hidden">
      <!-- Loading -->
      <div v-if="cargando" class="flex justify-center items-center p-8">
        <div class="flex items-center space-x-2">
          <div class="spinner"></div>
          <span class="text-gray-600">Cargando historial...</span>
        </div>
      </div>

      <!-- Tabla -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Movimiento
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Motivo
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="mov in movimientos" :key="mov.id" class="hover:bg-gray-50">
              <!-- Fecha -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatearFecha(mov.fecha_movimiento) }}</div>
                <div class="text-xs text-gray-500">{{ formatearHora(mov.fecha_movimiento) }}</div>
              </td>

              <!-- Producto -->
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{{ mov.producto_nombre }}</div>
                <div class="text-xs text-gray-500">{{ mov.tipo_producto === 'medicamento' ? '💊 Medicamento' : '🧰 Extra' }}</div>
              </td>

              <!-- Tipo -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getBadgeClass(mov.tipo_movimiento)" class="px-2 py-1 text-xs rounded-full">
                  {{ getTipoTexto(mov.tipo_movimiento) }}
                </span>
              </td>

              <!-- Movimiento -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm">
                  <span class="text-gray-500">{{ mov.cantidad_anterior }}</span>
                  <span :class="mov.cantidad_movimiento > 0 ? 'text-green-600' : 'text-red-600'" class="font-semibold mx-1">
                    {{ mov.cantidad_movimiento > 0 ? '+' : '' }}{{ mov.cantidad_movimiento }}
                  </span>
                  <span class="text-gray-900 font-medium">{{ mov.cantidad_nueva }}</span>
                </div>
              </td>

              <!-- Motivo -->
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">{{ mov.motivo || 'Sin motivo' }}</div>
                <div v-if="mov.detalle" class="text-xs text-gray-500">{{ mov.detalle }}</div>
              </td>

              <!-- Usuario -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ mov.usuario_nombres }} {{ mov.usuario_apellidos }}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Estado vacío -->
        <div v-if="!movimientos.length && !cargando" class="text-center py-8">
          <span class="text-4xl mb-4 block">📊</span>
          <p class="text-gray-500 text-lg">No se encontraron movimientos</p>
          <p class="text-gray-400 text-sm mt-2">Intenta ajustar los filtros</p>
        </div>
      </div>

      <!-- Paginación -->
      <div v-if="pagination.total_pages > 1" class="px-6 py-3 border-t bg-gray-50">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Página {{ pagination.current_page }} de {{ pagination.total_pages }}
            ({{ pagination.total }} registros)
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
  </div>
</template>

<script>
import historialInventarioService from '../services/historialInventarioService';

export default {
  name: 'HistorialInventarioView',
  
  data() {
    return {
      cargando: false,
      error: null,
      movimientos: [],
      stats: {},
      pagination: {},
      filtros: {
        search: '',
        tipo_movimiento: '',
        fecha_inicio: '',
        fecha_fin: '',
        page: 1,
        limit: 20
      },
      searchTimeout: null
    };
  },

  async mounted() {
    await this.inicializar();
  },

  beforeUnmount() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },

  methods: {
    async inicializar() {
      await Promise.all([
        this.cargarHistorial(),
        this.cargarEstadisticas()
      ]);
    },

    async cargarHistorial() {
      try {
        this.cargando = true;
        this.error = null;

        const params = {
          page: this.filtros.page,
          limit: this.filtros.limit
        };

        if (this.filtros.search && this.filtros.search.trim()) {
          params.search = this.filtros.search.trim();
        }

        if (this.filtros.tipo_movimiento) {
          params.tipo_movimiento = this.filtros.tipo_movimiento;
        }

        if (this.filtros.fecha_inicio) {
          params.fecha_inicio = this.filtros.fecha_inicio;
        }

        if (this.filtros.fecha_fin) {
          params.fecha_fin = this.filtros.fecha_fin;
        }

        const response = await historialInventarioService.obtenerHistorial(params);

        this.movimientos = response.data?.historial || [];
        this.pagination = response.data?.pagination || {};

      } catch (error) {
        console.error('Error cargando historial:', error);
        this.error = error.message || 'Error cargando historial';
        this.movimientos = [];
      } finally {
        this.cargando = false;
      }
    },

    async cargarEstadisticas() {
      try {
        const params = {};

        if (this.filtros.fecha_inicio) {
          params.fecha_inicio = this.filtros.fecha_inicio;
        }

        if (this.filtros.fecha_fin) {
          params.fecha_fin = this.filtros.fecha_fin;
        }

        const response = await historialInventarioService.obtenerEstadisticas(params);
        this.stats = response.data || {};

      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      }
    },

    buscarConDelay() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      this.searchTimeout = setTimeout(() => {
        this.filtros.page = 1;
        this.cargarHistorial();
      }, 500);
    },

    limpiarFiltros() {
      this.filtros = {
        search: '',
        tipo_movimiento: '',
        fecha_inicio: '',
        fecha_fin: '',
        page: 1,
        limit: 20
      };
      this.cargarHistorial();
      this.cargarEstadisticas();
    },

    filtrarHoy() {
      const hoy = new Date().toISOString().split('T')[0];
      this.filtros.fecha_inicio = hoy;
      this.filtros.fecha_fin = hoy;
      this.filtros.page = 1;
      this.cargarHistorial();
      this.cargarEstadisticas();
    },

    filtrarSemana() {
      const hoy = new Date();
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - 7);
      
      this.filtros.fecha_inicio = inicioSemana.toISOString().split('T')[0];
      this.filtros.fecha_fin = hoy.toISOString().split('T')[0];
      this.filtros.page = 1;
      this.cargarHistorial();
      this.cargarEstadisticas();
    },

    filtrarMes() {
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      
      this.filtros.fecha_inicio = inicioMes.toISOString().split('T')[0];
      this.filtros.fecha_fin = hoy.toISOString().split('T')[0];
      this.filtros.page = 1;
      this.cargarHistorial();
      this.cargarEstadisticas();
    },

    cambiarPagina(page) {
      if (page >= 1 && page <= this.pagination.total_pages && !this.cargando) {
        this.filtros.page = page;
        this.cargarHistorial();
      }
    },

    formatearFecha(fecha) {
      if (!fecha) return '';
      const date = new Date(fecha);
      return date.toLocaleDateString('es-GT', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    },

    formatearHora(fecha) {
      if (!fecha) return '';
      const date = new Date(fecha);
      return date.toLocaleTimeString('es-GT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    },

    getTipoTexto(tipo) {
      const tipos = {
        'entrada': '📦 Entrada',
        'salida': '🔙 Salida',
        'vencimiento': '⚠️ Vencimiento',
        'devolucion': '↩️ Devolución',
        'ajuste': '⚙️ Ajuste'
      };
      return tipos[tipo] || tipo;
    },

    getBadgeClass(tipo) {
      const classes = {
        'entrada': 'bg-green-100 text-green-800',
        'salida': 'bg-red-100 text-red-800',
        'vencimiento': 'bg-orange-100 text-orange-800',
        'devolucion': 'bg-blue-100 text-blue-800',
        'ajuste': 'bg-purple-100 text-purple-800'
      };
      return classes[tipo] || 'bg-gray-100 text-gray-800';
    },

    async exportarExcel() {
      try {
        console.log('📊 Exportando historial a Excel...');

        const response = await historialInventarioService.obtenerHistorial({ 
          limit: 10000,
          ...this.filtros 
        });

        const movimientos = response.data?.historial || [];

        if (!movimientos.length) {
          alert('❌ No hay datos para exportar');
          return;
        }

        const csvContent = this.convertirCSV(movimientos);
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `historial_inventario_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert(`✅ Excel exportado: ${movimientos.length} registros`);

      } catch (error) {
        console.error('❌ Error exportando:', error);
        alert(`❌ Error exportando: ${error.message}`);
      }
    },

    convertirCSV(datos) {
      const SEPARADOR = ';';
      
      const headers = [
        'Fecha', 'Hora', 'Producto', 'Tipo Producto', 'Tipo Movimiento',
        'Stock Anterior', 'Movimiento', 'Stock Nuevo', 'Motivo', 
        'Detalle', 'Usuario'
      ];
      
      const escaparValor = (valor) => {
        if (valor === null || valor === undefined) return '';
        let valorStr = String(valor).trim();
        valorStr = valorStr.replace(/[\r\n\t]/g, ' ');
        if (valorStr.includes(SEPARADOR) || valorStr.includes('"')) {
          valorStr = valorStr.replace(/"/g, '""');
          return `"${valorStr}"`;
        }
        return valorStr;
      };
      
      const lineaHeaders = headers.map(h => escaparValor(h)).join(SEPARADOR);
      
      const lineasDatos = datos.map(mov => {
        const valores = [
          this.formatearFecha(mov.fecha_movimiento),
          this.formatearHora(mov.fecha_movimiento),
          mov.producto_nombre || '',
          mov.tipo_producto || '',
          mov.tipo_movimiento || '',
          mov.cantidad_anterior || 0,
          mov.cantidad_movimiento || 0,
          mov.cantidad_nueva || 0,
          mov.motivo || '',
          mov.detalle || '',
          `${mov.usuario_nombres || ''} ${mov.usuario_apellidos || ''}`.trim()
        ];
        return valores.map(v => escaparValor(v)).join(SEPARADOR);
      });
      
      return [lineaHeaders, ...lineasDatos].join('\r\n');
    }
  }
};
</script>

<style scoped>
.spinner {
  @apply inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin;
}

.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200;
}

.btn-secondary {
  @apply px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors;
}
</style>