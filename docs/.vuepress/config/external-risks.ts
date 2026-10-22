// External risk reports are excluded from recommendation collections.
// checkedAt is our source-review date, not a confirmed shutdown date.
export const externalRiskRecords = [
  {
    name: '蜜雪冰城',
    status: '疑似跑路（待核实）',
    risk: '搜索收录的翻翻墙条目含2026-10-17疑似跑路、官网无法访问预警；当前预览未稳定复现该更新，尚未独立确认停运。暂停新购与续费。',
    source: 'https://t.me/s/ffqchannel/15149?q=%23tuic',
    checkedAt: '2026-10-20',
    historicalDomain: 'kad520.uk',
  },
  {
    name: '滕王阁',
    status: '高风险（跑路待核实）',
    risk: '公开用户记录反映服务异常及售后响应问题，工具箱作者列入黑名单；尚未取得可追溯的停运公告或跑路确认。暂停新购与续费。',
    source: 'https://tools.adoyle.me/for-china.html',
    checkedAt: '2026-10-20',
    historicalDomain: 'twg520.com',
  },
  {
    name: '上帝世界',
    status: '高风险（跑路待核实）',
    risk: '翻翻墙2026-05-20更新转述用户反馈并建议不购买；现有公开记录不足以确认已经停运或跑路。暂停新购与续费，继续核实官方公告及售后。',
    source: 'https://t.me/s/ffqchannel?q=%23%E4%B8%8A%E5%B8%9D%E4%B8%96%E7%95%8C',
    checkedAt: '2026-10-20',
    historicalDomain: 'god-world.com',
  },
] as const
