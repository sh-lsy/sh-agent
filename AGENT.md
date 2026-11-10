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

1. **模块与运行时规范**：
   * Node.js v22+ 环境，全面采用 **ESM (ECMAScript Modules)**。
   * 本地引用相对文件时注意遵循 NodeNext 规范（若使用相对路径导入，使用 `.js` 后缀，如 `import { foo } from './tools.js'`）。
2. **工具 Schema 与类型系统**：
   * 弃用 Python 中松散的字典形式，统一使用 **Zod** 定义 Agent 工具的输入参数 Schema。
   * 对 Agent 的核心生命周期事件（思考、决策、工具调用、工具观察、最终回答）定义清晰的 TypeScript 联合类型。
3. **函数式与组合式优先**：
   * 契合 Vue 3 组合式 API（Composition API）思维，优先采用纯函数、高阶函数和组合对象模式，减少不必要的深层面向对象继承。
4. **流式与异步优先**：
   * 全面采用 `async / await`，针对 LLM 输出设计良好的异步迭代器（AsyncGenerator）或回调接口，便于未来无缝对接前端 UI 界面（如 SSE 流式渲染）。

---

## 4. Python 原语至 TypeScript 转换心智对照

| Python 习惯 (原教程) | TypeScript 最佳实践 (本项目) | 转换注意点 |
| :--- | :--- | :--- |
| `dict` / `TypedDict` | `interface` / `type` + `z.infer<typeof schema>` | 参数必选/可选由 TS 严格保证 |
| `@tool` 装饰器 | `AgentTool` 配置对象 (含 `name`, `description`, `parameters`, `execute`) | 简单直观，便于单测与工具集动态注入 |
| `print(..., flush=True)` | `process.stdout.write` 或异步回调 | 适配控制台与 Web 流式渲染两端 |
| 同步 `time.sleep` / 阻塞调用 | `await new Promise(...)` / 非阻塞异步 | 避免任何阻塞 Node 事件循环的行为 |
| Python 正则 `re.search` 解析输出 | 优先采用大模型 JSON Mode / 结构化输出，降级使用正则清洗 | 增强鲁棒性，防御大模型格式幻觉 |

---

## 5. 多电脑同步与协同执行纪律

* 永远不要将包含了真实 API Key 的 `.env` 提交到 Git。
* 当帮助用户编写新练习或完成某个章节时，应同步更新该章节的 `README.md` 与根目录 `README.md` 中的进度清单。
* 编写的代码必须能通过 `npx tsx <file>` 或 `pnpm run test` 进行可复现的验证。
