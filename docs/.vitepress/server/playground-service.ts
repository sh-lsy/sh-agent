import type { ServerResponse } from 'node:http';
// 注意：本文件会被 VitePress 的 config 打包器（esbuild → 临时 mjs → Node ESM）内联，
// 该阶段不认识 vite 别名，故这里必须用相对路径；浏览器组件侧才用 @fundamentals 别名。
import { runFirstAgent } from '../../../learning/01-fundamentals/src/first-agent.js';
import { runSimulation } from '../../../learning/01-fundamentals/src/simulation.js';
import { resolveModel, DEFAULT_BASE_URL } from '../../../learning/01-fundamentals/src/llm-client.js';
import type { MetaEvent, PlaygroundEvent } from '../../../learning/01-fundamentals/src/events.js';

export interface PlaygroundRunRequest {
  prompt?: string;
  mock?: boolean;
}

const DEFAULT_PROMPT = '你好，请帮我查询一下今天成都的天气，然后根据天气推荐一个合适的旅游景点。';

export interface RuntimeStatus {
  runtime: string;
  hasApiKey: boolean;
  model: string;
  baseURL: string;
}

/** 供 /api/agent/status 使用：让页面能显示「到底在跑哪个模型」 */
export function getRuntimeStatus(): RuntimeStatus {
  const key = process.env.OPENAI_API_KEY;
  return {
    runtime: `Node.js ${process.version}`,
    hasApiKey: Boolean(key && key !== 'your_api_key_here'),
    // 与真实运行同一口径：角色路由 + 同一默认网关，避免状态页与实际跑的不一致
    model: resolveModel('fast'),
    baseURL: process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL,
  };
}

/**
 * 处理文档页的 SSE 流式运行请求。
 *
 * 设计要点：
 * 1. 仿真逻辑下沉到 learning/ 层（单一来源），文档层只做协议适配；
 * 2. 不再静默降级——没有 Key 就明确告知，而不是假装在跑真模型；
 * 3. 服务端不塞 stepDelay，节奏交给前端播放器，暂停/变速无需重发请求；
 * 4. 客户端断开（关页/刷新）即 abort：不再为看不见的页面继续烧 token。
 */
export async function handlePlaygroundRun(
  payload: PlaygroundRunRequest,
  res: ServerResponse
): Promise<void> {
  const status = getRuntimeStatus();
  const prompt = (payload.prompt || DEFAULT_PROMPT).slice(0, 2000);
  const useMock = payload.mock === true || !status.hasApiKey;

  const controller = new AbortController();
  let closed = false;
  res.on('close', () => {
    closed = true;
    controller.abort();
  });

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (event: PlaygroundEvent) => {
    if (closed) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const meta: MetaEvent = {
    type: 'meta',
    mode: useMock ? 'simulation' : 'live',
    model: status.model,
    baseURL: status.baseURL,
    reason: status.hasApiKey ? undefined : '未检测到有效 OPENAI_API_KEY，已切换到离线仿真。',
  };
  send(meta);

  try {
    const stream = useMock ? runSimulation(prompt) : runFirstAgent(prompt, { signal: controller.signal });

    for await (const event of stream) {
      if (closed) break;
      send(event);
    }
    if (!closed) res.write('data: [DONE]\n\n');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    send({ type: 'error', message: `运行时异常：${msg}` });
    if (!closed) res.write('data: [DONE]\n\n');
  } finally {
    res.end();
  }
}
