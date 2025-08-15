<template>
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
        to="/login"
        class="btn-primary"
      >
        Volver al Inicio
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView'
}
</script>