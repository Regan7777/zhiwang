import fs from 'node:fs'
import path from 'node:path'
import { affiliateProviders } from './lib/affiliates.mjs'

const publicGoDir = path.resolve('docs/.vuepress/public/go')

export function generateAffiliateRedirects() {
  if (!fs.existsSync(publicGoDir)) {
    fs.mkdirSync(publicGoDir, { recursive: true })
  }

  let count = 0
  for (const item of affiliateProviders) {
    const slugDir = path.join(publicGoDir, item.slug)
    if (!fs.existsSync(slugDir)) {
      fs.mkdirSync(slugDir, { recursive: true })
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>正在前往 ${item.name} 官网...</title>
  <meta name="robots" content="noindex, nofollow">
  <meta http-equiv="refresh" content="0; url=${item.target}">
  <style>
    body {
      background-color: #141518;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
      box-sizing: border-box;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(255, 255, 255, 0.15);
      border-top-color: #2ca5e0;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    p {
      font-size: 15px;
      color: #999;
      margin-bottom: 12px;
    }
    a {
      color: #2ca5e0;
      text-decoration: none;
      font-weight: 500;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
  <script>
    window.location.replace("${item.target}");
  </script>
</head>
<body>
  <div class="spinner"></div>
  <p>正在为您安全连接至 <strong>${item.name}</strong> 官网，请稍候...</p>
  <p style="font-size: 13px;">如果页面未自动跳转，请 <a href="${item.target}" rel="sponsored nofollow">点击此处直接直达</a></p>
</body>
</html>
`

    fs.writeFileSync(path.join(slugDir, 'index.html'), htmlContent, 'utf-8')
    count++
  }

  console.log(`✓ 成功生成 ${count} 个 /go/ 专属中转短链页面！`)
}

// 允许直接命令行运行
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/generate-affiliate-redirects.mjs')) {
  generateAffiliateRedirects()
}
