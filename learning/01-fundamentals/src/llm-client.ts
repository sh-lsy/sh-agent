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
 * 默认使用的模型名称
 */
export const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'deepseek-chat';

/**
 * 极简的单轮对话调用封装
 */
export async function chat(prompt: string, model: string = DEFAULT_MODEL): Promise<string> {
  const client = createLLMClient();
  const response = await client.chat.completions.create({
    model,
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
  model: string = DEFAULT_MODEL
): Promise<string> {
  const client = createLLMClient();
  const stream = await client.chat.completions.create({
    model,
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
