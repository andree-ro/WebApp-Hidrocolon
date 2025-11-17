// frontend/src/store/estadoResultadosStore.js
import { defineStore } from 'pinia'
import estadoResultadosService from '@/services/estadoResultadosService'

export const useEstadoResultadosStore = defineStore('estadoResultados', {
  state: () => ({
    // Estado de carga
    cargando: false,
    error: null,
    mensaje: null,

    // Período seleccionado
    periodo: {
      fecha_inicio: null,
      fecha_fin: null
    },

    // Estado de Resultados
    estadoResultados: null,

    // Conceptos personalizables
    conceptos: [],
    totalConceptos: 0,

    // UI
    modalConceptoAbierto: false,
    conceptoSeleccionado: null,
    modoEdicion: false,
    tipoConceptoActual: null // 'costo_operacion', 'gasto_operacion', 'otro_gasto'
  }),

  getters: {
    /**
     * Conceptos filtrados por tipo
     */
    conceptosPorTipo: (state) => (tipo) => {
      return state.conceptos.filter(c => c.tipo === tipo)
    },

    /**
     * Total de conceptos por tipo
     */
    totalConceptosPorTipo: (state) => (tipo) => {
      return state.conceptos
        .filter(c => c.tipo === tipo)
        .reduce((sum, c) => sum + parseFloat(c.monto || 0), 0)
    }
  },

  actions: {
    // ============================================================================
    // ESTADO DE RESULTADOS
    // ============================================================================

    /**
     * Cargar estado de resultados completo
     */
    async cargarEstadoResultados() {
      try {
        this.cargando = true
        this.error = null

        if (!this.periodo.fecha_inicio || !this.periodo.fecha_fin) {
          this.error = 'Debe seleccionar un período de fechas'
          return
        }

        const params = {
          fecha_inicio: this.periodo.fecha_inicio,
          fecha_fin: this.periodo.fecha_fin
        }

        const response = await estadoResultadosService.obtenerEstadoResultados(params)

        if (response.success) {
          this.estadoResultados = response.data
        }
      } catch (error) {
        console.error('Error al cargar estado de resultados:', error)
        this.error = error.response?.data?.message || 'Error al cargar estado de resultados'
      } finally {
        this.cargando = false
      }
    },

    /**
     * Establecer período
     */
    setPeriodo(fecha_inicio, fecha_fin) {
      this.periodo = { fecha_inicio, fecha_fin }
    },

    // ============================================================================
    // CONCEPTOS (CRUD)
    // ============================================================================

    /**
     * Cargar conceptos con filtros
     */
    async cargarConceptos(filtros = {}) {
      try {
        this.cargando = true
        this.error = null

        const params = {
          ...filtros,
          periodo_inicio: this.periodo.fecha_inicio,
          periodo_fin: this.periodo.fecha_fin
        }

        const response = await estadoResultadosService.listarConceptos(params)

        if (response.success) {
          this.conceptos = response.data
          this.totalConceptos = response.total
        }
      } catch (error) {
        console.error('Error al cargar conceptos:', error)
        this.error = error.response?.data?.message || 'Error al cargar conceptos'
      } finally {
        this.cargando = false
      }
    },

    /**
     * Crear nuevo concepto
     */
    async crearConcepto(data) {
      try {
        this.cargando = true
        this.error = null

        const response = await estadoResultadosService.crearConcepto(data)

        if (response.success) {
          this.mensaje = 'Concepto creado exitosamente'
          this.modalConceptoAbierto = false

          // Recargar estado de resultados
          await this.cargarEstadoResultados()
        }

        return response
      } catch (error) {
        console.error('Error al crear concepto:', error)
        this.error = error.response?.data?.message || 'Error al crear concepto'
        throw error
      } finally {
        this.cargando = false
      }
    },

    /**
     * Actualizar concepto existente
     */
    async actualizarConcepto(id, data) {
      try {
        this.cargando = true
        this.error = null

        const response = await estadoResultadosService.actualizarConcepto(id, data)

        if (response.success) {
          this.mensaje = 'Concepto actualizado exitosamente'
          this.modalConceptoAbierto = false
          this.conceptoSeleccionado = null

          // Recargar estado de resultados
          await this.cargarEstadoResultados()
        }

        return response
      } catch (error) {
        console.error('Error al actualizar concepto:', error)
        this.error = error.response?.data?.message || 'Error al actualizar concepto'
        throw error
      } finally {
        this.cargando = false
      }
    },

    /**
     * Eliminar concepto
     */
    async eliminarConcepto(id) {
      try {
        this.cargando = true
        this.error = null

        const response = await estadoResultadosService.eliminarConcepto(id)

        if (response.success) {
          this.mensaje = 'Concepto eliminado exitosamente'

          // Recargar estado de resultados
          await this.cargarEstadoResultados()
        }

        return response
      } catch (error) {
        console.error('Error al eliminar concepto:', error)
        this.error = error.response?.data?.message || 'Error al eliminar concepto'
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

        const params = {
          fecha_inicio: this.periodo.fecha_inicio,
          fecha_fin: this.periodo.fecha_fin
        }

        const blob = await estadoResultadosService.exportarPDF(params)

        // Crear link de descarga
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `estado-resultados-${this.periodo.fecha_inicio}-${this.periodo.fecha_fin}.pdf`
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

        const params = {
          fecha_inicio: this.periodo.fecha_inicio,
          fecha_fin: this.periodo.fecha_fin
        }

        const blob = await estadoResultadosService.exportarExcel(params)

        // Crear link de descarga
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `estado-resultados-${this.periodo.fecha_inicio}-${this.periodo.fecha_fin}.xlsx`
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
     * Abrir modal para nuevo concepto
     */
    abrirModalNuevoConcepto(tipo) {
      this.conceptoSeleccionado = null
      this.modoEdicion = false
      this.tipoConceptoActual = tipo
      this.modalConceptoAbierto = true
    },

    /**
     * Abrir modal para editar concepto
     */
    abrirModalEditarConcepto(concepto) {
      this.conceptoSeleccionado = concepto
      this.modoEdicion = true
      this.tipoConceptoActual = concepto.tipo
      this.modalConceptoAbierto = true
    },

    /**
     * Cerrar modal de concepto
     */
    cerrarModalConcepto() {
      this.modalConceptoAbierto = false
      this.conceptoSeleccionado = null
      this.modoEdicion = false
      this.tipoConceptoActual = null
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