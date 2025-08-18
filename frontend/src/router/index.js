// src/router/index.js
// Router principal del Sistema Hidrocolon

import { createRouter, createWebHistory } from 'vue-router'
// ✅ AGREGAR ESTE IMPORT AL INICIO
import authService from '@/services/authService'

// =====================================
// IMPORTAR COMPONENTES
// =====================================

// Vistas principales
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import FarmaciaView from '@/views/FarmaciaView.vue'
import ExtrasView from '@/views/ExtrasView.vue'

// =====================================
// DEFINIR RUTAS
// =====================================

const routes = [
  // Ruta raíz - redirige al dashboard
  {
    path: '/',
    redirect: '/dashboard'
  },

  // Login
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      requiresAuth: false,
      title: 'Iniciar Sesión'
    }
  },

  // Dashboard principal
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: {
      requiresAuth: true,
      title: 'Dashboard'
    }
  },

  // Módulo Farmacia
  {
    path: '/farmacia',
    name: 'Farmacia',
    component: FarmaciaView,
    meta: {
      requiresAuth: true,
      title: 'Módulo Farmacia'
    }
  },

  // Módulo Extras
  {
    path: '/extras',
    name: 'Extras',
    component: () => import('@/views/ExtrasView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Módulo Extras'
    }
  },

  // Ruta 404 - Página no encontrada
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: 'Página no encontrada'
    }
  }
]

// =====================================
// CREAR ROUTER
// =====================================

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
// GUARDS DE NAVEGACIÓN - VERSIÓN CORREGIDA
// =====================================

// Guard global - verificar autenticación
router.beforeEach((to, from, next) => {
  console.log(`Navegando de ${from.path} a ${to.path}`)

  // Verificar si la ruta requiere autenticación
  if (to.meta.requiresAuth) {
    
    // ✅ USAR authService.isAuthenticated() directamente
    if (!authService.isAuthenticated()) {
      console.log('❌ No autenticado, redirigiendo al login')
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // Verificar si requiere rol de administrador
    if (to.meta.requiresAdmin) {
      try {
        // ✅ USAR authService.getUser() directamente
        const userData = authService.getUser()
        
        if (!userData || userData.rol_nombre !== 'administrador') {
          console.log('❌ No es administrador, acceso denegado')
          next('/dashboard')
          return
        }
      } catch (error) {
        console.error('❌ Error obteniendo datos de usuario:', error)
        next('/login')
        return
      }
    }

    console.log('✅ Autenticado, permitiendo acceso')
  }

  // Si está en login y ya está autenticado, redirigir al dashboard
  if (to.path === '/login' && authService.isAuthenticated()) {
    console.log('✅ Ya autenticado, redirigiendo al dashboard')
    next('/dashboard')
    return
  }

  // Actualizar título de la página
  if (to.meta.title) {
    document.title = `${to.meta.title} - Sistema Hidrocolon`
  } else {
    document.title = 'Sistema Hidrocolon'
  }

  console.log('Navegación completada:', `${from.path} -> ${to.path}`)
  next()
})

// Guard después de cada navegación
router.afterEach((to, from) => {
  if (import.meta.env.DEV) {
    console.log(`✅ Navegación exitosa: ${from.path} → ${to.path}`)
  }
})

// =====================================
// UTILIDADES DEL ROUTER
// =====================================

// Función para navegar programáticamente con manejo de errores
router.navigateTo = (path, replace = false) => {
  try {
    if (replace) {
      router.replace(path)
    } else {
      router.push(path)
    }
  } catch (error) {
    console.error('❌ Error en navegación:', error)
  }
}

// Función para ir atrás de forma segura
router.goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/dashboard')
  }
}

// Función para logout y limpiar estado
router.logout = () => {
  authService.logout()
  router.push('/login')
}

// =====================================
// EXPORTAR ROUTER
// =====================================

export default router