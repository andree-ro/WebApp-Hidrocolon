// src/services/farmaciaService.js
import { api } from './authService'

const farmaciaService = {
  // =====================================
  // OPERACIONES CRUD PRINCIPALES
  // =====================================

  // Obtener medicamentos con filtros y paginación
  async getMedicamentos(params = {}) {
    try {
      console.log('📊 Obteniendo medicamentos con parámetros:', params)
      
      const response = await api.get('/farmacia', { params })
      
      console.log('✅ Medicamentos obtenidos:', response.data.data?.medicamentos?.length || 0)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo medicamentos:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error obteniendo medicamentos')
    }
  },

  // Obtener medicamento específico por ID
  async getMedicamento(id) {
    try {
      console.log('👁️ Obteniendo medicamento ID:', id)
      
      const response = await api.get(`/farmacia/${id}`)
      
      console.log('✅ Medicamento obtenido:', response.data.data?.nombre)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo medicamento:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error obteniendo medicamento')
    }
  },

  // Crear nuevo medicamento
  async crearMedicamento(medicamentoData) {
    try {
      console.log('➕ Creando nuevo medicamento:', medicamentoData.nombre)
      
      // Limpiar datos antes de enviar
      const datosLimpios = this.limpiarDatosMedicamento(medicamentoData)
      
      const response = await api.post('/farmacia', datosLimpios)
      
      console.log('✅ Medicamento creado exitosamente:', response.data.data?.id)
      return response.data
    } catch (error) {
      console.error('❌ Error creando medicamento:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error creando medicamento')
    }
  },

  // Actualizar medicamento existente
  async actualizarMedicamento(id, medicamentoData) {
    try {
      console.log('✏️ Actualizando medicamento ID:', id, '- Nombre:', medicamentoData.nombre)
      
      // Limpiar datos antes de enviar
      const datosLimpios = this.limpiarDatosMedicamento(medicamentoData)
      
      const response = await api.put(`/farmacia/${id}`, datosLimpios)
      
      console.log('✅ Medicamento actualizado exitosamente')
      return response.data
    } catch (error) {
      console.error('❌ Error actualizando medicamento:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error actualizando medicamento')
    }
  },

  // Eliminar medicamento
  async eliminarMedicamento(id) {
    try {
      console.log('🗑️ Eliminando medicamento ID:', id)
      
      const response = await api.delete(`/farmacia/${id}`)
      
      console.log('✅ Medicamento eliminado exitosamente')
      return response.data
    } catch (error) {
      console.error('❌ Error eliminando medicamento:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error eliminando medicamento')
    }
  },

  // =====================================
  // OPERACIONES DE STOCK
  // =====================================

  // Actualizar stock de medicamento
  async actualizarStock(id, cantidad, motivo = 'Ajuste manual') {
    try {
      console.log('📦 Actualizando stock:', { id, cantidad, motivo })
      
      const response = await api.put(`/farmacia/${id}/stock`, {
        cantidad: parseInt(cantidad),
        motivo
      })
      
      console.log('✅ Stock actualizado exitosamente')
      return response.data
    } catch (error) {
      console.error('❌ Error actualizando stock:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error actualizando stock')
    }
  },

  // =====================================
  // DATOS AUXILIARES
  // =====================================

  // Obtener presentaciones para filtros
  async getPresentaciones() {
    try {
      console.log('📋 Obteniendo presentaciones...')
      
      const response = await api.get('/farmacia/presentaciones')
      
      console.log('✅ Presentaciones obtenidas:', response.data.data?.length || 0)
      return response.data.data || []
    } catch (error) {
      console.error('❌ Error obteniendo presentaciones:', error.response?.data)
      throw new Error('Error obteniendo presentaciones')
    }
  },

  // Obtener laboratorios para filtros
  async getLaboratorios() {
    try {
      console.log('🏭 Obteniendo laboratorios...')
      
      const response = await api.get('/farmacia/laboratorios')
      
      console.log('✅ Laboratorios obtenidos:', response.data.data?.length || 0)
      return response.data.data || []
    } catch (error) {
      console.error('❌ Error obteniendo laboratorios:', error.response?.data)
      throw new Error('Error obteniendo laboratorios')
    }
  },

  // Obtener estadísticas del módulo farmacia
  async getEstadisticas() {
    try {
      console.log('📈 Obteniendo estadísticas...')
      
      const response = await api.get('/farmacia/stats')
      
      console.log('✅ Estadísticas obtenidas')
      return response.data.data || {}
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.response?.data)
      throw new Error('Error obteniendo estadísticas')
    }
  },

  // =====================================
  // OPERACIONES DE CARRITO (PREPARADO)
  // =====================================

  // Agregar medicamento al carrito (preparado para módulo carrito)
  async agregarAlCarrito(medicamentoId, cantidad, tipoPrecio = 'tarjeta') {
    try {
      console.log('🛒 Agregando al carrito:', { medicamentoId, cantidad, tipoPrecio })
      
      const response = await api.post(`/farmacia/${medicamentoId}/carrito`, {
        cantidad: parseInt(cantidad),
        precio_tipo: tipoPrecio
      })
      
      console.log('✅ Agregado al carrito exitosamente')
      return response.data.data || {}
    } catch (error) {
      console.error('❌ Error agregando al carrito:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error agregando al carrito')
    }
  },

  // =====================================
  // EXPORTACIÓN DE DATOS
  // =====================================

  // Exportar datos de medicamentos
  async exportarDatos() {
    try {
      console.log('📤 Exportando datos...')
      
      const response = await api.get('/farmacia/export/excel')
      
      console.log('✅ Datos exportados:', response.data.data?.length || 0, 'registros')
      return response.data.data || []
    } catch (error) {
      console.error('❌ Error exportando datos:', error.response?.data)
      throw new Error('Error exportando datos')
    }
  },

  // =====================================
  // UTILIDADES Y VALIDACIONES
  // =====================================

  // Limpiar datos del medicamento antes de enviar al API
  limpiarDatosMedicamento(datos) {
    const datosLimpios = {
      nombre: datos.nombre?.trim() || '',
      presentacion_id: parseInt(datos.presentacion_id) || null,
      laboratorio_id: parseInt(datos.laboratorio_id) || null,
      fecha_vencimiento: datos.fecha_vencimiento || null,
      existencias: parseInt(datos.existencias) || 0,
      precio_tarjeta: parseFloat(datos.precio_tarjeta) || 0,
      precio_efectivo: parseFloat(datos.precio_efectivo) || 0,
      costo_compra: parseFloat(datos.costo_compra) || 0,
      indicaciones: datos.indicaciones?.trim() || '',
      contraindicaciones: datos.contraindicaciones?.trim() || '',
      dosis: datos.dosis?.trim() || '',
      porcentaje_comision: parseFloat(datos.porcentaje_comision) || 0,
      requiere_extras: Boolean(datos.requiere_extras),
      activo: datos.activo !== undefined ? Boolean(datos.activo) : true
    }

    // Remover campos nulos o vacíos para updates parciales
    Object.keys(datosLimpios).forEach(key => {
      if (datosLimpios[key] === null || datosLimpios[key] === '') {
        if (key !== 'existencias' && key !== 'precio_tarjeta' && key !== 'precio_efectivo') {
          delete datosLimpios[key]
        }
      }
    })

    console.log('🧹 Datos limpiados:', datosLimpios)
    return datosLimpios
  },

  // Validar cantidad para operaciones
  validarCantidad(cantidad, max = 9999) {
    const cantidadNum = parseInt(cantidad)
    
    if (isNaN(cantidadNum)) {
      return {
        valido: false,
        error: 'La cantidad debe ser un número válido'
      }
    }
    
    if (cantidadNum < 0) {
      return {
        valido: false,
        error: 'La cantidad no puede ser negativa'
      }
    }
    
    if (cantidadNum > max) {
      return {
        valido: false,
        error: `La cantidad no puede ser mayor a ${max}`
      }
    }
    
    return {
      valido: true,
      cantidad: cantidadNum
    }
  },

  // Validar datos básicos del medicamento
  validarMedicamento(datos) {
    const errores = []

    if (!datos.nombre?.trim()) {
      errores.push('El nombre del medicamento es obligatorio')
    }

    if (!datos.presentacion_id) {
      errores.push('Debe seleccionar una presentación')
    }

    if (!datos.laboratorio_id) {
      errores.push('Debe seleccionar un laboratorio')
    }

    if (!datos.fecha_vencimiento) {
      errores.push('La fecha de vencimiento es obligatoria')
    }

    if (datos.precio_tarjeta !== undefined && (isNaN(datos.precio_tarjeta) || datos.precio_tarjeta < 0)) {
      errores.push('El precio de tarjeta debe ser un número válido mayor o igual a 0')
    }

    if (datos.precio_efectivo !== undefined && (isNaN(datos.precio_efectivo) || datos.precio_efectivo < 0)) {
      errores.push('El precio de efectivo debe ser un número válido mayor o igual a 0')
    }

    if (datos.existencias !== undefined && (isNaN(datos.existencias) || datos.existencias < 0)) {
      errores.push('Las existencias deben ser un número válido mayor o igual a 0')
    }

    return {
      valido: errores.length === 0,
      errores
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
  },

  // Obtener estado del stock
  getStockStatus(cantidad) {
    const cantidadNum = parseInt(cantidad) || 0
    
    if (cantidadNum === 0) {
      return {
        badge: 'Sin Stock',
        color: 'bg-red-600 text-white'
      }
    } else if (cantidadNum < 11) {
      return {
        badge: 'Stock Bajo',
        color: 'bg-orange-600 text-white'
      }
    } else if (cantidadNum < 51) {
      return {
        badge: 'Stock Normal',
        color: 'bg-blue-600 text-white'
      }
    } else {
      return {
        badge: 'Stock Alto',
        color: 'bg-green-600 text-white'
      }
    }
  },

  // Obtener estado del vencimiento
  getVencimientoStatus(fechaVencimiento) {
    if (!fechaVencimiento) {
      return {
        badge: 'Sin Fecha',
        color: 'bg-gray-600 text-white'
      }
    }
    
    try {
      const hoy = new Date()
      const vencimiento = new Date(fechaVencimiento)
      const diasDiferencia = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))
      
      if (diasDiferencia < 0) {
        return {
          badge: 'Vencido',
          color: 'bg-red-600 text-white'
        }
      } else if (diasDiferencia <= 30) {
        return {
          badge: 'Próximo a Vencer',
          color: 'bg-orange-600 text-white'
        }
      } else if (diasDiferencia <= 90) {
        return {
          badge: 'Vence Pronto',
          color: 'bg-yellow-600 text-white'
        }
      } else {
        return {
          badge: 'Vigente',
          color: 'bg-green-600 text-white'
        }
      }
    } catch (error) {
      return {
        badge: 'Error Fecha',
        color: 'bg-gray-600 text-white'
      }
    }
  },

  // =====================================
  // BÚSQUEDAS Y FILTROS AVANZADOS
  // =====================================

  // Buscar medicamentos con autocompletado
  async buscarMedicamentosAutocompletado(query, limit = 10) {
    try {
      if (!query || query.trim().length < 2) {
        return []
      }
      
      const response = await this.getMedicamentos({
        search: query.trim(),
        limit,
        page: 1
      })
      
      return response.data?.medicamentos || []
    } catch (error) {
      console.error('❌ Error en autocompletado:', error)
      return []
    }
  },

  // Filtrar medicamentos por múltiples criterios
  async filtrarMedicamentos(filtros) {
    try {
      const params = {
        page: filtros.page || 1,
        limit: filtros.limit || 20
      }

      // Agregar filtros específicos
      if (filtros.search) params.search = filtros.search
      if (filtros.presentacion_id) params.presentacion_id = filtros.presentacion_id
      if (filtros.laboratorio_id) params.laboratorio_id = filtros.laboratorio_id
      if (filtros.stock_bajo) params.stock_bajo = 'true'
      if (filtros.proximo_vencer) params.proximo_vencer = 'true'
      if (filtros.precio_min) params.precio_min = filtros.precio_min
      if (filtros.precio_max) params.precio_max = filtros.precio_max

      return await this.getMedicamentos(params)
    } catch (error) {
      console.error('❌ Error filtrando medicamentos:', error)
      throw error
    }
  },

  // ============================================================================
  // CRUD PRESENTACIONES
  // ============================================================================
  async crearPresentacion(datos) {
    try {
      const response = await api.post('/presentaciones', datos);
      return response.data;
    } catch (error) {
      console.error('Error creando presentación:', error);
      throw error;
    }
  },

  async eliminarPresentacion(id) {
    try {
      const response = await api.delete(`/presentaciones/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando presentación:', error);
      throw error;
    }
  },

  // ============================================================================
  // CRUD CASAS MÉDICAS (LABORATORIOS)
  // ============================================================================
  async crearCasaMedica(datos) {
    try {
      const response = await api.post('/casas-medicas', datos);
      return response.data;
    } catch (error) {
      console.error('Error creando casa médica:', error);
      throw error;
    }
  },

  async eliminarCasaMedica(id) {
    try {
      const response = await api.delete(`/casas-medicas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando casa médica:', error);
      throw error;
    }
  }
}

export default farmaciaService