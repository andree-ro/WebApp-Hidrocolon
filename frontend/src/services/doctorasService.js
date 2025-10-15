// frontend/src/services/doctorasService.js
import { api } from './authService'

const doctorasService = {
    /**
     * Obtener todas las doctoras activas
     */
    async obtenerDoctoras() {
        try {
            console.log('👩‍⚕️ Obteniendo doctoras...')
            
            const response = await api.get('/doctoras')
            
            console.log('✅ Doctoras obtenidas:', response.data.data?.length || 0)
            return response.data
        } catch (error) {
            console.error('❌ Error obteniendo doctoras:', error.response?.data)
            throw error
        }
    },

    /**
     * Obtener una doctora específica por ID
     */
    async obtenerDoctora(id) {
        try {
            console.log('👁️ Obteniendo doctora ID:', id)
            
            const response = await api.get(`/doctoras/${id}`)
            
            console.log('✅ Doctora obtenida:', response.data.data?.nombre)
            return response.data
        } catch (error) {
            console.error('❌ Error obteniendo doctora:', error.response?.data)
            throw error
        }
    },

    /**
     * Crear nueva doctora (solo admin)
     */
    async crearDoctora(datos) {
        try {
            console.log('➕ Creando doctora:', datos.nombre)
            
            const response = await api.post('/doctoras', datos)
            
            console.log('✅ Doctora creada exitosamente')
            return response.data
        } catch (error) {
            console.error('❌ Error creando doctora:', error.response?.data)
            throw error
        }
    },

    /**
     * Actualizar doctora (solo admin)
     */
    async actualizarDoctora(id, datos) {
        try {
            console.log('✏️ Actualizando doctora ID:', id)
            
            const response = await api.put(`/doctoras/${id}`, datos)
            
            console.log('✅ Doctora actualizada exitosamente')
            return response.data
        } catch (error) {
            console.error('❌ Error actualizando doctora:', error.response?.data)
            throw error
        }
    },

    /**
     * Eliminar (desactivar) doctora (solo admin)
     */
    async eliminarDoctora(id) {
        try {
            console.log('🗑️ Eliminando doctora ID:', id)
            
            const response = await api.delete(`/doctoras/${id}`)
            
            console.log('✅ Doctora eliminada exitosamente')
            return response.data
        } catch (error) {
            console.error('❌ Error eliminando doctora:', error.response?.data)
            throw error
        }
    },

    /**
     * Obtener comisiones por doctora
     */
    async obtenerComisionesPorDoctora(filtros = {}) {
        try {
            console.log('💰 Obteniendo comisiones por doctora...')
            
            const response = await api.get('/ventas/comisiones-doctoras', { params: filtros })
            
            console.log('✅ Comisiones obtenidas')
            return response.data
        } catch (error) {
            console.error('❌ Error obteniendo comisiones:', error.response?.data)
            throw error
        }
    }
}

export default doctorasService