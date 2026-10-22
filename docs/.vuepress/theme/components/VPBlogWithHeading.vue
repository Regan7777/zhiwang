<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useRoute } from 'vuepress/client'
import VPBlog from 'vuepress-theme-plume/components/Blog/VPBlog.vue'

defineOptions({ inheritAttrs: false })
const route = useRoute()
const slots = useSlots()
const forwardedSlots = Object.keys(slots).filter((name) => name !== 'blog-top')
const headings: Record<string, string> = {
  '/blog/': '博客文章',
  '/blog/archives/': '文章归档',
  '/blog/categories/': '文章分类',
  '/blog/tags/': '文章标签',
}
const heading = computed(() => headings[route.path])
</script>

<template>
  <VPBlog v-bind="$attrs">
    <template #blog-top>
      <h1 v-if="heading" class="visually-hidden">{{ heading }}</h1>
      <slot name="blog-top" />
    </template>
    <template v-for="name in forwardedSlots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </VPBlog>
</template>
