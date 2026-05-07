import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        codeSplitting: true,
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three/examples')) {
              return 'three-controls'
            }
            if (id.includes('@react-three/fiber')) {
              return 'three-runtime'
            }
            if (id.includes('/three/') || id.includes('\\three\\')) {
              return 'three-runtime'
            }
            if (id.includes('/react/') || id.includes('\\react\\') || id.includes('/react-dom/') || id.includes('\\react-dom\\')) {
              return 'react-vendor'
            }
            return 'vendor'
          }

          if (id.includes('ProjectPreview.jsx')) {
            return 'project-preview'
          }

          if (id.includes('AuthScreen.jsx')) {
            return 'auth-screen'
          }

          return undefined
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
    },
  },
})
