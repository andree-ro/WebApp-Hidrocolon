// src/services/historialInventarioService.js
import { api } from './authService'

/**
 * Servicio para gestionar el historial de inventario
 */
const historialInventarioService = {
    /**
     * Obtener historial completo con filtros
     */
    async obtenerHistorial(filtros = {}) {
        try {
            const response = await api.get('/historial-inventario', { params: filtros });
            return response.data;
        } catch (error) {
            console.error('Error obteniendo historial:', error);
            throw error.response?.data || error;
        }
    },

    /**
     * Obtener historial de un producto específico
     */
    async obtenerHistorialProducto(tipo, productoId) {
        try {
            const response = await api.get(`/historial-inventario/producto/${tipo}/${productoId}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo historial del producto:', error);
            throw error.response?.data || error;
        }
    },

    /**
     * Obtener estadísticas del historial
     */
    async obtenerEstadisticas(filtros = {}) {
        try {
            const response = await api.get('/historial-inventario/estadisticas', { params: filtros });
            return response.data;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw error.response?.data || error;
        }
    },

    /**
     * Registrar entrada de inventario (compra, recepción)
     */
    async registrarEntrada(datos) {
        try {
            const response = await api.post('/historial-inventario/registrar-entrada', datos);
            return response.data;
        } catch (error) {
            console.error('Error registrando entrada:', error);
            throw error.response?.data || error;
        }
    },

    /**
     * Registrar salida de inventario (devolución, vencimiento)
     */
    async registrarSalida(datos) {
        try {
            const response = await api.post('/historial-inventario/registrar-salida', datos);
            return response.data;
        } catch (error) {
            console.error('Error registrando salida:', error);
            throw error.response?.data || error;
        }
    }
};

export default historialInventarioService;