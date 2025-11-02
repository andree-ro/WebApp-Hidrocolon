// frontend/src/services/comisionesService.js
import { api } from './authService'

/**
 * Servicio para el mÃ³dulo de comisiones con rango de fechas
 * Maneja todas las peticiones HTTP relacionadas con comisiones de doctoras
 */
export default {
  /**
   * Obtiene el dashboard de comisiones pendientes
   * @param {string|null} fechaCorte - Fecha opcional de corte (YYYY-MM-DD)
   * @returns {Promise} Response con resumen y doctoras con comisiones pendientes
   */
  async obtenerDashboard(fechaCorte = null) {
    try {
      const params = fechaCorte ? { fecha_corte: fechaCorte } : {}
      console.log('ðŸ“Š Obteniendo dashboard de comisiones...', params)
      
      const response = await api.get('/comisiones/dashboard', { params })
      
      console.log('âœ… Dashboard obtenido:', response.data)
      return response.data
    } catch (error) {
      console.error('âŒ Error obteniendo dashboard:', error)
      throw error
    }
  },

  /**
   * Obtiene ventas agrupadas por dÃ­a y producto para un rango de fechas
   * @param {number} doctoraId - ID de la doctora
   * @param {string} fechaInicio - Fecha inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha fin (YYYY-MM-DD)
   * @returns {Promise} Response con ventas agrupadas y validaciÃ³n de pago
   */
  async obtenerVentasAgrupadas(doctoraId, fechaInicio, fechaFin) {
    try {
      console.log(`ðŸ“‹ Obteniendo ventas agrupadas para doctora ${doctoraId}:`, {
        fechaInicio,
        fechaFin
      })

      const response = await api.get(
        `/comisiones/doctora/${doctoraId}/ventas-agrupadas`,
        {
          params: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin
          }
        }
      )

      console.log('âœ… Ventas agrupadas obtenidas:', response.data)
      return response.data
    } catch (error) {
      console.error('âŒ Error obteniendo ventas agrupadas:', error)
      throw error
    }
  },

  /**
   * Registra un pago de comisiones para un rango de fechas
   * @param {Object} datos - Datos del pago
   * @param {number} datos.doctora_id - ID de la doctora
   * @param {string} datos.fecha_inicio - Fecha inicio (YYYY-MM-DD)
   * @param {string} datos.fecha_fin - Fecha fin (YYYY-MM-DD)
   * @param {string} datos.observaciones - Observaciones opcionales
   * @param {number} datos.turno_id - ID del turno (opcional)
   * @param {boolean} datos.autorizado_por_admin - Si admin autoriza pago duplicado
   * @returns {Promise} Response con pago registrado
   */
  async pagarComisiones(datos) {
    try {
      console.log('ðŸ’° Registrando pago de comisiones:', datos)

      const response = await api.post('/comisiones/pagar-con-rango', datos)

      console.log('âœ… Pago registrado exitosamente:', response.data)
      return response.data
    } catch (error) {
      console.error('âŒ Error registrando pago:', error)
      
      // Si es error 409 (pago duplicado), re-lanzar con info especÃ­fica
      if (error.response?.status === 409) {
        console.warn('âš ï¸ Pago duplicado detectado:', error.response.data)
      }
      
      throw error
    }
  },

  /**
   * Obtiene el historial de pagos realizados
   * @param {Object} filtros - Filtros opcionales
   * @param {number} filtros.doctora_id - ID de la doctora
   * @param {string} filtros.estado - Estado (pendiente|pagado|acumulado|anulado)
   * @param {string} filtros.fecha_inicio - Fecha inicio (YYYY-MM-DD)
   * @param {string} filtros.fecha_fin - Fecha fin (YYYY-MM-DD)
   * @returns {Promise} Response con historial de pagos
   */
  async obtenerHistorial(filtros = {}) {
    try {
      console.log('ðŸ“š Obteniendo historial de pagos...', filtros)

      const response = await api.get('/comisiones/historial', { 
        params: filtros 
      })

      console.log('âœ… Historial obtenido:', response.data)
      return response.data
    } catch (error) {
      console.error('âŒ Error obteniendo historial:', error)
      throw error
    }
  },

  /**
   * Obtiene un pago especÃ­fico por ID
   * @param {number} pagoId - ID del pago
   * @returns {Promise} Response con detalles del pago
   */
  async obtenerPago(pagoId) {
    try {
      console.log(`ðŸ” Obteniendo pago ID: ${pagoId}`)

      const response = await api.get(`/comisiones/pago/${pagoId}`)

      console.log('âœ… Pago obtenido:', response.data)
      return response.data
    } catch (error) {
      console.error('âŒ Error obteniendo pago:', error)
      throw error
    }
  },

  /**
   * Anula un pago de comisiones (libera las ventas)
   * @param {number} pagoId - ID del pago a anular
   * @param {string} motivo - Motivo de la anulaciÃ³n (obligatorio)
   * @returns {Promise} Response con resultado de la anulaciÃ³n
   */
  async anularPago(pagoId, motivo) {
    try {
      if (!motivo || motivo.trim() === '') {
        throw new Error('El motivo de anulaciÃ³n es obligatorio')
      }

      console.log(`ðŸ—‘ï¸ Anulando pago ID: ${pagoId}`, { motivo })

      const response = await api.delete(`/comisiones/pago/${pagoId}/anular`, {
        data: { motivo }
      })

      console.log('âœ… Pago anulado exitosamente:', response.data)
      return response.data
    } catch (error) {
      console.error('âŒ Error anulando pago:', error)
      throw error
    }
  },

  /**
   * Obtiene listado de doctoras activas
   * @returns {Promise} Response con doctoras
   */
  async obtenerDoctoras() {
    try {
      console.log('ðŸ‘©â€âš•ï¸ Obteniendo listado de doctoras...')

      const response = await api.get('/doctoras')

      console.log('âœ… Doctoras obtenidas:', response.data)
      return response.data
    } catch (error) {
      console.error('âŒ Error obteniendo doctoras:', error)
      throw error
    }
  }
}