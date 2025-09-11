// frontend/src/router/index.js
// Router completo del Sistema Hidrocolon

import { createRouter, createWebHistory } from 'vue-router'
import authService from '@/services/authService'

// =====================================
// IMPORTAR COMPONENTES
// =====================================

// Vistas principales
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import FarmaciaView from '@/views/FarmaciaView.vue'
import ExtrasView from '@/views/ExtrasView.vue'
import ServiciosView from '@/views/ServiciosView.vue'

// =====================================
// DEFINIR RUTAS
// =====================================

const routes = [
  // Ruta raíz - Dashboard principal
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: { 
      requiresAuth: true,
      title: 'Dashboard - Sistema Hidrocolon',
      breadcrumb: 'Dashboard'
    }
  },

  // Login
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { 
      requiresAuth: false,
      title: 'Iniciar Sesión - Sistema Hidrocolon'
    }
  },

  // Dashboard alternativo (redirige a /)
  {
    path: '/dashboard',
    redirect: '/'
  },

  // Módulo Farmacia
  {
    path: '/farmacia',
    name: 'Farmacia',
    component: FarmaciaView,
    meta: { 
      requiresAuth: true,
      title: 'Farmacia - Sistema Hidrocolon',
      breadcrumb: 'Farmacia',
      description: 'Gestión de medicamentos e inventario'
    }
  },

  // Módulo Extras
  {
    path: '/extras',
    name: 'Extras',
    component: ExtrasView,
    meta: { 
      requiresAuth: true,
      title: 'Extras - Sistema Hidrocolon',
      breadcrumb: 'Extras',
      description: 'Productos adicionales y suministros'
    }
  },

  // Módulo Servicios
  {
    path: '/servicios',
    name: 'Servicios',
    component: ServiciosView,
    meta: { 
      requiresAuth: true,
      title: 'Servicios - Sistema Hidrocolon',
      breadcrumb: 'Servicios Médicos',
      description: 'Gestión de servicios médicos, precios y medicamentos vinculados'
    }
  },

  // Rutas futuras (placeholder con lazy loading)
  {
    path: '/pacientes',
    name: 'Pacientes',
    component: () => import('@/views/PacientesView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Pacientes - Sistema Hidrocolon',
      breadcrumb: 'Pacientes',
      description: 'Base de datos de pacientes'
    }
  },

  {
    path: '/carrito',
    name: 'Carrito',
    component: () => import('@/views/CarritoView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Carrito de Ventas - Sistema Hidrocolon',
      breadcrumb: 'Ventas',
      description: 'Sistema de ventas y facturación'
    }
  },

  {
    path: '/financiero',
    name: 'Financiero',
    component: () => import('@/views/FinancieroView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Módulo Financiero - Sistema Hidrocolon',
      breadcrumb: 'Financiero',
      description: 'Control de turnos y reportes'
    }
  },

  // Rutas de sistema
  {
    path: '/perfil',
    name: 'Perfil',
    component: () => import('@/views/PerfilView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Mi Perfil - Sistema Hidrocolon',
      breadcrumb: 'Perfil'
    }
  },

  {
    path: '/configuracion',
    name: 'Configuracion',
    component: () => import('@/views/ConfiguracionView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Configuración - Sistema Hidrocolon',
      breadcrumb: 'Configuración',
      adminOnly: true
    }
  },

  // Página 404 - DEBE SER LA ÚLTIMA RUTA
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: 'Página no encontrada - Sistema Hidrocolon'
    }
  }
]

// =====================================
// CREAR ROUTER
// =====================================

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// =====================================
// GUARDS DE NAVEGACIÓN
// =====================================

// Guard global - verificar autenticación
router.beforeEach(async (to, from, next) => {
  console.log(`🧭 Navegando a: ${to.name} (${to.path})`)
  
  // Actualizar título de la página
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // Verificar autenticación
  if (to.meta.requiresAuth) {
    if (!authService.isAuthenticated()) {
      console.log('🔒 Redirigiendo a login - usuario no autenticado')
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // Verificar permisos de administrador si es necesario
    if (to.meta.adminOnly) {
      const user = authService.getUser()
      if (!user || user.rol?.nombre !== 'administrador') {
        console.log('⛔ Acceso denegado - se requieren permisos de administrador')
        next({ name: 'Dashboard' })
        return
      }
    }
  }
  
  // Si ya está autenticado y va a login, redirigir a dashboard
  if (to.name === 'Login' && authService.isAuthenticated()) {
    console.log('✅ Usuario ya autenticado, redirigiendo a dashboard')
    next({ name: 'Dashboard' })
    return
  }
  
  next()
})

// Guard posterior a la navegación
router.afterEach((to, from) => {
  console.log(`📍 Navegación completada: ${from.name || 'inicial'} → ${to.name}`)
})

// Guard de error
router.onError((error) => {
  console.error('❌ Error en router:', error)
})

export default router

// ==========================================
// UTILIDADES DE NAVEGACIÓN
// ==========================================

export const navegarA = {
  dashboard: () => router.push({ name: 'Dashboard' }),
  farmacia: () => router.push({ name: 'Farmacia' }),
  extras: () => router.push({ name: 'Extras' }),
  servicios: () => router.push({ name: 'Servicios' }),
  pacientes: () => router.push({ name: 'Pacientes' }),
  carrito: () => router.push({ name: 'Carrito' }),
  financiero: () => router.push({ name: 'Financiero' }),
  perfil: () => router.push({ name: 'Perfil' }),
  configuracion: () => router.push({ name: 'Configuracion' }),
  login: (redirect) => router.push({ 
    name: 'Login', 
    query: redirect ? { redirect } : undefined 
  }),
  // Navegación con parámetros
  goBack: () => router.go(-1),
  reload: () => router.go(0)
}

// ==========================================
// UTILIDADES DE BREADCRUMBS
// ==========================================

export const obtenerBreadcrumbs = (route) => {
  const breadcrumbs = []
  
  // Siempre agregar Dashboard como base (excepto si ya estamos ahí)
  if (route.name !== 'Dashboard') {
    breadcrumbs.push({
      text: '🏠 Dashboard',
      to: { name: 'Dashboard' },
      active: false
    })
  }
  
  // Agregar página actual
  if (route.meta?.breadcrumb) {
    breadcrumbs.push({
      text: route.meta.breadcrumb,
      to: route,
      active: true
    })
  }
  
  return breadcrumbs
}

// ==========================================
// UTILIDADES DE MENÚ
// ==========================================

export const menuItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: '🏠',
    title: 'Panel Principal',
    description: 'Resumen general del sistema',
    active: true
  },
  {
    name: 'Farmacia',
    path: '/farmacia',
    icon: '💊',
    title: 'Farmacia',
    description: 'Gestión de medicamentos e inventario',
    active: true
  },
  {
    name: 'Extras',
    path: '/extras',
    icon: '🧰',
    title: 'Extras',
    description: 'Productos adicionales y suministros',
    active: true
  },
  {
    name: 'Servicios',
    path: '/servicios',
    icon: '🏥',
    title: 'Servicios Médicos',
    description: 'Gestión de servicios y precios',
    active: true,
    badge: 'Nuevo'
  },
  {
    name: 'Pacientes',
    path: '/pacientes',
    icon: '👥',
    title: 'Pacientes',
    description: 'Base de datos de pacientes',
    active: false,
    badge: 'Próximo'
  },
  {
    name: 'Carrito',
    path: '/carrito',
    icon: '🛒',
    title: 'Ventas',
    description: 'Sistema de ventas y facturación',
    active: false,
    badge: 'Próximo'
  },
  {
    name: 'Financiero',
    path: '/financiero',
    icon: '💰',
    title: 'Financiero',
    description: 'Control de turnos y reportes',
    active: false,
    badge: 'Próximo'
  }
]

// ==========================================
// UTILIDADES DE VALIDACIÓN DE RUTAS
// ==========================================

export const esRutaValida = (path) => {
  return routes.some(route => route.path === path)
}

export const esRutaProtegida = (path) => {
  const route = routes.find(route => route.path === path)
  return route?.meta?.requiresAuth === true
}

export const esRutaAdmin = (path) => {
  const route = routes.find(route => route.path === path)
  return route?.meta?.adminOnly === true
}

// ==========================================
// FUNCIONES DE DEBUGGING
// ==========================================

export const debugRouter = () => {
  console.log('🔍 Debug del Router:')
  console.log('- Rutas registradas:', routes.length)
  console.log('- Ruta actual:', router.currentRoute.value)
  console.log('- Usuario autenticado:', authService.isAuthenticated())
  console.log('- Datos de usuario:', authService.getUser())
}

// Exportar debug globalmente para console
if (typeof window !== 'undefined') {
  window.debugRouter = debugRouter
}