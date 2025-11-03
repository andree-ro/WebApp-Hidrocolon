// frontend/src/services/comisionesService.js
import { api } from './authService'

/**
 * Servicio para el módulo de comisiones con rango de fechas
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
      console.log('📊 Obteniendo dashboard de comisiones...', params)
      
      const response = await api.get('/comisiones/dashboard', { params })
      
      console.log('✅ Dashboard obtenido:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo dashboard:', error)
      throw error
    }
  },

  /**
   * Obtiene ventas agrupadas por día y producto para un rango de fechas
   * @param {number} doctoraId - ID de la doctora
   * @param {string} fechaInicio - Fecha inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha fin (YYYY-MM-DD)
   * @returns {Promise} Response con ventas agrupadas y validación de pago
   */
  async obtenerVentasAgrupadas(doctoraId, fechaInicio, fechaFin) {
    try {
      console.log(`📋 Obteniendo ventas agrupadas para doctora ${doctoraId}:`, {
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

      console.log('✅ Ventas agrupadas obtenidas:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo ventas agrupadas:', error)
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
      console.log('💰 Registrando pago de comisiones:', datos)

      const response = await api.post('/comisiones/pagar-con-rango', datos)

      console.log('✅ Pago registrado exitosamente:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error registrando pago:', error)
      
      // Si es error 409 (pago duplicado), re-lanzar con info específica
      if (error.response?.status === 409) {
        console.warn('⚠️ Pago duplicado detectado:', error.response.data)
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
      console.log('📚 Obteniendo historial de pagos...', filtros)

      const response = await api.get('/comisiones/historial', { 
        params: filtros 
      })

      console.log('✅ Historial obtenido:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error)
      throw error
    }
  },

  /**
   * Obtiene un pago específico por ID
   * @param {number} pagoId - ID del pago
   * @returns {Promise} Response con detalles del pago
   */
  async obtenerPago(pagoId) {
    try {
      console.log(`🔍 Obteniendo pago ID: ${pagoId}`)

      const response = await api.get(`/comisiones/pago/${pagoId}`)

      console.log('✅ Pago obtenido:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo pago:', error)
      throw error
    }
  },

  /**
   * Anula un pago de comisiones (libera las ventas)
   * @param {number} pagoId - ID del pago a anular
   * @param {string} motivo - Motivo de la anulación (obligatorio)
   * @returns {Promise} Response con resultado de la anulación
   */
  async anularPago(pagoId, motivo) {
    try {
      if (!motivo || motivo.trim() === '') {
        throw new Error('El motivo de anulación es obligatorio')
      }

      console.log(`🗑️ Anulando pago ID: ${pagoId}`, { motivo })

      const response = await api.delete(`/comisiones/pago/${pagoId}/anular`, {
        data: { motivo }
      })

      console.log('✅ Pago anulado exitosamente:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error anulando pago:', error)
      throw error
    }
  },

  /**
   * Obtiene listado de doctoras activas
   * @returns {Promise} Response con doctoras
   */
  async obtenerDoctoras() {
    try {
      console.log('👩‍⚕️ Obteniendo listado de doctoras...')

      const response = await api.get('/doctoras')

      console.log('✅ Doctoras obtenidas:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo doctoras:', error)
      throw error
    }
  },

  /**
   * Descarga el PDF de un pago de comisiones
   * @param {number} pagoId - ID del pago
   * @returns {Promise} Response con el PDF
   */
  async descargarPDFComision(pagoId) {
    try {
      console.log(`📄 Descargando PDF para pago ID: ${pagoId}`)

      const response = await api.post(`/comisiones/pdf/${pagoId}/generar`, {}, {
        responseType: 'blob' // Importante para recibir el PDF
      })

      // Crear blob y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Comisiones_Pago_${pagoId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('✅ PDF descargado exitosamente')
      return { success: true }
    } catch (error) {
      console.error('❌ Error descargando PDF:', error)
      throw error
    }
  }
}