import { fileURLToPath } from 'node:url'
import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'
import {
  generateAirportDataFiles,
  patchGeneratedHtml,
} from './config/generated'
import { extendSponsoredMarkdown } from './config/markdown'
import { extendPageWithSeo } from './config/page-seo'
import { defaultRobots, siteDescription, siteName } from './config/site'
import { theme } from './config/theme'

// Plume uses H2 for every feature card; keep H2 for homepage sections and H3 for cards.
const homeFeatureComponent = fileURLToPath(new URL('./theme/components/VPHomeFeature.vue', import.meta.url))
const blogHeadingComponent = fileURLToPath(new URL('./theme/components/VPBlogWithHeading.vue', import.meta.url))
const navBarTitleComponent = fileURLToPath(new URL('./theme/components/VPNavBarTitle.vue', import.meta.url))

export default defineUserConfig({
  lang: 'zh-CN',
  title: siteName,
  description: siteDescription,
  head: [
    ['meta', { name: 'google-site-verification', content: 'cqm96i-difY9qiLSeQqCh2VvjzY0qWPhs60TfdRyOX4' }],
    ['meta', { name: 'msvalidate.01', content: '7ec54bed5e684bee9e50ea059b0e5538' }],
    ['meta', { name: 'google', content: 'notranslate' }],
    ['meta', { httpEquiv: 'Content-Language', content: 'zh-CN' }],
    ['meta', { name: 'author', content: '织网' }],
    ['meta', { name: 'theme-color', content: '#141518' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    ['link', { rel: 'shortcut icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', href: '/logo.png' }],
  ],
  plugins: [
    {
      name: 'yinli-link-rel',
      extendsMarkdownOptions: (options: any) => {
        options.links ||= {}
        options.links.externalAttrs = {
          ...(options.links.externalAttrs || {}),
          target: '_blank',
          rel: 'nofollow noopener noreferrer',
        }
      },
    },
    {
      name: 'yinli-generated-html-cleanup',
      onGenerated: (app: any) => {
        patchGeneratedHtml(app)
        generateAirportDataFiles(app)
      },
    },
  ],
  extendsPage: extendPageWithSeo,
  extendsMarkdown: extendSponsoredMarkdown,
  shouldPrefetch: false,
  theme,
  bundler: viteBundler({
    viteOptions: {
      resolve: {
        alias: {
          '@theme/Home/VPHomeFeature.vue': homeFeatureComponent,
          '@theme/Blog/VPBlog.vue': blogHeadingComponent,
          '@theme/Nav/VPNavBarTitle.vue': navBarTitleComponent,
        },
      },
      build: {
        modulePreload: false,
      },
    }
  })
})
