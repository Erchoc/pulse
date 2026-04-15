import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'doc-page',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/doc' || req.url === '/doc/') {
            req.url = '/doc/index.html'
          }
          next()
        })
      },
    },
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
