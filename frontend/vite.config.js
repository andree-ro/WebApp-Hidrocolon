import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    // CONFIGURACIÓN DE PROXY CORREGIDA
    proxy: {
      '/api': {
        target: 'https://webapp-hidrocolon-production.up.railway.app',
        changeOrigin: true,
        secure: true,
        // Agregar headers necesarios para CORS
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Proxying:', req.method, req.url, '->', options.target + req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('✅ Proxy response:', proxyRes.statusCode, req.url)
          })
          proxy.on('error', (err, req, res) => {
            console.error('❌ Proxy error:', err.message, req.url)
          })
        },
        // Reescribir headers para evitar problemas CORS
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['@headlessui/vue', '@heroicons/vue'],
          utils: ['axios'],
        },
      },
    },
  },
  define: {
    __VUE_PROD_DEVTOOLS__: false,
  },
})