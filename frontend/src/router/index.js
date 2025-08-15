import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '@/services/authService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: {
        requiresGuest: true,
        title: 'Iniciar Sesión - Sistema Hidrocolon'
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Dashboard - Sistema Hidrocolon'
      }
    },
    // Ruta 404 - debe ir al final
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

// Navigation Guards - Protección de rutas con autenticación real
router.beforeEach(async (to, from, next) => {
  console.log(`🧭 Navegando de ${from.path} a ${to.path}`)
  
  // Cambiar título de la página
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // Verificar autenticación usando el authService real
  const isAuthenticated = authService.isAuthenticated()
  console.log(`🔐 Usuario autenticado: ${isAuthenticated}`)

  if (to.meta.requiresAuth) {
    // Ruta requiere autenticación
    if (!isAuthenticated) {
      console.log('❌ Acceso denegado, redirigiendo al login')
      next('/login')
    } else {
      console.log('✅ Usuario autenticado, permitiendo acceso')
      next()
    }
  } else if (to.meta.requiresGuest) {
    // Ruta solo para invitados (login)
    if (isAuthenticated) {
      console.log('👤 Usuario ya autenticado, redirigiendo al dashboard')
      next('/dashboard')
    } else {
      console.log('👋 Usuario no autenticado, permitiendo acceso al login')
      next()
    }
  } else {
    // Ruta pública
    console.log('🌐 Ruta pública, permitiendo acceso')
    next()
  }
})

// Log de navegación exitosa
router.afterEach((to, from) => {
  console.log(`✅ Navegación completada: ${from.path} → ${to.path}`)
})

export default router