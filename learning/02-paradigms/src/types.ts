import { z } from 'zod';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * 现代强类型工具定义接口 (采用 Zod 作为单一真理源)
 */
export interface ToolDefinition<TParams extends z.ZodTypeAny = any> {
  name: string;
  description: string;
  schema: TParams;
  execute: (args: z.infer<TParams>) => Promise<string> | string;
}

/**
 * 包装后的可执行工具对象
 */
export interface ExecutableTool<TParams extends z.ZodTypeAny = any> {
  name: string;
  description: string;
  schema: TParams;
  execute: (args: any) => Promise<string> | string;
  /** 转换为 OpenAI / DeepSeek 原生 tools Function Calling 参数格式 */
  toOpenAITool: () => ChatCompletionTool;
  /** 防御性执行：安全解析 JSON 参数，捕获异常转为自愈提示文本返回 */
  runSafe: (rawArgs: string | Record<string, unknown>) => Promise<string>;
}

/**
 * 智能体运行时事件流 (用于 AsyncGenerator 与前端 SSE 同构)
 */
export type AgentEvent =
  | { type: 'thought'; content: string }
  | { type: 'tool_call'; tool: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool: string; output: string }
  | { type: 'final_answer'; content: string }
  | { type: 'error'; message: string };

/**
 * ReAct 循环中的单个执行动作
 */
export interface AgentAction {
  tool: string;
  input: Record<string, unknown> | string;
  thought: string;
}

/**
 * 工具执行产生的观察结果
 */
export interface AgentObservation {
  action: AgentAction;
  output: string;
}

/**
 * ReAct 循环的单步记录
 */
export interface ReActStep {
  step: number;
  thought: string;
  action?: AgentAction;
  observation?: string;
}

/**
 * 最终输出结果
 */
export interface AgentExecutionResult {
  success: boolean;
  finalAnswer: string;
  steps: ReActStep[];
  totalIterations: number;
}
