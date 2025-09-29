// frontend/src/router/index.js
// Router del Sistema Hidrocolon - ACTUALIZADO CON PACIENTES

import { createRouter, createWebHistory } from 'vue-router'
import authService from '@/services/authService'

// =====================================
// IMPORTAR COMPONENTES EXISTENTES + PACIENTES
// =====================================

// Vistas principales existentes
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import FarmaciaView from '@/views/FarmaciaView.vue'
import ExtrasView from '@/views/ExtrasView.vue'
import ServiciosView from '@/views/ServiciosView.vue'
// NUEVO: Agregar PacientesView
import PacientesView from '@/views/PacientesView.vue'

// =====================================
// DEFINIR RUTAS - INCLUYENDO PACIENTES
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

  // NUEVO: Módulo Pacientes
  {
    path: '/pacientes',
    name: 'Pacientes',
    component: PacientesView,
    meta: { 
      requiresAuth: true,
      title: 'Pacientes - Sistema Hidrocolon',
      breadcrumb: 'Gestión de Pacientes',
      description: 'Administra información de pacientes, citas y seguimiento médico'
    }
  },

  // Página 404 simple
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: {
      template: `
        <div class="min-h-screen flex items-center justify-center bg-gray-50">
          <div class="text-center">
            <h1 class="text-6xl font-bold text-gray-400 mb-4">404</h1>
            <h2 class="text-2xl font-semibold text-gray-900 mb-4">
              Página no encontrada
            </h2>
            <p class="text-gray-600 mb-8">
              La página que buscas no existe en el Sistema Hidrocolon.
            </p>
            <router-link
              to="/"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              Volver al Dashboard
            </router-link>
          </div>
        </div>
      `
    },
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
      if (!user || user.rol_nombre !== 'administrador') {
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
  console.log(`🎯 Navegación completada: ${from.name || 'inicial'} → ${to.name}`)
})

// Guard de error
router.onError((error) => {
  console.error('❌ Error en router:', error)
})

export default router

// ==========================================
// UTILIDADES DE NAVEGACIÓN - INCLUYENDO PACIENTES
// ==========================================

export const navegarA = {
  dashboard: () => router.push({ name: 'Dashboard' }),
  farmacia: () => router.push({ name: 'Farmacia' }),
  extras: () => router.push({ name: 'Extras' }),
  servicios: () => router.push({ name: 'Servicios' }),
  pacientes: () => router.push({ name: 'Pacientes' }), // NUEVO
  login: (redirect) => router.push({ 
    name: 'Login', 
    query: redirect ? { redirect } : {} 
  }),
  // Navegación básica
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
      text: 'Dashboard',
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
// MENÚ CON PACIENTES AGREGADO
// ==========================================

export const menuItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: 'home',
    title: 'Panel Principal',
    description: 'Resumen general del sistema',
    active: true
  },
  {
    name: 'Farmacia',
    path: '/farmacia',
    icon: 'beaker',
    title: 'Farmacia',
    description: 'Gestión de medicamentos e inventario',
    active: true
  },
  {
    name: 'Extras',
    path: '/extras',
    icon: 'cube',
    title: 'Extras',
    description: 'Productos adicionales y suministros',
    active: true
  },
  {
    name: 'Servicios',
    path: '/servicios',
    icon: 'heart',
    title: 'Servicios Médicos',
    description: 'Gestión de servicios y precios',
    active: true
  },
  // NUEVO: Agregar Pacientes al menú
  {
    name: 'Pacientes',
    path: '/pacientes',
    icon: 'users',
    title: 'Gestión de Pacientes',
    description: 'Administra pacientes, citas y seguimiento',
    active: true
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
  console.log('- Módulos disponibles: Dashboard, Farmacia, Extras, Servicios, Pacientes')
}

// Exportar debug globalmente para console
if (typeof window !== 'undefined') {
  window.debugRouter = debugRouter
}