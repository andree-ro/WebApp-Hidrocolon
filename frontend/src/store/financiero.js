// frontend/src/store/financiero.js
// Store de Pinia para el módulo financiero del Sistema Hidrocolon

import { defineStore } from 'pinia'
import financieroService from '@/services/financieroService'

export const useFinancieroStore = defineStore('financiero', {
  // ============================================================================
  // STATE
  // ============================================================================
  state: () => ({
    // Turno activo
    turnoActivo: null,
    
    // Resumen del turno en tiempo real
    resumenTurno: null,
    
    // Listas
    gastos: [],
    vouchers: [],
    transferencias: [],
    historialTurnos: [],
    
    // Estados de carga
    loading: {
      turno: false,
      resumen: false,
      gastos: false,
      vouchers: false,
      transferencias: false,
      cierre: false
    },
    
    // Errores
    error: null,
    
    // Cache de datos
    cache: {
      ultimaActualizacion: null,
      estadisticas: null
    },
    
    // UI States
    mostrarModalApertura: false,
    mostrarModalCierre: false,
    mostrarModalGasto: false,
    mostrarModalVoucher: false,
    mostrarModalTransferencia: false
  }),

  // ============================================================================
  // GETTERS
  // ============================================================================
  getters: {
    /**
     * Verificar si hay un turno activo
     */
    hayTurnoActivo: (state) => !!state.turnoActivo,
    
    /**
     * ID del turno activo
     */
    turnoId: (state) => state.turnoActivo?.id || null,
    
    /**
     * Información del turno activo
     */
    infoTurno: (state) => {
      if (!state.turnoActivo) return null
      
      return {
        id: state.turnoActivo.id,
        usuario: state.turnoActivo.usuario_nombre,
        fechaApertura: state.turnoActivo.fecha_apertura,
        efectivoInicial: state.turnoActivo.efectivo_inicial_total,
        estado: state.turnoActivo.estado
      }
    },
    
    /**
     * Total de gastos del turno
     */
    totalGastos: (state) => {
      return state.gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto || 0), 0)
    },
    
    /**
     * Total de vouchers del turno
     */
    totalVouchers: (state) => {
      return state.vouchers.reduce((sum, voucher) => sum + parseFloat(voucher.monto || 0), 0)
    },
    
    /**
     * Total de transferencias del turno
     */
    totalTransferencias: (state) => {
      return state.transferencias.reduce((sum, trans) => sum + parseFloat(trans.monto || 0), 0)
    },
    
    /**
     * Resumen financiero rápido
     */
    resumenFinanciero: (state) => {
      if (!state.resumenTurno) return null
      
      const ventas = state.resumenTurno.ventas || {}
      const impuestos = state.resumenTurno.impuestos || {}
      
      return {
        ventaTotal: ventas.total || 0,
        ventaEfectivo: ventas.efectivo || 0,
        ventaTarjeta: ventas.tarjeta || 0,
        ventaTransferencia: ventas.transferencia || 0,
        impuestoTotal: (impuestos.efectivo || 0) + (impuestos.tarjeta || 0) + (impuestos.transferencia || 0),
        gastoTotal: state.totalGastos,
        efectivoEnCaja: (ventas.efectivo || 0) - state.totalGastos
      }
    },
    
    /**
     * Verificar si está cargando algo
     */
    estaCargando: (state) => {
      return Object.values(state.loading).some(val => val === true)
    },
    
    /**
     * Duración del turno activo
     */
    duracionTurno: (state) => {
      if (!state.turnoActivo?.fecha_apertura) return '0h 0m'
      return financieroService.calcularDuracion(state.turnoActivo.fecha_apertura)
    }
  },

  // ============================================================================
  // ACTIONS
  // ============================================================================
  actions: {
    // ========================================
    // TURNOS
    // ========================================
    
    /**
     * Verificar si hay turno activo
     */
    async verificarTurnoActivo() {
      this.loading.turno = true
      this.error = null
      
      try {
        const response = await financieroService.verificarTurnoActivo()
        this.turnoActivo = response.data
        
        // Si hay turno activo, cargar su resumen
        if (this.turnoActivo) {
          await this.obtenerResumenTurno()
        }
        
        return response
      } catch (error) {
        this.error = error.message
        console.error('Error al verificar turno activo:', error)
        throw error
      } finally {
        this.loading.turno = false
      }
    },
    
    /**
     * Abrir un nuevo turno
     */
    async abrirTurno(datosApertura) {
      this.loading.turno = true
      this.error = null
      
      try {
        const usuario = JSON.parse(localStorage.getItem('user_data'))
        
        if (!usuario || !usuario.id) {
          throw new Error('No hay usuario autenticado')
        }
        
        // Agregar usuario_id a los datos
        const datosCompletos = {
          ...datosApertura,
          usuario_id: usuario.id
        }
        
        console.log('📤 Enviando datos completos de apertura:', datosCompletos)
        
        const response = await financieroService.abrirTurno(datosCompletos)
        this.turnoActivo = response.data
        
        // Limpiar datos previos
        this.gastos = []
        this.vouchers = []
        this.transferencias = []
        this.resumenTurno = null
        
        // Cargar resumen inicial
        await this.obtenerResumenTurno()
        
        // Cerrar modal de apertura
        this.mostrarModalApertura = false
        
        return response
      } catch (error) {
        this.error = error.message
        console.error('Error al abrir turno:', error)
        throw error
      } finally {
        this.loading.turno = false
      }
    },
    
    /**
     * Cerrar turno con cuadre automático
     */
    async cerrarTurno(datosCierre) {
      if (!this.turnoActivo) {
        throw new Error('No hay turno activo para cerrar')
      }
      
      this.loading.cierre = true
      this.error = null
      
      try {
        const response = await financieroService.cerrarTurno(this.turnoActivo.id, datosCierre)
        
        // Limpiar estado
        this.turnoActivo = null
        this.resumenTurno = null
        this.gastos = []
        this.vouchers = []
        this.transferencias = []
        
        // Cerrar modal de cierre
        this.mostrarModalCierre = false
        
        return response
      } catch (error) {
        this.error = error.message
        console.error('Error al cerrar turno:', error)
        throw error
      } finally {
        this.loading.cierre = false
      }
    },
    
    /**
     * Obtener resumen del turno en tiempo real
     */
    async obtenerResumenTurno() {
      if (!this.turnoActivo) return
      
      this.loading.resumen = true
      
      try {
        const response = await financieroService.obtenerResumenTurno(this.turnoActivo.id)
        this.resumenTurno = response.data
        
        // Actualizar listas
        this.gastos = response.data.gastos || []
        this.vouchers = response.data.vouchers || []
        this.transferencias = response.data.transferencias || []
        
        // Actualizar timestamp de cache
        this.cache.ultimaActualizacion = new Date()
        
        return response
      } catch (error) {
        console.error('Error al obtener resumen del turno:', error)
        // No lanzamos el error para no interrumpir el flujo
      } finally {
        this.loading.resumen = false
      }
    },
    
    /**
     * Calcular cuadre previo (preview sin cerrar)
     */
    async calcularCuadrePrevio(efectivoFinal) {
      if (!this.turnoActivo) {
        throw new Error('No hay turno activo')
      }
      
      try {
        const response = await financieroService.calcularCuadrePrevio(
          this.turnoActivo.id, 
          efectivoFinal
        )
        return response.data
      } catch (error) {
        this.error = error.message
        console.error('Error al calcular cuadre previo:', error)
        throw error
      }
    },
    
    /**
     * Obtener estadísticas generales
     */
    async obtenerEstadisticas(filtros = {}) {
      try {
        const response = await financieroService.obtenerEstadisticas(filtros)
        this.cache.estadisticas = response.data
        return response
      } catch (error) {
        console.error('Error al obtener estadísticas:', error)
        throw error
      }
    },
    
    /**
     * Listar turnos históricos
     */
    async listarTurnos(filtros = {}) {
      this.loading.turno = true
      
      try {
        const response = await financieroService.listarTurnos(filtros)
        this.historialTurnos = response.data
        return response
      } catch (error) {
        console.error('Error al listar turnos:', error)
        throw error
      } finally {
        this.loading.turno = false
      }
    },
    
    // ========================================
    // GASTOS
    // ========================================
    
    /**
     * Registrar un nuevo gasto
     */
    async registrarGasto(gasto) {
      if (!this.turnoActivo) {
        throw new Error('No hay turno activo')
      }
      
      this.loading.gastos = true
      this.error = null
      
      try {
        // Agregar turno_id automáticamente
        const gastoCompleto = {
          ...gasto,
          turno_id: this.turnoActivo.id
        }
        
        const response = await financieroService.registrarGasto(gastoCompleto)
        
        // Agregar a la lista local
        this.gastos.push(response.data)
        
        // Actualizar resumen
        await this.obtenerResumenTurno()
        
        // Cerrar modal
        this.mostrarModalGasto = false
        
        return response
      } catch (error) {
        this.error = error.message
        console.error('Error al registrar gasto:', error)
        throw error
      } finally {
        this.loading.gastos = false
      }
    },
    
    /**
     * Actualizar un gasto
     */
    async actualizarGasto(gastoId, datos) {
      this.loading.gastos = true
      
      try {
        const response = await financieroService.actualizarGasto(gastoId, datos)
        
        // Actualizar en la lista local
        const index = this.gastos.findIndex(g => g.id === gastoId)
        if (index !== -1) {
          this.gastos[index] = response.data
        }
        
        // Actualizar resumen
        await this.obtenerResumenTurno()
        
        return response
      } catch (error) {
        console.error('Error al actualizar gasto:', error)
        throw error
      } finally {
        this.loading.gastos = false
      }
    },
    
    /**
     * Eliminar un gasto
     */
    async eliminarGasto(gastoId) {
      this.loading.gastos = true
      
      try {
        await financieroService.eliminarGasto(gastoId)
        
        // Remover de la lista local
        this.gastos = this.gastos.filter(g => g.id !== gastoId)
        
        // Actualizar resumen
        await this.obtenerResumenTurno()
      } catch (error) {
        console.error('Error al eliminar gasto:', error)
        throw error
      } finally {
        this.loading.gastos = false
      }
    },
    
    // ========================================
    // VOUCHERS
    // ========================================
    
    /**
     * Registrar un voucher de tarjeta
     */
    async registrarVoucher(voucher) {
      if (!this.turnoActivo) {
        throw new Error('No hay turno activo')
      }
      
      this.loading.vouchers = true
      this.error = null
      
      try {
        const voucherCompleto = {
          ...voucher,
          turno_id: this.turnoActivo.id
        }
        
        const response = await financieroService.registrarVoucher(voucherCompleto)
        
        // Agregar a la lista local
        this.vouchers.push(response.data)
        
        // Actualizar resumen
        await this.obtenerResumenTurno()
        
        // Cerrar modal
        this.mostrarModalVoucher = false
        
        return response
      } catch (error) {
        this.error = error.message
        console.error('Error al registrar voucher:', error)
        throw error
      } finally {
        this.loading.vouchers = false
      }
    },
    
    /**
     * Verificar cuadre de vouchers
     */
    async verificarCuadreVouchers() {
      if (!this.turnoActivo) return null
      
      try {
        const response = await financieroService.verificarCuadreVouchers(this.turnoActivo.id)
        return response.data
      } catch (error) {
        console.error('Error al verificar cuadre de vouchers:', error)
        throw error
      }
    },
    
    /**
     * Eliminar un voucher
     */
    async eliminarVoucher(voucherId) {
      this.loading.vouchers = true
      
      try {
        await financieroService.eliminarVoucher(voucherId)
        
        // Remover de la lista local
        this.vouchers = this.vouchers.filter(v => v.id !== voucherId)
        
        // Actualizar resumen
        await this.obtenerResumenTurno()
      } catch (error) {
        console.error('Error al eliminar voucher:', error)
        throw error
      } finally {
        this.loading.vouchers = false
      }
    },
    
    // ========================================
    // TRANSFERENCIAS
    // ========================================
    
    /**
     * Registrar una transferencia bancaria
     */
    async registrarTransferencia(transferencia) {
      if (!this.turnoActivo) {
        throw new Error('No hay turno activo')
      }
      
      this.loading.transferencias = true
      this.error = null
      
      try {
        const transferenciaCompleta = {
          ...transferencia,
          turno_id: this.turnoActivo.id
        }
        
        const response = await financieroService.registrarTransferencia(transferenciaCompleta)
        
        // Agregar a la lista local
        this.transferencias.push(response.data)
        
        // Actualizar resumen
        await this.obtenerResumenTurno()
        
        // Cerrar modal
        this.mostrarModalTransferencia = false
        
        return response
      } catch (error) {
        this.error = error.message
        console.error('Error al registrar transferencia:', error)
        throw error
      } finally {
        this.loading.transferencias = false
      }
    },
    
    /**
     * Verificar cuadre de transferencias
     */
    async verificarCuadreTransferencias() {
      if (!this.turnoActivo) return null
      
      try {
        const response = await financieroService.verificarCuadreTransferencias(this.turnoActivo.id)
        return response.data
      } catch (error) {
        console.error('Error al verificar cuadre de transferencias:', error)
        throw error
      }
    },
    
    /**
     * Eliminar una transferencia
     */
    async eliminarTransferencia(transferenciaId) {
      this.loading.transferencias = true
      
      try {
        await financieroService.eliminarTransferencia(transferenciaId)
        
        // Remover de la lista local
        this.transferencias = this.transferencias.filter(t => t.id !== transferenciaId)
        
        // Actualizar resumen
        await this.obtenerResumenTurno()
      } catch (error) {
        console.error('Error al eliminar transferencia:', error)
        throw error
      } finally {
        this.loading.transferencias = false
      }
    },
    
    // ========================================
    // UTILIDADES
    // ========================================
    
    /**
     * Refrescar datos del turno activo
     */
    async refrescarDatos() {
      if (!this.turnoActivo) return
      
      await this.obtenerResumenTurno()
    },
    
    /**
     * Limpiar errores
     */
    limpiarError() {
      this.error = null
    },
    
    /**
     * Resetear store completo
     */
    resetearStore() {
      this.turnoActivo = null
      this.resumenTurno = null
      this.gastos = []
      this.vouchers = []
      this.transferencias = []
      this.historialTurnos = []
      this.error = null
      this.cache.ultimaActualizacion = null
      this.cache.estadisticas = null
      
      // Cerrar todos los modales
      this.mostrarModalApertura = false
      this.mostrarModalCierre = false
      this.mostrarModalGasto = false
      this.mostrarModalVoucher = false
      this.mostrarModalTransferencia = false
    },
    
    /**
     * Abrir modal de apertura
     */
    abrirModalApertura() {
      this.mostrarModalApertura = true
    },
    
    /**
     * Cerrar modal de apertura
     */
    cerrarModalApertura() {
      this.mostrarModalApertura = false
    },
    
    /**
     * Abrir modal de cierre
     */
    abrirModalCierre() {
      this.mostrarModalCierre = true
    },
    
    /**
     * Cerrar modal de cierre
     */
    cerrarModalCierre() {
      this.mostrarModalCierre = false
    },
    
    /**
     * Toggle modal de gasto
     */
    toggleModalGasto() {
      this.mostrarModalGasto = !this.mostrarModalGasto
    },
    
    /**
     * Toggle modal de voucher
     */
    toggleModalVoucher() {
      this.mostrarModalVoucher = !this.mostrarModalVoucher
    },
    
    /**
     * Toggle modal de transferencia
     */
    toggleModalTransferencia() {
      this.mostrarModalTransferencia = !this.mostrarModalTransferencia
    }
  }
})