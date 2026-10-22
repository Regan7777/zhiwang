import { airportData, isVisibleAirport, mainRecommendationNames } from './airports'
import type { AirportData } from './airports'

interface AirportCollectionDefinition {
  name: string
  dataTitle: string
  pagePath?: string
  sourceFile?: string
  heading?: string
  sectionLinks?: boolean
  ordered?: boolean
  select: (airports: AirportData[]) => AirportData[]
}

// Editorial selections belong here, not in separate Markdown, JSON and Schema filters.
// A service that is hidden or no longer eligible drops out of every corresponding view.
const selectNames = (
  airports: AirportData[],
  names: readonly string[],
  eligible: (airport: AirportData) => boolean = () => true,
  appendRemaining = false,
) => {
  const byName = new Map(airports.map((airport) => [airport.name, airport]))
  if (new Set(names).size !== names.length) throw new Error('Duplicate airport in collection selection')
  const selected = names.map((name) => {
    const airport = byName.get(name)
    if (!airport) throw new Error(`Unknown airport in collection: ${name}`)
    return airport
  })
  const ordered = appendRemaining
    ? [...selected, ...airports.filter((airport) => !names.includes(airport.name))]
    : selected
  return ordered.filter((airport) => isVisibleAirport(airport) && eligible(airport))
}

const visibleWhere = (predicate: (airport: AirportData) => boolean) => (airports: AirportData[]) => (
  airports.filter((airport) => isVisibleAirport(airport) && predicate(airport))
)

// Candidate services for the ChatGPT scenario.
const chatgptCandidateNames = [
  '神行加速', '榴莲云', '闪电鼠',
] as const

const streamingCandidateNames = [
  '神行加速', '榴莲云', '云界线',
] as const

const definitions = {
  mainRecommendation: {
    name: '2026机场综合推荐顺序', dataTitle: '综合推荐顺序', ordered: true,
    pagePath: '/posts/jichang-tuijian/', sourceFile: 'docs/机场推荐/机场推荐.md',
    heading: '## 2026机场推荐对比', sectionLinks: true,
    select: (airports) => selectNames(airports, mainRecommendationNames),
  },
  all: {
    name: '2026机场大全', dataTitle: '全部机场',
    pagePath: '/posts/jichang-heji/', sourceFile: 'docs/机场推荐/机场合集.md',
    heading: '## 机场价格总表', sectionLinks: true,
    select: (airports) => selectNames(airports, [
      '神行加速', '榴莲云', '云界线', '闪电鼠', '环球梯', '月之暗面', '大佬云', '边缘节点', '快狸', '飞V', '灵动云',
    ], () => true, true),
  },
  cheap: {
    name: '2026低价机场筛选', dataTitle: '低价机场',
    pagePath: '/rankings/cheap/', sourceFile: 'docs/机场榜单/低价机场榜.md',
    heading: '## 低价机场候选',
    select: (airports) => selectNames(airports, [
      '月之暗面',
    ], (airport) => airport.price <= 10 || airport.scenarios.includes('cheap')),
  },
  clash: {
    name: '2026 Clash机场筛选', dataTitle: 'Clash 机场',
    pagePath: '/rankings/clash/', sourceFile: 'docs/机场榜单/Clash机场榜.md',
    heading: '## Clash机场候选',
    select: (airports) => selectNames(airports, [
      '月之暗面', '神行加速', '榴莲云', '云界线', '大佬云', '快狸',
    ], (airport) => airport.universalSubscription === true),
  },
  chatgpt: {
    name: '2026 ChatGPT机场筛选', dataTitle: 'ChatGPT 机场',
    pagePath: '/rankings/chatgpt/', sourceFile: 'docs/机场榜单/ChatGPT机场榜.md',
    heading: '## ChatGPT机场候选',
    select: (airports) => selectNames(airports, chatgptCandidateNames),
  },
  streaming: {
    name: '2026流媒体机场资料筛选', dataTitle: '流媒体机场资料',
    pagePath: '/rankings/streaming/', sourceFile: 'docs/机场榜单/流媒体机场榜.md',
    heading: '## 流媒体机场候选',
    select: (airports) => selectNames(airports, streamingCandidateNames),
  },
  noExpiry: {
    name: '2026不限时机场筛选', dataTitle: '不限时套餐机场',
    pagePath: '/rankings/no-expiry/', sourceFile: 'docs/机场榜单/不限时机场榜.md',
    heading: '## 不限时与按量套餐候选',
    // Keep conflicting advertised packages visible as candidates, without counting them as supported.
    select: visibleWhere((airport) => airport.noExpiry !== false),
  },
  dedicatedClient: {
    name: '2026专属客户端机场筛选', dataTitle: '专属客户端机场',
    pagePath: '/rankings/dedicated-client/', sourceFile: 'docs/机场榜单/专属客户端机场榜.md',
    heading: '## 专属客户端机场候选',
    select: visibleWhere((airport) => airport.dedicatedClient),
  },
} satisfies Record<string, AirportCollectionDefinition>

export type AirportCollectionKey = keyof typeof definitions
export type AirportCollection = Omit<AirportCollectionDefinition, 'select'> & { items: AirportData[] }

export const createAirportCollections = (airports: AirportData[]) => Object.fromEntries(
  Object.entries(definitions).map(([key, { select, ...definition }]) => [
    key, { ...definition, items: select(airports) },
  ]),
) as Record<AirportCollectionKey, AirportCollection>

export const airportCollections = createAirportCollections(airportData)

export const getAirportCollectionForPage = (path: string) => (
  Object.values(airportCollections).find((collection) => collection.pagePath === path)
)

export const airportRankingKeys = [
  'mainRecommendation', 'cheap', 'noExpiry',
  'dedicatedClient', 'clash', 'chatgpt', 'streaming',
] as const satisfies readonly AirportCollectionKey[]
