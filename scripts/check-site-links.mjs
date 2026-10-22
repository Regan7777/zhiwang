import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

const dist = resolve('docs/.vuepress/dist')
const origin = 'https://zhiwang.one'
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const path = join(dir, entry.name)
  return entry.isDirectory() ? walk(path) : entry.name.endsWith('.html') ? [path] : []
})
const decode = (value) => {
  try { return decodeURIComponent(value) } catch { return value }
}
const targetFile = (pathname) => {
  const path = resolve(dist, `.${decode(pathname)}`)
  if (path !== dist && !path.startsWith(`${dist}${sep}`)) return null
  for (const candidate of [path, join(path, 'index.html'), `${path}.html`]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}
const errors = new Set()
const idsByFile = new Map()
const ids = (file) => {
  if (!idsByFile.has(file)) idsByFile.set(file, new Set([...readFileSync(file, 'utf8').matchAll(/\bid=["']([^"']+)["']/g)].map((m) => decode(m[1]))))
  return idsByFile.get(file)
}
let links = 0
const pages = walk(dist)
for (const file of pages) {
  const path = `/${relative(dist, file).replace(/\\/g, '/').replace(/index\.html$/, '')}`
  for (const match of readFileSync(file, 'utf8').matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    const href = match[1].replace(/&amp;/g, '&')
    let url
    try { url = new URL(href, `${origin}${path}`) } catch { errors.add(`${path}: invalid link ${href}`); continue }
    if (url.origin !== origin) continue
    links++
    const target = targetFile(url.pathname)
    if (!target) { errors.add(`${path}: missing destination ${href}`); continue }
    if (url.hash && target.endsWith('.html') && !ids(target).has(decode(url.hash.slice(1)))) errors.add(`${path}: missing anchor ${href}`)
  }
}
const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8')
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
for (const location of locations) {
  const url = new URL(location)
  if (url.origin !== origin || !targetFile(url.pathname)) errors.add(`sitemap: missing destination ${location}`)
}
if (errors.size) {
  console.error([...errors].join('\n'))
  process.exitCode = 1
} else console.log(`Site links passed: ${pages.length} HTML files, ${links} internal links, ${locations.length} sitemap URLs; destinations and anchors checked.`)
