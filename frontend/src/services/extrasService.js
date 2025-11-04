// src/services/extrasService.js
// Servicio para gestión de extras del Sistema Hidrocolon

import { api } from './authService'

const extrasService = {
  // =====================================
  // OBTENER DATOS
  // =====================================

  // Obtener todos los extras con filtros
  async getExtras(params = {}) {
    try {
      console.log('🧰 Obteniendo extras con parámetros:', params)
      
      const response = await api.get('/extras', { params })
      
      console.log('✅ Extras obtenidos:', response.data.data?.extras?.length || 0)
      return response.data.data || {}
    } catch (error) {
      console.error('❌ Error obteniendo extras:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error obteniendo extras')
    }
  },

  // Obtener extra específico por ID
  async getExtra(id) {
    try {
      console.log('👁️ Obteniendo extra ID:', id)
      
      const response = await api.get(`/extras/${id}`)
      
      console.log('✅ Extra obtenido:', response.data.data?.nombre)
      return response.data.data || {}
    } catch (error) {
      console.error('❌ Error obteniendo extra:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error obteniendo extra')
    }
  },

  // Obtener estadísticas de extras
  async getStats() {
    try {
      console.log('📊 Obteniendo estadísticas de extras...')
      
      const response = await api.get('/extras/stats')
      
      console.log('✅ Estadísticas obtenidas')
      return response.data.data || {}
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.response?.data)
      throw new Error('Error obteniendo estadísticas')
    }
  },

  // =====================================
  // CRUD OPERATIONS
  // =====================================

  // Crear nuevo extra
  async crearExtra(datos) {
    try {
      console.log('➕ Creando extra:', datos.nombre)
      
      const datosLimpios = this.limpiarDatosExtra(datos)
      const response = await api.post('/extras', datosLimpios)
      
      console.log('✅ Extra creado exitosamente')
      return response.data.data || {}
    } catch (error) {
      console.error('❌ Error creando extra:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error creando extra')
    }
  },

  // Actualizar extra existente
  async actualizarExtra(id, datos) {
    try {
      console.log('✏️ Actualizando extra ID:', id)
      
      const datosLimpios = this.limpiarDatosExtra(datos)
      const response = await api.put(`/extras/${id}`, datosLimpios)
      
      console.log('✅ Extra actualizado exitosamente')
      return response.data.data || {}
    } catch (error) {
      console.error('❌ Error actualizando extra:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error actualizando extra')
    }
  },

  // Actualizar stock de extra
  async actualizarStock(id, nuevasExistencias, motivo = 'Ajuste manual') {
    try {
      console.log('📦 Actualizando stock extra ID:', id, 'Nuevas existencias:', nuevasExistencias)
      
      const response = await api.put(`/extras/${id}/stock`, {
        existencias: parseInt(nuevasExistencias),
        motivo: motivo
      })
      
      console.log('✅ Stock actualizado exitosamente')
      return response.data.data || {}
    } catch (error) {
      console.error('❌ Error actualizando stock:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error actualizando stock')
    }
  },

  // Eliminar extra
  async eliminarExtra(id) {
    try {
      console.log('🗑️ Eliminando extra ID:', id)
      
      const response = await api.delete(`/extras/${id}`)
      
      console.log('✅ Extra eliminado exitosamente')
      return response.data
    } catch (error) {
      console.error('❌ Error eliminando extra:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error eliminando extra')
    }
  },

  // =====================================
  // RELACIÓN CON MEDICAMENTOS
  // =====================================

  // Obtener extras de un medicamento
  async getExtrasDeMedicamento(medicamentoId) {
    try {
      console.log('🔗 Obteniendo extras del medicamento:', medicamentoId)
      
      const response = await api.get(`/medicamentos/${medicamentoId}/extras`)
      
      console.log('✅ Extras del medicamento obtenidos:', response.data.data?.length || 0)
      return response.data.data || []
    } catch (error) {
      console.error('❌ Error obteniendo extras del medicamento:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error obteniendo extras del medicamento')
    }
  },

  // Vincular extra con medicamento
  async vincularExtraConMedicamento(medicamentoId, extraId, cantidadRequerida = 1) {
    try {
      console.log('🔗 Vinculando extra', extraId, 'con medicamento', medicamentoId)
      
      const response = await api.post(`/medicamentos/${medicamentoId}/extras`, {
        extra_id: parseInt(extraId),
        cantidad_requerida: parseInt(cantidadRequerida)
      })
      
      console.log('✅ Extra vinculado exitosamente')
      return response.data
    } catch (error) {
      console.error('❌ Error vinculando extra:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error vinculando extra')
    }
  },

  // Desvincular extra de medicamento
  async desvincularExtraDeMedicamento(medicamentoId, extraId) {
    try {
      console.log('🔗 Desvinculando extra', extraId, 'del medicamento', medicamentoId)
      
      const response = await api.delete(`/medicamentos/${medicamentoId}/extras/${extraId}`)
      
      console.log('✅ Extra desvinculado exitosamente')
      return response.data
    } catch (error) {
      console.error('❌ Error desvinculando extra:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error desvinculando extra')
    }
  },



  // =============================================
  // MÉTODOS PARA RELACIÓN CON SERVICIOS
  // =============================================

  /**
   * Obtener extras vinculados a un servicio
   */
  async getExtrasDeServicio(servicioId) {
    try {
      console.log('📞 Obteniendo extras del servicio:', servicioId)
      const response = await api.get(`/servicios/${servicioId}/extras`)
      console.log('✅ Extras del servicio obtenidos:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo extras del servicio:', error)
      throw new Error(error.response?.data?.message || 'Error en la operación')
    }
  },

  /**
   * Vincular un extra con un servicio
   */
  async vincularExtraConServicio(servicioId, extraId, cantidadRequerida = 1) {
    try {
      console.log('🔗 Vinculando extra con servicio:', { servicioId, extraId, cantidadRequerida })
      const response = await api.post(`/servicios/${servicioId}/extras`, {
        extra_id: extraId,
        cantidad_requerida: cantidadRequerida
      })
      console.log('✅ Extra vinculado con servicio')
      return response.data
    } catch (error) {
      console.error('❌ Error vinculando extra con servicio:', error)
      throw new Error(error.response?.data?.message || 'Error en la operación')
    }
  },

  /**
   * Desvincular un extra de un servicio
   */
  async desvincularExtraDeServicio(servicioId, extraId) {
    try {
      console.log('🔗 Desvinculando extra de servicio:', { servicioId, extraId })
      const response = await api.delete(`/servicios/${servicioId}/extras/${extraId}`)
      console.log('✅ Extra desvinculado de servicio')
      return response.data
    } catch (error) {
      console.error('❌ Error desvinculando extra de servicio:', error)
      throw new Error(error.response?.data?.message || 'Error en la operación')
    }
  },





  // =====================================
  // UTILIDADES Y VALIDACIONES
  // =====================================

  // Limpiar datos del extra antes de enviar al API
  limpiarDatosExtra(datos) {
    return {
      nombre: datos.nombre?.trim() || '',
      descripcion: datos.descripcion?.trim() || '',
      existencias: parseInt(datos.existencias) || 0,
      stock_minimo: parseInt(datos.stock_minimo) || 20,
      costo_unitario: parseFloat(datos.precio_unitario) || 0, // En frontend usamos precio_unitario
      activo: datos.activo !== undefined ? datos.activo : true
    }
  },

  // Validar datos de extra
  validarExtra(datos) {
    const errores = []

    if (!datos.nombre || datos.nombre.trim().length === 0) {
      errores.push('El nombre del extra es obligatorio')
    }

    if (datos.nombre && datos.nombre.trim().length > 100) {
      errores.push('El nombre no puede exceder 100 caracteres')
    }

    if (datos.existencias !== undefined && (isNaN(datos.existencias) || datos.existencias < 0)) {
      errores.push('Las existencias deben ser un número válido mayor o igual a 0')
    }

    if (datos.stock_minimo !== undefined && (isNaN(datos.stock_minimo) || datos.stock_minimo < 0)) {
      errores.push('El stock mínimo debe ser un número válido mayor o igual a 0')
    }

    if (datos.precio_unitario !== undefined && (isNaN(datos.precio_unitario) || datos.precio_unitario < 0)) {
      errores.push('El precio unitario debe ser un número válido mayor o igual a 0')
    }

    return {
      valido: errores.length === 0,
      errores
    }
  },

  // Validar cantidad para stock
  validarCantidad(cantidad, maximo = 9999) {
    const cantidadNum = parseInt(cantidad)

    if (isNaN(cantidadNum) || cantidadNum < 0) {
      return {
        valido: false,
        error: 'La cantidad debe ser un número válido mayor o igual a 0'
      }
    }

    if (cantidadNum > maximo) {
      return {
        valido: false,
        error: `La cantidad no puede exceder ${maximo}`
      }
    }

    return {
      valido: true,
      cantidad: cantidadNum
    }
  },

  // =====================================
  // UTILIDADES DE FORMATEO Y ESTADO
  // =====================================

  // Formatear precio para mostrar
  formatPrice(precio) {
    if (!precio || isNaN(precio)) return 'Q 0.00'
    return `Q ${parseFloat(precio).toFixed(2)}`
  },

  // Obtener estado del stock
  getStockStatus(existencias, stockMinimo = 20) {
    const cantidad = parseInt(existencias) || 0
    const minimo = parseInt(stockMinimo) || 20
    
    if (cantidad === 0) {
      return {
        estado: 'agotado',
        badge: 'Agotado',
        color: 'bg-red-100 text-red-800'
      }
    }
    
    if (cantidad < minimo) {
      return {
        estado: 'bajo',
        badge: 'Stock Bajo',
        color: 'bg-yellow-100 text-yellow-800'
      }
    }
    
    if (cantidad < (minimo * 2)) {
      return {
        estado: 'medio',
        badge: 'Stock Medio',
        color: 'bg-blue-100 text-blue-800'
      }
    }
    
    return {
      estado: 'normal',
      badge: 'Stock Normal',
      color: 'bg-green-100 text-green-800'
    }
  },

  // Obtener icono para tipo de extra
  getExtraIcon(nombre) {
    const nombreLower = nombre.toLowerCase()
    
    if (nombreLower.includes('alcohol')) return '🧴'
    if (nombreLower.includes('algodón')) return '🧽'
    if (nombreLower.includes('jeringa')) return '💉'
    if (nombreLower.includes('aguja')) return '📍'
    if (nombreLower.includes('gasa')) return '🩹'
    if (nombreLower.includes('guante')) return '🧤'
    if (nombreLower.includes('vendas')) return '🎗️'
    if (nombreLower.includes('catéter')) return '🔌'
    if (nombreLower.includes('equipo')) return '🔗'
    
    return '🧰' // Icono por defecto
  },

  // Formatear fecha para mostrar
  formatDate(fecha) {
    if (!fecha) return '--'
    
    try {
      const date = new Date(fecha)
      if (isNaN(date.getTime())) return '--'
      
      return date.toLocaleDateString('es-GT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch (error) {
      return '--'
    }
  }
}

export default extrasService