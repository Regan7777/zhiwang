import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadConfig } from './lib/load-config.mjs'

test('retired performance, unsupported sales and stability rankings cannot leak from source or exports', (t) => {
  const { airportData } = loadConfig('airports.ts')
  const { airportCollections } = loadConfig('airport-collections.ts')
  assert.ok(!('sales' in airportCollections) && !('stable' in airportCollections))
  for (const airport of airportData) {
    assert.ok(!('performance' in airport) && !('salesSample' in airport), airport.name)
    assert.ok(!airport.scenarios.includes('stable'))
  }
  const output = mkdtempSync(join(tmpdir(), 'yinli-retired-data-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  loadConfig('generated.ts').generateAirportDataFiles({ dir: { dest: (file = '') => join(output, file) } })
  const read = (file) => readFileSync(join(output, 'data', file), 'utf8')
  const data = JSON.parse(read('rankings.json'))
  assert.ok(!('sales' in data.rankings) && !('stable' in data.rankings))
  assert.ok(!('salesSampleMeta' in data))
  assert.ok(!('historicalPerformanceRecordCount' in data.metrics))
  for (const file of ['airports.html', 'rankings.html', 'airports.md', 'rankings.md']) {
    assert.doesNotMatch(read(file), /仅作为历史资料|旧测试记录仅作历史|销量样本|稳定机场/)
  }
})
