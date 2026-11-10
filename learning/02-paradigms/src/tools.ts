import { z } from 'zod';
import type { AgentTool } from './types.js';

/**
 * 1. 计算器工具 (安全计算算术表达式)
 */
export const calculatorTool: AgentTool<z.ZodObject<{ expression: z.ZodString }>> = {
  name: 'calculator',
  description: '用于执行数学计算，输入必须是一个合法的数学算式（如 "24 * 36 + 10"）',
  parameters: z.object({
    expression: z.string().describe('需要计算的数学表达式字符串'),
  }),
  execute: ({ expression }) => {
    try {
      // 简单白名单清洗防注入
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${sanitized})`)();
      return String(result);
    } catch {
      return `计算错误：无法解析表达式 "${expression}"`;
    }
  },
};

/**
 * 2. 天气查询工具 (模拟实现)
 */
export const weatherTool: AgentTool<z.ZodObject<{ city: z.ZodString }>> = {
  name: 'get_current_weather',
  description: '查询指定城市的当前实时天气与温度情况',
  parameters: z.object({
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
};

/**
 * 默认工具注册表
 */
export const defaultTools: AgentTool[] = [calculatorTool, weatherTool];
