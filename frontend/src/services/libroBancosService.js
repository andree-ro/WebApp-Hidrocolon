// frontend/src/services/libroBancosService.js
import { api } from './authService'

const libroBancosService = {
  // ============================================================================
  // SALDO INICIAL
  // ============================================================================

  /**
   * Obtener el saldo inicial registrado
   */
  async obtenerSaldoInicial() {
    const response = await api.get('/libro-bancos/saldo-inicial')
    return response.data
  },

  /**
   * Registrar saldo inicial
   */
  async registrarSaldoInicial(data) {
    const response = await api.post('/libro-bancos/saldo-inicial', data)
    return response.data
  },

  /**
   * Obtener saldo actual calculado
   */
  async obtenerSaldoActual() {
    const response = await api.get('/libro-bancos/saldo-actual')
    return response.data
  },

  // ============================================================================
  // OPERACIONES (CRUD)
  // ============================================================================

  /**
   * Obtener todas las operaciones con filtros opcionales
   */
  async obtenerOperaciones(params = {}) {
    const response = await api.get('/libro-bancos', { params })
    return response.data
  },

  /**
   * Crear nueva operación
   */
  async crearOperacion(data) {
    const response = await api.post('/libro-bancos', data)
    return response.data
  },

  /**
   * Actualizar operación existente
   */
  async actualizarOperacion(id, data) {
    const response = await api.put(`/libro-bancos/${id}`, data)
    return response.data
  },

  /**
   * Eliminar operación
   */
  async eliminarOperacion(id) {
    const response = await api.delete(`/libro-bancos/${id}`)
    return response.data
  },

  // ============================================================================
  // EXPORTACIÓN
  // ============================================================================

  /**
   * Exportar a PDF
   */
  async exportarPDF(params = {}) {
    const response = await api.get('/libro-bancos/exportar/pdf', {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  /**
   * Exportar a Excel
   */
  async exportarExcel(params = {}) {
    const response = await api.get('/libro-bancos/exportar/excel', {
      params,
      responseType: 'blob'
    })
    return response.data
  }
}
export default libroBancosService