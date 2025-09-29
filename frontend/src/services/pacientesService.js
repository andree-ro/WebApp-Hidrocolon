// src/services/pacientesService.js
// Servicio API para el módulo de pacientes - Sistema Hidrocolon
// Sigue el mismo patrón que authService.js y farmaciaService.js

import { api } from './authService'

const pacientesService = {
  // =====================================
  // OPERACIONES CRUD PRINCIPALES
  // =====================================

  // Obtener pacientes con filtros y paginación
  async getPacientes(params = {}) {
    try {
      console.log('👥 Obteniendo pacientes con parámetros:', params)
      
      const response = await api.get('/pacientes', { params })
      
      console.log('✅ Pacientes obtenidos:', response.data.data?.length || 0)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo pacientes:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error obteniendo pacientes')
    }
  },

  // Obtener paciente específico por ID
  async getPaciente(id) {
    try {
      console.log('👁️ Obteniendo paciente ID:', id)
      
      const response = await api.get(`/pacientes/${id}`)
      
      console.log('✅ Paciente obtenido:', response.data.data?.nombre_completo)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo paciente:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error obteniendo paciente')
    }
  },

  // Crear nuevo paciente
  async crearPaciente(pacienteData) {
    try {
      console.log('➕ Creando nuevo paciente:', `${pacienteData.nombre} ${pacienteData.apellido}`)
      
      // Limpiar datos antes de enviar
      const datosLimpios = this.limpiarDatosPaciente(pacienteData)
      
      const response = await api.post('/pacientes', datosLimpios)
      
      console.log('✅ Paciente creado exitosamente:', response.data.data?.id)
      return response.data
    } catch (error) {
      console.error('❌ Error creando paciente:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error creando paciente')
    }
  },

  // Actualizar paciente existente
  async actualizarPaciente(id, pacienteData) {
    try {
      console.log('✏️ Actualizando paciente ID:', id)
      
      const datosLimpios = this.limpiarDatosPaciente(pacienteData)
      
      const response = await api.put(`/pacientes/${id}`, datosLimpios)
      
      console.log('✅ Paciente actualizado exitosamente')
      return response.data
    } catch (error) {
      console.error('❌ Error actualizando paciente:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error actualizando paciente')
    }
  },

  // Eliminar paciente (soft delete)
  async eliminarPaciente(id) {
    try {
      console.log('🗑️ Eliminando paciente ID:', id)
      
      const response = await api.delete(`/pacientes/${id}`)
      
      console.log('✅ Paciente eliminado exitosamente')
      return response.data
    } catch (error) {
      console.error('❌ Error eliminando paciente:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error eliminando paciente')
    }
  },

  // =====================================
  // ENDPOINTS ESPECIALES
  // =====================================

  // Obtener estadísticas de pacientes
  async getEstadisticas() {
    try {
      console.log('📊 Obteniendo estadísticas de pacientes')
      
      const response = await api.get('/pacientes/stats/general')
      
      console.log('✅ Estadísticas obtenidas:', response.data.data)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error obteniendo estadísticas')
    }
  },

  // Exportar pacientes a Excel
  async exportarExcel() {
    try {
      console.log('📊 Exportando pacientes a Excel')
      
      const response = await api.get('/pacientes/export/excel')
      
      console.log('✅ Datos preparados para exportación:', response.data.data?.length || 0, 'pacientes')
      return response.data
    } catch (error) {
      console.error('❌ Error exportando pacientes:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error exportando pacientes')
    }
  },

  // Obtener pacientes que cumplen años este mes
  async getPacientesCumpleanosMes(params = {}) {
    try {
      console.log('🎂 Obteniendo pacientes con cumpleaños este mes')
      
      const response = await api.get('/pacientes/cumpleanos-mes', { params })
      
      console.log('✅ Pacientes con cumpleaños obtenidos:', response.data.data?.length || 0)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo pacientes con cumpleaños:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error obteniendo pacientes con cumpleaños')
    }
  },

  // Obtener pacientes con citas mañana
  async getPacientesCitasManana(params = {}) {
    try {
      console.log('📅 Obteniendo pacientes con citas mañana')
      
      const response = await api.get('/pacientes/citas-manana', { params })
      
      console.log('✅ Pacientes con citas mañana obtenidos:', response.data.data?.length || 0)
      return response.data
    } catch (error) {
      console.error('❌ Error obteniendo pacientes con citas mañana:', error.response?.data)
      throw new Error(error.response?.data?.message || 'Error obteniendo pacientes con citas mañana')
    }
  },

  // =====================================
  // UTILIDADES Y VALIDACIONES
  // =====================================

  // Limpiar datos del paciente antes de enviar
  limpiarDatosPaciente(datos) {
    const datosLimpios = {}
    
    // Campos de texto
    if (datos.nombre) datosLimpios.nombre = datos.nombre.trim()
    if (datos.apellido) datosLimpios.apellido = datos.apellido.trim()
    if (datos.telefono) datosLimpios.telefono = datos.telefono.trim()
    
    // DPI opcional (puede ser null para menores)
    if (datos.dpi && datos.dpi.trim()) {
      datosLimpios.dpi = datos.dpi.trim()
    }
    
    // Fechas
    if (datos.fecha_primer_cita) datosLimpios.fecha_primer_cita = datos.fecha_primer_cita
    if (datos.proxima_cita) datosLimpios.proxima_cita = datos.proxima_cita
    if (datos.cumpleanos) datosLimpios.cumpleanos = datos.cumpleanos
    
    console.log('🧹 Datos del paciente limpiados:', datosLimpios)
    return datosLimpios
  },

  // Validar datos del paciente
  validarPaciente(datos) {
    const errores = []
    
    // Validaciones requeridas
    if (!datos.nombre || !datos.nombre.trim()) {
      errores.push('El nombre es requerido')
    }
    
    if (!datos.apellido || !datos.apellido.trim()) {
      errores.push('El apellido es requerido')
    }
    
    if (!datos.telefono || !datos.telefono.trim()) {
      errores.push('El teléfono es requerido')
    }
    
    if (!datos.fecha_primer_cita) {
      errores.push('La fecha de primera cita es requerida')
    }
    
    if (!datos.cumpleanos) {
      errores.push('La fecha de nacimiento es requerida')
    }
    
    // Validaciones de formato
    if (datos.telefono && !this.validarTelefono(datos.telefono)) {
      errores.push('El formato del teléfono no es válido (ej: 5551-2345)')
    }
    
    if (datos.dpi && !this.validarDPI(datos.dpi)) {
      errores.push('El formato del DPI no es válido (debe tener 13 dígitos)')
    }
    
    // Validar fechas
    if (datos.cumpleanos && new Date(datos.cumpleanos) > new Date()) {
      errores.push('La fecha de nacimiento no puede ser futura')
    }
    
    if (datos.fecha_primer_cita && new Date(datos.fecha_primer_cita) > new Date()) {
      // Permitir fechas futuras para primera cita
    }
    
    if (datos.proxima_cita && new Date(datos.proxima_cita) < new Date()) {
      console.warn('⚠️ La próxima cita está en el pasado')
    }
    
    return errores
  },

  validarTelefono(telefono) {
    if (!telefono || telefono.trim() === '') return false
    
    // Limpiar el teléfono de espacios y caracteres especiales
    const telefonoLimpio = telefono.replace(/\s+/g, '').replace(/[()-]/g, '')
    
    // Formatos válidos: 1234-5678, 12345678, (123) 4567-8901, etc.
    const regexConGuion = /^\d{4}-\d{4}$/
    const regexSinGuion = /^\d{8}$/
    
    return regexConGuion.test(telefono.trim()) || regexSinGuion.test(telefonoLimpio)
  },

  // Validar DPI guatemalteco
  validarDPI(dpi) {
    if (!dpi || dpi.trim() === '') return true // DPI es opcional para menores
    
    // Limpiar el DPI de espacios y guiones
    const dpiLimpio = dpi.replace(/\s/g, '').replace(/-/g, '')
    
    // DPI debe tener exactamente 13 dígitos
    const regex = /^\d{13}$/
    return regex.test(dpiLimpio)
  },

  // =====================================
  // UTILIDADES DE FORMATO MEJORADAS
  // =====================================

  // Formatear fecha para mostrar
  formatearFecha(fecha) {
    if (!fecha) return ''
    
    try {
      // Manejar fecha null o undefined del backend
      if (fecha === null || fecha === undefined) {
        return ''
      }
      
      let fechaObj
      
      // Si la fecha ya incluye timezone, usarla directamente
      if (typeof fecha === 'string' && fecha.includes('T')) {
        fechaObj = new Date(fecha)
      } else if (typeof fecha === 'string') {
        // Si es solo la fecha (YYYY-MM-DD), agregar hora para evitar timezone issues
        fechaObj = new Date(fecha + 'T00:00:00.000Z')
      } else {
        // Si es un objeto Date
        fechaObj = new Date(fecha)
      }
      
      // Verificar si la fecha es válida
      if (isNaN(fechaObj.getTime())) {
        console.warn('⚠️ Fecha inválida recibida:', fecha)
        return '' // Retornar string vacío en lugar de mostrar "Invalid Date"
      }
      
      // Formatear usando UTC para consistencia
      return fechaObj.toLocaleDateString('es-GT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC' // Importante para evitar problemas de timezone
      })
    } catch (error) {
      console.error('Error formateando fecha:', error, 'Fecha recibida:', fecha)
      return '' // Retornar string vacío en lugar de mostrar error
    }
  },

  // Formatear fecha para input HTML
  formatearFechaInput(fecha) {
    if (!fecha) return ''
    
    try {
      // Manejar fecha null del backend
      if (fecha === null || fecha === undefined) {
        return ''
      }
      
      let fechaObj
      
      if (typeof fecha === 'string' && fecha.includes('T')) {
        fechaObj = new Date(fecha)
      } else if (typeof fecha === 'string') {
        fechaObj = new Date(fecha + 'T00:00:00.000Z')
      } else {
        fechaObj = new Date(fecha)
      }
      
      if (isNaN(fechaObj.getTime())) {
        console.warn('⚠️ Fecha inválida para input:', fecha)
        return ''
      }
      
      // Para inputs, necesitamos formato YYYY-MM-DD
      return fechaObj.toISOString().split('T')[0]
    } catch (error) {
      console.error('Error formateando fecha para input:', error)
      return ''
    }
  },

  // Formatear teléfono para mostrar (agregar guión si no lo tiene)
  formatearTelefono(telefono) {
    if (!telefono) return ''
    
    const limpio = telefono.replace(/\D/g, '')
    if (limpio.length === 8) {
      return `${limpio.substring(0, 4)}-${limpio.substring(4)}`
    }
    
    return telefono
  },

  // Calcular edad a partir de fecha de nacimiento
  calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null
    
    try {
      // Manejar fecha null del backend
      if (fechaNacimiento === null || fechaNacimiento === undefined) {
        return null
      }
      
      const hoy = new Date()
      let nacimiento
      
      if (typeof fechaNacimiento === 'string' && fechaNacimiento.includes('T')) {
        nacimiento = new Date(fechaNacimiento)
      } else if (typeof fechaNacimiento === 'string') {
        nacimiento = new Date(fechaNacimiento + 'T00:00:00.000Z')
      } else {
        nacimiento = new Date(fechaNacimiento)
      }
      
      if (isNaN(nacimiento.getTime())) {
        console.warn('⚠️ Fecha de nacimiento inválida:', fechaNacimiento)
        return null
      }
      
      let edad = hoy.getFullYear() - nacimiento.getFullYear()
      
      const mesActual = hoy.getMonth()
      const mesNacimiento = nacimiento.getMonth()
      
      if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
        edad--
      }
      
      return edad >= 0 ? edad : null
    } catch (error) {
      console.error('Error calculando edad:', error)
      return null
    }
  },

  // Determinar si es menor de edad
  esMenorDeEdad(fechaNacimiento) {
    const edad = this.calcularEdad(fechaNacimiento)
    return edad !== null && edad < 18
  },

  // Obtener estado de la próxima cita con más detalles
  getEstadoCita(proximaCita) {
    if (!proximaCita) {
      return { 
        texto: 'Sin cita', 
        clase: 'text-gray-500 bg-gray-100',
        icono: '📅',
        prioridad: 'baja'
      }
    }

    try {
      // Manejar fecha null del backend
      if (proximaCita === null || proximaCita === undefined) {
        return { 
          texto: 'Sin cita', 
          clase: 'text-gray-500 bg-gray-100',
          icono: '📅',
          prioridad: 'baja'
        }
      }

      // 🔧 USAR FECHA LOCAL EN LUGAR DE UTC
      const hoy = new Date()
      
      // Formatear fecha local como YYYY-MM-DD
      const hoyString = hoy.getFullYear() + '-' + 
                       String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(hoy.getDate()).padStart(2, '0')
      
      // Calcular mañana usando fecha local
      const manana = new Date(hoy)
      manana.setDate(hoy.getDate() + 1)
      const mananaString = manana.getFullYear() + '-' + 
                          String(manana.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(manana.getDate()).padStart(2, '0')
      
      // Procesar la fecha de la cita
      let citaString
      if (typeof proximaCita === 'string') {
        citaString = proximaCita.split('T')[0] // "2025-09-24"
      } else {
        const citaObj = new Date(proximaCita)
        citaString = citaObj.getFullYear() + '-' + 
                    String(citaObj.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(citaObj.getDate()).padStart(2, '0')
      }
      
      console.log(`📅 DEBUG Estado Cita (FECHA LOCAL):`)
      console.log(`   Hoy: ${hoyString}`)
      console.log(`   Mañana: ${mananaString}`)
      console.log(`   Cita: ${citaString}`)
      
      // LÓGICA EXACTA:
      
      // 1. Si la cita es HOY 
      if (citaString === hoyString) {
        console.log(`   → Resultado: CITA HOY`)
        return { 
          texto: 'Cita HOY', 
          clase: 'text-blue-700 bg-blue-100 font-semibold',
          icono: '🔵',
          prioridad: 'alta'
        }
      }
      
      // 2. Si la cita es MAÑANA
      else if (citaString === mananaString) {
        console.log(`   → Resultado: CITA MAÑANA`)
        return { 
          texto: 'Cita mañana', 
          clase: 'text-green-700 bg-green-100 font-medium',
          icono: '🟢',
          prioridad: 'media'
        }
      }
      
      // 3. Si la cita es PASADA
      else if (citaString < hoyString) {
        console.log(`   → Resultado: CITA VENCIDA`)
        return { 
          texto: 'Cita vencida', 
          clase: 'text-red-700 bg-red-100 font-medium',
          icono: '🔴',
          prioridad: 'alta'
        }
      }
      
      // 4. Si la cita es FUTURA
      else if (citaString > mananaString) {
        // Calcular días usando fechas locales
        const citaDate = new Date(citaString + 'T00:00:00')
        const hoyDate = new Date(hoyString + 'T00:00:00')
        const diferenciaDias = Math.ceil((citaDate - hoyDate) / (1000 * 60 * 60 * 24))
        
        console.log(`   → Resultado: ACERCÁNDOSE (${diferenciaDias} días)`)
        return { 
          texto: `Acercándose cita (${diferenciaDias} días)`, 
          clase: 'text-purple-700 bg-purple-100',
          icono: '🟣',
          prioridad: 'baja'
        }
      }
      
      // 5. Fallback
      else {
        console.log(`   → Resultado: FECHA INVÁLIDA`)
        return { 
          texto: 'Fecha inválida', 
          clase: 'text-gray-500 bg-gray-100',
          icono: '❓',
          prioridad: 'baja'
        }
      }
      
    } catch (error) {
      console.error('Error procesando estado de cita:', error)
      return { 
        texto: 'Error en fecha', 
        clase: 'text-gray-500 bg-gray-100',
        icono: '❌',
        prioridad: 'baja'
      }
    }
  },

  // =====================================
  // FILTROS AVANZADOS MEJORADOS
  // =====================================

  // Construir parámetros de filtro para la API
  construirParametrosFiltro(filtros = {}) {
    const params = {}
    
    // Paginación con valores por defecto
    params.page = parseInt(filtros.page) || 1
    params.limit = parseInt(filtros.limit) || 20
    
    // Búsqueda con limpieza
    if (filtros.search && filtros.search.trim()) {
      params.search = filtros.search.trim()
    }
    
    // 🔧 FILTROS ESPECIALES CORREGIDOS - ENVIAR PARÁMETRO 'filtro'
    if (filtros.filtro && filtros.filtro !== 'todos') {
      // ✅ ENVIAR EL PARÁMETRO 'filtro' QUE EL BACKEND ENTIENDE
      params.filtro = filtros.filtro
      
      console.log(`🎯 Aplicando filtro especial: ${filtros.filtro}`)
    }
    
    console.log('🔍 Parámetros de filtro construidos:', params)
    return params
  },

  // =====================================
  // MANEJO DE ERRORES ROBUSTO
  // =====================================

  // Procesar errores de la API con más detalle
  procesarError(error) {
    console.error('🔥 Error en pacientesService:', error)
    
    if (error.response) {
      // Error del servidor con respuesta
      const status = error.response.status
      const data = error.response.data
      
      switch (status) {
        case 400:
          if (data.campo_faltante) {
            return `Campo requerido: ${data.campo_faltante}`
          }
          return data.message || 'Los datos enviados no son válidos'
          
        case 401:
          // Redirigir al login si es necesario
          return 'Su sesión ha expirado. Por favor inicie sesión nuevamente'
          
        case 403:
          return 'No tiene permisos para realizar esta acción'
          
        case 404:
          return 'El paciente solicitado no fue encontrado'
          
        case 409:
          if (data.error_type === 'duplicate_dpi') {
            return 'Ya existe un paciente registrado con ese DPI'
          }
          return data.message || 'Ya existe un paciente con esos datos'
          
        case 422:
          if (data.errors && Array.isArray(data.errors)) {
            return data.errors.join(', ')
          }
          return data.message || 'Los datos no cumplen con los requisitos de validación'
          
        case 500:
          return 'Error interno del servidor. Intente nuevamente en unos momentos'
          
        default:
          return data.message || `Error del servidor (${status})`
      }
    } else if (error.request) {
      // Error de red
      if (error.code === 'NETWORK_ERROR') {
        return 'Sin conexión a internet. Verifique su conexión y vuelva a intentar'
      }
      if (error.code === 'TIMEOUT') {
        return 'La operación tardó demasiado tiempo. Intente nuevamente'
      }
      return 'Error de conexión con el servidor'
    } else {
      // Error de configuración
      return 'Error interno de la aplicación'
    }
  },

  // =====================================
  // CACHE MEJORADO CON MÚLTIPLES TIPOS
  // =====================================

  // Cache múltiple para diferentes tipos de datos
  _cache: {
    estadisticas: { data: null, timestamp: null },
    pacientes: { data: null, timestamp: null, filtros: null }
  },

  // Cache inteligente para estadísticas
  async getEstadisticasConCache(tiempoExpiracion = 60000) { // 1 minuto por defecto
    const ahora = Date.now()
    const cache = this._cache.estadisticas
    
    // Si hay cache válido, usarlo
    if (cache.data && cache.timestamp && (ahora - cache.timestamp < tiempoExpiracion)) {
      console.log('📊 Usando estadísticas desde cache')
      return { data: cache.data, success: true }
    }
    
    // Si no hay cache válido, obtener nuevos datos
    try {
      console.log('🔄 Actualizando estadísticas...')
      const response = await this.getEstadisticas()
      
      // Guardar en cache
      cache.data = response.data
      cache.timestamp = ahora
      
      console.log('✅ Estadísticas actualizadas y guardadas en cache')
      return response
    } catch (error) {
      // Si falla, usar cache aunque esté expirado si existe
      if (cache.data) {
        console.warn('⚠️ Error obteniendo estadísticas, usando cache expirado')
        return { data: cache.data, success: true }
      }
      throw error
    }
  },

  // Limpiar cache específico o todo
  limpiarCache(tipo = 'todos') {
    if (tipo === 'todos') {
      this._cache.estadisticas = { data: null, timestamp: null }
      this._cache.pacientes = { data: null, timestamp: null, filtros: null }
      console.log('🧹 Todo el cache ha sido limpiado')
    } else if (this._cache[tipo]) {
      this._cache[tipo] = { data: null, timestamp: null, filtros: null }
      console.log(`🧹 Cache de ${tipo} limpiado`)
    }
  },

  // =====================================
  // UTILIDADES ADICIONALES
  // =====================================

  // Normalizar datos del paciente para consistent display
  normalizarPaciente(paciente) {
    if (!paciente) return null
    
    return {
      ...paciente,
      nombre_completo: `${paciente.nombres} ${paciente.apellidos}`,
      telefono_formateado: this.formatearTelefono(paciente.telefono),
      edad: this.calcularEdad(paciente.fecha_nacimiento),
      es_menor: this.esMenorDeEdad(paciente.fecha_nacimiento),
      estado_cita: this.getEstadoCita(paciente.proxima_cita),
      fecha_primer_cita_formateada: this.formatearFecha(paciente.fecha_primer_cita),
      proxima_cita_formateada: this.formatearFecha(paciente.proxima_cita),
      cumpleanos_formateado: this.formatearFecha(paciente.fecha_nacimiento)
    }
  },

  // Generar resumen para reportes
  generarResumenPaciente(paciente) {
    const normalizado = this.normalizarPaciente(paciente)
    
    return {
      id: normalizado.id,
      nombre: normalizado.nombre_completo,
      telefono: normalizado.telefono_formateado,
      edad: normalizado.edad,
      estado_cita: normalizado.estado_cita?.texto || 'Sin cita',
      es_menor_edad: normalizado.es_menor ? 'Sí' : 'No',
      tiene_dpi: normalizado.dpi ? 'Sí' : 'No'
    }
  }
}

export default pacientesService