import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'
import { createMarkdown } from 'vuepress/markdown'

const filename = fileURLToPath(new URL('../docs/.vuepress/config/image-loading.ts', import.meta.url))
const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
})
const module = { exports: {} }
vm.runInThisContext(`(function(exports, module) {\n${outputText}\n})`, { filename })(module.exports, module)
const { extendContentImageLoading } = module.exports
const render = (source) => {
  const md = createMarkdown({ html: true })
  extendContentImageLoading(md)
  return md.render(source)
}
const belowFoldText = `${'正文说明'.repeat(300)}\n\n`

test('an article opening image is eager, while lower Markdown and HTML images are lazy', () => {
  assert.match(render('![首屏示意](/hero.png)'), /loading="eager"/)
  for (const image of ['![正文图片](/test.png)', '<img src="/test.png" alt="正文图片">', '正文内嵌 <img src="/test.png" alt="正文图片"/>']) {
    const html = render(`${belowFoldText}${image}`)
    assert.match(html, /loading="lazy"/)
    assert.match(html, /decoding="async"/)
    assert.doesNotMatch(html, /loading="eager"/)
  }
})

test('explicit image loading and decoding overrides are preserved without duplicates', () => {
  const html = render(`${belowFoldText}<img src="/test.png" loading="eager" decoding="sync" alt="图">`)
  assert.equal((html.match(/loading=/g) || []).length, 1)
  assert.equal((html.match(/decoding=/g) || []).length, 1)
  assert.match(html, /loading="eager"/)
  assert.match(html, /decoding="sync"/)
})

test('self-closing HTML images are normalized before Plume parses their final attribute', () => {
  const html = render(`${belowFoldText}<a href="/original.png"><img src="/thumb.png" srcset="/thumb.png 1x, /thumb-2x.png 2x" width="100" alt="证据图"/></a>`)
  assert.match(html, /decoding="async">/)
  assert.doesNotMatch(html, /<img[^>]*\/>/)
})
