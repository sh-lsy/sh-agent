import 'dotenv/config';
import OpenAI from 'openai';

/**
 * 获取初始化的 OpenAI 兼容客户端
 * 支持配置 DeepSeek、通义千问、硅基流动、智谱等所有兼容 OpenAI 格式的接口
 */
export function createLLMClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.deepseek.com/v1';

  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error(
      '【配置提示】未检测到有效的 OPENAI_API_KEY，请在根目录创建 .env 并填入你的 API Key。参考 .env.example'
    );
  }

  return new OpenAI({
    apiKey,
    baseURL,
  });
}

/**
 * 模型角色路由（工业级轻量实践）：
 * - fast: 极速且经济，适合高频工具调用 (Tool Calling) 与 ReAct 循环
 * - reasoning: 强逻辑推理，适合任务拆解 (Planner) 与生成反思 (Reflection)
 */
export type ModelRole = 'fast' | 'reasoning' | (string & {});

export const MODEL_FAST = process.env.MODEL_FAST || process.env.DEFAULT_MODEL || 'deepseek-chat';
export const MODEL_REASONING = process.env.MODEL_REASONING || 'deepseek-reasoner';

export function resolveModel(roleOrName: ModelRole = 'fast'): string {
  if (roleOrName === 'fast') return MODEL_FAST;
  if (roleOrName === 'reasoning') return MODEL_REASONING;
  return roleOrName;
}

/**
 * 默认使用的模型名称（向前兼容）
 */
export const DEFAULT_MODEL = MODEL_FAST;

/**
 * 极简的单轮对话调用封装
 */
export async function chat(prompt: string, model: ModelRole = 'fast'): Promise<string> {
  const client = createLLMClient();
  const actualModel = resolveModel(model);

  const response = await client.chat.completions.create({
    model: actualModel,
    messages: [
      { role: 'system', content: 'You are a helpful and precise AI assistant.' },
      { role: 'user', content: prompt },
    ],
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * 流式输出调用封装
 */
export async function chatStream(
  prompt: string,
  onToken: (token: string) => void,
  model: ModelRole = 'fast'
): Promise<string> {
  const client = createLLMClient();
  const actualModel = resolveModel(model);

  const stream = await client.chat.completions.create({
    model: actualModel,
    stream: true,
    messages: [
      { role: 'system', content: 'You are a helpful and precise AI assistant.' },
      { role: 'user', content: prompt },
    ],
  });

  let fullText = '';
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || '';
    if (token) {
      fullText += token;
      onToken(token);
    }
  }

  return fullText;
}
