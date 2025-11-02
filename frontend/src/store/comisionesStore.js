// frontend/src/store/comisionesStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import comisionesService from '@/services/comisionesService'

/**
 * Store para gestión de comisiones de doctoras
 * Maneja todo el estado relacionado con pagos, historial y dashboard
 */
export const useComisionesStore = defineStore('comisiones', () => {
  
  // ============================================================================
  // ESTADO
  // ============================================================================
  
  const comisionesPendientes = ref([])
  const historialPagos = ref([])
  const ventasAgrupadas = ref(null)
  const pagoSeleccionado = ref(null)
  const doctoras = ref([])
  const resumenDashboard = ref(null)
  
  const cargando = ref(false)
  const error = ref(null)
  const mensaje = ref(null)

  // ============================================================================
  // COMPUTED (GETTERS)
  // ============================================================================

  /**
   * Obtiene el total de comisiones pendientes
   */
  const totalPendiente = computed(() => {
    return resumenDashboard.value?.monto_total_pendiente || 0
  })

  /**
   * Obtiene el número de doctoras con comisiones pendientes
   */
  const totalDoctoras = computed(() => {
    return comisionesPendientes.value.length
  })

  /**
   * Verifica si hay comisiones pendientes
   */
  const hayComisionesPendientes = computed(() => {
    return comisionesPendientes.value.length > 0
  })

  /**
   * Obtiene doctoras activas (para selector)
   */
  const doctorasActivas = computed(() => {
    return doctoras.value.filter(d => d.activo)
  })

  // ============================================================================
  // ACCIONES
  // ============================================================================

  /**
   * Carga el dashboard de comisiones pendientes
   * @param {string|null} fechaCorte - Fecha de corte opcional
   */
  async function cargarDashboard(fechaCorte = null) {
    try {
      cargando.value = true
      error.value = null
      
      console.log('📊 [Store] Cargando dashboard...')
      
      const response = await comisionesService.obtenerDashboard(fechaCorte)
      
      if (response.success) {
        comisionesPendientes.value = response.data.doctoras
        resumenDashboard.value = response.data.resumen
        
        console.log('✅ [Store] Dashboard cargado:', {
          doctoras: comisionesPendientes.value.length,
          total: resumenDashboard.value.monto_total_pendiente
        })
      }
      
      return response.data
    } catch (err) {
      console.error('❌ [Store] Error cargando dashboard:', err)
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  /**
   * Carga ventas agrupadas para una doctora en un rango de fechas
   * @param {number} doctoraId - ID de la doctora
   * @param {string} fechaInicio - Fecha inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha fin (YYYY-MM-DD)
   */
  async function cargarVentasAgrupadas(doctoraId, fechaInicio, fechaFin) {
    try {
      cargando.value = true
      error.value = null
      
      console.log('📋 [Store] Cargando ventas agrupadas...')
      
      const response = await comisionesService.obtenerVentasAgrupadas(
        doctoraId, 
        fechaInicio, 
        fechaFin
      )
      
      if (response.success) {
        ventasAgrupadas.value = response.data
        
        console.log('✅ [Store] Ventas agrupadas cargadas:', {
          productos: ventasAgrupadas.value.ventas_agrupadas.productos.length,
          total: ventasAgrupadas.value.ventas_agrupadas.totales.total_comisiones
        })
      }
      
      return response.data
    } catch (err) {
      console.error('❌ [Store] Error cargando ventas agrupadas:', err)
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  /**
   * Registra un pago de comisiones
   * @param {Object} datosPago - Datos del pago
   */
  async function pagarComisiones(datosPago) {
    try {
      cargando.value = true
      error.value = null
      mensaje.value = null
      
      console.log('💰 [Store] Registrando pago de comisiones...')
      
      const response = await comisionesService.pagarComisiones(datosPago)
      
      if (response.success) {
        mensaje.value = response.message
        
        console.log('✅ [Store] Pago registrado exitosamente')
        
        // Recargar dashboard automáticamente
        await cargarDashboard()
        
        // Limpiar ventas agrupadas
        ventasAgrupadas.value = null
      }
      
      return response
    } catch (err) {
      console.error('❌ [Store] Error registrando pago:', err)
      
      // Manejar caso especial de pago duplicado (409)
      if (err.response?.status === 409) {
        error.value = 'Ya existe un pago para este período'
        return {
          success: false,
          esPagoDuplicado: true,
          pagoExistente: err.response.data.pago_existente,
          requiereAutorizacion: err.response.data.requiere_autorizacion
        }
      }
      
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  /**
   * Carga el historial de pagos
   * @param {Object} filtros - Filtros para historial
   */
  async function cargarHistorial(filtros = {}) {
    try {
      cargando.value = true
      error.value = null
      
      console.log('📚 [Store] Cargando historial...')
      
      const response = await comisionesService.obtenerHistorial(filtros)
      
      if (response.success) {
        historialPagos.value = response.data
        
        console.log('✅ [Store] Historial cargado:', historialPagos.value.length, 'pagos')
      }
      
      return response.data
    } catch (err) {
      console.error('❌ [Store] Error cargando historial:', err)
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  /**
   * Obtiene un pago específico
   * @param {number} pagoId - ID del pago
   */
  async function cargarPago(pagoId) {
    try {
      cargando.value = true
      error.value = null
      
      console.log('🔍 [Store] Cargando pago...')
      
      const response = await comisionesService.obtenerPago(pagoId)
      
      if (response.success) {
        pagoSeleccionado.value = response.data
        
        console.log('✅ [Store] Pago cargado')
      }
      
      return response.data
    } catch (err) {
      console.error('❌ [Store] Error cargando pago:', err)
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  /**
   * Anula un pago
   * @param {number} pagoId - ID del pago
   * @param {string} motivo - Motivo de anulación
   */
  async function anularPago(pagoId, motivo) {
    try {
      cargando.value = true
      error.value = null
      mensaje.value = null
      
      console.log('🗑️ [Store] Anulando pago...')
      
      const response = await comisionesService.anularPago(pagoId, motivo)
      
      if (response.success) {
        mensaje.value = response.message
        
        console.log('✅ [Store] Pago anulado exitosamente')
        
        // Recargar historial y dashboard automáticamente
        await Promise.all([
          cargarHistorial(),
          cargarDashboard()
        ])
      }
      
      return response
    } catch (err) {
      console.error('❌ [Store] Error anulando pago:', err)
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      cargando.value = false
    }
  }

  /**
   * Carga el listado de doctoras
   */
  async function cargarDoctoras() {
    try {
      console.log('👩‍⚕️ [Store] Cargando doctoras...')
      
      const response = await comisionesService.obtenerDoctoras()
      
      if (response.success) {
        doctoras.value = response.data
        
        console.log('✅ [Store] Doctoras cargadas:', doctoras.value.length)
      }
      
      return response.data
    } catch (err) {
      console.error('❌ [Store] Error cargando doctoras:', err)
      throw err
    }
  }

  /**
   * Limpia el error actual
   */
  function limpiarError() {
    error.value = null
  }

  /**
   * Limpia el mensaje actual
   */
  function limpiarMensaje() {
    mensaje.value = null
  }

  /**
   * Limpia las ventas agrupadas
   */
  function limpiarVentasAgrupadas() {
    ventasAgrupadas.value = null
  }

  /**
   * Reinicia el store a su estado inicial
   */
  function resetear() {
    comisionesPendientes.value = []
    historialPagos.value = []
    ventasAgrupadas.value = null
    pagoSeleccionado.value = null
    doctoras.value = []
    resumenDashboard.value = null
    cargando.value = false
    error.value = null
    mensaje.value = null
    
    console.log('🔄 [Store] Store reseteado')
  }

  // ============================================================================
  // RETURN (EXPONER ESTADO Y MÉTODOS)
  // ============================================================================

  return {
    // Estado
    comisionesPendientes,
    historialPagos,
    ventasAgrupadas,
    pagoSeleccionado,
    doctoras,
    resumenDashboard,
    cargando,
    error,
    mensaje,
    
    // Computed
    totalPendiente,
    totalDoctoras,
    hayComisionesPendientes,
    doctorasActivas,
    
    // Acciones
    cargarDashboard,
    cargarVentasAgrupadas,
    pagarComisiones,
    cargarHistorial,
    cargarPago,
    anularPago,
    cargarDoctoras,
    limpiarError,
    limpiarMensaje,
    limpiarVentasAgrupadas,
    resetear
  }
})