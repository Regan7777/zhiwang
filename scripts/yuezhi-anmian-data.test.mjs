import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { loadConfig } from './lib/load-config.mjs'
import { validateReviewEvidence } from './lib/airport-data-validation.mjs'

test('月之暗面 preserves owner-provided prices, source limits and explicit Clash eligibility', () => {
  const { airportData } = loadConfig('airports.ts')
  const { airportCollections } = loadConfig('airport-collections.ts')
  const { getNoExpiryPackage, getNoExpiryCells } = loadConfig('no-expiry-packages.ts')
  const brand = airportData.find((airport) => airport.name === '月之暗面')
  assert.ok(brand)
  assert.equal(brand.price, 5)
  assert.equal(brand.priceText, '5元/月')
  assert.equal(brand.traffic, '100GB/月')
  assert.equal(brand.trial, false)
  assert.equal(brand.dedicatedClient, false)
  assert.equal(brand.universalSubscription, true)
  assert.ok(brand.informationSources.every((source) => source.checkedAt === '2026-10-21'))
  assert.ok(brand.informationSources.filter((source) => source.link === false).every((source) => /人工/.test(source.name)))
  assert.match(brand.risk, /周期套餐不退款/)
  assert.match(brand.risk, /不限时包退款/)
  assert.match(brand.risk, /套餐与结算未独立核验/)
  assert.match(brand.risk, /人工确认官网可访问、Clash订阅可导入/)
  assert.match(brand.informationSources[1].name, /可导入（人工确认/)
  assert.equal(brand.informationSources[2].name, '月之暗面官网入口')
  for (const key of ['all', 'cheap', 'clash', 'noExpiry']) {
    assert.ok(airportCollections[key].items.some((airport) => airport.path === brand.path), key)
  }
  for (const key of ['mainRecommendation', 'chatgpt', 'streaming', 'dedicatedClient']) {
    assert.ok(!airportCollections[key].items.some((airport) => airport.path === brand.path), key)
  }
  assert.ok(!('performance' in brand))
  const pack = getNoExpiryPackage(brand.path)
  assert.equal(pack.priceCny, 10)
  assert.equal(pack.trafficGb, 100)
  assert.equal(pack.unitPriceCnyPerGb, 0.1)
  assert.match(getNoExpiryCells(brand.path).at(-1), /人工提供，套餐与结算未独立核验/)
  const page = readFileSync('docs/机场评测/月之暗面.md', 'utf8')
  assert.match(page, /25元\/年 \| 50GB\/月/)
  assert.match(page, /80元 \| 1000GB \| 0.080元\/GB/)
  assert.match(page, /本站没有|未付款|未独立读取/)
  assert.ok(!/月之暗面官网推广入口|月之暗面官网入口（/.test(page))
  assert.doesNotMatch(page, /站长/)
})

test('review source validation accepts IDN serialization but rejects changed referral codes or domains', () => {
  const { airportData } = loadConfig('airports.ts')
  const brand = airportData.find((airport) => airport.name === '月之暗面')
  const urls = brand.informationSources.filter((source) => source.link !== false).map((source) => new URL(source.url).href)
  const rows = [
    { cells: { 项目: '套餐价格', 当前记录: `${brand.priceText}，${brand.traffic}` } },
    { cells: { 项目: '免费试用', 当前记录: '不支持' } },
    { cells: { 项目: '资料来源', 当前记录: brand.informationSources.map((source) => source.name).join('；') }, hrefs: urls },
    { cells: { 项目: '资料复核日期', 当前记录: brand.informationSources.map((source) => `${source.name}：${source.checkedAt}`).join('；') } },
  ]
  assert.deepEqual(validateReviewEvidence(rows, brand, 'fixture'), [])
  for (const url of [urls[0].replace('lAzTYBl2', 'wrong-code'), 'https://example.org/#/register?code=lAzTYBl2']) {
    rows[2].hrefs = [url]
    assert.ok(validateReviewEvidence(rows, brand, 'fixture').some((error) => /source URLs/.test(error)))
  }
  rows[2].hrefs = []
  assert.ok(validateReviewEvidence(rows, brand, 'fixture').some((error) => /source URLs/.test(error)))
})
