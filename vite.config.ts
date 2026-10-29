import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

/** Emits sw.js with every built + public file precached, versioned by their content. */
function serviceWorker(): Plugin {
  let publicDir = ''
  return {
    name: 'chordhub-sw',
    apply: 'build',
    enforce: 'post',
    configResolved: (c) => void (publicDir = c.publicDir),
    generateBundle(_, bundle) {
      const pub = readdirSync(publicDir).sort()
      // Every browser with service workers takes woff2, so the woff fallbacks are never fetched.
      const files = [...Object.keys(bundle), ...pub].filter((f) => !/\.(woff|map)$/.test(f))
      const hash = createHash('sha256')
      for (const f of Object.keys(bundle).sort()) {
        const o = bundle[f]
        hash.update(f).update(o.type === 'chunk' ? o.code : o.source)
      }
      for (const f of pub) hash.update(readFileSync(join(publicDir, f)))
      const source = readFileSync(fileURLToPath(new URL('./src/sw.js', import.meta.url)), 'utf8')
        .replace('__VERSION__', JSON.stringify(hash.digest('hex').slice(0, 12)))
        .replace('__PRECACHE__', JSON.stringify(files))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), serviceWorker()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
