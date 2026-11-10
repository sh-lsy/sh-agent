import { z } from 'zod';

/**
 * 统一的工具定义接口 (采用 Zod 进行强类型参数校验)
 */
export interface AgentTool<TParams extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  parameters: TParams;
  execute: (args: any) => Promise<string> | string;
}

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
