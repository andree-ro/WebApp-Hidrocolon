// frontend/src/services/ventasService.js
// Servicio para comunicación con API de ventas - Sistema Hidrocolon

// ✅ IMPORTAR instancia compartida de axios desde authService
import { api } from './authService'

// ============================================================================
// 📊 SERVICIO DE VENTAS
// ============================================================================

const ventasService = {
  
  // ============================================================================
  // 🛒 CREAR VENTA
  // ============================================================================
  
  async crearVenta(datosVenta) {
    try {
      console.log('💾 Creando venta:', datosVenta)
      const response = await api.post('/ventas', datosVenta)
      console.log('✅ Venta creada exitosamente:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error creando venta:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 📋 LISTAR VENTAS
  // ============================================================================
  
  async listarVentas(params = {}) {
    try {
      console.log('📋 Listando ventas con parámetros:', params)
      const response = await api.get('/ventas', { params })
      return response.data
    } catch (error) {
      console.error('❌ Error listando ventas:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 🔍 OBTENER VENTA POR ID
  // ============================================================================
  
  async obtenerVenta(id) {
    try {
      console.log(`🔍 Obteniendo venta ID: ${id}`)
      const response = await api.get(`/ventas/${id}`)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo venta:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 📊 ESTADÍSTICAS
  // ============================================================================
  
  async obtenerEstadisticas(params = {}) {
    try {
      console.log('📊 Obteniendo estadísticas de ventas')
      const response = await api.get('/ventas/stats', { params })
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 🏆 PRODUCTOS MÁS VENDIDOS
  // ============================================================================
  
  async obtenerProductosMasVendidos(params = {}) {
    try {
      console.log('🏆 Obteniendo productos más vendidos')
      const response = await api.get('/ventas/productos-mas-vendidos', { params })
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo productos más vendidos:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 💰 COMISIONES
  // ============================================================================
  
  async obtenerComisiones(params = {}) {
    try {
      console.log('💰 Obteniendo comisiones')
      const response = await api.get('/ventas/comisiones', { params })
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo comisiones:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 📈 RESUMEN POR TIPO DE PRODUCTO
  // ============================================================================
  
  async obtenerResumenPorTipo(params = {}) {
    try {
      console.log('📈 Obteniendo resumen por tipo de producto')
      const response = await api.get('/ventas/resumen-por-tipo', { params })
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo resumen por tipo:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 📜 HISTORIAL DE COMPRAS DE PACIENTE
  // ============================================================================
  
  async obtenerHistorialPaciente(pacienteId, params = {}) {
    try {
      console.log(`📜 Obteniendo historial del paciente ID: ${pacienteId}`)
      const response = await api.get(`/ventas/paciente/${pacienteId}/historial`, { params })
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo historial del paciente:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 🧾 GENERAR COMPROBANTE PDF
  // ============================================================================
  
  async generarComprobante(ventaId) {
    try {
      console.log(`🧾 Generando comprobante para venta ID: ${ventaId}`)
      const response = await api.get(`/ventas/${ventaId}/comprobante`, {
        responseType: 'blob' // Importante para recibir archivos
      })
      
      // Crear URL temporal para el blob
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      
      // Abrir en nueva pestaña
      window.open(url, '_blank')
      
      // Opcional: descargar automáticamente
      // const link = document.createElement('a')
      // link.href = url
      // link.download = `comprobante-venta-${ventaId}.pdf`
      // link.click()
      
      console.log('✅ Comprobante generado exitosamente')
      return { success: true, url }
    } catch (error) {
      console.error('❌ Error generando comprobante:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 🔄 DESCARGAR COMPROBANTE PDF
  // ============================================================================
  
  async descargarComprobante(ventaId, nombreArchivo = null) {
    try {
      console.log(`📥 Descargando comprobante para venta ID: ${ventaId}`)
      const response = await api.get(`/ventas/${ventaId}/comprobante`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = nombreArchivo || `comprobante-venta-${ventaId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      console.log('✅ Comprobante descargado exitosamente')
      return { success: true }
    } catch (error) {
      console.error('❌ Error descargando comprobante:', error)
      throw this.procesarError(error)
    }
  },
  
  // ============================================================================
  // 🛠️ UTILIDADES
  // ============================================================================
  
  /**
   * Procesar errores de la API
   */
  procesarError(error) {
    if (error.response) {
      // Error del servidor con respuesta
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
          mensaje = 'Venta no encontrada'
          break
        case 409:
          mensaje = data.message || 'Conflicto con los datos'
          break
        case 500:
          mensaje = 'Error interno del servidor'
          break
        default:
          mensaje = data.message || 'Error desconocido'
      }
      
      return new Error(mensaje)
    } else if (error.request) {
      // Error de red
      return new Error('Sin conexión al servidor. Verifique su conexión a internet')
    } else {
      // Error de configuración
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
   * Validar datos de venta antes de enviar
   */
  validarDatosVenta(datosVenta) {
    const errores = []
    
    if (!datosVenta.turno_id) {
      errores.push('Debe tener un turno abierto')
    }
    
    if (!datosVenta.usuario_vendedor_id) {
      errores.push('Falta ID del vendedor')
    }
    
    if (!datosVenta.metodo_pago) {
      errores.push('Debe seleccionar un método de pago')
    }
    
    if (!datosVenta.detalle || datosVenta.detalle.length === 0) {
      errores.push('El carrito está vacío')
    }
    
    if (datosVenta.total <= 0) {
      errores.push('El total debe ser mayor a cero')
    }
    
    if (!datosVenta.cliente_nombre) {
      errores.push('Falta nombre del cliente')
    }
    
    return {
      valido: errores.length === 0,
      errores
    }
  },

  // Anular venta con autorización de administrador
  async anularVenta(ventaId, datos) {
    try {
      console.log(`🗑️ Anulando venta ID: ${ventaId}`);
      console.log('📦 Datos:', datos);

      const response = await api.delete(`/ventas/${ventaId}/anular`, {
        data: {
          motivo: datos.motivo,
          admin_usuario: datos.admin_usuario,
          admin_password: datos.admin_password
        }
      });

      console.log('✅ Venta anulada exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error anulando venta:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Error al anular la venta. Por favor intenta de nuevo.');
    }
  },
}

export default ventasService