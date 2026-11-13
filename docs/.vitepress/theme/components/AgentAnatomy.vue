<script setup lang="ts">
import { ref } from 'vue';

/**
 * 智能体构成的可交互解剖图
 *
 * 旧教材讲「传感器 / 执行器 / 环境 / 自主性」，这是 1990 年代机器人视角的隐喻。
 * 在数字环境里更准确的四件套是：Model / Tools / Context / Loop，
 * 四者加上权限与观测，合起来才叫 Harness。
 */

interface Part {
  key: string;
  name: string;
  en: string;
  icon: string;
  one: string;
  duty: string;
  change: string;
  vue: string;
}

const parts: Part[] = [
  {
    key: 'model',
    name: '模型',
    en: 'Model',
    icon: '🧠',
    one: '把「当前情况」变成「下一步做什么」',
    duty: '读上下文、理解目标、决定是继续调工具还是收尾回答。它只输出决策，不接触真实世界。',
    change:
      '2026 的模型分两档：直接回答的（System 1）和先产出思维链再回答的（System 2）。后者的 reasoning tokens 同样计费，也同样是上下文的一部分。',
    vue: '像 computed：输入（context）变了才重新求值。区别是它不保证幂等——同一个 prompt 两次结果可能不同。',
  },
  {
    key: 'tools',
    name: '工具',
    en: 'Tools',
    icon: '🔧',
    one: '模型触碰真实世界的唯一出口',
    duty: '每个工具是一段带 JSON Schema 的普通函数。模型不执行代码，它只产出「调用意图」，由你的运行时校验参数后执行。',
    change:
      '2026 的工具不再是硬编码在 prompt 里的字符串，而是 MCP 服务器声明的能力清单；页面自己也能通过 WebMCP 把前端函数暴露成工具。',
    vue: '像事件处理器：模型只负责 emit("call", payload)，真正干活和兜底是你的代码。',
  },
  {
    key: 'context',
    name: '上下文',
    en: 'Context',
    icon: '📚',
    one: '有预算的工作记忆，不是无限草稿纸',
    duty: '系统提示 + 用户输入 + 历史消息 + 工具返回值，全部拼进每次请求。窗口有限，越多无关信息，信号越被稀释。',
    change:
      '2026 的核心工程问题从「怎么写出好 prompt」变成「每一步该让模型看见什么」——上下文工程：写入、选取、压缩、隔离。',
    vue: '像 Pinia store：全局可读，但会越堆越大。区别是它每次都要整体传给模型，等于每次都付一次全量传输费。',
  },
  {
    key: 'loop',
    name: '循环',
    en: 'Loop',
    icon: '🔁',
    one: '决定「什么时候停」的控制流',
    duty: 'while 循环：请求模型 → 有工具调用就执行并回灌 → 没有就结束。必须有人为的停止条件（最大轮数/预算/超时）。',
    change:
      '2026 把它叫 harness：循环本身很简单，难的是外面那层——权限分级、沙箱、重试、死循环拦截、轨迹记录。',
    vue: '像 Vue 的调度器：不是「跑一次就完」，而是「状态变了再跑一轮」，直到没有副作用产生。',
  },
];

const active = ref<string>('model');
const current = ref<Part>(parts[0]);

function select(p: Part) {
  active.value = p.key;
  current.value = p;
}
</script>

<template>
  <div class="anatomy sh-no-print">
    <div class="anatomy__grid" role="tablist" aria-label="智能体的四个组成部分">
      <button
        v-for="p in parts"
        :key="p.key"
        type="button"
        role="tab"
        class="anatomy__card"
        :class="{ 'is-active': active === p.key }"
        :aria-selected="active === p.key"
        @click="select(p)"
      >
        <span class="anatomy__icon" aria-hidden="true">{{ p.icon }}</span>
        <span class="anatomy__name">{{ p.name }}</span>
        <span class="anatomy__en">{{ p.en }}</span>
        <span class="anatomy__one">{{ p.one }}</span>
      </button>
    </div>

    <div class="anatomy__detail" role="tabpanel" aria-live="polite">
      <div class="anatomy__detail-head">
        <span class="anatomy__badge">{{ current.icon }} {{ current.name }} · {{ current.en }}</span>
      </div>
      <dl>
        <dt>它负责什么</dt>
        <dd>{{ current.duty }}</dd>
        <dt>2026 年的变化</dt>
        <dd>{{ current.change }}</dd>
        <dt>前端类比</dt>
        <dd class="anatomy__vue">{{ current.vue }}</dd>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.anatomy {
  margin: 20px 0;
  padding: 14px;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-lg);
  background: var(--sh-surface-2);
}

.anatomy__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.anatomy__card {
  display: grid;
  gap: 2px;
  padding: 10px;
  text-align: left;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius);
  background: var(--sh-surface);
  cursor: pointer;
  transition: border-color 0.16s var(--sh-ease-out), background 0.16s var(--sh-ease-out);
}
.anatomy__card:hover {
  border-color: var(--vp-c-brand-2);
}
.anatomy__card.is-active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.anatomy__icon {
  font-size: 17px;
  line-height: 1.2;
}
.anatomy__name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}
.anatomy__en {
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}
.anatomy__one {
  margin-top: 4px;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--vp-c-text-2);
}

.anatomy__detail {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: var(--sh-radius);
  background: var(--sh-surface);
  border: 1px solid var(--sh-border);
}

.anatomy__badge {
  font-size: 12px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.anatomy__detail dl {
  margin: 8px 0 0;
}
.anatomy__detail dt {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
}
.anatomy__detail dd {
  margin: 2px 0 0;
  font-size: 13px;
  line-height: 1.68;
  color: var(--vp-c-text-1);
}
.anatomy__vue {
  color: var(--vp-c-text-2);
}

@media (max-width: 760px) {
  .anatomy__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
