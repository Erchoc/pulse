import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 3000)
const ENV = process.env.NODE_ENV ?? 'production'

function ts() {
  return new Date().toISOString()
}
function level(sc: number) {
  if (sc >= 500) return '\x1b[31m[ERROR]\x1b[0m'
  if (sc >= 400) return '\x1b[33m[WARN] \x1b[0m'
  return '\x1b[32m[INFO] \x1b[0m'
}

const app = Fastify({ logger: false, genReqId: () => randomUUID() })

app.addHook('onSend', async (req, reply) => {
  reply.header('x-trace-id', req.id as string)
  const sc = reply.statusCode
  console.log(`${level(sc)} [${ts()}] ${req.method} ${req.url} → ${sc} | trace:${req.id}`)
})

app.get('/health', async () => ({ status: 'ok', ts: ts() }))

// Serve web SPA static files
const webDist = resolve(__dirname, '../../web/dist')
if (existsSync(webDist)) {
  app.register(fastifyStatic, { root: webDist, wildcard: false })
  // /doc without trailing slash → redirect to /doc/
  app.get('/doc', async (_req, reply) => reply.redirect('/doc/'))
  // SPA fallback: serve index.html for non-API, non-file routes
  app.setNotFoundHandler(async (_req, reply) => {
    return reply.sendFile('index.html')
  })
}

const start = async () => {
  await app.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`\n  pulse · ${ENV} · http://localhost:${PORT}\n`)
}
start()
