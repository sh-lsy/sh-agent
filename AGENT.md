# AGENT.md: AI 助手与结对编程开发规约 (AI Context & Guidelines)

> 本文件专为 **AI 编程助手（Antigravity、Cursor、Claude Code、GitHub Copilot 等）** 编写。在阅读本仓库或协助开发者编写代码时，必须严格遵守以下原则与架构约定。

---

## 1. 开发者画像与项目定位

* **开发者背景**：熟练的 **Vue 3 前端工程师**，具备扎实的 JavaScript / TypeScript 与现代前端工程化基础，正在由浅入深系统学习 AI Agent 原理与开发。
* **核心学习参考**：Datawhale 的开源教程 **Hello-Agents（《从零开始构建智能体》）**。
* **工程目标**：将教程中以 Python 为主的 Agent 原理、范式与案例，逐步转化为 **现代化、类型安全、工程化良好的 TypeScript 实现**。

---

## 2. 目录界限与绝对禁区 (Strict Boundaries)

1. **`references/` 目录为只读参考区（DO NOT MODIFY）**：
   * `references/hello-agents/` 是 Git Submodule 挂载的只读第三方仓库。
   * **严禁**在此目录下修改、新增、重命名或删除任何文件。
   * AI 仅能在该目录下进行检索和阅读，以对照原教程设计。
2. **`learning/` 目录为唯一可写学习区**：
   * 所有学习笔记、TypeScript 源码、演练脚本、测试用例全部且只能存放在 `learning/` 对应的子目录中。
   * 必须严格保持与 Hello-Agents 章节的逻辑对应。

---

## 3. TypeScript 编码风格与工程规范

1. **模块与别名规范**：
   * Node.js v22+ 环境，全面采用 **ESM (ECMAScript Modules)**。
   * **优先使用路径别名**进行跨章节模块复用：
     * `@fundamentals/*` -> `learning/01-fundamentals/src/*`
     * `@paradigms/*` -> `learning/02-paradigms/src/*`
     * `@framework/*` -> `learning/03-framework/src/*`
     * `@infra/*` -> `learning/04-infrastructure/src/*`
     * `@apps/*` -> `learning/05-applications/src/*`
     * `@/*` -> `learning/*`
2. **严禁照搬原书正则解析 Tool 方式**：
   * 原版 Python 教程第 4 章采用正则字符串抠取 `Action: ...`。这是落后的过渡方案。
   * 在 TypeScript 重构中，所有工具定义必须使用 **Zod** 定义 Schema，并通过大模型原生的 `tools` (Function Calling) 或结构化 JSON 进行交互。
3. **流式与事件驱动优先 (AsyncGenerator)**：
   * 严禁在 Agent 核心推理循环中仅依赖 `console.log` 作为唯一输出。
   * 核心推理函数应设计为返回 `AsyncGenerator<AgentEvent>` 或派发强类型事件（`thought` \| `tool_call` \| `tool_result` \| `final_answer`），使得 CLI 终端与 `docs/` 下的 VitePress Vue 3 组件能够 100% 复用同一套核心逻辑。
4. **防御性工具执行 (Defensive Tool Execution)**：
   * 任何外部工具调用（天气查询、计算、搜索等）必须包裹在 `try/catch` 中；捕获到的错误格式化为清晰的错误文本作为 Observation 返回给大模型，促使大模型感知错误并自我纠偏，严禁直接让未捕获异常崩溃整个 Node 进程。
5. **函数式与组合式优先**：
   * 契合 Vue 3 组合式 API（Composition API）思维，优先采用纯函数、高阶函数和组合对象模式，减少不必要的深层面向对象继承。

---

## 4. Python 原语至 TypeScript 转换心智对照

| Python 习惯 (原教程) | TypeScript 最佳实践 (本项目) | 转换注意点 |
| :--- | :--- | :--- |
| `dict` / `TypedDict` | `interface` / `type` + `z.infer<typeof schema>` | 参数必选/可选由 TS 严格保证 |
| `@tool` 装饰器 | `AgentTool` 配置对象 (含 `name`, `description`, `parameters`, `execute`) | 简单直观，便于单测与工具集动态注入 |
| 正则 `re.search` 匹配 Action | 大模型原生 `tools` (Function Calling) + Zod 参数校验 | 消除格式幻觉，达到生产级健壮性 |
| 同步 `time.sleep` / 阻塞调用 | `await new Promise(...)` / 非阻塞异步 | 避免任何阻塞 Node 事件循环的行为 |
| 单向 `print()` 输出日志 | `AsyncGenerator<AgentEvent>` 事件流 | 兼顾终端打印与 Vue 3 前端流式渲染 |

---

## 5. 多电脑同步与协同执行纪律

* **API Key 安全红线**：
  * 永远不要将包含了真实 API Key 的 `.env` 提交到 Git。
  * 仓库已配置 `scripts/check-secrets.mjs` 作为 Git Pre-Commit 钩子，任何以 `sk-` 开头的非占位符密钥都会导致 commit 失败。AI 在生成测试用例或示例时，一律使用 `process.env.OPENAI_API_KEY` 或占位符 `your_api_key_here`。
* **新环境对齐**：在新电脑上引导用户时，优先提示运行 `pnpm run setup` 自动对齐子模块、环境模板与安全钩子。
* **双版本文档指引**：
  * 原版参考：`pnpm run docs:ref` (端口 3000)
  * 自主学习手册：`pnpm run docs:learn` (端口 5173，基于 VitePress)
  * 双开：`pnpm run docs:all`
* **进度跟踪**：当帮助用户编写新练习或完成某个章节时，应同步更新该章节的 `README.md` 与根目录 `README.md` 及 `docs/index.md` 中的进度清单。
* **可复现验证**：编写的代码必须能通过 `npx tsx <file>` 或 `pnpm run test` 进行可复现的验证。
