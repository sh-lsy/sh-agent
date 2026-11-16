<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * 一次工具调用的时序图
 *
 * 4 个角色、9 次来回。很多教程只讲"模型调用工具"，但真实链路里
 * 工具是运行时执行的、结果要回灌、页面要同步看到——这三件事经常被跳过。
 */

type Kind = 'req' | 'model' | 'tool' | 'res' | 'sse';

interface Step {
  from: number;
  to: number;
  label: string;
  note: string;
  kind: Kind;
}

const LANES = ['浏览器', '本地运行时', '大模型', '工具'];
const X = [64, 226, 396, 552];

const steps: Step[] = [
  {
    from: 0, to: 1, kind: 'req',
    label: 'POST /api/agent/run',
    note: '你点「运行 Agent」，浏览器把问题发给本地运行时。注意：这一步模型还不知道任何事。',
  },
  {
    from: 1, to: 2, kind: 'model',
    label: 'messages + tools',
    note: '运行时把「对话记录 + 工具菜单」一起发给模型。模型只能看到这里面的内容。',
  },
  {
    from: 2, to: 1, kind: 'model',
    label: 'tool_calls: get_weather',
    note: '模型决定点单。它只返回「要调哪个工具、参数是什么」，自己并不会执行。',
  },
  {
    from: 1, to: 3, kind: 'tool',
    label: 'execute(参数已校验)',
    note: '真正干活的是运行时：先用 Zod 校验参数，再调用工具函数。参数不合格会被退回。',
  },
  {
    from: 3, to: 1, kind: 'res',
    label: '局部多云 17.7℃',
    note: '工具把结果交回运行时。如果这里报错，错误文本也会被原样保留下来。',
  },
  {
    from: 1, to: 0, kind: 'sse',
    label: 'SSE: tool_call / tool_result',
    note: '运行时顺手把这两步推给页面，你才能在实验台里看见「行动」和「观察」。',
  },
  {
    from: 1, to: 2, kind: 'model',
    label: 'messages + 工具结果',
    note: '关键一步：把工具结果写进对话记录，再问模型一次。模型没有记忆，必须重新递交。',
  },
  {
    from: 2, to: 1, kind: 'model',
    label: 'final_answer',
    note: '这次模型不再点单，说明信息够了，直接给答案——循环在这里结束。',
  },
  {
    from: 1, to: 0, kind: 'sse',
    label: 'SSE: final_answer',
    note: '最后一条 SSE 推给页面，前端渲染成你能读的答案。整个过程结束。',
  },
];

const active = ref(0);
const current = computed(() => steps[active.value]);
const playing = ref(false);

let timer: ReturnType<typeof setTimeout> | null = null;

function stop() {
  playing.value = false;
  if (timer) clearTimeout(timer);
}

function play() {
  if (playing.value) {
    stop();
    return;
  }
  if (active.value >= steps.length - 1) active.value = 0;
  playing.value = true;
  const tick = () => {
    if (!playing.value) return;
    if (active.value >= steps.length - 1) {
      playing.value = false;
      return;
    }
    active.value += 1;
    timer = setTimeout(tick, 1500);
  };
  timer = setTimeout(tick, 800);
}

function next() {
  stop();
  if (active.value < steps.length - 1) active.value += 1;
}
function prev() {
  stop();
  if (active.value > 0) active.value -= 1;
}
function reset() {
  stop();
  active.value = 0;
}

const H = 70 + steps.length * 40;
const laneY = 46;

const color = (k: Kind) =>
  ({
    req: 'var(--vp-c-brand-1)',
    model: 'var(--sh-thought)',
    tool: 'var(--sh-action)',
    res: 'var(--sh-observe)',
    sse: 'var(--sh-final)',
  })[k];

function geom(s: Step, i: number) {
  const y = 78 + i * 40;
  const x1 = X[s.from];
  const x2 = X[s.to];
  const dir = x2 > x1 ? 1 : -1;
  return {
    y,
    x1,
    x2,
    head: `${x2},${y} ${x2 - 9 * dir},${y - 3.6} ${x2 - 9 * dir},${y + 3.6}`,
    mid: (x1 + x2) / 2,
  };
}
</script>

<template>
  <div class="ef sh-no-print">
    <div class="ef__head">
      <div class="ef__title">一次工具调用，在四个角色之间走了 9 步</div>
      <div class="ef__ctl">
        <button type="button" @click="prev" aria-label="上一步">上一步</button>
        <button type="button" class="ef__play" @click="play">{{ playing ? '暂停' : '自动播放' }}</button>
        <button type="button" @click="next" aria-label="下一步">下一步</button>
        <button type="button" @click="reset" aria-label="重播">重播</button>
      </div>
    </div>

    <!-- 桌面：时序图 -->
    <div class="ef__svg-wrap">
      <svg :viewBox="`0 0 620 ${H}`" class="ef__svg" role="img" aria-label="浏览器、运行时、模型、工具之间的调用时序">
        <g v-for="(l, i) in LANES" :key="l">
          <text :x="X[i]" y="16" text-anchor="middle" class="ef__lane-label">{{ l }}</text>
          <line :x1="X[i]" :y1="laneY - 10" :x2="X[i]" :y2="H - 8" class="ef__lane" />
        </g>

        <g v-for="(s, i) in steps" :key="i" :class="{ 'is-dim': i > active }">
          <line
            :x1="geom(s, i).x1"
            :y1="geom(s, i).y"
            :x2="geom(s, i).x2"
            :y2="geom(s, i).y"
            :stroke="color(s.kind)"
            :stroke-width="i === active ? 2.2 : 1.4"
            :opacity="i === active ? 1 : 0.72"
          />
          <polygon :points="geom(s, i).head" :fill="color(s.kind)" :opacity="i === active ? 1 : 0.72" />
          <circle :cx="geom(s, i).x1" :cy="geom(s, i).y" r="2.6" :fill="color(s.kind)" />
          <rect
            v-if="i === active"
            :x="geom(s, i).mid - 78"
            :y="geom(s, i).y - 13.5"
            width="156"
            height="15"
            rx="7"
            class="ef__chip-bg"
          />
          <text
            :x="geom(s, i).mid"
            :y="geom(s, i).y - 3"
            text-anchor="middle"
            class="ef__step-label"
            :class="{ 'is-active': i === active }"
          >
            {{ i + 1 }}. {{ s.label }}
          </text>
        </g>
      </svg>
    </div>

    <!-- 手机：竖排步骤 -->
    <ol class="ef__list">
      <li
        v-for="(s, i) in steps"
        :key="i"
        :class="{ 'is-active': i === active, 'is-dim': i > active }"
        @click="active = i; stop()"
      >
        <span class="ef__n">{{ i + 1 }}</span>
        <span class="ef__list-main">
          <strong>{{ LANES[s.from] }} → {{ LANES[s.to] }}</strong>
          <em>{{ s.label }}</em>
        </span>
      </li>
    </ol>

    <div class="ef__note" aria-live="polite">
      <span class="ef__note-n">第 {{ active + 1 }} / {{ steps.length }} 步</span>
      <p>{{ current.note }}</p>
    </div>
  </div>
</template>

<style scoped>
.ef {
  margin: 20px 0;
  padding: 14px;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-lg);
  background: var(--sh-surface-2);
}

.ef__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.ef__title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}
.ef__ctl {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.ef__ctl button {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--sh-border);
  background: var(--sh-surface);
  color: var(--vp-c-text-2);
  cursor: pointer;
  white-space: nowrap;
}
.ef__ctl button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.ef__play {
  border-color: var(--vp-c-brand-1) !important;
  color: var(--vp-c-brand-1) !important;
}

.ef__svg-wrap {
  overflow-x: auto;
}
.ef__svg {
  width: 100%;
  min-width: 560px;
  height: auto;
  display: block;
}

.ef__lane-label {
  font-size: 10px;
  fill: var(--vp-c-text-2);
}
.ef__lane {
  stroke: var(--sh-border-strong);
  stroke-width: 1;
  stroke-dasharray: 3 4;
}
.ef__step-label {
  font-size: 9px;
  fill: var(--vp-c-text-2);
  paint-order: stroke;
  stroke: var(--sh-surface-2);
  stroke-width: 3px;
  stroke-linejoin: round;
}
.ef__step-label.is-active {
  fill: var(--vp-c-text-1);
  font-weight: 700;
}
.ef__chip-bg {
  fill: var(--sh-surface);
  stroke: var(--sh-border);
}
.is-dim {
  opacity: 0.5;
}
.ef__list li.is-dim {
  opacity: 0.62;
}

.ef__list {
  display: none;
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  gap: 4px;
}
.ef__list li {
  display: flex;
  gap: 8px;
  padding: 7px 9px;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-sm);
  background: var(--sh-surface);
  cursor: pointer;
}
.ef__list li.is-active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.ef__n {
  flex: none;
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-3);
}
.ef__list li.is-active .ef__n {
  background: var(--vp-c-brand-1);
  color: #fff;
}
.ef__list-main {
  display: grid;
  gap: 1px;
  font-size: 11.5px;
  color: var(--vp-c-text-1);
}
.ef__list-main em {
  font-style: normal;
  font-family: var(--vp-font-family-mono);
  font-size: 10.5px;
  color: var(--vp-c-text-3);
}

.ef__note {
  margin-top: 8px;
  padding: 9px 11px;
  border-radius: var(--sh-radius-sm);
  background: var(--sh-surface);
  border: 1px solid var(--sh-border);
}
.ef__note-n {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}
.ef__note p {
  margin: 3px 0 0;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}

@media (max-width: 760px) {
  .ef__svg-wrap {
    display: none;
  }
  .ef__list {
    display: grid;
  }
}
</style>
