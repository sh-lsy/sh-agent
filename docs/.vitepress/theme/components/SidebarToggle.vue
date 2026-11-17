<script setup lang="ts">
import { onMounted, ref } from 'vue';

/**
 * 侧栏整体折叠开关（≥960px 才有意义，小屏由 CSS 隐藏）。
 * 状态放在 <html> 的 class 上：布局 CSS 全部以 html.sh-collapsed 为作用域，
 * 并写 localStorage，由 config.mts 的 head 内联脚本在首绘前恢复，避免闪烁。
 */
const collapsed = ref(false);

function apply(v: boolean) {
  collapsed.value = v;
  document.documentElement.classList.toggle('sh-collapsed', v);
  try {
    localStorage.setItem('sh-sidebar-collapsed', v ? '1' : '0');
  } catch {
    // 隐私模式等场景下忽略持久化失败
  }
}

function toggle() {
  apply(!collapsed.value);
}

onMounted(() => {
  collapsed.value = document.documentElement.classList.contains('sh-collapsed');
});
</script>

<template>
  <button
    type="button"
    class="sh-sidebar-toggle sh-focusable"
    :aria-expanded="!collapsed"
    :aria-label="collapsed ? '展开侧栏' : '折叠侧栏'"
    :title="collapsed ? '展开侧栏' : '折叠侧栏'"
    @click="toggle"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" />
      <line x1="9.5" y1="4" x2="9.5" y2="20" stroke="currentColor" stroke-width="1.6" />
      <path v-if="!collapsed" d="M6.8 9.5 5 12l1.8 2.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
      <path v-else d="M5.4 9.5 7.2 12l-1.8 2.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
</template>

<style scoped>
.sh-sidebar-toggle {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  margin-right: 4px;
  border: none;
  border-radius: var(--sh-radius-sm);
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: color 0.15s var(--sh-ease-out), background 0.15s var(--sh-ease-out);
}
.sh-sidebar-toggle:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-default-soft);
}
.sh-sidebar-toggle svg {
  width: 17px;
  height: 17px;
  display: block;
}
@media (max-width: 959px) {
  .sh-sidebar-toggle {
    display: none;
  }
}
</style>
