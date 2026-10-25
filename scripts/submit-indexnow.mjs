/**
 * IndexNow 自动批量提交脚本 (支持 IndexNow API 与 Bing)
 * 用法: node scripts/submit-indexnow.mjs
 */

const HOST = 'zhiwang.one'
const KEY = '7ec54bed5e684bee9e50ea059b0e5538'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const SITEMAP_URL = `https://${HOST}/sitemap.xml`

async function main() {
  console.log(`[1/3] 正在获取线上 sitemap: ${SITEMAP_URL} ...`)

  let sitemapXml = ''
  try {
    const res = await fetch(SITEMAP_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZhiWang-IndexNow/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      throw new Error(`Sitemap 返回状态异常: ${res.status} ${res.statusText}`)
    }
    sitemapXml = await res.text()
  } catch (err) {
    console.error('获取线上 sitemap 失败:', err.message)
    process.exit(1)
  }

  // 提取所有 <loc> URL
  const matches = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  let urlList = matches.map(m => m[1].trim()).filter(url => url.startsWith(`https://${HOST}`))
  urlList = [...new Set(urlList)]

  console.log(`[2/3] 从 sitemap 解析到 ${urlList.length} 个独立 URL`)
  if (urlList.length === 0) {
    console.error('未解析到有效 URL，终止提交。')
    process.exit(1)
  }

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  }

  console.log(`[3/3] 正在向 IndexNow 提交 ${urlList.length} 条 URL...`)
  console.log(`- 验证文件: ${KEY_LOCATION}`)

  const endpoints = [
    { name: 'IndexNow API (默认网关)', url: 'https://api.indexnow.org/indexnow' },
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
        signal: AbortSignal.timeout(20000),
      })

      if (res.status === 200 || res.status === 202) {
        console.log(`  ✓ 推送成功！HTTP 状态码: ${res.status} (OK/Accepted)`)
      } else {
        const text = await res.text().catch(() => '')
        console.log(`  ! 返回状态码: ${res.status} (${res.statusText}) ${text ? `- ${text}` : ''}`)
        if (res.status === 422) {
          console.log('    (422 说明 key 格式或 URL 与 host 不匹配)')
        } else if (res.status === 403) {
          console.log('    (403 说明线上密钥验证文件尚未部署完成，待代码 push & 部署后 Bing 将自动校验生效)')
        }
      }
    } catch (err) {
      console.error(`  ✕ 推送出现网络错误: ${err.message}`)
    }
  }

  console.log('\nIndexNow 推送流程执行完毕。')
}

main().catch(err => {
  console.error('执行脚本失败:', err)
  process.exit(1)
})
