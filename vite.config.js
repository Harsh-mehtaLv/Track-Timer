import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Vite plugin to save Supabase config and manage live multi-browser telemetry
function adminConfigPlugin() {
  // In-memory live telemetry store for multi-browser local sync
  const liveTelemetry = new Map()

  return {
    name: 'admin-config-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // 1. Live Telemetry Heartbeat from any browser
        if (req.url === '/api/telemetry/heartbeat' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}')
              if (data.username) {
                const key = data.username.toLowerCase()
                liveTelemetry.set(key, {
                  ...data,
                  lastSeen: Date.now()
                })
              }
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: true }))
              return
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: err.message }))
              return
            }
          })
          return
        }

        // 2. Fetch Active Telemetry for Admin Console
        if (req.url === '/api/telemetry/active' && req.method === 'GET') {
          const now = Date.now()
          const activeList = []
          for (const [username, state] of liveTelemetry.entries()) {
            // Heartbeat considered valid within 15 seconds
            if (now - state.lastSeen < 15000 && state.isTimerRunning) {
              activeList.push(state)
            } else if (now - state.lastSeen >= 60000) {
              // Purge stale disconnected entries
              liveTelemetry.delete(username)
            }
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ active: activeList, all: Array.from(liveTelemetry.values()) }))
          return
        }

        // 3. Save Supabase config into .env.local
        if (req.url === '/api/admin/save-supabase-config' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const { url, key } = JSON.parse(body || '{}')
              if (url && key) {
                const envPath = path.resolve(process.cwd(), '.env.local')
                const envContent = `VITE_SUPABASE_URL=${url.trim()}\nVITE_SUPABASE_ANON_KEY=${key.trim()}\n`
                if (fs.existsSync(envPath) && fs.readFileSync(envPath, 'utf-8') === envContent) {
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ success: true, message: 'Configuration already up to date' }))
                  return
                }
                fs.writeFileSync(envPath, envContent, 'utf-8')
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: true, message: 'Configuration saved to .env.local' }))
                return
              }
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: err.message }))
              return
            }
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Missing url or key' }))
          })
          return
        }
        next()
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), adminConfigPlugin()],
  server: {
    port: 5173,
    host: true
  }
})
