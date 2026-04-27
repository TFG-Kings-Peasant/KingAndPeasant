import { defineConfig } from 'vite' //
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // @ts-expect-error: Vite no conoce la propiedad 'test', pero Vitest sí la leerá
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/pages/**/*.tsx', 'src/components/**/*.tsx', 'src/hooks/**/*.ts'], // Qué medir
      exclude: [
        'src/**/*.test.tsx', 
        'src/**/*.test.ts',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      all: true, 
    }
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
