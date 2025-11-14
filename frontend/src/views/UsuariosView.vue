<template>
  <div class="usuarios-module">
    <!-- Header con título y botón agregar -->
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">

      <!-- Botón Volver al Dashboard -->
      <button
        @click="volverDashboard"
        class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        <span>Menú Principal</span>
      </button>

      <div class="text-center flex-1">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">👤 Gestión de Usuarios</h1>
        <p class="text-gray-600 mt-1">Administra usuarios y roles del sistema</p>
      </div>
      
      <!-- Botón Crear Nuevo Usuario -->
      <button
        @click="abrirModalCrear"
        class="btn-primary flex items-center space-x-2"
      >
        <span class="text-lg">➕</span>
        <span>Crear Usuario</span>
      </button>
    </header>

    <!-- Filtros -->
    <div class="mb-6 flex gap-2">
      <button
        @click="filtroActivo = 'todos'"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition-colors flex-1 sm:flex-none',
          filtroActivo === 'todos'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        ]"
      >
        Todos ({{ usuarios.length }})
      </button>
      <button
        @click="filtroActivo = 'activos'"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition-colors flex-1 sm:flex-none',
          filtroActivo === 'activos'
            ? 'bg-green-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        ]"
      >
        Activos ({{ usuariosActivos.length }})
      </button>
    </div>

    <!-- Loading -->
    <div v-if="cargando" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      <p class="mt-4 text-gray-600">Cargando usuarios...</p>
    </div>

    <!-- Tabla de Usuarios -->
    <div v-else class="card">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre Completo
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Último Login
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="usuario in usuariosFiltrados" :key="usuario.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ usuario.usuario }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ usuario.nombres }} {{ usuario.apellidos }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                  usuario.rol_nombre === 'administrador'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                ]">
                  {{ usuario.rol_nombre }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                  usuario.activo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                ]">
                  {{ usuario.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatearFecha(usuario.ultimo_login) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end gap-2">
                  <button
                    @click="abrirModalEditar(usuario)"
                    class="text-blue-600 hover:text-blue-900"
                    title="Editar usuario"
                  >
                    ✏️
                  </button>
                  <button
                    @click="abrirModalCambiarPassword(usuario)"
                    class="text-yellow-600 hover:text-yellow-900"
                    title="Cambiar contraseña"
                  >
                    🔑
                  </button>
                  <button
                    v-if="usuario.activo"
                    @click="confirmarDesactivar(usuario)"
                    class="text-red-600 hover:text-red-900"
                    :disabled="usuario.id === usuarioActualId"
                    :class="{ 'opacity-50 cursor-not-allowed': usuario.id === usuarioActualId }"
                    title="Desactivar usuario"
                  >
                    🚫
                  </button>
                  <button
                    v-else
                    @click="confirmarActivar(usuario)"
                    class="text-green-600 hover:text-green-900"
                    title="Activar usuario"
                  >
                    ✅
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="usuariosFiltrados.length === 0" class="text-center py-12">
        <p class="text-gray-500">No hay usuarios {{ filtroActivo !== 'todos' ? filtroActivo : '' }}</p>
      </div>
    </div>

    <!-- Modal Crear/Editar Usuario -->
    <div v-if="modalUsuarioVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">
            {{ modoEdicion ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}
          </h3>

          <form @submit.prevent="guardarUsuario" class="space-y-4">
            <!-- Usuario (Email) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Usuario (Email) *
              </label>
              <input
                v-model="formulario.usuario"
                type="email"
                required
                :disabled="modoEdicion"
                placeholder="ejemplo@hidrocolon.com"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
              <p class="text-xs text-gray-500 mt-1">Debe terminar en @hidrocolon.com</p>
            </div>

            <!-- Contraseña (solo en crear) -->
            <div v-if="!modoEdicion">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Contraseña *
              </label>
              <input
                v-model="formulario.password"
                type="password"
                required
                minlength="6"
                placeholder="Mínimo 6 caracteres"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
            </div>

            <!-- Nombres -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nombres *
              </label>
              <input
                v-model="formulario.nombres"
                type="text"
                required
                placeholder="Nombres del usuario"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
            </div>

            <!-- Apellidos -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Apellidos *
              </label>
              <input
                v-model="formulario.apellidos"
                type="text"
                required
                placeholder="Apellidos del usuario"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
            </div>

            <!-- Rol -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Rol *
              </label>
              <select
                v-model="formulario.rol_id"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar rol...</option>
                <option v-for="rol in roles" :key="rol.id" :value="rol.id">
                  {{ rol.nombre }} - {{ rol.descripcion }}
                </option>
              </select>
            </div>

            <!-- Botones -->
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="cerrarModalUsuario"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="guardando"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {{ guardando ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Crear') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Cambiar Contraseña -->
    <div v-if="modalPasswordVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">
            Cambiar Contraseña
          </h3>
          <p class="text-sm text-gray-600 mb-4">
            Usuario: <strong>{{ usuarioSeleccionado?.usuario }}</strong>
          </p>

          <form @submit.prevent="cambiarPassword" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña *
              </label>
              <input
                v-model="nuevaPassword"
                type="password"
                required
                minlength="6"
                placeholder="Mínimo 6 caracteres"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña *
              </label>
              <input
                v-model="confirmarPassword"
                type="password"
                required
                minlength="6"
                placeholder="Repetir contraseña"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
            </div>

            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="cerrarModalPassword"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="guardando"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {{ guardando ? 'Cambiando...' : 'Cambiar Contraseña' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import usuariosService from '@/services/usuariosService'
import authService from '@/services/authService'

export default {
  name: 'UsuariosView',
  setup() {
    const router = useRouter()

    // Estado
    const usuarios = ref([])
    const roles = ref([])
    const cargando = ref(false)
    const guardando = ref(false)
    const filtroActivo = ref('todos')

    // Modales
    const modalUsuarioVisible = ref(false)
    const modalPasswordVisible = ref(false)
    const modoEdicion = ref(false)
    const usuarioSeleccionado = ref(null)

    // Formularios
    const formulario = ref({
      usuario: '',
      password: '',
      nombres: '',
      apellidos: '',
      rol_id: ''
    })

    const nuevaPassword = ref('')
    const confirmarPassword = ref('')

    // Usuario actual
    const usuarioActual = authService.getUser()
    const usuarioActualId = usuarioActual?.id

    // Computed
    const usuariosActivos = computed(() => 
      usuarios.value.filter(u => u.activo === 1)
    )

    const usuariosInactivos = computed(() => 
      usuarios.value.filter(u => u.activo === 0)
    )

    const usuariosFiltrados = computed(() => {
      if (filtroActivo.value === 'activos') return usuariosActivos.value
      if (filtroActivo.value === 'inactivos') return usuariosInactivos.value
      return usuarios.value
    })

    // Métodos
    const cargarUsuarios = async () => {
      try {
        cargando.value = true
        const response = await usuariosService.obtenerTodos()
        usuarios.value = response.data
      } catch (error) {
        console.error('Error cargando usuarios:', error)
        alert('Error al cargar usuarios')
      } finally {
        cargando.value = false
      }
    }

    const cargarRoles = async () => {
      try {
        const response = await usuariosService.obtenerRoles()
        roles.value = response.data
      } catch (error) {
        console.error('Error cargando roles:', error)
      }
    }

    const abrirModalCrear = () => {
      modoEdicion.value = false
      formulario.value = {
        usuario: '',
        password: '',
        nombres: '',
        apellidos: '',
        rol_id: ''
      }
      modalUsuarioVisible.value = true
    }

    const abrirModalEditar = (usuario) => {
      modoEdicion.value = true
      usuarioSeleccionado.value = usuario
      formulario.value = {
        usuario: usuario.usuario,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        rol_id: usuario.rol_id
      }
      modalUsuarioVisible.value = true
    }

    const cerrarModalUsuario = () => {
      modalUsuarioVisible.value = false
      usuarioSeleccionado.value = null
      formulario.value = {
        usuario: '',
        password: '',
        nombres: '',
        apellidos: '',
        rol_id: ''
      }
    }

    const guardarUsuario = async () => {
      try {
        guardando.value = true

        if (modoEdicion.value) {
          await usuariosService.actualizar(usuarioSeleccionado.value.id, formulario.value)
          alert('Usuario actualizado correctamente')
        } else {
          await usuariosService.crear(formulario.value)
          alert('Usuario creado correctamente')
        }

        cerrarModalUsuario()
        await cargarUsuarios()
      } catch (error) {
        console.error('Error guardando usuario:', error)
        alert(error.response?.data?.message || 'Error al guardar usuario')
      } finally {
        guardando.value = false
      }
    }

    const abrirModalCambiarPassword = (usuario) => {
      usuarioSeleccionado.value = usuario
      nuevaPassword.value = ''
      confirmarPassword.value = ''
      modalPasswordVisible.value = true
    }

    const cerrarModalPassword = () => {
      modalPasswordVisible.value = false
      usuarioSeleccionado.value = null
      nuevaPassword.value = ''
      confirmarPassword.value = ''
    }

    const cambiarPassword = async () => {
      if (nuevaPassword.value !== confirmarPassword.value) {
        alert('Las contraseñas no coinciden')
        return
      }

      try {
        guardando.value = true
        await usuariosService.cambiarPassword(usuarioSeleccionado.value.id, nuevaPassword.value)
        alert('Contraseña cambiada correctamente')
        cerrarModalPassword()
      } catch (error) {
        console.error('Error cambiando contraseña:', error)
        alert(error.response?.data?.message || 'Error al cambiar contraseña')
      } finally {
        guardando.value = false
      }
    }

    const confirmarDesactivar = async (usuario) => {
      if (usuario.id === usuarioActualId) {
        alert('No puedes desactivar tu propio usuario')
        return
      }

      if (confirm(`¿Estás seguro de desactivar al usuario ${usuario.usuario}?`)) {
        try {
          await usuariosService.desactivar(usuario.id)
          alert('Usuario desactivado correctamente')
          await cargarUsuarios()
        } catch (error) {
          console.error('Error desactivando usuario:', error)
          alert(error.response?.data?.message || 'Error al desactivar usuario')
        }
      }
    }

    const confirmarActivar = async (usuario) => {
      if (confirm(`¿Estás seguro de activar al usuario ${usuario.usuario}?`)) {
        try {
          await usuariosService.activar(usuario.id)
          alert('Usuario activado correctamente')
          await cargarUsuarios()
        } catch (error) {
          console.error('Error activando usuario:', error)
          alert(error.response?.data?.message || 'Error al activar usuario')
        }
      }
    }

    const formatearFecha = (fecha) => {
      if (!fecha) return 'Nunca'
      return new Date(fecha).toLocaleString('es-GT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const volverDashboard = () => {
      router.push('/')
    }

    // Lifecycle
    onMounted(async () => {
      await cargarRoles()
      await cargarUsuarios()
    })

    return {
      usuarios,
      roles,
      cargando,
      guardando,
      filtroActivo,
      modalUsuarioVisible,
      modalPasswordVisible,
      modoEdicion,
      usuarioSeleccionado,
      formulario,
      nuevaPassword,
      confirmarPassword,
      usuarioActualId,
      usuariosActivos,
      usuariosInactivos,
      usuariosFiltrados,
      abrirModalCrear,
      abrirModalEditar,
      cerrarModalUsuario,
      guardarUsuario,
      abrirModalCambiarPassword,
      cerrarModalPassword,
      cambiarPassword,
      confirmarDesactivar,
      confirmarActivar,
      formatearFecha,
      volverDashboard
    }
  }
}
</script>

<style scoped>
.usuarios-module {
  @apply p-4 sm:p-6 max-w-7xl mx-auto;
}

.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden;
}

.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50;
}
</style>