import assert from 'node:assert/strict'
import test from 'node:test'
import { loadConfig } from './lib/load-config.mjs'
import { getAirportMembershipLinks } from './sync-airport-review-sections.mjs'

const { airportData, hiddenAirportStatuses, getAirportPriceMetrics } = loadConfig('airports.ts')
const { airportCollections } = loadConfig('airport-collections.ts')
const byName = (name) => airportData.find((airport) => airport.name === name)
const membershipPaths = (airport, collections = airportCollections) => getAirportMembershipLinks(airport, collections, hiddenAirportStatuses).map((link) => link.link)

test('Candidate airports join scenario pages without changing other curated memberships', () => {
  const airport = {
    name: '候选机场',
    path: '/posts/candidate-test/',
    scenarios: ['clash', 'streaming', 'chatgpt', 'cheap', 'noExpiry'],
    price: 5,
    noExpiry: true,
  }
  const customCollections = {
    ...airportCollections,
    chatgpt: { ...airportCollections.chatgpt, items: [{ path: airport.path }] },
    streaming: { ...airportCollections.streaming, items: [{ path: airport.path }] },
    all: { ...airportCollections.all, items: [{ path: airport.path }] },
    cheap: { ...airportCollections.cheap, items: [{ path: airport.path }] },
    noExpiry: { ...airportCollections.noExpiry, items: [{ path: airport.path }] },
  }
  const paths = membershipPaths(airport, customCollections)
  assert.ok(!paths.includes('/rankings/clash/'))
  assert.ok(paths.includes('/rankings/chatgpt/'))
  assert.ok(paths.includes('/rankings/streaming/'))
  assert.ok(!paths.includes('/posts/jichang-tuijian/'))
  assert.ok(paths.includes('/posts/jichang-heji/'))
  assert.ok(paths.includes('/rankings/cheap/'))
  assert.ok(paths.includes('/rankings/no-expiry/'))
})

test('AI and streaming scenario tags alone do not place an airport on evidence pages', () => {
  const airport = {
    name: '测试机场',
    path: '/posts/ai-test/',
    scenarios: ['chatgpt', 'streaming'],
  }
  const customCollections = {
    ...airportCollections,
    all: { ...airportCollections.all, items: [{ path: airport.path }] },
  }
  const paths = membershipPaths(airport, customCollections)
  assert.ok(!paths.includes('/rankings/chatgpt/'))
  assert.ok(!paths.includes('/rankings/streaming/'))
  assert.ok(paths.includes('/posts/jichang-heji/'))
})

test('membership follows a changed editorial collection without changing scenario tags', () => {
  const airport = byName('神行加速')
  const before = membershipPaths(airport)
  assert.ok(before.includes('/posts/jichang-tuijian/'))
  assert.ok(before.includes('/rankings/clash/'))
  const collections = {
    ...airportCollections,
    clash: { ...airportCollections.clash, items: airportCollections.clash.items.filter((item) => item.path !== airport.path) },
  }
  const after = membershipPaths(airport, collections)
  assert.ok(!after.includes('/rankings/clash/'))
  assert.ok(after.includes('/posts/jichang-tuijian/'))
  assert.ok(airport.scenarios.includes('clash'))
})

test('hidden airports only belong to risk monitoring even if an old collection contains them', () => {
  const airport = { ...airportData[0], status: '停止推荐' }
  assert.deepEqual(membershipPaths(airport), ['/risk-monitor/'])
})

test('introductory entry statistics preserve the entry price while using the normal-cycle reference', () => {
  // Keep this metric regression independent of future changes to live product prices.
  const airport = { ...airportData[0], price: 8.9, regularPrice: 30 }
  assert.equal(airport.price, 8.9)
  assert.equal(airport.regularPrice, 30)
  assert.deepEqual(getAirportPriceMetrics([airport]), {
    cheapUnderTenCount: 1, averagePrice: 8.9,
    regularCheapUnderTenCount: 0, regularAveragePrice: 30,
  })
  assert.equal(airport.price, 8.9)
})

test('normal references retain their price and hidden records do not affect either statistic', () => {
  const ordinary = { ...airportData[0], price: 6, regularPrice: undefined }
  const hidden = { ...airportData[0], status: '停止推荐' }
  assert.deepEqual(getAirportPriceMetrics([ordinary, hidden]), {
    cheapUnderTenCount: 1, averagePrice: 6,
    regularCheapUnderTenCount: 1, regularAveragePrice: 6,
  })
  assert.deepEqual(getAirportPriceMetrics([]), {
    cheapUnderTenCount: 0, averagePrice: 0,
    regularCheapUnderTenCount: 0, regularAveragePrice: 0,
  })
})
