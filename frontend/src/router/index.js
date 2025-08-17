// src/router/index.js
// VERSIÓN SIN GUARDS - Para que funcione el puto login

import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '@/services/authService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: {
        title: 'Iniciar Sesión - Sistema Hidrocolon'
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: {
        title: 'Dashboard - Sistema Hidrocolon'
      }
    },
    // Ruta 404
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

// Navigation Guards COMPLETAMENTE DESACTIVADOS
router.beforeEach(async (to, from, next) => {
  console.log(`🧭 Navegando de ${from.path} a ${to.path}`)
  
  // Solo cambiar título
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // PERMITIR TODO - SIN VERIFICACIONES
  console.log('🟢 GUARDS DESACTIVADOS - Permitiendo navegación libre')
  next()
})

router.afterEach((to, from) => {
  console.log(`✅ Navegación completada: ${from.path} → ${to.path}`)
})

export default router