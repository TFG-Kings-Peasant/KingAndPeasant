import { defineConfig } from 'vite' //
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // @ts-expect-error: Vite no conoce la propiedad 'test', pero Vitest sí la leerá
  test: {
    environment: 'jsdom',
    globals: true
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'http://server:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
