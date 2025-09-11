// frontend/src/services/serviciosService.js
// Servicio para gestión de servicios del Sistema Hidrocolon

import { api } from './authService'

const serviciosService = {
  // =====================================
  // OBTENER DATOS
  // =====================================

  // Obtener todos los servicios con filtros y paginación
  async getServicios(params = {}) {
    try {
      console.log('🏥 Obteniendo servicios con parámetros:', params)
      
      const response = await api.get('/servicios', { params })
      
      console.log('✅ Servicios obtenidos:', response.data.data?.length || 0)
      return response.data || {}
    } catch (error) {
      console.error('❌ Error obteniendo servicios:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error obteniendo servicios')
    }
  },

  // Obtener servicio específico por ID
  async getServicio(id) {
    try {
      console.log('👁️ Obteniendo servicio ID:', id)
      
      const response = await api.get(`/servicios/${id}`)
      
      console.log('✅ Servicio obtenido:', response.data.data?.nombre_servicio)
      return response.data.data || {}
    } catch (error) {
      console.error('❌ Error obteniendo servicio:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error obteniendo servicio')
    }
  },

  // Obtener estadísticas de servicios
  async getStats() {
    try {
      console.log('📊 Obteniendo estadísticas de servicios...')
      
      const response = await api.get('/servicios/stats')
      
      console.log('✅ Estadísticas obtenidas')
      return response.data.data || {}
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error obteniendo estadísticas')
    }
  },

  // =====================================
  // CREAR, ACTUALIZAR, ELIMINAR
  // =====================================

  // Crear nuevo servicio
  async crearServicio(datosServicio) {
    try {
      console.log('➕ Creando servicio:', datosServicio)
      
      const response = await api.post('/servicios', datosServicio)
      
      console.log('✅ Servicio creado exitosamente')
      return response.data || {}
    } catch (error) {
      console.error('❌ Error creando servicio:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error creando servicio')
    }
  },

  // Actualizar servicio existente
  async actualizarServicio(id, datosServicio) {
    try {
      console.log('📝 Actualizando servicio ID:', id, datosServicio)
      
      const response = await api.put(`/servicios/${id}`, datosServicio)
      
      console.log('✅ Servicio actualizado exitosamente')
      return response.data || {}
    } catch (error) {
      console.error('❌ Error actualizando servicio:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error actualizando servicio')
    }
  },

  // Eliminar servicio
  async eliminarServicio(id) {
    try {
      console.log('🗑️ Eliminando servicio ID:', id)
      
      const response = await api.delete(`/servicios/${id}`)
      
      console.log('✅ Servicio eliminado exitosamente')
      return response.data || {}
    } catch (error) {
      console.error('❌ Error eliminando servicio:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error eliminando servicio')
    }
  },

  // =====================================
  // GESTIÓN DE MEDICAMENTOS VINCULADOS
  // =====================================

  // Obtener medicamentos vinculados a un servicio
  async getMedicamentosVinculados(servicioId) {
    try {
      console.log('💊 Obteniendo medicamentos vinculados al servicio:', servicioId)
      
      const response = await api.get(`/servicios/${servicioId}/medicamentos`)
      
      console.log('✅ Medicamentos vinculados obtenidos:', response.data.data?.length || 0)
      return response.data || {}
    } catch (error) {
      console.error('❌ Error obteniendo medicamentos vinculados:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error obteniendo medicamentos vinculados')
    }
  },

  // Vincular medicamento a servicio
  async vincularMedicamento(servicioId, medicamentoData) {
    try {
      console.log('🔗 Vinculando medicamento:', { servicioId, medicamentoData })
      
      const response = await api.post(`/servicios/${servicioId}/medicamentos`, medicamentoData)
      
      console.log('✅ Medicamento vinculado exitosamente')
      return response.data || {}
    } catch (error) {
      console.error('❌ Error vinculando medicamento:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error vinculando medicamento')
    }
  },

  // Desvincular medicamento de servicio
  async desvincularMedicamento(servicioId, medicamentoId) {
    try {
      console.log('🚫 Desvinculando medicamento:', { servicioId, medicamentoId })
      
      const response = await api.delete(`/servicios/${servicioId}/medicamentos/${medicamentoId}`)
      
      console.log('✅ Medicamento desvinculado exitosamente')
      return response.data || {}
    } catch (error) {
      console.error('❌ Error desvinculando medicamento:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error desvinculando medicamento')
    }
  },

  // =====================================
  // BÚSQUEDAS Y FILTROS AVANZADOS
  // =====================================

  // Buscar servicios con autocompletado
  async buscarServiciosAutocompletado(query, limit = 10) {
    try {
      if (!query || query.trim().length < 2) {
        return []
      }
      
      const response = await this.getServicios({
        search: query.trim(),
        limit,
        page: 1
      })
      
      return response.data?.servicios || []
    } catch (error) {
      console.error('❌ Error en autocompletado:', error)
      return []
    }
  },

  // Filtrar servicios por múltiples criterios
  async filtrarServicios(filtros) {
    try {
      const params = {
        page: filtros.page || 1,
        limit: filtros.limit || 10
      }

      // Agregar filtros específicos
      if (filtros.search) params.search = filtros.search
      if (filtros.activo !== null && filtros.activo !== '') params.activo = filtros.activo
      if (filtros.precio_min) params.precio_min = filtros.precio_min
      if (filtros.precio_max) params.precio_max = filtros.precio_max
      if (filtros.orderBy) params.orderBy = filtros.orderBy
      if (filtros.orderDir) params.orderDir = filtros.orderDir

      return await this.getServicios(params)
    } catch (error) {
      console.error('❌ Error filtrando servicios:', error)
      throw error
    }
  },

  // =====================================
  // UTILIDADES
  // =====================================

  // Exportar servicios a Excel
  async exportarExcel(filtros = {}) {
    try {
      console.log('📊 Exportando servicios...')
      
      const response = await api.get('/servicios/export/excel', {
        params: filtros
      })
      
      // Como tu backend devuelve JSON, convertiremos a CSV manualmente
      if (response.data && response.data.data) {
        const servicios = response.data.data
        
        // Crear CSV
        const headers = ['Nombre', 'Descripcion', 'Precio Efectivo', 'Precio Tarjeta', 'Comision', 'Estado']
        const csvContent = [
          headers.join(','),
          ...servicios.map(servicio => [
            `"${servicio.nombre || servicio.nombre_servicio || 'Sin nombre'}"`,
            `"${servicio.descripcion || 'Sin descripcion'}"`,
            servicio.precio_efectivo || 0,
            servicio.precio_tarjeta || 0,
            servicio.porcentaje_comision || servicio.comision_venta || 0,
            servicio.activo ? 'Activo' : 'Inactivo'
          ].join(','))
        ].join('\n')
        
        // Crear archivo para descarga
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `servicios_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        
        console.log('✅ Servicios exportados como CSV exitosamente')
        return true
      }
      
    } catch (error) {
      console.error('❌ Error exportando servicios:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error exportando servicios')
    }
  },

  // Formatear precio para mostrar
  formatearPrecio(precio) {
    if (!precio) return 'Q 0.00'
    return `Q ${parseFloat(precio).toFixed(2)}`
  },

  // Validar datos del servicio
  validarServicio(servicio) {
    const errores = []

    if (!servicio.nombre_servicio || servicio.nombre_servicio.trim().length < 3) {
      errores.push('El nombre del servicio debe tener al menos 3 caracteres')
    }

    if (!servicio.precio_efectivo || servicio.precio_efectivo <= 0) {
      errores.push('El precio en efectivo debe ser mayor a 0')
    }

    if (!servicio.precio_tarjeta || servicio.precio_tarjeta <= 0) {
      errores.push('El precio con tarjeta debe ser mayor a 0')
    }

    if (servicio.porcentaje_comision && (servicio.porcentaje_comision < 0 || servicio.porcentaje_comision > 100)) {
      errores.push('El porcentaje de comisión debe estar entre 0 y 100')
    }

    return {
      esValido: errores.length === 0,
      errores
    }
  }
}

export default serviciosService