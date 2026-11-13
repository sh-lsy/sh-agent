<script setup lang="ts">
import { ref } from 'vue';

/**
 * 2026 年智能体协议栈
 *
 * 一个常见误解是把 MCP 当成"智能体的全部协议"。
 * 实际上 2026 年的协议已经分层：纵向接工具、横向连同行、单独一层管交易授权、还有一层管可观测。
 */

interface Layer {
  key: string;
  dir: string;
  name: string;
  en: string;
  protos: string;
  status: string;
  detail: string;
  owner: string;
}

const layers: Layer[] = [
  {
    key: 'tools',
    dir: '纵向',
    name: '工具与数据接入',
    en: 'Agent → Tools',
    protos: 'MCP · WebMCP',
    status: '事实标准',
    detail:
      'MCP 让任何 Agent 用统一方式发现并调用外部工具（JSON-RPC 2.0）。2026-07-28 版把核心改成无状态：去掉了会话与 initialize 握手，新增异步 Tasks、Skills over MCP、Server Cards 等扩展。WebMCP 是它在浏览器里的对应物——网页用 document.modelContext 把自己的前端函数注册成工具。',
    owner: 'MCP：Anthropic 发起，2025-12 捐入 Linux Foundation 的 Agentic AI Foundation（AAIF）',
  },
  {
    key: 'agents',
    dir: '横向',
    name: '智能体之间',
    en: 'Agent to Agent',
    protos: 'A2A',
    status: 'v1.0.1 稳定',
    detail:
      '解决"甲 Agent 怎么找到乙 Agent、把子任务委派过去、再拿回结果"。靠 Agent Card（/.well-known/agent-card.json）声明能力。IBM 的 ACP 已于 2025-08 并入 A2A，跨厂商的横向协议基本收敛为这一个。',
    owner: 'Google 发起，2026-08 进入 AAIF；2026-04 时已有 150+ 组织参与',
  },
  {
    key: 'commerce',
    dir: '交易',
    name: '支付与授权',
    en: 'Agent → Payment',
    protos: 'UCP · ACP · AP2',
    status: '早期',
    detail:
      '让 Agent 不只是"建议下单"，而是能真正完成交易。AP2 由 Google 捐给 FIDO 联盟，用签名凭证表达"谁授权、限额多少、何时失效"。这层目前变化最快，做业务集成前建议只做预留、不做深度绑定。',
    owner: 'UCP：Google + Shopify 等；ACP：Stripe + OpenAI；AP2：FIDO Alliance',
  },
  {
    key: 'obs',
    dir: '观测',
    name: '可观测与声明',
    en: 'Trace & Declare',
    protos: 'OTel GenAI · AGENTS.md · llms.txt',
    status: '演进中',
    detail:
      'Agent 的轨迹（每轮 prompt、工具调用、耗时、token）需要能被追踪，OpenTelemetry 的 GenAI 语义约定目前仍标记为 Development。AGENTS.md / llms.txt 则是给 Agent 读的站点说明书，属于"让 Agent 认识你"的最低成本手段。',
    owner: 'OpenTelemetry（CNCF）；AGENTS.md 为社区约定',
  },
];

const active = ref('tools');
const current = ref<Layer>(layers[0]);

function pick(l: Layer) {
  active.value = l.key;
  current.value = l;
}
</script>

<template>
  <div class="stack sh-no-print">
    <div class="stack__list" role="tablist" aria-label="智能体协议栈">
      <button
        v-for="l in layers"
        :key="l.key"
        type="button"
        role="tab"
        class="stack__layer"
        :class="{ 'is-active': active === l.key }"
        :aria-selected="active === l.key"
        @click="pick(l)"
      >
        <span class="stack__dir">{{ l.dir }}</span>
        <span class="stack__main">
          <span class="stack__name">{{ l.name }}</span>
          <span class="stack__en">{{ l.en }}</span>
        </span>
        <span class="stack__protos">{{ l.protos }}</span>
        <span class="stack__status" :data-state="l.status">{{ l.status }}</span>
      </button>
    </div>

    <div class="stack__detail" role="tabpanel" aria-live="polite">
      <p class="stack__desc">{{ current.detail }}</p>
      <p class="stack__owner">{{ current.owner }}</p>
    </div>
  </div>
</template>

<style scoped>
.stack {
  margin: 20px 0;
  padding: 14px;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-lg);
  background: var(--sh-surface-2);
}

.stack__list {
  display: grid;
  gap: 6px;
}

.stack__layer {
  display: grid;
  grid-template-columns: 40px minmax(0, 1.4fr) minmax(0, 1.2fr) auto;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  text-align: left;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius);
  background: var(--sh-surface);
  cursor: pointer;
  transition: border-color 0.16s var(--sh-ease-out), background 0.16s var(--sh-ease-out);
}
.stack__layer:hover {
  border-color: var(--vp-c-brand-2);
}
.stack__layer.is-active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.stack__dir {
  font-size: 10.5px;
  font-weight: 700;
  text-align: center;
  padding: 2px 0;
  border-radius: 4px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}

.stack__main {
  display: grid;
  gap: 1px;
  min-width: 0;
}
.stack__name {
  font-size: 13px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}
.stack__en {
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
}

.stack__protos {
  font-size: 12px;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  word-break: break-word;
}

.stack__status {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
  white-space: nowrap;
  color: var(--sh-observe);
  background: var(--sh-observe-bg);
}
.stack__status[data-state='早期'],
.stack__status[data-state='演进中'] {
  color: var(--sh-final);
  background: var(--sh-final-bg);
}

.stack__detail {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: var(--sh-radius);
  background: var(--sh-surface);
  border: 1px solid var(--sh-border);
}
.stack__desc {
  margin: 0;
  font-size: 12.8px;
  line-height: 1.7;
  color: var(--vp-c-text-1);
}
.stack__owner {
  margin: 6px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--vp-c-text-3);
}

@media (max-width: 640px) {
  .stack__layer {
    grid-template-columns: 36px minmax(0, 1fr) auto;
  }
  .stack__protos {
    grid-column: 2 / -1;
    font-size: 11px;
  }
}
</style>
