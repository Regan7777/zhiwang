import { plumeTheme } from 'vuepress-theme-plume'
import { normalizeDate } from './page-seo'
import { hostname } from './site'

export const theme = plumeTheme({
  cache: 'memory',
  hostname,
  logo: '/logo.svg',
  // Our maintained dates are calendar days; do not imply an exact edit time.
  lastUpdated: { formatOptions: { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC', forceLocale: true } },
  footer: { message: "织网 © 2026 版权所有" },
  navbar: [
    { text: '首页', link: '/', icon: 'material-symbols:home-rounded' },
    { text: '机场推荐', link: '/posts/jichang-tuijian/', icon: 'material-symbols:flight-takeoff' },
    {
      text: '场景筛选',
      icon: 'material-symbols:leaderboard',
      items: [
        { text: '低价机场', link: '/rankings/cheap/', icon: 'material-symbols:sell-outline' },
        { text: '不限时套餐', link: '/rankings/no-expiry/', icon: 'material-symbols:all-inclusive' },
        { text: 'Clash机场', link: '/rankings/clash/', icon: 'material-symbols:hive-outline' },
        { text: 'ChatGPT机场', link: '/rankings/chatgpt/', icon: 'material-symbols:smart-toy-outline' },
        { text: '流媒体资料', link: '/rankings/streaming/', icon: 'material-symbols:live-tv-outline' },
      ],
    },
    {
      text: '科学上网教程',
      icon: 'ic:baseline-construction',
      items: [
        { text: '机场工具与下载', link: '/posts/airport-tools/', icon: 'material-symbols:devices-outline' },
        { text: '科学上网入门', link: '/posts/vpn-guide-2026/', icon: 'material-symbols:school-outline' },
        { text: 'Clash Mi教程', link: '/posts/clash-mi-guide-2026/', icon: 'material-symbols:phone-iphone' },
        { text: 'Hiddify教程', link: '/posts/hiddify-guide-2026/', icon: 'material-symbols:hub-outline' },
        { text: 'Clash Verge教程', link: '/posts/clash-verge-guide-2026/', icon: 'ic:baseline-personal-video' },
        { text: 'FlClash教程', link: '/posts/flclash-guide-2026/', icon: 'material-symbols:devices-outline' },
        { text: 'Clash Meta 安卓教程', link: '/posts/clash-for-android-guide-2026/', icon: 'ic:baseline-android' },
        { text: 'Shadowrocket教程', link: '/posts/shadowrocket-guide-2026/', icon: 'ic:baseline-rocket-launch' },
        { text: 'ChatGPT打不开', link: '/posts/ai-tools-not-working/', icon: 'material-symbols:smart-toy-outline' },
        { text: 'Telegram教程', link: '/posts/telegram-guide-2026/', icon: 'material-symbols:send-outline' },
      ],
    },
    {
      text: '站点信息',
      icon: 'material-symbols:info-outline',
      items: [
        { text: '风险监测', link: '/risk-monitor/', icon: 'material-symbols:warning-outline' },
        { text: '推荐方法与数据来源', link: '/methodology/', icon: 'material-symbols:science-outline' },
        { text: '关于本站', link: '/about/', icon: 'material-symbols:info-outline' },
      ],
    },
  ],
  profile: {
    name: '织网',
    description: '织网 专注机场推荐、套餐与客户端资料、风险提示和科学上网教程。',
  },
  social: [
    { icon: 'github', link: 'https://github.com/Regan7777' },
    {
      icon: {
        name: 'telegram',
        svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/></svg>',
      },
      link: 'https://t.me/wanfengzn7',
      ariaLabel: 'Telegram',
    },
  ],
  navbarSocialInclude: ['github', 'telegram'],
  markdown: {
    collapse: true,
    imageSize: 'local',
  },
  blog: {
    tags: true,
    categories: true,
    archives: true,
    tagsLink: '/blog/tags/',
    categoriesLink: '/blog/categories/',
    archivesLink: '/blog/archives/',
    postCover: 'right',
  },
  plugins: {
    sitemap: {
      excludePaths: [
        '/404.html',
        '/blog/',
        '/blog/tags/',
        '/blog/categories/',
        '/blog/archives/',
      ],
      modifyTimeGetter: (page: any) => {
        const explicitDate = normalizeDate(page.frontmatter.dateModified || page.frontmatter.updateTime || page.frontmatter.lastUpdated || page.frontmatter.createTime || page.frontmatter.date)
        if (explicitDate) return explicitDate

        return page.data.git?.updatedTime ? new Date(page.data.git.updatedTime).toISOString() : ''
      },
    },
    seo: false,
  },
})
