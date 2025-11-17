// frontend/src/services/estadoResultadosService.js
import { api } from './authService'

const estadoResultadosService = {
  // ============================================================================
  // ESTADO DE RESULTADOS
  // ============================================================================

  /**
   * Obtener estado de resultados completo para un período
   */
  async obtenerEstadoResultados(params) {
    const response = await api.get('/estado-resultados', { params })
    return response.data
  },

  // ============================================================================
  // CONCEPTOS PERSONALIZABLES (CRUD)
  // ============================================================================

  /**
   * Listar conceptos con filtros opcionales
   */
  async listarConceptos(params = {}) {
    const response = await api.get('/estado-resultados/conceptos', { params })
    return response.data
  },

  /**
   * Obtener concepto por ID
   */
  async obtenerConcepto(id) {
    const response = await api.get(`/estado-resultados/conceptos/${id}`)
    return response.data
  },

  /**
   * Crear nuevo concepto
   */
  async crearConcepto(data) {
    const response = await api.post('/estado-resultados/conceptos', data)
    return response.data
  },

  /**
   * Actualizar concepto existente
   */
  async actualizarConcepto(id, data) {
    const response = await api.put(`/estado-resultados/conceptos/${id}`, data)
    return response.data
  },

  /**
   * Eliminar concepto
   */
  async eliminarConcepto(id) {
    const response = await api.delete(`/estado-resultados/conceptos/${id}`)
    return response.data
  },

  // ============================================================================
  // EXPORTACIÓN
  // ============================================================================

  /**
   * Exportar a PDF
   */
  async exportarPDF(params = {}) {
    const response = await api.get('/estado-resultados/pdf', {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  /**
   * Exportar a Excel
   */
  async exportarExcel(params = {}) {
    const response = await api.get('/estado-resultados/excel', {
      params,
      responseType: 'blob'
    })
    return response.data
  }
}

export default estadoResultadosService