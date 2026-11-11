import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import type { ToolDefinition, ExecutableTool } from './types.js';

/**
 * 现代高阶工具定义函数 (defineTool)
 * 1. 编译期通过 z.infer<T> 自动获得 execute 的入参类型提示；
 * 2. 运行时通过 zodToJsonSchema 导出 OpenAI / DeepSeek 原生 Function Calling 标准定义；
 * 3. 内置 runSafe 防御性执行：安全解析 JSON 并拦截校验/执行异常，将其转为友好文本返回给大模型以触发自愈。
 */
export function defineTool<T extends z.ZodTypeAny>(def: ToolDefinition<T>): ExecutableTool<T> {
  return {
    ...def,
    toOpenAITool(): ChatCompletionTool {
      return {
        type: 'function',
        function: {
          name: def.name,
          description: def.description,
          parameters: zodToJsonSchema(def.schema) as Record<string, unknown>,
        },
      };
    },
    async runSafe(rawArgs: string | Record<string, unknown>): Promise<string> {
      try {
        let parsed: unknown = rawArgs;
        if (typeof rawArgs === 'string') {
          try {
            parsed = JSON.parse(rawArgs);
          } catch {
            return `【工具参数格式错误】传入的不是合法 JSON 字符串: "${rawArgs}"，请修正参数格式重试。`;
          }
        }
        const validated = def.schema.parse(parsed);
        return await def.execute(validated);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return `【工具执行错误】工具 [${def.name}] 执行异常: ${errMsg}。请根据报错重新规划下一步行动。`;
      }
    },
  };
}

/**
 * 1. 计算器工具 (安全计算数学表达式)
 */
export const calculatorTool = defineTool({
  name: 'calculator',
  description: '用于执行数学计算，输入必须是一个合法的数学算式（如 "24 * 365 + 10"）',
  schema: z.object({
    expression: z.string().describe('需要计算的数学表达式字符串'),
  }),
  execute: ({ expression }) => {
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    if (!sanitized.trim()) {
      throw new Error(`表达式为空或包含非法数学字符: "${expression}"`);
    }
    const result = Function(`'use strict'; return (${sanitized})`)();
    return String(result);
  },
});

/**
 * 2. 天气查询工具 (模拟真实天气 API)
 */
export const weatherTool = defineTool({
  name: 'get_current_weather',
  description: '查询指定城市的当前实时天气与温度情况',
  schema: z.object({
    city: z.string().describe('城市名称，例如 "北京"、"上海" 或 "深圳"'),
  }),
  execute: ({ city }) => {
    const mockWeatherMap: Record<string, string> = {
      北京: '晴，气温 18°C，西北风 2 级，空气质量优',
      上海: '多云转小雨，气温 21°C，东南风 3 级，空气质量良',
      深圳: '晴朗微热，气温 28°C，南风 1 级，湿度 65%',
      杭州: '阴，气温 19°C，微风，舒适',
    };
    return mockWeatherMap[city] || `城市 "${city}"：晴，气温 20°C（模拟数据）`;
  },
});

/**
 * 默认注册的工具列表
 */
export const defaultTools: ExecutableTool[] = [calculatorTool, weatherTool];

/**
 * 获取所有工具的 OpenAI Function Calling 协议定义数组
 */
export function getOpenAITools(tools: ExecutableTool[] = defaultTools): ChatCompletionTool[] {
  return tools.map((t) => t.toOpenAITool());
}
