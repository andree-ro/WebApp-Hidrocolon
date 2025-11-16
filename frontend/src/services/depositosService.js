// frontend/src/services/depositosService.js
import api from './index.js'

export default {
  /**
   * Registrar un nuevo depósito
   * @param {Object} deposito - { numero_deposito, paciente_nombre, monto }
   * @returns {Promise} - Depósito creado
   */
  async registrarDeposito(deposito) {
    try {
      const response = await api.post('/depositos', deposito)
      return response.data
    } catch (error) {
      console.error('Error al registrar depósito:', error)
      throw error.response?.data || error
    }
  },

  /**
   * Obtener depósitos de un turno
   * @param {Number} turnoId - ID del turno
   * @returns {Promise} - Lista de depósitos
   */
  async obtenerDepositosTurno(turnoId) {
    try {
      const response = await api.get(`/depositos/turno/${turnoId}`)
      return response.data
    } catch (error) {
      console.error('Error al obtener depósitos:', error)
      throw error.response?.data || error
    }
  },

  /**
   * Verificar cuadre de depósitos vs ventas por depósito
   * @param {Number} turnoId - ID del turno
   * @returns {Promise} - Información del cuadre
   */
  async verificarCuadreDepositos(turnoId) {
    try {
      const response = await api.get(`/depositos/turno/${turnoId}/cuadre`)
      return response.data
    } catch (error) {
      console.error('Error al verificar cuadre:', error)
      throw error.response?.data || error
    }
  },

  /**
   * Buscar depósito por número
   * @param {String} numeroDeposito - Número del depósito
   * @returns {Promise} - Depósitos encontrados
   */
  async buscarDepositoPorNumero(numeroDeposito) {
    try {
      const response = await api.get(`/depositos/buscar/${numeroDeposito}`)
      return response.data
    } catch (error) {
      console.error('Error al buscar depósito:', error)
      throw error.response?.data || error
    }
  },

  /**
   * Obtener un depósito específico
   * @param {Number} depositoId - ID del depósito
   * @returns {Promise} - Depósito
   */
  async obtenerDeposito(depositoId) {
    try {
      const response = await api.get(`/depositos/${depositoId}`)
      return response.data
    } catch (error) {
      console.error('Error al obtener depósito:', error)
      throw error.response?.data || error
    }
  },

  /**
   * Actualizar un depósito
   * @param {Number} depositoId - ID del depósito
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise} - Depósito actualizado
   */
  async actualizarDeposito(depositoId, datos) {
    try {
      const response = await api.put(`/depositos/${depositoId}`, datos)
      return response.data
    } catch (error) {
      console.error('Error al actualizar depósito:', error)
      throw error.response?.data || error
    }
  },

  /**
   * Eliminar un depósito
   * @param {Number} depositoId - ID del depósito
   * @returns {Promise} - Confirmación
   */
  async eliminarDeposito(depositoId) {
    try {
      const response = await api.delete(`/depositos/${depositoId}`)
      return response.data
    } catch (error) {
      console.error('Error al eliminar depósito:', error)
      throw error.response?.data || error
    }
  }
}