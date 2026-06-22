/// <reference types="vitest" />
import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'

/** Dev-only endpoints so the in-app Accessory Studio can persist edits into the repo. */
function devSave(): PluginOption {
  const readBody = (req: import('node:http').IncomingMessage) =>
    new Promise<string>((resolve) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => resolve(b)) })
  return {
    name: 'dogmaker-dev-save',
    apply: 'serve',
    configureServer(server) {
      // overwrite an accessory PNG (manual crop), backing up the pristine original once
      server.middlewares.use('/api/save-part', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end() }
        try {
          const { name, dataUrl } = JSON.parse(await readBody(req))
          const safe = String(name).replace(/[^a-z0-9_-]/gi, '')
          const dst = path.resolve('public/parts', safe + '.png')
          const rawDir = path.resolve('public/parts/_acc-raw')
          if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir)
          const raw = path.join(rawDir, safe + '.png')
          if (fs.existsSync(dst) && !fs.existsSync(raw)) fs.copyFileSync(dst, raw)
          fs.writeFileSync(dst, Buffer.from(String(dataUrl).split(',')[1], 'base64'))
          res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ ok: true }))
        } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: String(e) })) }
      })
      // restore an accessory PNG from its pristine backup
      server.middlewares.use('/api/revert-part', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end() }
        try {
          const { name } = JSON.parse(await readBody(req))
          const safe = String(name).replace(/[^a-z0-9_-]/gi, '')
          const raw = path.resolve('public/parts/_acc-raw', safe + '.png')
          const dst = path.resolve('public/parts', safe + '.png')
          if (fs.existsSync(raw)) fs.copyFileSync(raw, dst)
          res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ ok: fs.existsSync(raw) }))
        } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: String(e) })) }
      })
      // persist accessory anchors (position/scale per accessory, optional per-base)
      server.middlewares.use('/api/save-anchors', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end() }
        try {
          const body = await readBody(req)
          fs.writeFileSync(path.resolve('src/raster/accessoryAnchors.json'), body)
          res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ ok: true }))
        } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: String(e) })) }
      })
    },
  }
}

export default defineConfig({
  base: '/DogMaker/',
  // don't hot-reload the page when the Studio writes the tuning JSON (live tuning is in localStorage)
  server: { watch: { ignored: ['**/src/raster/accessoryAnchors.json'] } },
  plugins: [
    react(),
    devSave(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'maskable-512.png'],
      manifest: {
        name: "Margo's Dogs",
        short_name: "Margo's Dogs",
        description: 'Make your own puppy and keep it as a sticker.',
        theme_color: '#e08a4a',
        background_color: '#fef7ee',
        display: 'standalone',
        start_url: '/DogMaker/',
        scope: '/DogMaker/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
