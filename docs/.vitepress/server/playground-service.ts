import type { ServerResponse } from 'node:http';
import { runFirstAgent, type AgentEvent } from '../../../learning/01-fundamentals/src/first-agent.js';
import { runSimulation } from '../../../learning/01-fundamentals/src/simulation.js';

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
    model: process.env.DEFAULT_MODEL || 'deepseek-chat',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  };
}

/**
 * 处理文档页的 SSE 流式运行请求。
 *
 * 与旧版的区别：
 * 1. 仿真逻辑下沉到 learning/ 层（单一来源），文档层只做协议适配；
 * 2. 不再静默降级——没有 Key 就明确告知，而不是假装在跑真模型；
 * 3. 服务端不再塞 stepDelay，节奏交给前端播放器，暂停/变速无需重发请求。
 */
export async function handlePlaygroundRun(
  payload: PlaygroundRunRequest,
  res: ServerResponse
): Promise<void> {
  const status = getRuntimeStatus();
  const prompt = (payload.prompt || DEFAULT_PROMPT).slice(0, 2000);
  const useMock = payload.mock === true || !status.hasApiKey;

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (event: unknown) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  send({
    type: 'meta',
    mode: useMock ? 'simulation' : 'live',
    model: status.model,
    baseURL: status.baseURL,
    reason: status.hasApiKey ? undefined : '未检测到有效 OPENAI_API_KEY，已切换到离线仿真。',
  });

  try {
    const stream = useMock ? runSimulation(prompt, 380) : runFirstAgent(prompt);

    for await (const event of stream) {
      send(event as AgentEvent);
    }
    res.write('data: [DONE]\n\n');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    send({ type: 'error', message: `运行时异常：${msg}` });
    res.write('data: [DONE]\n\n');
  } finally {
    res.end();
  }
}
