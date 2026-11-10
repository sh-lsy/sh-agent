# 第一部分：智能体与语言模型基础 (01-Fundamentals)

> 对应 Hello-Agents 教程：**第一章 初识智能体**、**第二章 智能体发展史**、**第三章 大语言模型基础**。

---

## 1. 学习目标与核心概念

* **什么是智能体 (Agent)**：大语言模型（LLM）充当思考与决策“大脑”，结合感知输入（Perception）、内部记忆（Memory）、规划推理（Planning）与工具执行（Action/Tools），具备自主完成复杂任务的能力。
* **Agent vs 传统工作流 (Workflow)**：
  * **传统工作流**：硬编码的条件分支（if-else / DAG 图），执行路径确定。
  * **智能体**：大模型根据当前环境状态动态决定下一步是调用工具、继续思考还是输出最终答案。
* **前端开发者的认知迁移**：
  * 从前端组件状态驱动（UI = f(state)）到 Agent 循环驱动（Next Action = LLM(Context, Tools)）。
  * 将大模型输出看作异步外部事件流（SSE / EventStream），工具调用看作受控的异步副作用（Async Actions）。

---

## 2. Python 原作与 TypeScript 实现映射对照 (Code Mapping)

| 原教程 Python 概念/代码 | TypeScript / 前端实现范式 | 说明与差异 |
| :--- | :--- | :--- |
| `openai` Python SDK (同步/异步) | `openai` Node.js SDK (原生 Promise / async-await) | TS 原生全异步，配合 ESM 模块规范 |
| `python-dotenv` 读取 `.env` | `dotenv` 模块 | `import 'dotenv/config'`，通过 `process.env` 读取 |
| `dict` 结构传递消息 | TypeScript `ChatCompletionMessageParam` 联合类型 | 强类型约束 `system` / `user` / `assistant` / `tool` 角色 |
| `print(response)` 同步控制台输出 | `process.stdout.write` 或前端流式渲染 | TS 练习中先实现控制台流式与非流式打印 |

---

## 3. 本地代码结构

```text
learning/01-fundamentals/
├── README.md               # 学习笔记与概念对照
└── src/
    ├── llm-client.ts       # 统一的大模型客户端封装（兼容各大国产与国际模型）
    └── index.ts            # 基础调用与连通性验证可执行示例
```

---

## 4. 运行与验证

在根目录下复制环境变量文件并配置你的 API Key：
```bash
# 复制环境变量模板
cp .env.example .env
# 编辑 .env 文件，填入你的 OPENAI_API_KEY
```

执行本章快速验证脚本：
```bash
pnpm run dev:01
# 或使用 npx
npx tsx learning/01-fundamentals/src/index.ts
```
若控制台成功输出大模型的打招呼回答，说明基础环境与 LLM 通信链路准备完毕！
