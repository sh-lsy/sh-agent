import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ChatCompletionTool, ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { createLLMClient, resolveModel } from './llm-client.js';

// ==============================================================================
// 1. 类型定义：事件流与工具规约 (Types)
// ==============================================================================

/**
 * 智能体运行时事件流。
 *
 * 与 2024 年的写法相比，这里多出两个 2026 年才成为刚需的事件：
 * - `reasoning`：推理模型（o 系列 / R1 类 / GLM / Qwen 思考模式）的「思维链」，
 *   与 `thought`（面向用户的可见回答）是两份不同的产物。只取 content 会把它丢掉。
 * - `usage`：每轮真实 token 计量。上下文是有预算的资源，看不到计量就谈不上工程化。
 *
 * 前端视角：这是一组强类型 Redux Action，终端与 Vue 组件消费同一份事件。
 */
export interface AgentEventBase {
  /** 第几轮循环，从 1 开始。前端的「轮次分组」依赖它 */
  round?: number;
}

export type AgentEvent = AgentEventBase &
  (
    | { type: 'round_start' }
    | { type: 'reasoning'; content: string }
    | { type: 'thought'; content: string }
    | { type: 'tool_call'; tool: string; input: Record<string, unknown> }
    | { type: 'tool_result'; tool: string; output: string; ok: boolean; durationMs: number }
    | {
        type: 'usage';
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        /** 截至本轮，整条会话累计消耗 */
        sessionPromptTokens: number;
        sessionTotalTokens: number;
      }
    | { type: 'final_answer'; content: string }
    | { type: 'error'; message: string }
  );

/**
 * 工具定义接口 (Zod 作为单一真理源)
 */
export interface AgentTool<TParams extends z.ZodTypeAny = any> {
  name: string;
  description: string;
  schema: TParams;
  execute: (params: z.infer<TParams>) => Promise<string> | string;
}

// ==============================================================================
// 2. 工具集实现 (Tools)
// ==============================================================================

/**
 * 天气工具的数据源策略
 *
 * 2026 年的工程原则：宁可换源，也不要把"英文 + 不准"的数据丢给模型。
 *
 * - 主源：Open-Meteo（免 Key、WMO 标准天气代码、自带观测时间戳，精度优于 wttr.in）
 * - 备源：wttr.in（主源超时/不可达时降级，返回内容会写明来源）
 * - 兜底：显式标注"非实时"，绝不伪装成实时数据
 *
 * 为什么要带「观测时间」：用户看到"17℃"第一反应是"真的假的"，
 * 给出时间和来源，才能让人自己核对。
 */

/** 常用城市坐标，省掉一次地理编码请求 */
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  成都: { lat: 30.5728, lon: 104.0668 },
  北京: { lat: 39.9042, lon: 116.4074 },
  上海: { lat: 31.2304, lon: 121.4737 },
  深圳: { lat: 22.5431, lon: 114.0579 },
  广州: { lat: 23.1291, lon: 113.2644 },
  杭州: { lat: 30.2741, lon: 120.1551 },
  西安: { lat: 34.3416, lon: 108.9398 },
  重庆: { lat: 29.563, lon: 106.5516 },
};

/** WMO 天气代码（Open-Meteo 标准）→ 中文 */
const WMO_ZH: Record<number, string> = {
  0: '晴',
  1: '大部晴朗',
  2: '局部多云',
  3: '阴',
  45: '雾',
  48: '雾凇',
  51: '小毛毛雨',
  53: '毛毛雨',
  55: '大毛毛雨',
  56: '冻毛毛雨',
  57: '强冻毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  66: '冻雨',
  67: '强冻雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '小阵雨',
  81: '中阵雨',
  82: '强阵雨',
  85: '小阵雪',
  86: '强阵雪',
  95: '雷阵雨',
  96: '雷阵雨伴冰雹',
  99: '强雷阵雨伴冰雹',
};

/** WWO 天气代码（wttr.in 使用）→ 中文，仅作备源 */
const WWO_ZH: Record<number, string> = {
  113: '晴',
  116: '局部多云',
  119: '多云',
  122: '阴',
  143: '薄雾',
  149: '烟霾',
  176: '局部阵雨',
  179: '局部阵雪',
  182: '局部雨夹雪',
  248: '雾',
  260: '冻雾',
  263: '零星毛毛雨',
  266: '毛毛雨',
  293: '零星小雨',
  296: '小雨',
  299: '间歇中雨',
  302: '中雨',
  305: '间歇大雨',
  308: '大雨',
  311: '小冻雨',
  314: '中到大冻雨',
  317: '小雨夹雪',
  320: '中到大雨夹雪',
  323: '零星小雪',
  326: '小雪',
  329: '局部中雪',
  332: '中雪',
  335: '局部大雪',
  338: '大雪',
  350: '冰粒',
  353: '小阵雨',
  356: '中到大阵雨',
  359: '暴雨',
  362: '小阵雨夹雪',
  365: '中到大阵雨夹雪',
  368: '小阵雪',
  371: '中到大阵雪',
  374: '小冰粒阵',
  377: '中到大冰粒阵',
  386: '局部雷阵雨',
  389: '强雷阵雨',
  392: '局部雷阵雪',
  395: '强雷阵雪',
};

/** 未知城市时用官方地理编码兜底；查不到就返回可操作错误，让模型自己去改城市名 */
async function resolveCoords(city: string): Promise<{ lat: number; lon: number } | null> {
  const preset = CITY_COORDS[city];
  if (preset) return preset;

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city
    )}&count=1&language=zh&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const hit = data.results?.[0];
    return hit ? { lat: hit.latitude, lon: hit.longitude } : null;
  } catch {
    return null;
  }
}

/** 主源：Open-Meteo */
async function fetchOpenMeteo(city: string): Promise<string> {
  const coords = await resolveCoords(city);
  if (!coords) {
    throw new Error(`未找到城市「${city}」，请换一个更常见的城市名后重试`);
  }

  const params = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lon),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    timezone: 'Asia/Shanghai',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

  const data = (await res.json()) as any;
  const cur = data.current;
  if (!cur) throw new Error('Open-Meteo 返回空数据');

  const desc = WMO_ZH[Number(cur.weather_code)] || `天气代码 ${cur.weather_code}`;
  const observedAt = String(cur.time || '').slice(11, 16) || '未知';

  return `${city}当前天气：${desc}，气温 ${cur.temperature_2m}℃，体感 ${cur.apparent_temperature}℃，湿度 ${cur.relative_humidity_2m}%，风速 ${cur.wind_speed_10m}km/h（数据来源：Open-Meteo，观测时间：${observedAt}）`;
}

/** 备源：wttr.in */
async function fetchWttr(city: string): Promise<string> {
  const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
    signal: AbortSignal.timeout(5000),
    headers: { 'User-Agent': 'sh-agent/1.0' },
  });
  if (!res.ok) throw new Error(`wttr.in HTTP ${res.status}`);

  const data = (await res.json()) as any;
  const cur = data.current_condition?.[0];
  if (!cur) throw new Error('wttr.in 返回空数据');

  const code = Number(cur.weatherCode);
  const desc = WWO_ZH[code] || cur.weatherDesc?.[0]?.value?.trim() || `天气代码 ${code}`;
  const time = String(cur.localObsDateTime || '').slice(11, 16);

  return `${city}当前天气：${desc}，气温 ${cur.temp_C}℃，体感 ${cur.FeelsLikeC}℃，湿度 ${cur.humidity}%（数据来源：wttr.in 备用源${time ? `，观测时间：${time}` : ''}）`;
}

/**
 * 工具 1：实时天气查询
 *
 * 防御性设计：主源 6s 超时 → 备源 5s → 兜底。
 * 兜底数据必须**显式标注**，不能伪装成实时数据。
 */
export const weatherTool: AgentTool = {
  name: 'get_weather',
  description: '查询指定城市的当前实时天气、气温与湿度',
  schema: z.object({
    city: z.string().describe('需要查询天气的城市名称，例如 "成都"、"北京" 或 "上海"'),
  }),
  execute: async ({ city }) => {
    const name = city.trim();

    try {
      return await fetchOpenMeteo(name);
    } catch (primaryErr: unknown) {
      const pMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);

      // 城市不存在属于「模型可以自己修」的错误，直接回灌，不要降级成编造的数据
      if (pMsg.includes('未找到城市')) return `【查询失败】${pMsg}。`;

      try {
        return await fetchWttr(name);
      } catch (backupErr: unknown) {
        const bMsg = backupErr instanceof Error ? backupErr.message : String(backupErr);
        return `【查询失败】实时天气接口不可用（主源：${pMsg}；备源：${bMsg}）。请告知用户稍后重试，不要编造天气数据。`;
      }
    }
  },
};

/**
 * 工具 2：根据城市与天气推荐景点
 *
 * 未配置 TAVILY_API_KEY 时走内置知识库，保证开箱即用。
 */
export const attractionTool: AgentTool = {
  name: 'get_attraction',
  description: '根据指定城市与当时的天气状况，推荐最适合游览的旅游景点及出游理由',
  schema: z.object({
    city: z.string().describe('城市名称，例如 "成都"'),
    weather: z.string().describe('当前天气或气候情况，例如 "晴"、"小雨"、"烟霾" 或 "阴"'),
  }),
  execute: async ({ city, weather }) => {
    const tavilyKey = process.env.TAVILY_API_KEY;

    if (tavilyKey && tavilyKey !== 'YOUR_TAVILY_API_KEY') {
      try {
        const query = `${city} 在 ${weather} 天气下最值得去的旅游景点推荐及理由`;
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: tavilyKey, query, search_depth: 'basic', include_answer: true }),
        });
        const data = (await res.json()) as any;
        if (data.answer) return data.answer;
        if (data.results?.length) {
          return data.results
            .slice(0, 3)
            .map((r: any) => `- ${r.title}: ${r.content}`)
            .join('\n');
        }
      } catch {
        // 静默降级到内置知识库
      }
    }

    const isBadWeather = /雨|雪|霾|雾|沙|雷|暴/.test(weather);
    const attractionMap: Record<string, { good: string; rainy: string }> = {
      成都: {
        good: '推荐清晨前往【成都大熊猫繁育研究基地】（看大熊猫户外活动）；午后到【人民公园】鹤鸣茶社喝盖碗茶，傍晚打卡【锦里】或【东郊记忆】。',
        rainy:
          '推荐漫步【杜甫草堂博物馆】（雨打竹林、茅屋意境极佳），或游览【成都博物馆】与【金沙遗址博物馆】；也可在【宽窄巷子】茶馆听川剧变脸、吃火锅。',
      },
      北京: {
        good: '推荐游览【颐和园】（万寿山与昆明湖视野开阔）或【故宫博物院】；体力好可去八达岭长城。',
        rainy: '推荐【中国国家博物馆】或【故宫珍宝馆】，室内展品丰富，雨天游览舒适。',
      },
      上海: {
        good: '推荐漫步【外滩滨江步道】，打卡【陆家嘴三件套】与【豫园】，晴天出片极佳。',
        rainy: '推荐【中华艺术宫】、【浦东美术馆】或【上海科技馆】，室内光影氛围好。',
      },
    };

    const target = attractionMap[city] || {
      good: `针对 ${city} 的晴好天气，建议选择视野开阔的历史名胜或市政森林公园。`,
      rainy: `针对 ${city} 的恶劣天气，建议选择当地博物馆、科技馆或艺术中心等室内场所。`,
    };

    return isBadWeather ? target.rainy : target.good;
  },
};

export const firstAgentTools: AgentTool[] = [weatherTool, attractionTool];

/** 把 Zod 工具集转换成 OpenAI 原生 Function Calling 协议 */
export function formatOpenAITools(tools: AgentTool[]): ChatCompletionTool[] {
  return tools.map((t) => {
    const jsonSchema = zodToJsonSchema(t.schema) as any;
    delete jsonSchema.$schema;

    return {
      type: 'function',
      function: { name: t.name, description: t.description, parameters: jsonSchema },
    };
  });
}

// ==============================================================================
// 3. 核心推理引擎：手写第一个智能体 (The Agent Loop)
// ==============================================================================

export interface RunAgentOptions {
  maxIterations?: number;
  model?: string;
  systemPrompt?: string;
}

const DEFAULT_SYSTEM_PROMPT = `你是一个专业的智能旅行助手。
你的目标是根据用户的旅行需求，主动利用可用工具获取最新天气与景点信息，一步步推理规划。
注意：
1. 遇到需要查询的天气或景点，必须调用对应工具。
2. 拿到工具返回后，结合上下文思考，并在信息充足后给出条理清晰、有温度的最终建议。
3. 如果工具返回中带有「⚠️」或「错误」字样，说明该数据不可靠，请在回答中如实说明。`;

/**
 * 运行第一个智能体（旅行助手）
 *
 * 循环结构（感知 → 思考 → 行动 → 观察）：
 * 1. 携带 messages 上下文 + 原生 tools 菜单请求模型；
 * 2. 有 tool_calls 就执行工具，把结果包装成 role: 'tool' 回灌；
 * 3. 没有 tool_calls 说明信息足够，输出最终答案。
 */
export async function* runFirstAgent(
  userPrompt: string,
  options: RunAgentOptions = {}
): AsyncGenerator<AgentEvent> {
  const {
    maxIterations = 6,
    model = resolveModel('fast'),
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
  } = options;

  let client;
  try {
    client = createLLMClient();
  } catch (err: unknown) {
    yield { type: 'error', message: err instanceof Error ? err.message : String(err) };
    return;
  }

  const openAITools = formatOpenAITools(firstAgentTools);
  const toolMap = new Map(firstAgentTools.map((t) => [t.name, t]));

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  let sessionPromptTokens = 0;
  let sessionTotalTokens = 0;

  for (let round = 1; round <= maxIterations; round++) {
    yield { type: 'round_start', round };

    let response;
    try {
      response = await client.chat.completions.create({
        model,
        messages,
        tools: openAITools,
        tool_choice: 'auto',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const hint = /401|invalid_api_key/i.test(msg)
        ? 'API Key 无效或已过期，请检查 .env 中的 OPENAI_API_KEY。'
        : /429|rate limit/i.test(msg)
          ? '触发限流（429），请稍后重试或换用更小的模型。'
          : /timeout|ETIMEDOUT|aborted/i.test(msg)
            ? '请求超时，请检查网络或代理。'
            : '请检查 OPENAI_BASE_URL 与模型名是否匹配。';
      yield { type: 'error', message: `大模型通信失败：${msg}；${hint}` };
      return;
    }

    const message: any = response.choices[0]?.message;
    if (!message) {
      yield { type: 'error', message: '大模型返回了空消息。' };
      return;
    }

    // ① 思维链（推理模型特有）——与面向用户的回答分开呈现
    const reasoning = message.reasoning_content ?? message.reasoning;
    if (typeof reasoning === 'string' && reasoning.trim()) {
      yield { type: 'reasoning', content: reasoning.trim(), round };
    }

    // ② 可见回答（可能为空：模型决定直接调工具时 content 就是 null）
    if (typeof message.content === 'string' && message.content.trim()) {
      yield { type: 'thought', content: message.content.trim(), round };
    }

    // ③ 真实 token 计量
    const usage = response.usage;
    if (usage) {
      sessionPromptTokens += usage.prompt_tokens ?? 0;
      sessionTotalTokens += usage.total_tokens ?? 0;
      yield {
        type: 'usage',
        promptTokens: usage.prompt_tokens ?? 0,
        completionTokens: usage.completion_tokens ?? 0,
        totalTokens: usage.total_tokens ?? 0,
        sessionPromptTokens,
        sessionTotalTokens,
        round,
      };
    }

    const toolCalls = message.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      yield {
        type: 'final_answer',
        content: message.content?.trim() || '任务完成，但模型没有返回文字内容。',
        round,
      };
      return;
    }

    messages.push(message);

    for (const call of toolCalls) {
      const toolName = call.function.name;
      const rawArgs = call.function.arguments;

      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(rawArgs);
      } catch {
        parsedArgs = { raw: rawArgs };
      }

      yield { type: 'tool_call', tool: toolName, input: parsedArgs, round };

      const startedAt = Date.now();
      let toolOutput = '';
      let ok = true;
      const toolInstance = toolMap.get(toolName);

      if (!toolInstance) {
        ok = false;
        toolOutput = `【错误】未注册的工具 "${toolName}"，可用工具为：${[...toolMap.keys()].join(', ')}。请修正工具名后重试。`;
      } else {
        try {
          const validated = toolInstance.schema.parse(parsedArgs);
          toolOutput = await toolInstance.execute(validated);
        } catch (execErr: unknown) {
          ok = false;
          const msg = execErr instanceof Error ? execErr.message : String(execErr);
          toolOutput = `【工具执行异常】${msg}；请据此调整参数后重试。`;
        }
      }

      yield {
        type: 'tool_result',
        tool: toolName,
        output: toolOutput,
        ok,
        durationMs: Date.now() - startedAt,
        round,
      };

      messages.push({ role: 'tool', tool_call_id: call.id, content: toolOutput });
    }
  }

  yield {
    type: 'error',
    message: `已达到最大循环次数（${maxIterations} 轮）仍未收敛，已终止。这是 Agent 的经典死循环保护。`,
  };
}

// ==============================================================================
// 4. 终端演练入口 (CLI Runner)
// ==============================================================================

async function cliRun() {
  console.log('\n' + '='.repeat(64));
  console.log('🤖【01-fundamentals】第一个智能体手写实战 (Travel Agent)');
  console.log('📖 对照 Hello-Agents 1.3 节：查询成都天气并推荐景点');
  console.log('⚡ 架构：Zod + Native Function Calling + AsyncGenerator 事件流');
  console.log('='.repeat(64) + '\n');

  const question = '你好，请帮我查询一下今天成都的天气，然后根据天气推荐一个合适的旅游景点。';
  console.log(`👤 用户提问："${question}"\n`);

  try {
    for await (const event of runFirstAgent(question)) {
      switch (event.type) {
        case 'round_start':
          console.log(`\n──────── 第 ${event.round} 轮循环 ────────`);
          break;
        case 'reasoning':
          console.log(`💭 [Reasoning 思维链]:\n   ${event.content.replace(/\n/g, '\n   ')}\n`);
          break;
        case 'thought':
          console.log(`🧠 [Thought 可见回答]:\n${event.content}\n`);
          break;
        case 'tool_call':
          console.log(`🔧 [Action 工具调用] ${event.tool}`);
          console.log(`   📥 参数: ${JSON.stringify(event.input)}`);
          break;
        case 'tool_result':
          console.log(`👁️ [Observation 观察${event.ok ? '' : '(失败)'}] ${event.durationMs}ms`);
          console.log(`   📤 结果: ${event.output}\n`);
          break;
        case 'usage':
          console.log(
            `🪙 [Usage] 本轮 ${event.totalTokens} tokens（prompt ${event.promptTokens} / completion ${event.completionTokens}），会话累计 ${event.sessionTotalTokens}`
          );
          break;
        case 'final_answer':
          console.log('='.repeat(64));
          console.log(`🎯 [Final Answer 最终建议]:\n\n${event.content}`);
          console.log('='.repeat(64));
          break;
        case 'error':
          console.error(`\n❌ [Agent 异常] ${event.message}\n`);
          break;
      }
    }
  } catch (err: unknown) {
    console.error('主运行入口捕获异常:', err);
  }
}

if (process.argv[1]?.includes('first-agent')) {
  cliRun();
}
