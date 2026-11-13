<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * 反应性 vs 规划性 权衡曲线（可拖动）
 *
 * 对应原书 1.1.3 的「基于时间与反应性的分类」，也就是图 1.3 的那条曲线。
 * 原图是静态的，这里把「你在曲线上的哪个位置」变成可操作的变量。
 */

const budget = ref(30);

const W = 420;
const H = 220;
const PAD_X = 42;
const PAD_Y = 30;

/** 收益递减：q(t) = 100 * (1 - e^(-t/38))，用采样点画成平滑曲线 */
function qualityAt(t: number) {
  return 100 * (1 - Math.exp(-t / 38));
}

const points = computed(() => {
  const pts: string[] = [];
  for (let i = 0; i <= 100; i += 2) {
    const x = PAD_X + (i / 100) * (W - PAD_X * 2);
    const y = H - PAD_Y - (qualityAt(i) / 100) * (H - PAD_Y * 2);
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
});

const dot = computed(() => {
  const x = PAD_X + (budget.value / 100) * (W - PAD_X * 2);
  const y = H - PAD_Y - (qualityAt(budget.value) / 100) * (H - PAD_Y * 2);
  return { x, y };
});

const zone = computed(() => {
  if (budget.value < 33) return 'reactive';
  if (budget.value < 67) return 'hybrid';
  return 'deliberate';
});

const zoneInfo = computed(() => {
  if (zone.value === 'reactive') {
    return {
      title: '反应式（Reactive）',
      latency: '毫秒级',
      desc: '感知到就直接映射成动作，不做未来推演。',
      cases: '安全气囊触发、风控规则拦截、缓存命中、输入法联想',
      cost: '快、便宜；但短视，遇到多步依赖就容易翻车。',
    };
  }
  if (zone.value === 'hybrid') {
    return {
      title: '混合式（Hybrid）',
      latency: '秒级',
      desc: '大方向先规划，小步执行时立即响应环境反馈。',
      cases: 'LLM Agent 的 Agent Loop、自动驾驶分层决策、CI 失败自动修复',
      cost: '这是 2026 年绝大多数 Agent 的真实形态：把长任务切成「规划—反应」微循环。',
    };
  }
  return {
    title: '规划式（Deliberative）',
    latency: '秒到分钟级',
    desc: '行动前先搜索未来可能性，评估多条路径再落子。',
    cases: '旅行行程规划、推理模型的长思维链、代码重构方案设计、深度研究',
    cost: '想得深；代价是慢和贵，环境快速变化时最优时机可能已经过去。',
  };
});

function preset(v: number) {
  budget.value = v;
}
</script>

<template>
  <div class="trade sh-no-print">
    <div class="trade__chart">
      <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="决策时间与决策质量的权衡曲线">
        <!-- 分区底色 -->
        <rect :x="PAD_X" :y="PAD_Y" :width="(W - PAD_X * 2) * 0.33" :height="H - PAD_Y * 2" class="trade__zone" />
        <rect
          :x="PAD_X + (W - PAD_X * 2) * 0.67"
          :y="PAD_Y"
          :width="(W - PAD_X * 2) * 0.33"
          :height="H - PAD_Y * 2"
          class="trade__zone trade__zone--alt"
        />

        <!-- 轴 -->
        <line :x1="PAD_X" :y1="H - PAD_Y" :x2="W - PAD_X + 6" :y2="H - PAD_Y" class="trade__axis" />
        <line :x1="PAD_X" :y1="PAD_Y - 6" :x2="PAD_X" :y2="H - PAD_Y" class="trade__axis" />

        <!-- 轴标签 -->
        <text :x="4" :y="14" class="trade__axis-label">决策质量 ↑</text>
        <text :x="W / 2" :y="H - 8" text-anchor="middle" class="trade__axis-label">决策耗时 →</text>

        <!-- 分区名 -->
        <text :x="PAD_X + (W - PAD_X * 2) * 0.165" :y="PAD_Y + 12" text-anchor="middle" class="trade__zone-label">反应式</text>
        <text :x="W / 2" :y="PAD_Y + 12" text-anchor="middle" class="trade__zone-label">混合式</text>
        <text :x="PAD_X + (W - PAD_X * 2) * 0.835" :y="PAD_Y + 12" text-anchor="middle" class="trade__zone-label">规划式</text>

        <path :d="points" class="trade__curve" />

        <!-- 当前点 -->
        <line :x1="dot.x" :y1="dot.y" :x2="dot.x" :y2="H - PAD_Y" class="trade__drop" />
        <circle :cx="dot.x" :cy="dot.y" r="6" class="trade__dot" />
        <circle :cx="dot.x" :cy="dot.y" r="11" class="trade__dot-halo" />
      </svg>
    </div>

    <div class="trade__panel">
      <label class="trade__label" for="trade-slider">
        允许的思考预算：<strong>{{ budget }}%</strong>
      </label>
      <input
        id="trade-slider"
        v-model.number="budget"
        type="range"
        min="0"
        max="100"
        step="1"
        class="trade__slider"
        aria-describedby="trade-desc"
      />

      <div class="trade__presets" role="group" aria-label="常见取值">
        <button type="button" :class="{ 'is-active': zone === 'reactive' }" @click="preset(12)">毫秒级反应</button>
        <button type="button" :class="{ 'is-active': zone === 'hybrid' }" @click="preset(50)">Agent 循环</button>
        <button type="button" :class="{ 'is-active': zone === 'deliberate' }" @click="preset(88)">深度规划</button>
      </div>

      <div id="trade-desc" class="trade__info">
        <h4>{{ zoneInfo.title }}</h4>
        <p class="trade__latency">典型延迟：{{ zoneInfo.latency }}</p>
        <p>{{ zoneInfo.desc }}</p>
        <p class="trade__cases"><strong>典型场景：</strong>{{ zoneInfo.cases }}</p>
        <p class="trade__cost">{{ zoneInfo.cost }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trade {
  margin: 20px 0;
  padding: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 14px;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-lg);
  background: var(--sh-surface-2);
}

.trade__chart svg {
  width: 100%;
  height: auto;
  display: block;
}

.trade__axis {
  stroke: var(--sh-border-strong);
  stroke-width: 1;
}
.trade__axis-label {
  fill: var(--vp-c-text-3);
  font-size: 10px;
}
.trade__zone-label {
  fill: var(--vp-c-text-3);
  font-size: 10px;
  letter-spacing: 0.04em;
}
.trade__zone {
  fill: var(--vp-c-default-soft);
  opacity: 0.5;
}
.trade__zone--alt {
  fill: var(--vp-c-brand-soft);
}
.trade__curve {
  fill: none;
  stroke: var(--vp-c-brand-1);
  stroke-width: 2.2;
  stroke-linecap: round;
}
.trade__drop {
  stroke: var(--vp-c-text-3);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}
.trade__dot {
  fill: var(--sh-surface);
  stroke: var(--vp-c-brand-1);
  stroke-width: 2.5;
}
.trade__dot-halo {
  fill: var(--vp-c-brand-soft);
  opacity: 0.6;
}

.trade__panel {
  display: grid;
  gap: 8px;
  align-content: start;
}

.trade__label {
  font-size: 12.5px;
  color: var(--vp-c-text-2);
}
.trade__label strong {
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
}

.trade__slider {
  width: 100%;
  accent-color: var(--vp-c-brand-1);
  cursor: pointer;
}

.trade__presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.trade__presets button {
  font-size: 11.5px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--sh-border);
  background: var(--sh-surface);
  color: var(--vp-c-text-2);
  cursor: pointer;
  white-space: nowrap;
}
.trade__presets button.is-active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.trade__info {
  padding: 10px 12px;
  border-radius: var(--sh-radius);
  background: var(--sh-surface);
  border: 1px solid var(--sh-border);
}
.trade__info h4 {
  margin: 0 0 2px;
  font-size: 13.5px;
  color: var(--vp-c-text-1);
}
.trade__info p {
  margin: 4px 0 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
.trade__latency {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}
.trade__cases strong {
  color: var(--vp-c-text-1);
}
.trade__cost {
  border-top: 1px dashed var(--sh-border);
  padding-top: 6px;
}

@media (max-width: 760px) {
  .trade {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
