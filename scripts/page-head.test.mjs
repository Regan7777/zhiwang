import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { dedupeHead } from 'vuepress/shared'
import { loadConfig } from './lib/load-config.mjs'

const configDir = fileURLToPath(new URL('../docs/.vuepress/config/', import.meta.url))
const { extendPageWithSeo } = loadConfig(join(configDir, 'page-head.ts'))
const { patchGeneratedHtml } = loadConfig(join(configDir, 'generated.ts'))
const { defaultRobots, siteName } = loadConfig(join(configDir, 'site.ts'))
const homepageTitle = '织网｜机场资料、风险监测与科学上网教程'

const makePage = (path, title = '') => {
  const page = { path, title, frontmatter: {}, data: {}, content: '', contentRendered: '' }
  extendPageWithSeo(page)
  return page
}

// VuePress 2.0.0-rc.24 resolvePageHead puts frontmatter before its default title.
// Use its real deduper to test the override contract used by SSR and the client.
const resolveHead = (page) => dedupeHead([
  ...page.frontmatter.head,
  ['title', {}, [page.title, siteName].filter(Boolean).join(' | ')],
])
const getTitles = (head) => head.filter(([tag]) => tag === 'title').map(([, , title]) => title)
const getRobots = (head) => head
  .filter(([tag, attrs]) => tag === 'meta' && attrs.name === 'robots')
  .map(([, attrs]) => attrs.content)

test('homepage title is in serialized page data and overrides the default site suffix', () => {
  const page = makePage('/', homepageTitle)
  const clientPage = JSON.parse(JSON.stringify(page))
  assert.deepEqual(getTitles(resolveHead(clientPage)), [homepageTitle])
  assert.deepEqual(getRobots(resolveHead(clientPage)), [defaultRobots])
})

test('404 title and noindex are in page data before HTML generation', () => {
  const page = makePage('/404.html')
  const clientPage = JSON.parse(JSON.stringify(page))
  assert.deepEqual(getTitles(resolveHead(clientPage)), ['页面未找到｜织网'])
  assert.deepEqual(getRobots(resolveHead(clientPage)), ['noindex, follow'])
})

test('article titles retain the VuePress site suffix and normal indexing policy', () => {
  const page = makePage('/posts/example/', '文章标题')
  assert.deepEqual(getTitles(resolveHead(page)), ['文章标题 | 织网'])
  assert.deepEqual(getRobots(resolveHead(page)), [defaultRobots])
})

test('airport sharing uses a dedicated wide cover without changing the original logo', () => {
  const page = makePage('/posts/shenxingjiasu-review-2026/', '神行加速套餐')
  const head = resolveHead(page)
  const social = Object.fromEntries(head.filter(([tag, attrs]) => tag === 'meta' && attrs.property)
    .map(([, attrs]) => [attrs.property, attrs.content]))
  assert.equal(social['og:image'], 'https://zhiwang.one/covers/posts-shenxingjiasu-review-2026.png')
  assert.equal(social['og:image:width'], '1280')
  assert.equal(social['og:image:height'], '720')
  const { airportData } = loadConfig(join(configDir, 'airports.ts'))
  assert.equal(airportData.find((airport) => airport.path === page.path).image, '/shouye.png')
})

test('the explicit content date drives the footer and metadata without losing Git contributors', () => {
  const contributors = [{ name: 'yinli', commits: 3 }]
  const gitTime = Date.parse('2026-09-23T13:59:00Z')
  const page = {
    filePathRelative: 'example.md',
    path: '/posts/example/', title: '文章标题', frontmatter: { createTime: '2026/09/16', dateModified: '2026/09/28' },
    data: { git: { updatedTime: gitTime, createdTime: 123, contributors } }, content: '', contentRendered: '',
  }
  extendPageWithSeo(page)
  assert.equal(page.data.git.updatedTime, Date.parse('2026-09-28T00:00:00Z'))
  assert.equal(page.data.git.createdTime, 123)
  assert.equal(page.data.git.contributors, contributors)
  const meta = page.frontmatter.head.find(([tag, attrs]) => tag === 'meta' && attrs.property === 'article:modified_time')
  assert.equal(Date.parse(meta[1].content), page.data.git.updatedTime)

  const fallback = { ...page, frontmatter: {}, data: { git: { updatedTime: gitTime, contributors } } }
  extendPageWithSeo(fallback)
  assert.equal(fallback.data.git.updatedTime, gitTime)
})

test('FAQPage and HowTo schemas are generated when frontmatter defines faq and howto', () => {
  const page = {
    filePathRelative: 'example.md',
    path: '/posts/guide-example/',
    title: '教程指南',
    frontmatter: {
      faq: [
        { q: '怎么安装？', a: '直接从官网下载并运行安装程序。' },
      ],
      howto: {
        name: '快速配置教程',
        totalTime: 'PT5M',
        steps: [
          { name: '第一步：下载', text: '前往下载页获取客户端。' },
          { name: '第二步：导入', text: '复制订阅链接并导入。' },
        ],
      },
    },
    data: {},
    content: '',
    contentRendered: '',
  }
  extendPageWithSeo(page)
  const jsonLdTag = page.frontmatter.head.find(([tag, attrs]) => tag === 'script' && attrs?.type === 'application/ld+json')
  assert.ok(jsonLdTag, 'ld+json script tag should exist')
  const schema = JSON.parse(jsonLdTag[2])
  const graph = schema['@graph']

  const faqItem = graph.find((item) => item['@type'] === 'FAQPage')
  assert.ok(faqItem, 'FAQPage should exist in schema graph')
  assert.equal(faqItem.mainEntity.length, 1)
  assert.equal(faqItem.mainEntity[0].name, '怎么安装？')
  assert.equal(faqItem.mainEntity[0].acceptedAnswer.text, '直接从官网下载并运行安装程序。')

  const howToItem = graph.find((item) => item['@type'] === 'HowTo')
  assert.ok(howToItem, 'HowTo should exist in schema graph')
  assert.equal(howToItem.name, '快速配置教程')
  assert.equal(howToItem.totalTime, 'PT5M')
  assert.equal(howToItem.step.length, 2)
  assert.equal(howToItem.step[0]['@type'], 'HowToStep')
  assert.equal(howToItem.step[0].position, 1)
  assert.equal(howToItem.step[0].name, '第一步：下载')
})

test('post-generation cleanup preserves the head that the client will take over', (t) => {
  const dest = mkdtempSync(join(tmpdir(), 'yinli-page-head-'))
  t.after(() => rmSync(dest, { recursive: true, force: true }))
  const fixtures = [
    ['index.html', makePage('/', homepageTitle)],
    ['404.html', makePage('/404.html')],
    ['article.html', makePage('/posts/example/', '文章标题')],
  ]
  const expectedHeads = new Map()

  for (const [file, page] of fixtures) {
    const head = `<head><title>${getTitles(resolveHead(page))[0]}</title><meta name="robots" content="${getRobots(resolveHead(page))[0]}"></head>`
    expectedHeads.set(file, head)
    writeFileSync(join(dest, file), `<!doctype html><html>${head}<body><div id="VPContent"></div><img class="vp-image dark logo" style="" src="/logo.svg" alt><img class="vp-image light logo" style="" src="/logo.svg" alt><a href="https://www.dengta12.com/reg?ref=DjdVKysq">官网入口</a></body></html>`)
  }

  patchGeneratedHtml({ dir: { dest: (file = '') => join(dest, file) } })

  for (const [file] of fixtures) {
    const html = readFileSync(join(dest, file), 'utf8')
    assert.equal(html.match(/<head>[\s\S]*?<\/head>/)?.[0], expectedHeads.get(file), file)
    assert.equal((html.match(/<title>/g) || []).length, 1, file)
    assert.equal((html.match(/<meta name="robots"/g) || []).length, 1, file)
    assert.match(html, /href="https:\/\/www\.dengta12\.com\/reg\?ref=DjdVKysq"[^>]*rel="sponsored nofollow noopener noreferrer"/)
    assert.match(html, /<img class="vp-image dark logo" style="" src="\/logo\.svg" alt="织网 Logo">/)
    assert.match(html, /<img class="vp-image light logo" style="" src="\/logo\.svg" alt="织网 Logo">/)
  }
})
