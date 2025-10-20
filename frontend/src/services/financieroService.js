// frontend/src/services/financieroService.js
// Servicio de API para el módulo financiero del Sistema Hidrocolon

import { api } from './authService'

const financieroService = {
  // ============================================================================
  // TURNOS
  // ============================================================================

  /**
   * Verificar si hay un turno activo
   * @returns {Promise} - Turno activo o null
   */
  async verificarTurnoActivo() {
    try {
      const response = await api.get('/turnos/activo')
      return response.data
    } catch (error) {
      // Si es 404, significa que no hay turno activo (no es un error)
      if (error.response?.status === 404) {
        return { turno: null }
      }
      throw this.procesarError(error)
    }
  },

  /**
   * Abrir un nuevo turno con conteo de billetes y monedas
   * @param {Object} datosApertura - { efectivo_billetes: {}, efectivo_monedas: {} }
   * @returns {Promise} - Turno creado
   */
  async abrirTurno(datosApertura) {
    try {
      const response = await api.post('/turnos/abrir-completo', datosApertura)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Cerrar turno con cuadre automático
   * @param {Number} turnoId - ID del turno
   * @param {Object} datosCierre - { efectivo_billetes: {}, efectivo_monedas: {}, notas: '' }
   * @returns {Promise} - Turno cerrado con cuadre
   */
  async cerrarTurno(turnoId, datosCierre) {
    try {
      const response = await api.post(`/turnos/${turnoId}/cerrar-completo`, datosCierre)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Obtener resumen del turno en tiempo real
   * @param {Number} turnoId - ID del turno
   * @returns {Promise} - Resumen completo del turno
   */
  async obtenerResumenTurno(turnoId) {
    try {
      const response = await api.get(`/turnos/${turnoId}/resumen`)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Calcular cuadre previo sin cerrar el turno (preview)
   * @param {Number} turnoId - ID del turno
   * @param {Object} efectivoFinal - { efectivo_billetes: {}, efectivo_monedas: {} }
   * @returns {Promise} - Preview del cuadre
   */
  async calcularCuadrePrevio(turnoId, efectivoFinal) {
    try {
      const response = await api.post(`/turnos/${turnoId}/cuadre-previo`, efectivoFinal)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Obtener estadísticas generales de turnos
   * @param {Object} filtros - { fecha_inicio, fecha_fin }
   * @returns {Promise} - Estadísticas
   */
  async obtenerEstadisticas(filtros = {}) {
    try {
      const response = await api.get('/turnos/estadisticas', { params: filtros })
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Listar turnos con filtros
   * @param {Object} filtros - { estado, fecha_inicio, fecha_fin, limit, offset }
   * @returns {Promise} - Lista de turnos
   */
  async listarTurnos(filtros = {}) {
    try {
      const response = await api.get('/turnos', { params: filtros })
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Obtener turno por ID
   * @param {Number} turnoId - ID del turno
   * @returns {Promise} - Turno completo
   */
  async obtenerTurno(turnoId) {
    try {
      const response = await api.get(`/turnos/${turnoId}`)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  // ============================================================================
  // GASTOS
  // ============================================================================

  /**
   * Registrar un nuevo gasto
   * @param {Object} gasto - { turno_id, descripcion, monto, categoria, metodo_pago }
   * @returns {Promise} - Gasto creado
   */
  async registrarGasto(gasto) {
    try {
      const response = await api.post('/gastos', gasto)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Obtener gastos de un turno
   * @param {Number} turnoId - ID del turno
   * @returns {Promise} - Lista de gastos
   */
  async obtenerGastosTurno(turnoId) {
    try {
      const response = await api.get(`/gastos/turno/${turnoId}`)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Obtener resumen de gastos de un turno
   * @param {Number} turnoId - ID del turno
   * @returns {Promise} - Resumen de gastos
   */
  async obtenerResumenGastos(turnoId) {
    try {
      const response = await api.get(`/gastos/turno/${turnoId}/resumen`)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Actualizar un gasto
   * @param {Number} gastoId - ID del gasto
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise} - Gasto actualizado
   */
  async actualizarGasto(gastoId, datos) {
    try {
      const response = await api.put(`/gastos/${gastoId}`, datos)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Eliminar un gasto
   * @param {Number} gastoId - ID del gasto
   * @returns {Promise} - Confirmación
   */
  async eliminarGasto(gastoId) {
    try {
      const response = await api.delete(`/gastos/${gastoId}`)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  // ============================================================================
  // VOUCHERS DE TARJETA
  // ============================================================================

  /**
   * Registrar un voucher de tarjeta
   * @param {Object} voucher - { turno_id, numero_voucher, monto, banco }
   * @returns {Promise} - Voucher creado
   */
  async registrarVoucher(voucher) {
    try {
      const response = await api.post('/vouchers', voucher)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Obtener vouchers de un turno
   * @param {Number} turnoId - ID del turno
   * @returns {Promise} - Lista de vouchers
   */
  async obtenerVouchersTurno(turnoId) {
    try {
      const response = await api.get(`/vouchers/turno/${turnoId}`)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Verificar cuadre de vouchers vs ventas con tarjeta
   * @param {Number} turnoId - ID del turno
   * @returns {Promise} - Cuadre de vouchers
   */
  async verificarCuadreVouchers(turnoId) {
    try {
      const response = await api.get(`/vouchers/turno/${turnoId}/cuadre`)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Buscar voucher por número
   * @param {String} numeroVoucher - Número del voucher
   * @returns {Promise} - Vouchers encontrados
   */
  async buscarVoucherPorNumero(numeroVoucher) {
    try {
      const response = await api.get(`/vouchers/buscar/${numeroVoucher}`)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Actualizar un voucher
   * @param {Number} voucherId - ID del voucher
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise} - Voucher actualizado
   */
  async actualizarVoucher(voucherId, datos) {
    try {
      const response = await api.put(`/vouchers/${voucherId}`, datos)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Eliminar un voucher
   * @param {Number} voucherId - ID del voucher
   * @returns {Promise} - Confirmación
   */
  async eliminarVoucher(voucherId) {
    try {
      const response = await api.delete(`/vouchers/${voucherId}`)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  // ============================================================================
  // TRANSFERENCIAS BANCARIAS
  // ============================================================================

  /**
   * Registrar una transferencia bancaria
   * @param {Object} transferencia - { turno_id, numero_boleta, monto, banco }
   * @returns {Promise} - Transferencia creada
   */
  async registrarTransferencia(transferencia) {
    try {
      const response = await api.post('/transferencias', transferencia)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Obtener transferencias de un turno
   * @param {Number} turnoId - ID del turno
   * @returns {Promise} - Lista de transferencias
   */
  async obtenerTransferenciasTurno(turnoId) {
    try {
      const response = await api.get(`/transferencias/turno/${turnoId}`)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Verificar cuadre de transferencias vs ventas por transferencia
   * @param {Number} turnoId - ID del turno
   * @returns {Promise} - Cuadre de transferencias
   */
  async verificarCuadreTransferencias(turnoId) {
    try {
      const response = await api.get(`/transferencias/turno/${turnoId}/cuadre`)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Buscar transferencia por número de boleta
   * @param {String} numeroBoleta - Número de boleta
   * @returns {Promise} - Transferencias encontradas
   */
  async buscarTransferenciaPorBoleta(numeroBoleta) {
    try {
      const response = await api.get(`/transferencias/buscar/${numeroBoleta}`)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Actualizar una transferencia
   * @param {Number} transferenciaId - ID de la transferencia
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise} - Transferencia actualizada
   */
  async actualizarTransferencia(transferenciaId, datos) {
    try {
      const response = await api.put(`/transferencias/${transferenciaId}`, datos)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  /**
   * Eliminar una transferencia
   * @param {Number} transferenciaId - ID de la transferencia
   * @returns {Promise} - Confirmación
   */
  async eliminarTransferencia(transferenciaId) {
    try {
      const response = await api.delete(`/transferencias/${transferenciaId}`)
      return response.data
    } catch (error) {
      throw this.procesarError(error)
    }
  },

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Procesar errores de la API
   * @param {Error} error - Error de Axios
   * @returns {Error} - Error procesado
   */
  procesarError(error) {
    if (error.response) {
      // Error de respuesta del servidor
      const mensaje = error.response.data?.message || error.response.data?.error || 'Error en el servidor'
      const nuevoError = new Error(mensaje)
      nuevoError.status = error.response.status
      nuevoError.data = error.response.data
      return nuevoError
    } else if (error.request) {
      // Error de red
      return new Error('No se pudo conectar con el servidor. Verifica tu conexión.')
    } else {
      // Otro tipo de error
      return new Error(error.message || 'Error desconocido')
    }
  },

  /**
   * Formatear precio a Q0.00
   * @param {Number} precio - Precio a formatear
   * @returns {String} - Precio formateado
   */
  formatearPrecio(precio) {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(precio || 0)
  },

  /**
   * Formatear fecha a formato guatemalteco
   * @param {String|Date} fecha - Fecha a formatear
   * @returns {String} - Fecha formateada
   */
  formatearFecha(fecha) {
    if (!fecha) return ''
    return new Intl.DateTimeFormat('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(fecha))
  },

  /**
   * Formatear fecha corta
   * @param {String|Date} fecha - Fecha a formatear
   * @returns {String} - Fecha formateada
   */
  formatearFechaCorta(fecha) {
    if (!fecha) return ''
    return new Intl.DateTimeFormat('es-GT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(fecha))
  },

  /**
   * Calcular duración entre dos fechas
   * @param {String|Date} inicio - Fecha de inicio
   * @param {String|Date} fin - Fecha de fin (opcional, usa ahora si no se proporciona)
   * @returns {String} - Duración en formato "Xh Ym"
   */
  calcularDuracion(inicio, fin = null) {
    const fechaInicio = new Date(inicio)
    const fechaFin = fin ? new Date(fin) : new Date()
    
    const diff = fechaFin - fechaInicio
    const horas = Math.floor(diff / (1000 * 60 * 60))
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${horas}h ${minutos}m`
  },

  /**
   * Validar conteo de efectivo
   * @param {Object} billetes - Conteo de billetes
   * @param {Object} monedas - Conteo de monedas
   * @returns {Boolean} - true si es válido
   */
  validarConteoEfectivo(billetes, monedas) {
    // Verificar que al menos haya algún valor
    const tieneBilletes = Object.values(billetes).some(v => v > 0)
    const tieneMonedas = Object.values(monedas).some(v => v > 0)
    
    return tieneBilletes || tieneMonedas
  },

  /**
   * Calcular total de efectivo
   * @param {Object} billetes - { "200": 5, "100": 10, ... }
   * @param {Object} monedas - { "1": 20, "0.50": 15, ... }
   * @returns {Number} - Total calculado
   */
  calcularTotalEfectivo(billetes, monedas) {
    let total = 0
    
    // Sumar billetes
    Object.entries(billetes).forEach(([denominacion, cantidad]) => {
      total += parseFloat(denominacion) * parseInt(cantidad || 0)
    })
    
    // Sumar monedas
    Object.entries(monedas).forEach(([denominacion, cantidad]) => {
      total += parseFloat(denominacion) * parseInt(cantidad || 0)
    })
    
    return total
  }
}

export default financieroService