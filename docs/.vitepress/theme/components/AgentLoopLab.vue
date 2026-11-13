<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

/**
 * Agent Loop 实验台（面向初学者的可回放版）
 *
 * 设计目标是"看懂每一步在干什么"，而不是"炫技"：
 * 1. 顶部有一句白话旁白，随播放头变化，说明当前这一步到底发生了什么；
 * 2. 时间线自动跟随播放头，否则初学者会以为"思考完就直接出答案"（旧版的真实缺陷）；
 * 3. 工具调用有明确的"执行中 / 已返回"状态，不再一闪而过；
 * 4. 默认隐藏"记账"卡片，避免专业术语干扰第一次阅读；
 * 5. 网络与播放解耦：暂停/单步/变速都不会重新请求模型。
 */

type EventType =
  | 'meta'
  | 'round_start'
  | 'reasoning'
  | 'thought'
  | 'tool_call'
  | 'tool_result'
  | 'usage'
  | 'final_answer'
  | 'error';

interface AgentEvent {
  type: EventType;
  round?: number;
  content?: string;
  tool?: string;
  input?: Record<string, unknown>;
  output?: string;
  ok?: boolean;
  durationMs?: number;
  message?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  sessionPromptTokens?: number;
  sessionTotalTokens?: number;
  mode?: 'live' | 'simulation';
  model?: string;
  baseURL?: string;
  reason?: string;
}

interface Row {
  evt: AgentEvent;
  step: number;
  toolDone?: boolean;
}

type Phase = 'idle' | 'perceive' | 'think' | 'act' | 'observe' | 'answer';

const cities = ['成都', '北京', '上海', '深圳'];
const selectedCity = ref('成都');
const prompt = ref('你好，请帮我查询一下今天成都的天气，然后根据天气推荐一个合适的旅游景点。');

const buffer = ref<AgentEvent[]>([]);
const playhead = ref(0);
const playing = ref(false);
const status = ref<'idle' | 'connecting' | 'streaming' | 'done' | 'error'>('idle');
const speed = ref(1);
const errorText = ref('');
const meta = ref<{ mode: 'live' | 'simulation'; model: string; baseURL: string; reason?: string } | null>(null);
const showRaw = ref(false);
const showUsage = ref(false);
const confirmedCost = ref(false);
const pendingRun = ref(false);
const lastChunkAt = ref(0);
const nowTs = ref(Date.now());
const timelineEl = ref<HTMLElement | null>(null);
const WAIT_HINT_MS = 1200;
const IDLE_TIMEOUT_MS = 120000;

// ---------------------------------------------------------------- 展示数据

/** 缓冲里"要展示"的事件（可隐藏记账卡） */
const displayOf = (e: AgentEvent) => showUsage.value || e.type !== 'usage';

const visible = computed(() => buffer.value.slice(0, playhead.value).filter(displayOf));
const totalSteps = computed(() => buffer.value.filter(displayOf).length);

const currentPhase = computed<Phase>(() => {
  for (let i = visible.value.length - 1; i >= 0; i--) {
    const t = visible.value[i].type;
    if (t === 'round_start') return 'perceive';
    if (t === 'reasoning' || t === 'thought') return 'think';
    if (t === 'tool_call') return 'act';
    if (t === 'tool_result') return 'observe';
    if (t === 'final_answer') return 'answer';
  }
  return status.value === 'idle' ? 'idle' : 'perceive';
});

const currentRound = computed(() => {
  const rounds = visible.value.map((e) => e.round).filter(Boolean) as number[];
  return rounds.length ? Math.max(...rounds) : 0;
});

/** 按轮次分组 + 全局步骤号；同时算出"这次工具调用是否已返回" */
const rounds = computed(() => {
  const groups: { round: number; rows: Row[] }[] = [];
  let step = 0;

  visible.value.forEach((e, i) => {
    step += 1;
    const row: Row = { evt: e, step };
    if (e.type === 'tool_call') {
      row.toolDone = visible.value
        .slice(i + 1)
        .some((x) => x.type === 'tool_result' && x.tool === e.tool);
    }
    const r = groups.find((g) => g.round === (e.round ?? 0));
    if (r) r.rows.push(row);
    else groups.push({ round: e.round ?? 0, rows: [row] });
  });

  return groups;
});

const activeStep = computed(() => visible.value.length);

/** 顶部旁白：用一句白话解释"现在这一步在做什么" */
const narration = computed(() => {
  const last = visible.value[visible.value.length - 1];
  if (!last) {
    if (status.value === 'connecting') {
      return { tone: 'idle', icon: '⏳', title: '正在连接运行时…', detail: '马上开始，请稍候。' };
    }
    return {
      tone: 'idle',
      icon: '👋',
      title: '还没开始',
      detail: '点下面的「运行 Agent」，或者用 ▶ 自动播放、⏭ 一步一步看。每一步这里都会告诉你发生了什么。',
    };
  }

  switch (last.type) {
    case 'round_start':
      return {
        tone: 'perceive',
        icon: '🎯',
        title: `第 ${last.round ?? 1} 轮开始：把问题重新交给模型`,
        detail:
          '模型没有记忆，每一轮都要把「你的问题 + 之前查到的所有结果」重新读一遍。这就是为什么轮数越多越贵。',
      };
    case 'reasoning':
      return {
        tone: 'think',
        icon: '💭',
        title: '模型在心里打草稿',
        detail:
          '这段是模型的内部推理（思维链）。你平时看不到它，但它按 token 收费——所以"想太久"也是要花钱的。',
      };
    case 'thought':
      return {
        tone: 'think',
        icon: '🗣️',
        title: '模型说了一句话',
        detail:
          '注意：这句话只是"表达"，它什么也没做。真正去查天气，要等下一步「调用工具」。',
      };
    case 'tool_call':
      return {
        tone: 'act',
        icon: '🔧',
        title: `模型点名要用工具：${last.tool}`,
        detail:
          '模型只负责"点名"和给出参数，真正执行的是你的代码。参数会先被校验，不合格就退回让它重填。',
      };
    case 'tool_result': {
      const prov = parseProvenance(last.output);
      const provText =
        prov?.kind === 'live'
          ? `数据来自 ${prov.text}，可以自己核对。`
          : prov?.kind === 'mock'
            ? '这是仿真数据，不是真实天气。'
            : prov?.kind === 'error'
              ? '这次调用失败了，模型会读到错误并尝试修正。'
              : '';
      return {
        tone: 'observe',
        icon: '📦',
        title: prov?.kind === 'error' ? '工具调用失败' : '工具把结果交回来了',
        detail: `工具实际执行了 ${last.durationMs}ms。${provText}这条结果会被塞回模型的"记忆"，下一轮它才看得见。`,
      };
    }
    case 'usage':
      return {
        tone: 'idle',
        icon: '🧾',
        title: '记账：这一次请求花了多少',
        detail: `本轮 ${last.totalTokens ?? 0} 个 token。它是成本刻度，不是思考过程。`,
      };
    case 'final_answer':
      return {
        tone: 'answer',
        icon: '✅',
        title: '模型认为信息够了，开始写答案',
        detail: '它没有再点名任何工具，说明收集结束——这就是循环的出口。',
      };
    case 'error':
      return { tone: 'error', icon: '⚠️', title: '出错了', detail: last.message || '未知错误' };
    default:
      return { tone: 'idle', icon: '·', title: '', detail: '' };
  }
});

const usage = computed(() => {
  // 注意：这里必须用未经过滤的原始切片。
  // "记账"卡片可以隐藏，但 token 数据仍要在左侧实时显示。
  const raw = buffer.value.slice(0, playhead.value);
  const items = raw.filter((e) => e.type === 'usage');
  const last = items[items.length - 1];
  return {
    prompt: last?.sessionPromptTokens ?? 0,
    total: last?.sessionTotalTokens ?? 0,
    perRound: items.map((e) => ({ round: e.round ?? 0, prompt: e.promptTokens ?? 0 })),
  };
});

const maxRoundPrompt = computed(() => Math.max(1, ...usage.value.perRound.map((r) => r.prompt)));

const finalAnswer = computed(() => {
  const f = visible.value.filter((e) => e.type === 'final_answer').pop();
  return f?.content || '';
});

const errorEvent = computed(() => visible.value.filter((e) => e.type === 'error').pop());

const phaseList: { key: Phase; label: string; plain: string }[] = [
  { key: 'perceive', label: '感知', plain: '拿到问题和历史' },
  { key: 'think', label: '思考', plain: '决定下一步做什么' },
  { key: 'act', label: '行动', plain: '真的去调用工具' },
  { key: 'observe', label: '观察', plain: '工具把结果送回来' },
  { key: 'answer', label: '回答', plain: '整理成人话' },
];

const ringNodes = computed(() =>
  phaseList.map((p, i) => {
    const angle = (-90 + i * 72) * (Math.PI / 180);
    return { ...p, x: 130 + Math.cos(angle) * 82, y: 130 + Math.sin(angle) * 82, index: i };
  })
);

const activeNode = computed(() => ringNodes.value.find((n) => n.key === currentPhase.value));

const phaseLabel = computed(() => {
  if (currentPhase.value === 'idle') return '待运行';
  return phaseList.find((p) => p.key === currentPhase.value)?.label || '';
});

const phasePlain = computed(() => {
  if (currentPhase.value === 'idle') return '点「运行 Agent」开始';
  return phaseList.find((p) => p.key === currentPhase.value)?.plain || '';
});

// ---------------------------------------------------------------- 播放调度器

let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * 每一步停留多久：按内容长度自适应。
 * 固定 900ms 对"一大段工具结果"太快，对"开始新一轮"又太慢。
 */
function dwellForNext() {
  const next = buffer.value[playhead.value];
  const text = String(next?.content ?? next?.output ?? next?.message ?? '');
  const base = 800 + Math.min(2200, text.length * 18); // 800ms ~ 3000ms
  const byType = next?.type === 'final_answer' ? 2600 : next?.type === 'tool_result' ? base + 400 : base;
  return Math.round(byType / speed.value);
}

function tick() {
  if (timer) clearTimeout(timer);
  if (!playing.value) return;

  timer = setTimeout(() => {
    if (playhead.value < buffer.value.length) {
      playhead.value += 1;
      tick();
    } else if (status.value === 'done' || status.value === 'error') {
      playing.value = false;
    } else {
      tick();
    }
  }, dwellForNext());
}

function togglePlay() {
  if (status.value === 'idle') {
    void startRun();
    return;
  }
  playing.value = !playing.value;
  if (playing.value) tick();
  else if (timer) clearTimeout(timer);
}

function stepForward() {
  playing.value = false;
  if (timer) clearTimeout(timer);
  if (playhead.value < buffer.value.length) playhead.value += 1;
}

function stepBack() {
  playing.value = false;
  if (timer) clearTimeout(timer);
  if (playhead.value > 0) playhead.value -= 1;
}

function replay() {
  playhead.value = 0;
  playing.value = true;
  tick();
}

function reset() {
  playing.value = false;
  if (timer) clearTimeout(timer);
  buffer.value = [];
  playhead.value = 0;
  status.value = 'idle';
  errorText.value = '';
  meta.value = null;
}

function selectCity(city: string) {
  selectedCity.value = city;
  prompt.value = `你好，请帮我查询一下今天${city}的天气，然后根据天气推荐一个合适的旅游景点。`;
}

/** 播放头前进时，把当前高亮卡片滚进可视区——这是旧版最致命的缺陷 */
watch(
  () => playhead.value,
  async () => {
    await nextTick();
    const box = timelineEl.value;
    const card = box?.querySelector<HTMLElement>('.evt.is-active');
    if (!box || !card) return;

    const boxRect = box.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const below = cardRect.bottom - boxRect.bottom;

    if (below > -8) {
      const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      box.scrollTo({ top: box.scrollTop + below + 12, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
);

// ---------------------------------------------------------------- 运行

async function checkStatus() {
  try {
    const res = await fetch('/api/agent/status');
    if (!res.ok) return;
    const data = await res.json();
    meta.value = {
      mode: data.hasApiKey ? 'live' : 'simulation',
      model: data.model,
      baseURL: data.baseURL,
      reason: data.hasApiKey ? undefined : '当前运行环境没有读到有效的 OPENAI_API_KEY',
    };
  } catch {
    // 静态部署没有本地运行时：保持 null，由运行时错误兜底
  }
}
void checkStatus();

function requestRun() {
  if (status.value === 'connecting' || status.value === 'streaming') return;
  if (meta.value?.mode === 'live' && !confirmedCost.value) {
    pendingRun.value = true;
    return;
  }
  void startRun();
}

function confirmRun() {
  confirmedCost.value = true;
  pendingRun.value = false;
  void startRun();
}

async function startRun() {
  if (status.value === 'connecting' || status.value === 'streaming') return;

  reset();
  status.value = 'connecting';
  playing.value = false;
  lastChunkAt.value = Date.now();
  startClock();

  try {
    const res = await fetch('/api/agent/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt.value }),
    });

    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let raw = '';
    status.value = 'streaming';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      raw += decoder.decode(value, { stream: true });
      const blocks = raw.split('\n\n');
      raw = blocks.pop() || '';

      for (const block of blocks) {
        const line = block.trim();
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        lastChunkAt.value = Date.now();
        if (payload === '[DONE]') {
          status.value = 'done';
          continue;
        }
        try {
          const evt = JSON.parse(payload) as AgentEvent;
          if (evt.type === 'meta') {
            meta.value = {
              mode: (evt.mode as 'live' | 'simulation') || 'simulation',
              model: evt.model || '',
              baseURL: evt.baseURL || '',
              reason: evt.reason,
            };
            continue;
          }
          buffer.value.push(evt);
          if (!playing.value && buffer.value.length === 1) {
            playing.value = true;
            tick();
          }
        } catch {
          // 忽略不完整分片
        }
      }
    }

    if (status.value !== 'done') status.value = 'done';
    stopClock();
  } catch (err: unknown) {
    status.value = 'error';
    errorText.value = err instanceof Error ? err.message : String(err);
    stopClock();
  }
}

const canPlay = computed(() => status.value !== 'connecting' && prompt.value.trim().length > 0);

const isWaiting = computed(
  () => status.value === 'streaming' && nowTs.value - lastChunkAt.value > WAIT_HINT_MS
);

let clock: ReturnType<typeof setInterval> | null = null;

function startClock() {
  if (clock) clearInterval(clock);
  nowTs.value = Date.now();
  clock = setInterval(() => {
    nowTs.value = Date.now();
    if (
      status.value === 'streaming' &&
      lastChunkAt.value > 0 &&
      nowTs.value - lastChunkAt.value > IDLE_TIMEOUT_MS
    ) {
      status.value = 'error';
      errorText.value = '超过 2 分钟没有收到任何数据（可能是模型排队、限流或网络中断）';
    }
  }, 500);
}

function stopClock() {
  if (clock) {
    clearInterval(clock);
    clock = null;
  }
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
  stopClock();
});

// ---------------------------------------------------------------- 呈现辅助

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 只处理本章用得到的语法：标题、加粗、行内代码、无序列表、换行 */
function renderMarkdown(src: string) {
  const escaped = escapeHtml(src);
  const lines = escaped.split('\n');
  let html = '';
  let inList = false;

  const inline = (t: string) =>
    t.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${inline(trimmed.replace(/^[-*]\s+/, ''))}</li>`;
      continue;
    }
    if (inList) {
      html += '</ul>';
      inList = false;
    }
    if (!trimmed) continue;
    if (/^#{1,3}\s+/.test(trimmed)) {
      const level = Math.min(trimmed.match(/^#+/)![0].length + 2, 5);
      html += `<h${level}>${inline(trimmed.replace(/^#{1,3}\s+/, ''))}</h${level}>`;
      continue;
    }
    html += `<p>${inline(trimmed)}</p>`;
  }
  if (inList) html += '</ul>';
  return html;
}

const finalHtml = computed(() => renderMarkdown(finalAnswer.value));

function prettyInput(input?: Record<string, unknown>) {
  if (!input) return '';
  return Object.entries(input)
    .map(([k, v]) => `${k} = ${typeof v === 'string' ? `"${v}"` : JSON.stringify(v)}`)
    .join('，');
}

/**
 * 从工具返回文本里解析"数据来源"。
 * 目的很直接：让人能自己核对这到底是不是实时数据，而不是猜。
 */
function parseProvenance(output?: string): { kind: 'live' | 'mock' | 'error'; text: string } | null {
  if (!output) return null;
  if (output.includes('仿真')) return { kind: 'mock', text: '仿真数据' };
  if (output.includes('【查询失败】') || output.includes('【工具执行异常】')) {
    return { kind: 'error', text: '调用失败' };
  }
  const source = output.match(/数据来源：([^，。）]+)/)?.[1];
  const time = output.match(/观测时间：([0-9]{1,2}:[0-9]{2})/)?.[1];
  if (!source) return null;
  return { kind: 'live', text: time ? `${source} · ${time}` : source };
}
</script>

<template>
  <div class="lab sh-no-print">
    <!-- 顶部：模式与成本 -->
    <div class="lab__head">
      <div class="lab__title">
        <span class="lab__dot" :class="meta?.mode"></span>
        <strong>Agent Loop 实验台</strong>
        <span v-if="meta" class="lab__mode">
          {{ meta.mode === 'live' ? `真实模型 · ${meta.model}` : '离线仿真' }}
        </span>
      </div>
      <div class="lab__head-actions">
        <label class="lab__switch">
          <input v-model="showUsage" type="checkbox" />
          <span>显示记账</span>
        </label>
        <button class="lab__link" type="button" @click="showRaw = !showRaw">
          {{ showRaw ? '隐藏' : '查看' }}原始事件
        </button>
      </div>
    </div>

    <p v-if="meta?.mode === 'live'" class="lab__cost">
      ⚠️ 这是真实模型调用，<strong>每运行一次都会花钱</strong>（单次通常 3 轮、约 2–4k tokens）。
      离线仿真不花钱，可以随便点多快。
    </p>
    <p v-else-if="meta?.reason" class="lab__cost lab__cost--mock">
      ℹ️ {{ meta.reason }}，现在用离线仿真演示。仿真数据不联网，不代表真实天气。
    </p>

    <!-- 输入区 -->
    <div class="lab__form">
      <div class="lab__cities">
        <button
          v-for="c in cities"
          :key="c"
          type="button"
          class="lab__chip"
          :class="{ 'is-active': selectedCity === c }"
          :disabled="status === 'connecting' || status === 'streaming'"
          @click="selectCity(c)"
        >
          {{ c }}
        </button>
      </div>
      <textarea
        v-model="prompt"
        class="lab__input"
        rows="2"
        :disabled="status === 'connecting' || status === 'streaming'"
        placeholder="给 Agent 一个目标，例如：查天气并推荐景点"
      ></textarea>
      <div class="lab__actions">
        <button class="lab__run" type="button" :disabled="!canPlay" @click="requestRun">
          {{ status === 'connecting' || status === 'streaming' ? '运行中…' : '运行 Agent' }}
        </button>
      </div>
    </div>

    <!-- 成本确认 -->
    <div v-if="pendingRun" class="lab__dialog" role="dialog" aria-modal="true" aria-labelledby="cost-title">
      <div class="lab__dialog-body">
        <h4 id="cost-title">这次会真的调用大模型</h4>
        <p>
          将使用 <code>{{ meta?.model }}</code> 走真实推理，每轮循环都是一次计费请求。
          单次演示通常 3 轮、约 2–4k tokens。
        </p>
        <div class="lab__dialog-actions">
          <button type="button" class="lab__ghost" @click="pendingRun = false">取消</button>
          <button type="button" class="lab__run" @click="confirmRun">知道了，开始</button>
        </div>
      </div>
    </div>

    <!-- 旁白条：一句话说清"现在在干什么" -->
    <div class="lab__narrate" :class="`tone-${narration.tone}`" aria-live="polite">
      <span class="lab__narrate-icon" aria-hidden="true">{{ narration.icon }}</span>
      <div class="lab__narrate-body">
        <div class="lab__narrate-title">
          {{ narration.title }}
          <span v-if="activeStep" class="lab__narrate-step">第 {{ activeStep }} / {{ Math.max(totalSteps, activeStep) }} 步</span>
        </div>
        <p class="lab__narrate-detail">{{ narration.detail }}</p>
      </div>
    </div>

    <!-- 主体：环形阶段 + 时间线 -->
    <div class="lab__grid">
      <div class="lab__ring-wrap">
        <!-- 小屏用横向步骤条替代环形图：环形缩到 150px 后文字会挤在一起 -->
        <div class="lab__strip" role="group" aria-label="当前阶段">
          <template v-for="(p, i) in phaseList" :key="p.key">
            <span
              class="lab__strip-item"
              :class="{
                'is-active': currentPhase === p.key,
                'is-done': phaseList.findIndex((x) => x.key === currentPhase) > i,
              }"
            >
              {{ p.label }}
            </span>
            <span v-if="i < phaseList.length - 1" class="lab__strip-sep" aria-hidden="true">→</span>
          </template>
        </div>

        <svg class="lab__ring" viewBox="0 0 260 260" role="img" aria-label="Agent 循环的五个阶段">
          <circle cx="130" cy="130" r="82" fill="none" stroke="var(--sh-border)" stroke-width="1" stroke-dasharray="4 6" />

          <!-- 跟着阶段跑的小光点：让"循环在转"这件事看得见 -->
          <circle
            v-if="activeNode"
            class="lab__traveler"
            :style="{ transform: `translate(${activeNode.x}px, ${activeNode.y}px)` }"
            r="5"
          />

          <g v-for="n in ringNodes" :key="n.key">
            <circle
              :cx="n.x"
              :cy="n.y"
              r="26"
              class="lab__node"
              :class="{
                'is-active': currentPhase === n.key,
                'is-done': phaseList.findIndex((p) => p.key === currentPhase) > n.index,
              }"
            />
            <text
              :x="n.x"
              :y="n.y + 4"
              text-anchor="middle"
              class="lab__node-text"
              :class="{ 'is-active': currentPhase === n.key }"
            >
              {{ n.label }}
            </text>
          </g>
          <text x="130" y="122" text-anchor="middle" class="lab__center-label">{{ phaseLabel }}</text>
          <text x="130" y="140" text-anchor="middle" class="lab__center-sub">{{ phasePlain }}</text>
          <text x="130" y="158" text-anchor="middle" class="lab__center-round">
            {{ currentRound ? `第 ${currentRound} 轮` : '未开始' }}
          </text>
        </svg>

        <!-- 阶段图例 -->
        <details class="lab__legend">
          <summary>这五个圈是什么意思？</summary>
          <ul>
            <li v-for="p in phaseList" :key="p.key">
              <strong>{{ p.label }}</strong>：{{ p.plain }}
            </li>
          </ul>
        </details>

        <!-- 上下文计量 -->
        <div class="lab__usage">
          <div class="lab__usage-row">
            <span>模型一共读了多少字</span>
            <strong>{{ usage.total.toLocaleString() }} tokens</strong>
          </div>
          <div class="lab__bars">
            <div v-for="r in usage.perRound" :key="r.round" class="lab__bar">
              <i :style="{ width: `${(r.prompt / maxRoundPrompt) * 100}%` }"></i>
              <span>R{{ r.round }} · {{ r.prompt }}</span>
            </div>
            <p v-if="!usage.perRound.length" class="lab__bar-empty">
              每轮都要把历史重发一遍，这里会显示每轮发了多少。
            </p>
          </div>
        </div>
      </div>

      <!-- 时间线 -->
      <div class="lab__stream">
        <div class="lab__controls">
          <button type="button" class="lab__ctl" :aria-label="playing ? '暂停' : '播放'" @click="togglePlay">
            <svg v-if="playing" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
              <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 4.5v15l13-7.5z" fill="currentColor" />
            </svg>
          </button>
          <button type="button" class="lab__ctl" aria-label="上一步" @click="stepBack">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 5v14L8 12z" fill="currentColor" />
              <rect x="4" y="5" width="2.4" height="14" rx="1" fill="currentColor" />
            </svg>
          </button>
          <button type="button" class="lab__ctl" aria-label="下一步" @click="stepForward">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 5v14l10-7z" fill="currentColor" />
              <rect x="17.6" y="5" width="2.4" height="14" rx="1" fill="currentColor" />
            </svg>
          </button>
          <button type="button" class="lab__ctl" aria-label="重播" @click="replay">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5a7 7 0 1 1-6.2 3.75" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <path d="M4 3.5v5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <div class="lab__speeds" role="group" aria-label="播放速度">
            <button
              v-for="s in [0.5, 1, 2]"
              :key="s"
              type="button"
              class="lab__speed"
              :class="{ 'is-active': speed === s }"
              @click="speed = s"
            >
              {{ s }}x
            </button>
          </div>
          <span class="lab__counter">{{ activeStep }} / {{ totalSteps }}</span>
        </div>

        <p v-if="!activeStep" class="lab__tip">
          第一次用？点左边的<strong>播放键</strong>让它自动走一遍；想慢慢看就点<strong>下一步键</strong>，一步一步来。
          每一步上面那句话会告诉你正在发生什么。
        </p>

        <div ref="timelineEl" class="lab__timeline" aria-live="polite">
          <div v-if="!visible.length" class="lab__empty">
            <img
              class="lab__empty-art"
              src="/images/art/empty-lab.png"
              alt=""
              width="512"
              height="472"
              loading="lazy"
            />
            <p>点「运行 Agent」，看它怎么把一句话拆成「查天气 → 拿结果 → 再推荐」。</p>
            <p class="lab__empty-hint">播放中可以随时暂停，用「上一步 / 下一步」前后翻，看清楚每一步。</p>
          </div>

          <section v-for="group in rounds" :key="group.round" class="lab__round">
            <header v-if="group.round" class="lab__round-head">
              <span>第 {{ group.round }} 轮</span>
              <span class="lab__round-sub">模型重新读一遍问题 + 之前的结果</span>
            </header>
            <ol class="lab__events">
              <li
                v-for="row in group.rows"
                :key="row.step"
                class="evt"
                :class="[`evt--${row.evt.type}`, { 'is-active': row.step === activeStep }]"
              >
                <span class="evt__step">{{ row.step }}</span>

                <template v-if="row.evt.type === 'round_start'">
                  <div class="evt__line evt__line--muted">把问题和历史装进上下文，交给模型</div>
                </template>

                <template v-else-if="row.evt.type === 'reasoning'">
                  <div class="evt__head">
                    <span class="sh-badge sh-badge--thought">思考 · 心里话</span>
                    <span class="evt__hint">你平时看不到，但按 token 收费</span>
                  </div>
                  <p class="evt__text evt__text--mono">{{ row.evt.content }}</p>
                </template>

                <template v-else-if="row.evt.type === 'thought'">
                  <div class="evt__head">
                    <span class="sh-badge sh-badge--thought">思考 · 说出来</span>
                    <span class="evt__hint">只是表达，还没行动</span>
                  </div>
                  <p class="evt__text">{{ row.evt.content }}</p>
                </template>

                <template v-else-if="row.evt.type === 'tool_call'">
                  <div class="evt__head">
                    <span class="sh-badge sh-badge--action">行动 · 调用工具</span>
                    <code class="evt__tool">{{ row.evt.tool }}</code>
                    <span v-if="!row.toolDone" class="evt__running">
                      <span class="evt__spinner"></span> 正在执行…
                    </span>
                    <span v-else class="evt__done">✓ 已返回</span>
                  </div>
                  <p class="evt__code">{{ prettyInput(row.evt.input) }}</p>
                  <p v-if="!row.toolDone" class="evt__hint-line">模型点完名了，等你的代码真正把它跑完。</p>
                </template>

                <template v-else-if="row.evt.type === 'tool_result'">
                  <div class="evt__head">
                    <span class="sh-badge sh-badge--observe">观察 · 工具返回</span>
                    <span class="evt__hint">{{ row.evt.durationMs }}ms{{ row.evt.ok === false ? ' · 失败' : '' }}</span>
                    <span
                      v-if="parseProvenance(row.evt.output)"
                      class="evt__prov"
                      :class="`is-${parseProvenance(row.evt.output)?.kind}`"
                    >
                      {{ parseProvenance(row.evt.output)?.text }}
                    </span>
                  </div>
                  <p class="evt__text">{{ row.evt.output }}</p>
                  <p class="evt__hint-line">这条结果被塞回模型的记忆，下一轮它才看得见。</p>
                </template>

                <template v-else-if="row.evt.type === 'usage'">
                  <div class="evt__head">
                    <span class="sh-badge">记账</span>
                    <span class="evt__hint">
                      本轮 {{ row.evt.totalTokens }} tokens（输入 {{ row.evt.promptTokens }} + 输出 {{ row.evt.completionTokens }}）
                    </span>
                  </div>
                </template>

                <template v-else-if="row.evt.type === 'final_answer'">
                  <div class="evt__head">
                    <span class="sh-badge sh-badge--final">回答 · 整理成人话</span>
                  </div>
                  <div class="evt__final" v-html="finalHtml"></div>
                </template>

                <template v-else-if="row.evt.type === 'error'">
                  <div class="evt__head">
                    <span class="sh-badge sh-badge--danger">出错</span>
                  </div>
                  <p class="evt__text">{{ row.evt.message }}</p>
                </template>
              </li>
            </ol>
          </section>
        </div>

        <div v-if="isWaiting" class="lab__waiting" aria-live="polite">
          <span class="lab__waiting-dot"></span>
          <span>模型正在推理…（推理模型第一句可能比较慢，这段时间也在计费）</span>
        </div>

        <details v-if="showRaw" class="lab__raw">
          <summary>原始事件流（SSE JSON）</summary>
          <pre>{{ visible.map((e) => JSON.stringify(e)).join('\n') }}</pre>
        </details>
      </div>
    </div>

    <p v-if="status === 'error' && errorText" class="lab__error">
      运行失败：{{ errorText }}。请确认本地运行时已启动（<code>pnpm docs:learn</code>）。
    </p>
    <p v-else-if="errorEvent" class="lab__error">Agent 报错：{{ errorEvent.message }}</p>
  </div>
</template>

<style scoped>
.lab {
  margin: 20px 0;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-lg);
  background: var(--sh-surface-2);
  padding: 16px;
}

.lab__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.lab__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  flex-wrap: wrap;
}

.lab__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
}
.lab__dot.live {
  background: var(--sh-observe);
  box-shadow: 0 0 0 3px var(--sh-observe-bg);
}
.lab__dot.simulation {
  background: var(--sh-final);
  box-shadow: 0 0 0 3px var(--sh-final-bg);
}

.lab__mode {
  font-size: 12px;
  color: var(--vp-c-text-2);
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
}

.lab__head-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.lab__switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--vp-c-text-3);
  cursor: pointer;
}
.lab__switch input {
  accent-color: var(--vp-c-brand-1);
}
.lab__link {
  font-size: 12px;
  color: var(--vp-c-text-2);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.lab__cost {
  margin: 12px 0 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  background: var(--sh-final-bg);
  border-left: 3px solid var(--sh-final);
  border-radius: 4px;
  padding: 8px 10px;
}
.lab__cost--mock {
  background: var(--vp-c-default-soft);
  border-left-color: var(--vp-c-text-3);
}

.lab__form {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}

.lab__cities {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.lab__chip {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--sh-border);
  background: var(--sh-surface);
  color: var(--vp-c-text-2);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s var(--sh-ease-out), color 0.15s var(--sh-ease-out);
}
.lab__chip:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.lab__chip.is-active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  font-weight: 600;
}

.lab__input {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 11px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--vp-c-text-1);
  background: var(--sh-surface);
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-sm);
  resize: vertical;
}
.lab__input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}
.lab__input:disabled {
  opacity: 0.7;
}

.lab__actions {
  display: flex;
  justify-content: flex-end;
}

.lab__run {
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--vp-c-brand-1);
  border: none;
  border-radius: var(--sh-radius-sm);
  cursor: pointer;
}
.lab__run:hover:not(:disabled) {
  filter: brightness(1.08);
}
.lab__run:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.lab__dialog {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 16px;
}
.lab__dialog-body {
  max-width: 420px;
  background: var(--sh-surface);
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius);
  padding: 18px;
  box-shadow: var(--sh-shadow);
}
.lab__dialog-body h4 {
  margin: 0 0 8px;
  font-size: 15px;
}
.lab__dialog-body p {
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}
.lab__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
.lab__ghost {
  padding: 7px 14px;
  font-size: 13px;
  background: none;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-sm);
  color: var(--vp-c-text-2);
  cursor: pointer;
}

/* ---------------- 旁白条 ---------------- */
.lab__narrate {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  padding: 11px 13px;
  border-radius: var(--sh-radius);
  border: 1px solid var(--sh-border);
  border-left-width: 4px;
  background: var(--sh-surface);
  transition: border-color 0.25s var(--sh-ease-out), background 0.25s var(--sh-ease-out);
}
.lab__narrate.tone-perceive {
  border-left-color: var(--vp-c-brand-1);
}
.lab__narrate.tone-think {
  border-left-color: var(--sh-thought);
  background: var(--sh-thought-bg);
}
.lab__narrate.tone-act {
  border-left-color: var(--sh-action);
  background: var(--sh-action-bg);
}
.lab__narrate.tone-observe {
  border-left-color: var(--sh-observe);
  background: var(--sh-observe-bg);
}
.lab__narrate.tone-answer {
  border-left-color: var(--sh-final);
  background: var(--sh-final-bg);
}
.lab__narrate.tone-error {
  border-left-color: var(--sh-danger);
}
.lab__narrate.tone-idle {
  border-left-color: var(--sh-border-strong);
}

.lab__narrate-icon {
  font-size: 18px;
  line-height: 1.3;
}

.lab__narrate-body {
  min-width: 0;
}

.lab__narrate-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.lab__narrate-step {
  font-size: 11px;
  font-weight: 500;
  color: var(--vp-c-text-3);
  padding: 0 6px;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  font-variant-numeric: tabular-nums;
}

.lab__narrate-detail {
  margin: 3px 0 0;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}

/* ---------------- 主体两栏 ---------------- */
.lab__grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.lab__ring {
  width: 100%;
  height: auto;
  max-width: 260px;
}

/* 横向步骤条：默认隐藏，小屏才出现 */
.lab__strip {
  display: none;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
}
.lab__strip-item {
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid var(--sh-border);
  color: var(--vp-c-text-3);
  background: var(--sh-surface);
  white-space: nowrap;
}
.lab__strip-item.is-done {
  color: var(--vp-c-text-2);
  border-color: var(--vp-c-brand-2);
}
.lab__strip-item.is-active {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  font-weight: 700;
}
.lab__strip-sep {
  color: var(--vp-c-text-3);
  font-size: 10px;
}

.lab__traveler {
  fill: var(--vp-c-brand-1);
  opacity: 0.85;
  transition: transform 0.45s var(--sh-ease);
  filter: drop-shadow(0 0 4px var(--vp-c-brand-1));
}

.lab__node {
  fill: var(--sh-surface);
  stroke: var(--sh-border-strong);
  stroke-width: 1.5;
  transition: fill 0.25s var(--sh-ease-out), stroke 0.25s var(--sh-ease-out);
}
.lab__node.is-done {
  stroke: var(--vp-c-brand-2);
}
.lab__node.is-active {
  fill: var(--vp-c-brand-soft);
  stroke: var(--vp-c-brand-1);
  stroke-width: 2.5;
}

.lab__node-text {
  font-size: 12px;
  fill: var(--vp-c-text-2);
}
.lab__node-text.is-active {
  fill: var(--vp-c-brand-1);
  font-weight: 700;
}

.lab__center-label {
  font-size: 15px;
  font-weight: 700;
  fill: var(--vp-c-text-1);
}
.lab__center-sub {
  font-size: 10px;
  fill: var(--vp-c-text-2);
}
.lab__center-round {
  font-size: 10px;
  fill: var(--vp-c-text-3);
}

.lab__legend {
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--vp-c-text-2);
}
.lab__legend summary {
  cursor: pointer;
  color: var(--vp-c-text-3);
}
.lab__legend ul {
  margin: 6px 0 0;
  padding-left: 16px;
  list-style: disc;
  display: grid;
  gap: 2px;
}
.lab__legend strong {
  color: var(--vp-c-text-1);
}

.lab__usage {
  margin-top: 10px;
  border-top: 1px dashed var(--sh-border);
  padding-top: 10px;
}
.lab__usage-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.lab__usage-row strong {
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.lab__bars {
  margin-top: 8px;
  display: grid;
  gap: 6px;
}
.lab__bar {
  position: relative;
  height: 18px;
  border-radius: 4px;
  background: var(--vp-c-default-soft);
  overflow: hidden;
}
.lab__bar i {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--vp-c-brand-soft);
  border-right: 2px solid var(--vp-c-brand-1);
  transition: width 0.3s var(--sh-ease-out);
}
.lab__bar span {
  position: relative;
  font-size: 11px;
  line-height: 18px;
  padding-left: 6px;
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}
.lab__bar-empty {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--vp-c-text-3);
}

/* ---------------- 时间线 ---------------- */
.lab__stream {
  min-width: 0;
}

.lab__controls {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--sh-border);
  flex-wrap: wrap;
}

.lab__ctl {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-sm);
  background: var(--sh-surface);
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.lab__ctl svg {
  width: 14px;
  height: 14px;
  display: block;
}
.lab__ctl:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.lab__ctl:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 1px;
}

.lab__speeds {
  display: flex;
  gap: 2px;
  margin-left: 4px;
}
.lab__speed {
  font-size: 11px;
  padding: 3px 7px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: none;
  color: var(--vp-c-text-3);
  cursor: pointer;
}
.lab__speed.is-active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.lab__counter {
  margin-left: auto;
  font-size: 11.5px;
  color: var(--vp-c-text-3);
  font-variant-numeric: tabular-nums;
}

.lab__tip {
  margin: 8px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--vp-c-text-3);
}
.lab__tip strong {
  color: var(--vp-c-text-2);
}

.lab__timeline {
  margin-top: 8px;
  max-height: 420px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
  scroll-behavior: smooth;
}

.lab__empty {
  padding: 18px 8px 26px;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 13px;
}
.lab__empty-art {
  width: 108px;
  height: auto;
  display: block;
  margin: 0 auto 10px;
  border-radius: 16px;
}
.lab__empty-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.lab__round {
  margin-top: 10px;
}
.lab__round-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-2);
}
.lab__round-sub {
  font-weight: 400;
  letter-spacing: 0;
  color: var(--vp-c-text-3);
}

.lab__events {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.evt {
  position: relative;
  padding: 8px 10px 8px 30px;
  border-radius: var(--sh-radius-sm);
  background: var(--sh-surface);
  border-left: 3px solid var(--sh-border-strong);
  animation: evt-in 0.28s var(--sh-ease) both;
  transition: box-shadow 0.25s var(--sh-ease-out), transform 0.25s var(--sh-ease);
}
@keyframes evt-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 当前这一步：加光晕 + 轻微放大，一眼能找到 */
.evt:not(.is-active) {
  opacity: 0.72;
}
.evt.is-active {
  opacity: 1;
  transform: scale(1.008);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft), 0 6px 18px rgba(0, 0, 0, 0.18);
}

.evt__step {
  position: absolute;
  left: 8px;
  top: 9px;
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  color: var(--vp-c-text-3);
  background: var(--vp-c-default-soft);
  font-variant-numeric: tabular-nums;
}
.evt.is-active .evt__step {
  color: #fff;
  background: var(--vp-c-brand-1);
}

.evt--reasoning {
  border-left-color: var(--sh-thought);
  background: var(--sh-thought-bg);
}
.evt--thought {
  border-left-color: var(--sh-thought);
}
.evt--tool_call {
  border-left-color: var(--sh-action);
  background: var(--sh-action-bg);
}
.evt--tool_result {
  border-left-color: var(--sh-observe);
  background: var(--sh-observe-bg);
}
.evt--final_answer {
  border-left-color: var(--sh-final);
  background: var(--sh-final-bg);
}
.evt--error {
  border-left-color: var(--sh-danger);
}
.evt--round_start {
  background: none;
  border-left-color: var(--sh-border);
  padding: 2px 10px 2px 30px;
}
.evt--usage {
  background: none;
  border-left-style: dashed;
}

.evt__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.evt__hint {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

.evt__prov {
  font-size: 10.5px;
  padding: 0 6px;
  border-radius: 999px;
  border: 1px solid var(--sh-border);
  color: var(--vp-c-text-3);
  white-space: nowrap;
}
.evt__prov.is-live {
  color: var(--sh-observe);
  border-color: currentColor;
}
.evt__prov.is-mock {
  color: var(--sh-final);
  border-color: currentColor;
}
.evt__prov.is-error {
  color: var(--sh-danger);
  border-color: currentColor;
}

.evt__tool {
  font-size: 12px;
  color: var(--sh-action);
  background: none;
  padding: 0;
}

.evt__running {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--sh-action);
}
.evt__spinner {
  width: 9px;
  height: 9px;
  border: 1.5px solid var(--sh-action);
  border-top-color: transparent;
  border-radius: 50%;
  animation: evt-spin 0.8s linear infinite;
}
@keyframes evt-spin {
  to {
    transform: rotate(360deg);
  }
}
.evt__done {
  font-size: 11.5px;
  color: var(--sh-observe);
  font-weight: 600;
}

.evt__text {
  margin: 5px 0 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--vp-c-text-1);
  white-space: pre-wrap;
  word-break: break-word;
}
.evt__text--mono {
  font-size: 12.5px;
  color: var(--vp-c-text-2);
}

.evt__hint-line {
  margin: 4px 0 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--vp-c-text-3);
}

.evt__line--muted {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

.evt__code {
  margin: 5px 0 0;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-2);
  word-break: break-all;
}

.evt__final {
  margin-top: 6px;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--vp-c-text-1);
}
.evt__final :deep(h3),
.evt__final :deep(h4),
.evt__final :deep(h5) {
  margin: 8px 0 4px;
  font-size: 14px;
}
.evt__final :deep(p) {
  margin: 4px 0;
}
.evt__final :deep(ul) {
  margin: 4px 0;
  padding-left: 18px;
  list-style: disc;
}
.evt__final :deep(li) {
  margin: 2px 0;
}
.evt__final :deep(code) {
  font-size: 12px;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--vp-c-default-soft);
}

.lab__raw {
  margin-top: 10px;
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.lab__raw pre {
  max-height: 200px;
  overflow: auto;
  padding: 8px;
  border-radius: 6px;
  background: var(--vp-c-bg-alt);
  font-size: 11px;
  line-height: 1.5;
}

.lab__error {
  margin: 10px 0 0;
  font-size: 12.5px;
  color: var(--sh-danger);
}

.lab__waiting {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 7px 10px;
  border-radius: var(--sh-radius-sm);
  background: var(--vp-c-default-soft);
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.lab__waiting-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  animation: lab-blink 1.1s ease-in-out infinite;
}

@keyframes lab-blink {
  0%,
  100% {
    opacity: 0.25;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 760px) {
  .lab {
    padding: 12px;
  }
  .lab__grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .lab__ring-wrap {
    display: block;
  }
  .lab__ring {
    display: none;
  }
  .lab__strip {
    display: flex;
  }
  .lab__legend {
    margin-top: 8px;
  }
  .lab__usage {
    margin-top: 10px;
    border-top: 1px dashed var(--sh-border);
    padding-top: 10px;
  }
  .lab__timeline {
    max-height: 360px;
  }
}
</style>
