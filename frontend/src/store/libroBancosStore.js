// frontend/src/store/libroBancosStore.js
import { defineStore } from 'pinia'
import libroBancosService from '@/services/libroBancosService'

export const useLibroBancosStore = defineStore('libroBancos', {
  state: () => ({
    // Estado de carga
    cargando: false,
    error: null,
    mensaje: null,

    // Saldo
    saldoInicial: null,
    saldoActual: null,
    tieneSaldoInicial: false,

    // Operaciones
    operaciones: [],
    totalOperaciones: 0,

    // Filtros
    filtros: {
      fecha_inicio: null,
      fecha_fin: null,
      tipo_operacion: null,
      clasificacion: null
    },

    // UI
    modalOperacionAbierto: false,
    modalSaldoInicialAbierto: false,
    operacionSeleccionada: null,
    modoEdicion: false
  }),

  getters: {
    /**
     * Operaciones ordenadas por fecha descendente
     */
    operacionesOrdenadas: (state) => {
      return [...state.operaciones].sort((a, b) => 
        new Date(b.fecha) - new Date(a.fecha)
      )
    },

    /**
     * Total de ingresos
     */
    totalIngresos: (state) => {
      return state.operaciones.reduce((sum, op) => 
        sum + parseFloat(op.ingreso || 0), 0
      )
    },

    /**
     * Total de egresos
     */
    totalEgresos: (state) => {
      return state.operaciones.reduce((sum, op) => 
        sum + parseFloat(op.egreso || 0), 0
      )
    }
  },

  actions: {
    // ============================================================================
    // SALDO INICIAL
    // ============================================================================

    /**
     * Verificar y cargar saldo inicial
     */
    async verificarSaldoInicial() {
      try {
        this.cargando = true
        const response = await libroBancosService.obtenerSaldoInicial()
        
        if (response.success && response.data) {
          this.saldoInicial = response.data.saldo_inicial
          this.tieneSaldoInicial = true
        } else {
          this.tieneSaldoInicial = false
        }
      } catch (error) {
        console.error('Error al verificar saldo inicial:', error)
        this.error = error.response?.data?.message || 'Error al verificar saldo inicial'
      } finally {
        this.cargando = false
      }
    },

    /**
     * Registrar saldo inicial
     */
    async registrarSaldoInicial(data) {
      try {
        this.cargando = true
        this.error = null
        
        const response = await libroBancosService.registrarSaldoInicial(data)
        
        if (response.success) {
          this.saldoInicial = response.saldo_inicial
          this.tieneSaldoInicial = true
          this.mensaje = 'Saldo inicial registrado exitosamente'
          this.modalSaldoInicialAbierto = false
          
          // Cargar operaciones después de registrar saldo
          await this.cargarOperaciones()
        }
        
        return response
      } catch (error) {
        console.error('Error al registrar saldo inicial:', error)
        this.error = error.response?.data?.message || 'Error al registrar saldo inicial'
        throw error
      } finally {
        this.cargando = false
      }
    },

    /**
     * Cargar saldo actual
     */
    async cargarSaldoActual() {
      try {
        const response = await libroBancosService.obtenerSaldoActual()
        
        if (response.success && response.data) {
          this.saldoActual = response.data
        }
      } catch (error) {
        console.error('Error al cargar saldo actual:', error)
      }
    },

    // ============================================================================
    // OPERACIONES (CRUD)
    // ============================================================================

    /**
     * Cargar operaciones con filtros
     */
    async cargarOperaciones() {
      try {
        this.cargando = true
        this.error = null
        
        // Construir parámetros de filtro
        const params = {}
        if (this.filtros.fecha_inicio) params.fecha_inicio = this.filtros.fecha_inicio
        if (this.filtros.fecha_fin) params.fecha_fin = this.filtros.fecha_fin
        if (this.filtros.tipo_operacion) params.tipo_operacion = this.filtros.tipo_operacion
        if (this.filtros.clasificacion) params.clasificacion = this.filtros.clasificacion
        
        const response = await libroBancosService.obtenerOperaciones(params)
        
        if (response.success) {
          this.operaciones = response.data
          this.totalOperaciones = response.total
          
          // Actualizar saldo actual
          await this.cargarSaldoActual()
        }
      } catch (error) {
        console.error('Error al cargar operaciones:', error)
        this.error = error.response?.data?.message || 'Error al cargar operaciones'
      } finally {
        this.cargando = false
      }
    },

    /**
     * Crear nueva operación
     */
    async crearOperacion(data) {
      try {
        this.cargando = true
        this.error = null
        
        const response = await libroBancosService.crearOperacion(data)
        
        if (response.success) {
          this.mensaje = 'Operación registrada exitosamente'
          this.modalOperacionAbierto = false
          
          // Recargar operaciones
          await this.cargarOperaciones()
        }
        
        return response
      } catch (error) {
        console.error('Error al crear operación:', error)
        this.error = error.response?.data?.message || 'Error al registrar operación'
        throw error
      } finally {
        this.cargando = false
      }
    },

    /**
     * Actualizar operación existente
     */
    async actualizarOperacion(id, data) {
      try {
        this.cargando = true
        this.error = null
        
        const response = await libroBancosService.actualizarOperacion(id, data)
        
        if (response.success) {
          this.mensaje = 'Operación actualizada exitosamente'
          this.modalOperacionAbierto = false
          this.operacionSeleccionada = null
          
          // Recargar operaciones
          await this.cargarOperaciones()
        }
        
        return response
      } catch (error) {
        console.error('Error al actualizar operación:', error)
        this.error = error.response?.data?.message || 'Error al actualizar operación'
        throw error
      } finally {
        this.cargando = false
      }
    },

    /**
     * Eliminar operación
     */
    async eliminarOperacion(id) {
      try {
        this.cargando = true
        this.error = null
        
        const response = await libroBancosService.eliminarOperacion(id)
        
        if (response.success) {
          this.mensaje = 'Operación eliminada exitosamente'
          
          // Recargar operaciones
          await this.cargarOperaciones()
        }
        
        return response
      } catch (error) {
        console.error('Error al eliminar operación:', error)
        this.error = error.response?.data?.message || 'Error al eliminar operación'
        throw error
      } finally {
        this.cargando = false
      }
    },

    // ============================================================================
    // EXPORTACIÓN
    // ============================================================================

    /**
     * Exportar a PDF
     */
    async exportarPDF() {
      try {
        this.cargando = true
        
        const params = {}
        if (this.filtros.fecha_inicio) params.fecha_inicio = this.filtros.fecha_inicio
        if (this.filtros.fecha_fin) params.fecha_fin = this.filtros.fecha_fin
        
        const blob = await libroBancosService.exportarPDF(params)
        
        // Crear link de descarga
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `libro-bancos-${new Date().toISOString().split('T')[0]}.pdf`
        link.click()
        window.URL.revokeObjectURL(url)
        
        this.mensaje = 'PDF generado exitosamente'
      } catch (error) {
        console.error('Error al exportar PDF:', error)
        this.error = 'Error al generar el PDF'
      } finally {
        this.cargando = false
      }
    },

    /**
     * Exportar a Excel
     */
    async exportarExcel() {
      try {
        this.cargando = true
        
        const params = {}
        if (this.filtros.fecha_inicio) params.fecha_inicio = this.filtros.fecha_inicio
        if (this.filtros.fecha_fin) params.fecha_fin = this.filtros.fecha_fin
        
        const blob = await libroBancosService.exportarExcel(params)
        
        // Crear link de descarga
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `libro-bancos-${new Date().toISOString().split('T')[0]}.xlsx`
        link.click()
        window.URL.revokeObjectURL(url)
        
        this.mensaje = 'Excel generado exitosamente'
      } catch (error) {
        console.error('Error al exportar Excel:', error)
        this.error = 'Error al generar el Excel'
      } finally {
        this.cargando = false
      }
    },

    // ============================================================================
    // UI ACTIONS
    // ============================================================================

    /**
     * Abrir modal para nueva operación
     */
    abrirModalNuevaOperacion() {
      this.operacionSeleccionada = null
      this.modoEdicion = false
      this.modalOperacionAbierto = true
    },

    /**
     * Abrir modal para editar operación
     */
    abrirModalEditarOperacion(operacion) {
      this.operacionSeleccionada = operacion
      this.modoEdicion = true
      this.modalOperacionAbierto = true
    },

    /**
     * Cerrar modal de operación
     */
    cerrarModalOperacion() {
      this.modalOperacionAbierto = false
      this.operacionSeleccionada = null
      this.modoEdicion = false
    },

    /**
     * Abrir modal de saldo inicial
     */
    abrirModalSaldoInicial() {
      this.modalSaldoInicialAbierto = true
    },

    /**
     * Cerrar modal de saldo inicial
     */
    cerrarModalSaldoInicial() {
      this.modalSaldoInicialAbierto = false
    },

    /**
     * Aplicar filtros
     */
    aplicarFiltros(filtros) {
      this.filtros = { ...this.filtros, ...filtros }
      this.cargarOperaciones()
    },

    /**
     * Limpiar filtros
     */
    limpiarFiltros() {
      this.filtros = {
        fecha_inicio: null,
        fecha_fin: null,
        tipo_operacion: null,
        clasificacion: null
      }
      this.cargarOperaciones()
    },

    /**
     * Limpiar mensajes
     */
    limpiarMensaje() {
      this.mensaje = null
    },

    /**
     * Limpiar error
     */
    limpiarError() {
      this.error = null
    }
  }
})