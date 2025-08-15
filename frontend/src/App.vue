<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Router View - Aquí se cargarán las páginas -->
    <RouterView />
  </div>
</template>

<script>
import { RouterView } from 'vue-router'

export default {
  name: 'App',
  components: {
    RouterView
  }
}
</script>

<style>
/* Los estilos ya están en style.css */
</style>