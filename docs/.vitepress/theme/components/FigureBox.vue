<script setup lang="ts">
/**
 * 配图容器
 *
 * 原书配图是浅底色稿，直接铺在暗色页面里会刺眼；但反色会让折线/箭头语义错乱。
 * 所以这里用「白底图片卡」承载，图注放在卡片外面，并标注来源。
 */
withDefaults(
  defineProps<{
    src: string;
    alt: string;
    caption?: string;
    source?: string;
    /** 宽表类图片：允许卡片内部横向滚动 */
    scroll?: boolean;
    maxWidth?: string;
  }>(),
  { caption: '', source: '', scroll: false, maxWidth: '100%' }
);
</script>

<template>
  <figure class="sh-figure">
    <div class="sh-figure__card" :class="{ 'sh-figure__card--scroll': scroll }" :style="{ maxWidth }">
      <img :src="src" :alt="alt" loading="lazy" decoding="async" />
    </div>
    <figcaption v-if="caption || source" class="sh-figure__caption">
      <span v-if="caption" v-html="caption"></span>
      <span v-if="source" class="sh-figure__source">来源：{{ source }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.sh-figure__source {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

@media (max-width: 640px) {
  .sh-figure__card--scroll img {
    min-width: 560px;
  }
}
</style>
