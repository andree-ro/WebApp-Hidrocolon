// frontend/src/services/turnosService.js
// Servicio para comunicación con API de turnos - Sistema Hidrocolon

// ✅ IMPORTAR instancia compartida de axios desde authService
import { api } from './authService'

// ============================================================================
// 💼 SERVICIO DE TURNOS
// ============================================================================

const turnosService = {
  
  // ============================================================================
  // 🔓 ABRIR TURNO
  // ============================================================================
  
  async abrirTurno(efectivoInicial) {
    try {
      console.log('🔓 Abriendo turno con efectivo inicial:', efectivoInicial)
      const response = await api.post('/turnos', {  // ✅ CORRECTO: POST /turnos
        efectivo_inicial: efectivoInicial
      })
      console.log('✅ Turno abierto exitosamente:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error abriendo turno:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 🔒 CERRAR TURNO
  // ============================================================================
  
  async cerrarTurno(turnoId, datosCierre) {
    try {
      console.log(`🔒 Cerrando turno ID: ${turnoId}`, datosCierre)
      const response = await api.put(`/turnos/${turnoId}/cerrar`, datosCierre)
      console.log('✅ Turno cerrado exitosamente:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error cerrando turno:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 📋 LISTAR TURNOS
  // ============================================================================
  
  async listarTurnos(params = {}) {
    try {
      console.log('📋 Listando turnos con parámetros:', params)
      const response = await api.get('/turnos', { params })
      return response.data
    } catch (error) {
      console.error('❌ Error listando turnos:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 🔍 OBTENER TURNO ACTIVO (ACTUAL)
  // ============================================================================
  
  async obtenerTurnoActivo() {
    try {
      console.log('🔍 Verificando turno activo...')
      // ✅ FIX: El backend usa /turnos/actual, NO /turnos/activo
      const response = await api.get('/turnos/actual')
      
      if (response.data.success && response.data.data) {
        console.log('✅ Turno activo encontrado:', response.data.data)
        return response.data
      } else {
        console.log('⚠️ No hay turno activo')
        return { success: false, data: null, message: 'No hay turno activo' }
      }
    } catch (error) {
      // Si es 404, no hay turno activo (no es error)
      if (error.response?.status === 404) {
        console.log('ℹ️ No hay turno activo (404)')
        return { success: false, data: null, message: 'No hay turno activo' }
      }
      console.error('❌ Error verificando turno activo:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 🔍 OBTENER TURNO POR ID
  // ============================================================================
  
  async obtenerTurno(id) {
    try {
      console.log(`🔍 Obteniendo turno ID: ${id}`)
      const response = await api.get(`/turnos/${id}`)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo turno:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 🛠️ UTILIDADES
  // ============================================================================
  
  /**
   * Verificar si hay turno activo y devolverlo
   */
  async verificarTurnoActivo() {
    try {
      const resultado = await this.obtenerTurnoActivo()
      return {
        hayTurno: resultado.success && resultado.data !== null,
        turno: resultado.data
      }
    } catch (error) {
      return {
        hayTurno: false,
        turno: null,
        error: error.message
      }
    }
  },
  
  /**
   * Procesar errores de la API
   */
  procesarError(error) {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      let mensaje = 'Error en el servidor'
      
      switch (status) {
        case 400:
          mensaje = data.message || 'Datos inválidos'
          break
        case 401:
          mensaje = 'Sesión expirada. Por favor inicie sesión nuevamente'
          break
        case 403:
          mensaje = 'No tiene permisos para realizar esta acción'
          break
        case 404:
          mensaje = data.message || 'Turno no encontrado'
          break
        case 409:
          // Conflicto - por ejemplo, ya hay un turno abierto
          mensaje = data.message || 'Ya hay un turno abierto'
          break
        case 500:
          mensaje = 'Error interno del servidor'
          break
        default:
          mensaje = data.message || 'Error desconocido'
      }
      
      return new Error(mensaje)
    } else if (error.request) {
      return new Error('Sin conexión al servidor. Verifique su conexión a internet')
    } else {
      return new Error(error.message || 'Error inesperado')
    }
  },
  
  /**
   * Formatear precio para mostrar
   */
  formatearPrecio(precio) {
    if (!precio && precio !== 0) return 'Q 0.00'
    return `Q ${parseFloat(precio).toFixed(2)}`
  },
  
  /**
   * Formatear fecha para mostrar
   */
  formatearFecha(fecha) {
    if (!fecha) return 'N/A'
    try {
      return new Date(fecha).toLocaleDateString('es-GT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'N/A'
    }
  },
  
  /**
   * Calcular duración del turno en horas
   */
  calcularDuracionTurno(fechaInicio, fechaFin = null) {
    try {
      const inicio = new Date(fechaInicio)
      const fin = fechaFin ? new Date(fechaFin) : new Date()
      
      const diferenciaMilisegundos = fin - inicio
      const horas = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60))
      const minutos = Math.floor((diferenciaMilisegundos % (1000 * 60 * 60)) / (1000 * 60))
      
      return `${horas}h ${minutos}m`
    } catch {
      return 'N/A'
    }
  },
  
  /**
   * Validar datos para abrir turno
   */
  validarAperturaTurno(efectivoInicial) {
    const errores = []
    
    if (efectivoInicial === null || efectivoInicial === undefined) {
      errores.push('Debe ingresar el efectivo inicial')
    }
    
    if (efectivoInicial < 0) {
      errores.push('El efectivo inicial no puede ser negativo')
    }
    
    return {
      valido: errores.length === 0,
      errores
    }
  },
  
  /**
   * Validar datos para cerrar turno
   */
  validarCierreTurno(datosCierre) {
    const errores = []
    
    if (!datosCierre.efectivo_final && datosCierre.efectivo_final !== 0) {
      errores.push('Debe ingresar el efectivo final')
    }
    
    if (datosCierre.efectivo_final < 0) {
      errores.push('El efectivo final no puede ser negativo')
    }
    
    if (!datosCierre.total_vouchers_tarjeta && datosCierre.total_vouchers_tarjeta !== 0) {
      errores.push('Debe ingresar el total de vouchers de tarjeta')
    }
    
    if (datosCierre.total_vouchers_tarjeta < 0) {
      errores.push('El total de vouchers no puede ser negativo')
    }
    
    return {
      valido: errores.length === 0,
      errores
    }
  },
  
  /**
   * Calcular diferencias en cierre de turno
   */
  calcularDiferencias(turno, efectivoFinal, vouchersFinal) {
    const diferencias = {
      efectivo: 0,
      vouchers: 0,
      hayDiferencias: false
    }
    
    if (turno) {
      // Diferencia en efectivo
      const efectivoEsperado = (turno.efectivo_inicial || 0) + 
                                (turno.total_efectivo || 0) - 
                                (turno.total_gastos || 0)
      diferencias.efectivo = efectivoFinal - efectivoEsperado
      
      // Diferencia en vouchers
      const vouchersEsperados = turno.total_tarjeta || 0
      diferencias.vouchers = vouchersFinal - vouchersEsperados
      
      // Verificar si hay diferencias significativas (más de Q0.50)
      diferencias.hayDiferencias = Math.abs(diferencias.efectivo) > 0.5 || 
                                    Math.abs(diferencias.vouchers) > 0.5
    }
    
    return diferencias
  }
}

export default turnosService