// frontend/src/composables/usePermisos.js
// Composable para gestionar permisos según el rol del usuario

import { computed } from 'vue'
import authService from '@/services/authService'

export function usePermisos() {
  // Obtener usuario actual
  const usuario = authService.getUser()
  const rolNombre = usuario?.rol_nombre || usuario?.rol?.nombre || null

  // Verificar roles
  const esAdmin = computed(() => rolNombre === 'administrador')
  const esVendedor = computed(() => rolNombre === 'vendedor')

  // Permisos por módulo
  const permisos = computed(() => ({
    // FARMACIA
    farmacia: {
      ver: true, // Todos pueden ver
      agregar: true, // Todos pueden agregar
      editar: esAdmin.value, // Solo admin puede editar
      eliminar: esAdmin.value // Solo admin puede eliminar
    },

    // EXTRAS
    extras: {
      ver: true,
      agregar: true,
      editar: esAdmin.value,
      eliminar: esAdmin.value
    },

    // SERVICIOS
    servicios: {
      ver: true,
      agregar: true,
      editar: esAdmin.value,
      eliminar: esAdmin.value,
      verMedicamentos: esAdmin.value // Solo admin ve columna de medicamentos
    },

    // PACIENTES
    pacientes: {
      ver: true,
      agregar: true,
      editar: esAdmin.value,
      eliminar: esAdmin.value
    },

    // DOCTORAS
    doctoras: {
      ver: true,
      agregar: true,
      editar: true, // Ambos pueden editar
      eliminar: esAdmin.value, // Solo admin puede eliminar
      comisiones: true // Ambos tienen acceso completo a comisiones
    },

    // CARRITO/VENTAS
    carrito: {
      acceso: true // Ambos tienen acceso completo
    },

    // FINANCIERO
    financiero: {
      acceso: true // Ambos tienen acceso completo
    },

    // USUARIOS
    usuarios: {
      acceso: esAdmin.value // Solo admin
    },

    // BITÁCORA
    bitacora: {
      acceso: esAdmin.value // Solo admin
    },

    // NOTIFICACIONES
    notificaciones: {
      acceso: esAdmin.value // Solo admin
    }
  }))

  // Métodos helper
  const puede = (modulo, accion) => {
    const permisoModulo = permisos.value[modulo]
    if (!permisoModulo) return false
    
    // Si el módulo tiene una propiedad 'acceso', usar esa
    if ('acceso' in permisoModulo) {
      return permisoModulo.acceso
    }
    
    // Si no, verificar la acción específica
    return permisoModulo[accion] || false
  }

  const puedeVerModulo = (modulo) => {
    return puede(modulo, 'ver') || puede(modulo, 'acceso')
  }

  const puedeAgregar = (modulo) => {
    return puede(modulo, 'agregar')
  }

  const puedeEditar = (modulo) => {
    return puede(modulo, 'editar')
  }

  const puedeEliminar = (modulo) => {
    return puede(modulo, 'eliminar')
  }

  return {
    usuario,
    rolNombre,
    esAdmin,
    esVendedor,
    permisos,
    puede,
    puedeVerModulo,
    puedeAgregar,
    puedeEditar,
    puedeEliminar
  }
}