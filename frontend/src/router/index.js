// frontend/src/router/index.js
// Agregar esta configuración a tu router existente

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore' // Si usas Pinia

// Importar vistas
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import FarmaciaView from '@/views/FarmaciaView.vue'
import ExtrasView from '@/views/ExtrasView.vue'
import ServiciosView from '@/views/ServiciosView.vue' // ⭐ NUEVA VISTA

const routes = [
  // Rutas públicas
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { 
      requiresAuth: false,
      title: 'Iniciar Sesión - Sistema Hidrocolon'
    }
  },
  
  // Rutas protegidas
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
  
  {
    path: '/farmacia',
    name: 'Farmacia',
    component: FarmaciaView,
    meta: { 
      requiresAuth: true,
      title: 'Farmacia - Sistema Hidrocolon',
      breadcrumb: 'Farmacia'
    }
  },
  
  {
    path: '/extras',
    name: 'Extras',
    component: ExtrasView,
    meta: { 
      requiresAuth: true,
      title: 'Extras - Sistema Hidrocolon',
      breadcrumb: 'Extras'
    }
  },
  
  // ⭐ NUEVA RUTA DE SERVICIOS
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
  
  // Rutas futuras (placeholder)
  {
    path: '/pacientes',
    name: 'Pacientes',
    component: () => import('@/views/PacientesView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Pacientes - Sistema Hidrocolon',
      breadcrumb: 'Pacientes'
    }
  },
  
  {
    path: '/carrito',
    name: 'Carrito',
    component: () => import('@/views/CarritoView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Carrito de Ventas - Sistema Hidrocolon',
      breadcrumb: 'Ventas'
    }
  },
  
  {
    path: '/financiero',
    name: 'Financiero',
    component: () => import('@/views/FinancieroView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Módulo Financiero - Sistema Hidrocolon',
      breadcrumb: 'Financiero'
    }
  },

  // Página 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: 'Página no encontrada - Sistema Hidrocolon'
    }
  }
]

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

// Navigation Guard para autenticación
router.beforeEach(async (to, from, next) => {
  console.log(`🧭 Navegando a: ${to.name} (${to.path})`)
  
  // Actualizar título de la página
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // Verificar autenticación
  const authStore = useAuthStore()
  
  // Rutas que requieren autenticación
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      console.log('🔒 Redirigiendo a login - usuario no autenticado')
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // Verificar token válido
    if (authStore.tokenExpired) {
      console.log('⏰ Token expirado, intentando refresh...')
      
      try {
        await authStore.refreshToken()
        console.log('✅ Token renovado exitosamente')
      } catch (error) {
        console.log('❌ Error renovando token, redirigiendo a login')
        authStore.logout()
        next({
          name: 'Login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }
  }
  
  // Si ya está autenticado y va a login, redirigir a dashboard
  if (to.name === 'Login' && authStore.isAuthenticated) {
    console.log('✅ Usuario ya autenticado, redirigiendo a dashboard')
    next({ name: 'Dashboard' })
    return
  }
  
  next()
})

// After navigation
router.afterEach((to, from) => {
  console.log(`📍 Navegación completada: ${from.name} → ${to.name}`)
})

export default router

// ==========================================
// UTILIDAD: Navegación programática
// ==========================================
export const navegarA = {
  dashboard: () => router.push({ name: 'Dashboard' }),
  farmacia: () => router.push({ name: 'Farmacia' }),
  extras: () => router.push({ name: 'Extras' }),
  servicios: () => router.push({ name: 'Servicios' }), // ⭐ NUEVA
  pacientes: () => router.push({ name: 'Pacientes' }),
  carrito: () => router.push({ name: 'Carrito' }),
  financiero: () => router.push({ name: 'Financiero' }),
  login: (redirect) => router.push({ 
    name: 'Login', 
    query: redirect ? { redirect } : undefined 
  })
}

// ==========================================
// UTILIDAD: Breadcrumbs
// ==========================================
export const obtenerBreadcrumbs = (route) => {
  const breadcrumbs = []
  
  // Siempre agregar Dashboard como base
  if (route.name !== 'Dashboard') {
    breadcrumbs.push({
      text: '🏠 Dashboard',
      to: { name: 'Dashboard' }
    })
  }
  
  // Agregar página actual
  if (route.meta?.breadcrumb) {
    breadcrumbs.push({
      text: route.meta.breadcrumb,
      to: route
    })
  }
  
  return breadcrumbs
}

// ==========================================
// UTILIDAD: Menú de navegación
// ==========================================
export const menuItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: '🏠',
    title: 'Panel Principal',
    description: 'Resumen general del sistema'
  },
  {
    name: 'Farmacia',
    path: '/farmacia',
    icon: '💊',
    title: 'Farmacia',
    description: 'Gestión de medicamentos e inventario'
  },
  {
    name: 'Extras',
    path: '/extras',
    icon: '🧰',
    title: 'Extras',
    description: 'Productos adicionales y suministros'
  },
  {
    name: 'Servicios', // ⭐ NUEVO ITEM
    path: '/servicios',
    icon: '🏥',
    title: 'Servicios Médicos',
    description: 'Gestión de servicios y precios'
  },
  {
    name: 'Pacientes',
    path: '/pacientes',
    icon: '👥',
    title: 'Pacientes',
    description: 'Base de datos de pacientes',
    disabled: true // Por implementar
  },
  {
    name: 'Carrito',
    path: '/carrito',
    icon: '🛒',
    title: 'Ventas',
    description: 'Sistema de ventas y facturación',
    disabled: true // Por implementar
  },
  {
    name: 'Financiero',
    path: '/financiero',
    icon: '💰',
    title: 'Financiero',
    description: 'Control de turnos y reportes',
    disabled: true // Por implementar
  }
]