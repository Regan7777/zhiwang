import fs from 'node:fs'
import path from 'node:path'

/**
 * IndexNow 自动批量提交脚本 (支持 IndexNow 统一网关、Bing 与 Yandex)
 * 用法: node scripts/submit-indexnow.mjs
 */

const HOST = 'zhiwang.one'
const KEY = '7ec54bed5e684bee9e50ea059b0e5538'
const SITEMAP_URL = `https://${HOST}/sitemap.xml`

async function getUrlList() {
  console.log(`[1/3] 正在获取 sitemap 链接: ${SITEMAP_URL} ...`)

  let sitemapXml = ''
  try {
    const res = await fetch(SITEMAP_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZhiWang-IndexNow/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      sitemapXml = await res.text()
    }
  } catch {
    // 忽略线上拉取超时，降级为本地查找
  }

  if (sitemapXml) {
    const matches = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    const list = matches.map(m => m[1].trim()).filter(url => url.startsWith(`https://${HOST}`))
    if (list.length > 0) return [...new Set(list)]
  }

  // 本地兜底：从 docs/.vuepress/dist/sitemap.xml 或生成的核心路径构建
  const distSitemap = path.resolve('docs/.vuepress/dist/sitemap.xml')
  if (fs.existsSync(distSitemap)) {
    const localXml = fs.readFileSync(distSitemap, 'utf-8')
    const matches = [...localXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    const list = matches.map(m => m[1].trim()).filter(url => url.startsWith(`https://${HOST}`))
    if (list.length > 0) return [...new Set(list)]
  }

  return [
    `https://${HOST}/`,
    `https://${HOST}/posts/jichang-tuijian/`,
    `https://${HOST}/posts/jichang-heji/`,
    `https://${HOST}/posts/clash-verge-guide-2026/`,
    `https://${HOST}/posts/shadowrocket-guide-2026/`,
    `https://${HOST}/posts/flclash-guide-2026/`,
    `https://${HOST}/posts/v2rayn-guide-2026/`,
    `https://${HOST}/risk-monitor/`,
    `https://${HOST}/about/`,
  ]
}

async function main() {
  const urlList = await getUrlList()
  console.log(`[2/3] 准备提交 ${urlList.length} 个独立 URL`)

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList,
  }

  console.log(`[3/3] 正在向 IndexNow 搜索引擎推送...`)
  console.log(`- 验证文件: https://${HOST}/${KEY}.txt`)

  const endpoints = [
    { name: 'Yandex IndexNow 网关 (实时全网共享)', url: 'https://yandex.com/indexnow' },
    { name: 'IndexNow 官方通用网关', url: 'https://api.indexnow.org/indexnow' },
    { name: 'Bing IndexNow 专属网关', url: 'https://www.bing.com/indexnow' },
  ]

  for (const ep of endpoints) {
    try {
      console.log(`\n> 正在推送至 ${ep.name} (${ep.url})...`)
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      })

      if (res.status === 200 || res.status === 202) {
        console.log(`  ✓ 成功接收！HTTP 状态码: ${res.status} (Accepted)`)
      } else {
        const text = await res.text().catch(() => '')
        console.log(`  ! 返回状态码: ${res.status} (${res.statusText}) ${text ? `- ${text}` : ''}`)
      }
    } catch (err) {
      console.error(`  ✕ 推送网络错误: ${err.message}`)
    }
  }

  console.log('\nIndexNow 推送流程执行完毕。所有引擎间会自动共享这批 URL。')
}

main().catch(err => {
  console.error('执行脚本失败:', err)
  process.exit(1)
})
