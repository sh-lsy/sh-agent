/**
 * 智能体运行时事件契约（纯类型模块）。
 *
 * 这里刻意不 import 任何运行时依赖（openai / zod / node）：
 * 终端 CLI、Node SSE 服务与浏览器 Vue 组件共用同一份类型，
 * 浏览器侧 import 本模块不会把 Node 依赖带进 bundle。
 *
 * 前端视角：这是一组强类型 Redux Action，终端与 UI 消费同一份事件。
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
    | {
        type: 'tool_call';
        tool: string;
        /** 模型原始 JSON 参数；Zod 校验发生在执行前 */
        input: Record<string, unknown>;
        /** 原生 Function Calling 的 call id，用于 tool_call 与 tool_result 配对 */
        callId?: string;
      }
    | {
        type: 'tool_result';
        tool: string;
        output: string;
        ok: boolean;
        durationMs: number;
        callId?: string;
      }
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
 * 传输层元事件：由文档站 SSE 适配器发出，描述「这次运行跑的是什么」，
 * 不属于核心推理循环的事件流。
 */
export interface MetaEvent {
  type: 'meta';
  mode: 'live' | 'simulation';
  model: string;
  baseURL: string;
  reason?: string;
}

/** SSE 链路上可能出现的全部事件 */
export type PlaygroundEvent = AgentEvent | MetaEvent;
