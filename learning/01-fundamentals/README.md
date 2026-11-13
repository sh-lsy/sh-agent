# 第一部分：智能体基础认知 (01-Fundamentals)

> 对标 Datawhale **Hello-Agents 第一章 初识智能体**。
> 骨架沿用原书，观点与工程实践**校准到 2026 年 11 月**：补齐 Harness、上下文工程、推理模型、
> MCP 2026-07-28 / WebMCP，删掉正则解析 Action、纯文本协议等已淘汰方案。

📖 完整讲解见文档站：`docs/01-fundamentals.md`（导读）+ `docs/01-fundamentals/1.1 ~ 1.7`

---

## 1. 代码结构

```text
learning/01-fundamentals/
├── README.md               # 本文件：设计与验收说明
└── src/
    ├── llm-client.ts       # 统一 OpenAI 兼容客户端（DeepSeek / GLM / Qwen / Ollama）
    ├── first-agent.ts      # 核心：Zod + 原生 Function Calling + AsyncGenerator 事件流
    ├── simulation.ts       # 离线仿真（不联网、数据自洽），供文档实验台复用
    └── index.ts            # 串联连通性校验与第一个 Agent 的 CLI 入口
```

## 2. 事件协议（前后端同构的关键）

`first-agent.ts` 导出的事件是终端与文档组件的**唯一契约**：

| 事件 | 携带信息 | 为什么需要它 |
| :--- | :--- | :--- |
| `round_start` | `round` | 前端按轮次分组，才能表达"循环"而不是"流水线" |
| `reasoning` | `content` | 推理模型的思维链，与可见回答是**两份产物**，且同样计费 |
| `thought` | `content` | 面向用户的可见回答（模型决定调工具时可能为空） |
| `tool_call` | `tool`, `input` | 参数已经过 Zod 校验 |
| `tool_result` | `output`, `ok`, `durationMs` | `ok` / `durationMs` 让前端能区分"失败"与"慢" |
| `usage` | 本轮 + 会话累计 token | 上下文是有预算的资源，必须可见 |
| `final_answer` | `content`（Markdown） | 前端需要渲染而不是原样打印 |
| `error` | `message`（含可操作建议） | 401 / 429 / 超时分别给不同提示 |

> 2024 年的写法只有 thought / action / observation / final 四类事件，且不带 `round` 与 `usage`，
> 前端无法做轮次分组与成本展示——这是本次重构的主要动因之一。

## 3. 三个关键设计决策

### 3.1 思维链与可见回答分离

推理模型（DeepSeek / GLM / Qwen 思考模式）在决定调用工具时，`message.content` 为 `null`，
真正的推理在 `message.reasoning_content` 里。只读 `content` 会导致：

- 思考区永远空白
- 已付费的 reasoning tokens 被丢弃

代码同时兼容 `reasoning_content`（主流）与 `reasoning`（部分实现）。

### 3.2 错误回灌，而不是抛异常

工具执行失败时不崩溃进程，而是把错误格式化成可读文本作为 `role: 'tool'` 回灌。
模型读到"缺少参数 city"后，下一轮会补参数——这才是"自我修正"的真实来源。

### 3.3 仿真逻辑下沉

旧版在"客户端兜底"和"服务端 mock"里各写了一份假流程，且 mock 会真的联网查天气，
导致"上一句说晴朗、下一句返回英文烟霾"的自相矛盾。现在：

- 仿真只有一份：`simulation.ts`
- 不联网、文案自洽、事件序列与真实链路一致
- 文档层只做 SSE 协议适配（`docs/.vitepress/server/playground-service.ts`）

## 4. 前端心智对照（Vue 3）

| Agent 概念 | Vue 3 对应物 | 差异点 |
| :--- | :--- | :--- |
| Context | Pinia store | 每次请求都要整体传输，等于每次付全量运费 |
| Tools | 事件处理器 / RPC | 模型只 emit 意图，执行与兜底在你的代码里 |
| Model | computed | 输入变才重算；但不保证幂等，同输入可能不同输出 |
| Loop | 调度器 | 循环何时停由模型判断，必须外加停止条件 |
| AgentEvent | Redux Action | 强类型、可回放，终端与 UI 消费同一份 |

## 5. 运行与验收

```bash
# 1) 真实模型跑一次完整循环（约 3 轮，消耗 2~4k tokens）
npx tsx learning/01-fundamentals/src/first-agent.ts

# 2) 连通性 + 流式 + Agent 全流程
pnpm run dev:01

# 3) 类型检查（不产生费用）
npx tsc --noEmit

# 4) 文档站（实验台在 1.4 节）
pnpm run docs:learn
```

验收点：

- [x] 真实模型下能输出 `reasoning` / `usage` 事件
- [x] 429 / 401 / 超时给出不同提示，不静默降级
- [x] 工具失败时模型能在后续轮次修正参数
- [x] 仿真模式不联网、数据自洽
- [x] 文档实验台支持暂停 / 单步 / 变速 / 重播，且变速不重发请求

## 6. 已知限制

- 天气工具主源为 `Open-Meteo`（WMO 标准代码 + 观测时间），`wttr.in` 仅作备源；两者都不可用时返回带 `【查询失败】` 的错误文本，让模型自己重试，而不是编造数据。
- `maxIterations` 默认 6，未做 token 预算硬上限（留给第 4 部分「上下文工程」展开）。
- 未接入 MCP 客户端；1.6 节只讲协议与边界，实现在第 4 部分。
