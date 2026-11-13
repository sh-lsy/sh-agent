<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * 上下文预算条
 *
 * 想让人"看见"两件事：
 * 1. 每多跑一轮，历史都会叠加在同一个窗口里；
 * 2. 窗口满了不会报错，只会悄悄挤掉最早的内容（context rot）。
 */

const BUDGET = 8000; // 示意用的窗口大小
const FIXED = 160 + 200 + 30; // 系统提示 + 工具 schema + 用户问题

const rounds = ref(6);
const trimmed = ref(false);

const history = computed(() => rounds.value * 620);

const segments = computed(() => {
  if (!trimmed.value) {
    const total = FIXED + history.value;
    return {
      overflow: total > BUDGET,
      items: [
        { key: 'fixed', label: '系统提示 + 工具 + 问题', tokens: FIXED },
        { key: 'history', label: `${rounds.value} 轮历史（工具结果也在里面）`, tokens: history.value },
      ],
      total,
    };
  }
  // 裁剪后：只留最近 3 轮 + 一份任务状态摘要
  const kept = Math.min(rounds.value, 3) * 620;
  const summary = 150;
  return {
    overflow: false,
    items: [
      { key: 'fixed', label: '系统提示 + 工具 + 问题', tokens: FIXED },
      { key: 'summary', label: '任务状态摘要（目标/进度/约束）', tokens: summary },
      { key: 'history', label: `最近 ${Math.min(rounds.value, 3)} 轮`, tokens: kept },
    ],
    total: FIXED + summary + kept,
  };
});

const pct = (t: number) => Math.min(100, (t / BUDGET) * 100);
</script>

<template>
  <div class="cb sh-no-print">
    <div class="cb__head">
      <div class="cb__title">上下文窗口（示意 {{ BUDGET.toLocaleString() }} tokens）</div>
      <label class="cb__toggle">
        <input v-model="trimmed" type="checkbox" />
        <span>开启裁剪</span>
      </label>
    </div>

    <div class="cb__bar" role="img" :aria-label="`已占用 ${segments.total} tokens`">
      <div
        v-for="s in segments.items"
        :key="s.key"
        class="cb__seg"
        :class="`cb__seg--${s.key}`"
        :style="{ width: pct(s.tokens) + '%' }"
        :title="`${s.label}：${s.tokens} tokens`"
      ></div>
      <div v-if="segments.overflow" class="cb__seg cb__seg--over" :style="{ width: pct(segments.total - BUDGET) + '%' }"></div>
    </div>

    <div class="cb__legend">
      <span v-for="s in segments.items" :key="s.key">
        <i :class="`cb__dot cb__dot--${s.key}`"></i>{{ s.label }} · {{ s.tokens }} tokens
      </span>
    </div>

    <div class="cb__control">
      <label for="cb-rounds">任务已经跑了 <strong>{{ rounds }}</strong> 轮</label>
      <input id="cb-rounds" v-model.number="rounds" type="range" min="1" max="12" step="1" class="cb__range" />
    </div>

    <p v-if="segments.overflow" class="cb__warn">
      ⚠️ 超出窗口 {{ (segments.total - BUDGET).toLocaleString() }} tokens。
      <strong>它不会报错</strong>，只会把最早的内容悄悄挤出去——任务跑到一半"忘了"开头说了什么，就是这个原因。
    </p>
    <p v-else-if="trimmed" class="cb__ok">
      ✅ 用"任务状态摘要 + 最近 3 轮"替代全量历史，同样的任务只占 {{ segments.total }} tokens，而且不会丢关键约束。
    </p>
    <p v-else class="cb__note">
      还剩 {{ (BUDGET - segments.total).toLocaleString() }} tokens。注意这是<strong>每一轮都要重新发一次</strong>的量，不是只发一次。
    </p>
  </div>
</template>

<style scoped>
.cb {
  margin: 20px 0;
  padding: 14px;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-lg);
  background: var(--sh-surface-2);
}

.cb__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.cb__title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}
.cb__toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.cb__toggle input {
  accent-color: var(--vp-c-brand-1);
}

.cb__bar {
  display: flex;
  height: 26px;
  margin-top: 10px;
  border-radius: var(--sh-radius-sm);
  background: var(--vp-c-default-soft);
  overflow: hidden;
  border: 1px solid var(--sh-border);
}

.cb__seg {
  height: 100%;
  transition: width 0.3s var(--sh-ease-out);
}
.cb__seg--fixed {
  background: var(--vp-c-text-3);
  opacity: 0.55;
}
.cb__seg--history {
  background: var(--vp-c-brand-1);
  opacity: 0.75;
}
.cb__seg--summary {
  background: var(--sh-observe);
  opacity: 0.7;
}
.cb__seg--over {
  background: var(--sh-danger);
}

.cb__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--vp-c-text-3);
}
.cb__legend span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.cb__dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
}
.cb__dot--fixed {
  background: var(--vp-c-text-3);
}
.cb__dot--history {
  background: var(--vp-c-brand-1);
}
.cb__dot--summary {
  background: var(--sh-observe);
}

.cb__control {
  margin-top: 12px;
  display: grid;
  gap: 4px;
}
.cb__control label {
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.cb__control strong {
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
}
.cb__range {
  width: 100%;
  accent-color: var(--vp-c-brand-1);
  cursor: pointer;
}

.cb__warn,
.cb__ok,
.cb__note {
  margin: 10px 0 0;
  padding: 8px 10px;
  border-radius: var(--sh-radius-sm);
  font-size: 12px;
  line-height: 1.65;
}
.cb__warn {
  color: var(--sh-danger);
  background: rgba(190, 18, 60, 0.08);
  border-left: 3px solid var(--sh-danger);
}
.cb__ok {
  color: var(--sh-observe);
  background: var(--sh-observe-bg);
  border-left: 3px solid var(--sh-observe);
}
.cb__note {
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
  border-left: 3px solid var(--sh-border-strong);
}
</style>
