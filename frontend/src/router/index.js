// frontend/src/router/index.js
// Router del Sistema Hidrocolon - ACTUALIZADO CON PACIENTES Y CARRITO

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
import PacientesView from '@/views/PacientesView.vue'
import FinancieroView from '@/views/FinancieroView.vue'
import LibroBancosView from '@/views/LibroBancosView.vue'
import EstadoResultadosView from '@/views/EstadoResultadosView.vue'
import UsuariosView from '@/views/UsuariosView.vue'
import HistorialVentasView from '@/views/HistorialVentasView.vue'

// =====================================
// DEFINIR RUTAS - INCLUYENDO PACIENTES Y CARRITO
// =====================================

const routes = [
  // Ruta raÃ­z - Dashboard principal
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
      title: 'Iniciar SesiÃ³n - Sistema Hidrocolon'
    }
  },

  // Dashboard alternativo (redirige a /)
  {
    path: '/dashboard',
    redirect: '/'
  },

  // MÃ³dulo Farmacia
  {
    path: '/farmacia',
    name: 'Farmacia',
    component: FarmaciaView,
    meta: { 
      requiresAuth: true,
      title: 'Farmacia - Sistema Hidrocolon',
      breadcrumb: 'Farmacia',
      description: 'GestiÃ³n de medicamentos e inventario'
    }
  },

  // MÃ³dulo Extras
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

  // MÃ³dulo Servicios
  {
    path: '/servicios',
    name: 'Servicios',
    component: ServiciosView,
    meta: { 
      requiresAuth: true,
      title: 'Servicios - Sistema Hidrocolon',
      breadcrumb: 'Servicios MÃ©dicos',
      description: 'GestiÃ³n de servicios mÃ©dicos, precios y medicamentos vinculados'
    }
  },

  // MÃ³dulo Pacientes
  {
    path: '/pacientes',
    name: 'Pacientes',
    component: PacientesView,
    meta: { 
      requiresAuth: true,
      title: 'Pacientes - Sistema Hidrocolon',
      breadcrumb: 'GestiÃ³n de Pacientes',
      description: 'Administra informaciÃ³n de pacientes, citas y seguimiento mÃ©dico'
    }
  },

  // MÃ³dulo Doctoras
  {
    path: '/doctoras',  // â† AGREGAR AQUÃ
    name: 'Doctoras',
    component: () => import('../views/DoctorasView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'GestiÃ³n de Doctoras'
    }
  },

  // Módulo Comisiones
  {
    path: '/comisiones',
    name: 'Comisiones',
    component: () => import('../views/ComisionesView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Comisiones - Sistema Hidrocolon',
      breadcrumb: 'Gestión de Comisiones',
      description: 'Administración de comisiones y pagos a doctoras'
    }
  },

  // MÃ³dulo Carrito/Ventas
  {
    path: '/carrito',
    name: 'Carrito',
    component: () => import('../views/CarritoView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Sistema de Ventas - Sistema Hidrocolon',
      breadcrumb: 'Carrito',
      description: 'GestiÃ³n de ventas y facturaciÃ³n'
    }
  },

  // Historial de Ventas
  {
    path: '/historial-ventas',
    name: 'HistorialVentas',
    component: HistorialVentasView,
    meta: { 
      requiresAuth: true,
      title: 'Historial de Ventas - Sistema Hidrocolon',
      breadcrumb: 'Historial de Ventas',
      description: 'Consulta y descarga comprobantes de ventas anteriores'
    }
  },


  {
    path: '/financiero',
    name: 'Financiero',
    component: FinancieroView,
    meta: { 
      requiresAuth: true,
      title: 'Módulo Financiero - Sistema Hidrocolon',
      breadcrumb: 'Financiero',
      description: 'Control de turnos, caja y finanzas'
    }
  },

  // Módulo Libro de Bancos
  {
    path: '/libro-bancos',
    name: 'LibroBancos',
    component: LibroBancosView,
    meta: { 
      requiresAuth: true,
      adminOnly: true,
      title: 'Libro de Bancos - Sistema Hidrocolon',
      breadcrumb: 'Libro de Bancos',
      description: 'Control de ingresos y egresos bancarios'
    }
  },

  // Módulo Estado de Resultados
  {
    path: '/estado-resultados',
    name: 'EstadoResultados',
    component: EstadoResultadosView,
    meta: { 
      requiresAuth: true,
      adminOnly: true,
      title: 'Estado de Resultados - Sistema Hidrocolon',
      breadcrumb: 'Estado de Resultados',
      description: 'Reporte financiero de ingresos, costos y utilidades'
    }
  },

    // Módulo Usuarios (solo administradores)
  {
    path: '/usuarios',
    name: 'Usuarios',
    component: UsuariosView,
    meta: { 
      requiresAuth: true,
      adminOnly: true,
      title: 'Gestión de Usuarios - Sistema Hidrocolon',
      breadcrumb: 'Usuarios',
      description: 'Administración de usuarios y roles del sistema'
    }
  },

  // PÃ¡gina 404 simple
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: {
      template: `
        <div class="min-h-screen flex items-center justify-center bg-gray-50">
          <div class="text-center">
            <h1 class="text-6xl font-bold text-gray-400 mb-4">404</h1>
            <h2 class="text-2xl font-semibold text-gray-900 mb-4">
              PÃ¡gina no encontrada
            </h2>
            <p class="text-gray-600 mb-8">
              La pÃ¡gina que buscas no existe en el Sistema Hidrocolon.
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
      title: 'PÃ¡gina no encontrada - Sistema Hidrocolon'
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
// GUARDS DE NAVEGACIÃ“N - CON LOGS DETALLADOS
// =====================================

// Guard global - verificar autenticaciÃ³n
router.beforeEach(async (to, from, next) => {
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•')
  console.log(`ðŸ§­ NAVEGANDO A: ${to.name} (${to.path})`)
  console.log(`ðŸ“ DESDE: ${from.name || 'inicial'} (${from.path})`)
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•')
  
  // Actualizar tÃ­tulo de la pÃ¡gina
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // ========== PASO 1: VERIFICAR SI REQUIERE AUTENTICACIÃ“N ==========
  console.log(`ðŸ” Â¿Requiere auth? ${to.meta.requiresAuth}`)
  
  if (to.meta.requiresAuth) {
    console.log('ðŸ”’ âœ… Ruta requiere autenticaciÃ³n, verificando...')
    
    const isAuth = authService.isAuthenticated()
    console.log('ðŸ”‘ authService.isAuthenticated():', isAuth)
    
    if (!isAuth) {
      console.log('âŒ Usuario NO autenticado')
      console.log('ðŸ”„ Redirigiendo a Login...')
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    console.log('âœ… Usuario AUTENTICADO correctamente')

    // ========== PASO 2: VERIFICAR PERMISOS DE ADMIN (SI APLICA) ==========
    if (to.meta.adminOnly) {
      console.log('ðŸ‘‘ Ruta requiere permisos de administrador')
      const user = authService.getUser()
      console.log('ðŸ‘¤ Usuario actual:', user)
      console.log('ðŸŽ­ Rol del usuario:', user?.rol_nombre)
      
      if (!user || user.rol_nombre !== 'administrador') {
        console.log('â›” ACCESO DENEGADO - No es administrador')
        console.log('ðŸ”„ Redirigiendo a Dashboard...')
        next({ name: 'Dashboard' })
        return
      }
      console.log('âœ… Usuario ES administrador')
    } else {
      console.log('â„¹ï¸ Ruta NO requiere permisos especiales')
    }
  } else {
    console.log('â„¹ï¸ Ruta pÃºblica, no requiere autenticaciÃ³n')
  }
  
  // ========== PASO 3: EVITAR IR A LOGIN SI YA ESTÃ AUTENTICADO ==========
  if (to.name === 'Login') {
    console.log('ðŸšª Destino es Login, verificando si ya estÃ¡ autenticado...')
    if (authService.isAuthenticated()) {
      console.log('âœ… Usuario YA autenticado')
      console.log('ðŸ”„ Redirigiendo a Dashboard en lugar de Login...')
      next({ name: 'Dashboard' })
      return
    } else {
      console.log('â„¹ï¸ Usuario no autenticado, permitir acceso a Login')
    }
  }
  
  // ========== PASO 4: PERMITIR NAVEGACIÃ“N ==========
  console.log('âœ…âœ…âœ… NAVEGACIÃ“N PERMITIDA A:', to.name)
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•')
  next()
})

// Guard posterior a la navegaciÃ³n
router.afterEach((to, from) => {
  console.log(`ðŸŽ¯ NavegaciÃ³n completada: ${from.name || 'inicial'} â†’ ${to.name}`)
})

// Guard de error
router.onError((error) => {
  console.error('âŒâŒâŒ ERROR EN ROUTER:', error)
  console.error('Stack trace:', error.stack)
})

export default router

// ==========================================
// UTILIDADES DE NAVEGACIÃ“N - INCLUYENDO PACIENTES Y CARRITO
// ==========================================

export const navegarA = {
  dashboard: () => router.push({ name: 'Dashboard' }),
  farmacia: () => router.push({ name: 'Farmacia' }),
  extras: () => router.push({ name: 'Extras' }),
  servicios: () => router.push({ name: 'Servicios' }),
  pacientes: () => router.push({ name: 'Pacientes' }),
  carrito: () => router.push({ name: 'Carrito' }),
  login: (redirect) => router.push({ 
    name: 'Login', 
    query: redirect ? { redirect } : {} 
  }),
  financiero: () => router.push({ name: 'Financiero' }),
  // NavegaciÃ³n bÃ¡sica
  goBack: () => router.go(-1),
  reload: () => router.go(0)
}

// ==========================================
// UTILIDADES DE BREADCRUMBS
// ==========================================

export const obtenerBreadcrumbs = (route) => {
  const breadcrumbs = []
  
  // Siempre agregar Dashboard como base (excepto si ya estamos ahÃ­)
  if (route.name !== 'Dashboard') {
    breadcrumbs.push({
      text: 'Dashboard',
      to: { name: 'Dashboard' },
      active: false
    })
  }
  
  // Agregar pÃ¡gina actual
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
// MENÃš CON PACIENTES Y CARRITO AGREGADOS
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
    description: 'GestiÃ³n de medicamentos e inventario',
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
    title: 'Servicios MÃ©dicos',
    description: 'GestiÃ³n de servicios y precios',
    active: true
  },
  {
    name: 'Pacientes',
    path: '/pacientes',
    icon: 'users',
    title: 'GestiÃ³n de Pacientes',
    description: 'Administra pacientes, citas y seguimiento',
    active: true
  },
  {
    name: 'Carrito',
    path: '/carrito',
    icon: 'shopping-cart',
    title: 'Sistema de Ventas',
    description: 'GestiÃ³n de ventas y facturaciÃ³n',
    active: true
  },
  {
    name: 'Financiero',
    path: '/financiero',
    icon: 'currency-dollar',
    title: 'MÃ³dulo Financiero',
    description: 'Control de turnos, caja y finanzas',
    active: true
  }
]

// ==========================================
// UTILIDADES DE VALIDACIÃ“N DE RUTAS
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
  console.log('ðŸ” Debug del Router:')
  console.log('- Rutas registradas:', routes.length)
  console.log('- Ruta actual:', router.currentRoute.value)
  console.log('- Usuario autenticado:', authService.isAuthenticated())
  console.log('- Datos de usuario:', authService.getUser())
  console.log('- MÃ³dulos disponibles: Dashboard, Farmacia, Extras, Servicios, Pacientes, Carrito')
}

// Exportar debug globalmente para console
if (typeof window !== 'undefined') {
  window.debugRouter = debugRouter
}