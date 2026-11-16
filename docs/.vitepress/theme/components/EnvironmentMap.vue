<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * 环境六性质 → 架构要求
 *
 * 原书给了四条（可观察性/随机性/多主体/序贯），2026 年要补两条
 * （上下文即环境、工具返回值不可信）。这里把"性质"和"你必须做的设计"
 * 直接连起来，避免读者背完概念却不知道要改什么。
 */

interface Prop {
  key: string;
  svg: string;
  name: string;
  short: string;
  must: string;
  cost: string;
  year?: '2026';
}

const props: Prop[] = [
  {
    key: 'partial',
    svg: '<circle cx="12" cy="12" r="8" stroke-dasharray="3 3"/>',
    name: '部分可观察',
    short: '模型永远看不到全貌，只能看到你给它的那一段。',
    must: '要记忆（历史）+ 探索（换个参数再查）',
    cost: '不加记忆 → 同一件事反复查，白烧 token',
  },
  {
    key: 'random',
    svg: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none"/>',
    name: '带随机性',
    short: '同一个接口两次返回不同，同一个 prompt 两次结果也不同。',
    must: '超时、重试、幂等、结果校验',
    cost: '不设重试 → 一次抖动整个任务白跑',
  },
  {
    key: 'multi',
    svg: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/>',
    name: '多主体共存',
    short: '环境里还有别的用户、脚本、自动调价系统在同时改变状态。',
    must: '冲突检测 + 最小权限（不是所有操作都该被允许）',
    cost: '把"别人会改状态"当成不会发生 → 线上数据被覆盖',
  },
  {
    key: 'sequential',
    svg: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
    name: '序贯且动态',
    short: '上一步动作影响下一步状态；你思考时环境还在变。',
    must: '循环 + 中断 + 重新规划',
    cost: '只跑一次就输出 → 拿旧状态做决定',
  },
  {
    key: 'context',
    svg: '<path d="M12 3l8 4.5-8 4.5-8-4.5z"/><path d="M4 12l8 4.5 8-4.5"/><path d="M4 16.5L12 21l8-4.5"/>',
    name: '上下文即环境',
    short: '模型能"看见"什么，完全由你塞进窗口的内容决定；窗口满了早期信息就被挤掉。',
    must: '上下文预算、摘要、任务状态对象',
    cost: '无限堆历史 → 关键信息被稀释、成本翻倍',
    year: '2026',
  },
  {
    key: 'untrusted',
    svg: '<path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z"/><path d="M12 9v4"/><circle cx="12" cy="16" r="0.9" fill="currentColor" stroke="none"/>',
    name: '返回值不可信',
    short: '工具返回的网页/邮件/Issue 里可能藏着指令，模型分不清"数据"和"命令"。',
    must: '把工具输出当数据处理 + 危险操作人工确认',
    cost: '直接把网页内容塞进上下文 → prompt injection',
    year: '2026',
  },
];

const active = ref('partial');
const current = computed(() => props.find((p) => p.key === active.value) || props[0]);
const show2026 = ref(true);

const shown = computed(() => (show2026.value ? props : props.filter((p) => !p.year)));
</script>

<template>
  <div class="em sh-no-print">
    <div class="em__head">
      <div class="em__title">环境的 6 个性质：每一个都对应一个必须做的设计</div>
      <label class="em__toggle">
        <input v-model="show2026" type="checkbox" />
        <span>包含 2026 新增的 2 条</span>
      </label>
    </div>

    <div class="em__grid">
      <button
        v-for="p in shown"
        :key="p.key"
        type="button"
        class="em__card"
        :class="{ 'is-active': active === p.key }"
        @click="active = p.key"
      >
        <svg class="em__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="p.svg"></svg>
        <span class="em__name">
          {{ p.name }}
          <em v-if="p.year" class="em__tag">2026</em>
        </span>
        <span class="em__must">{{ p.must }}</span>
      </button>
    </div>

    <div class="em__detail" aria-live="polite">
      <p class="em__short"><strong>{{ current.name }}</strong>：{{ current.short }}</p>
      <div class="em__rows">
        <div class="em__row">
          <span class="em__k">所以要</span>
          <span class="em__v">{{ current.must }}</span>
        </div>
        <div class="em__row em__row--warn">
          <span class="em__k">不做会</span>
          <span class="em__v">{{ current.cost }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.em {
  margin: 20px 0;
  padding: 14px;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-lg);
  background: var(--sh-surface-2);
}

.em__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.em__title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}
.em__toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.em__toggle input {
  accent-color: var(--vp-c-brand-1);
}

.em__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.em__card {
  display: grid;
  gap: 3px;
  padding: 9px 10px;
  text-align: left;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius);
  background: var(--sh-surface);
  cursor: pointer;
  transition: border-color 0.16s var(--sh-ease-out), background 0.16s var(--sh-ease-out);
}
.em__card:hover {
  border-color: var(--vp-c-brand-2);
}
.em__card.is-active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.em__icon {
  width: 15px;
  height: 15px;
  color: var(--vp-c-brand-1);
}
.em__name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  display: flex;
  align-items: center;
  gap: 4px;
}
.em__tag {
  font-style: normal;
  font-size: 9.5px;
  font-weight: 600;
  padding: 0 4px;
  border-radius: 3px;
  color: var(--sh-final);
  background: var(--sh-final-bg);
}
.em__must {
  font-size: 11px;
  line-height: 1.45;
  color: var(--vp-c-text-2);
}

.em__detail {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: var(--sh-radius);
  border: 1px solid var(--sh-border);
  background: var(--sh-surface);
}
.em__short {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--vp-c-text-1);
}
.em__rows {
  margin-top: 8px;
  display: grid;
  gap: 5px;
}
.em__row {
  display: flex;
  gap: 8px;
  font-size: 12px;
  line-height: 1.55;
}
.em__k {
  flex: none;
  width: 42px;
  color: var(--vp-c-text-3);
}
.em__v {
  color: var(--vp-c-text-2);
}
.em__row--warn .em__v {
  color: var(--sh-danger);
}

@media (max-width: 760px) {
  .em__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 420px) {
  .em__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
