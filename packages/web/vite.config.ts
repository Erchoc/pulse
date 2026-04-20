import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * 构建版本号：优先 CI 注入，回落 git SHA，最后 'dev'
 * - CI/Dockerfile 传 GIT_SHA 时用那个
 * - 本地/含 git 的构建机读 git HEAD
 * - 什么都没有就 'dev'
 */
const buildVersion = (() => {
  if (process.env.GIT_SHA) return process.env.GIT_SHA.slice(0, 12)
  try {
    return execSync('git rev-parse --short=12 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'dev'
  }
})()
const buildTime = new Date().toISOString()

export default defineConfig({
  define: {
    __BUILD_VERSION__: JSON.stringify(buildVersion),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt' 模式: SW 后台下载到 waiting 状态后, 通过 useRegisterSW 的
      // onNeedRefresh 回调暴露给前端 UI, 由用户主动点"立即更新"才激活.
      registerType: 'prompt',
      // 用 virtual:pwa-register/react 的 hook 手动控制注册, 避免重复注册.
      injectRegister: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },
      manifest: false, // use existing public/manifest.json
    }),
    {
      name: 'spa-routes',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/doc' || req.url === '/doc/') {
            req.url = '/doc/index.html'
          }
          if (req.url?.startsWith('/status')) {
            req.url = '/index.html'
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
