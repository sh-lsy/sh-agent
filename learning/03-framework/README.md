# 第三部分：构建你的 Agent 框架 (03-Framework)

> 对应 Hello-Agents 教程：**第六章 框架开发实践**、**第七章 构建你的Agent框架**。
> 参考 Python 源码目录：[`references/hello-agents/code/chapter6/`](../../references/hello-agents/code/chapter6/) 与 [`references/hello-agents/code/chapter7/`](../../references/hello-agents/code/chapter7/)

---

## 1. 为什么需要自研 Agent 框架？

在第二部分实现 ReAct、Plan-and-Solve 等范式后，我们会发现有很多重复逻辑：
* Prompt 模板的管理与动态组装
* 模型的统一路由与切换（OpenAI / DeepSeek / 本地 Ollama）
* 工具的注册、参数 Schema 解析与执行分发
* 会话历史与上下文修剪
* 中断、流式输出与人机协同（Human-in-the-loop）

因此，第七章的目标是从零抽象出一套轻量、清晰、属于自己的 TypeScript Agent 框架内核。

---

## 2. 前端/TypeScript 架构设计要点

不同于 Python 原版偏向类继承与重载的设计，在 TypeScript 中推荐采用组合式架构（Composition over Inheritance）：

```text
┌────────────────────────────────────────────────────────┐
│                   Agent Application                    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                 Agent Core Engine                      │
│   ├── State / Context Store (上下文与历史)              │
│   ├── Planning / Reasoner (推理与下一步决策)            │
│   └── Executor (工具分发与副作用执行)                  │
└──────────────────────────┬─────────────────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
┌──────────────┐                       ┌──────────────┐
│  LLM Client  │                       │  Tool Plugin │
│  (DeepSeek)  │                       │  (Zod-based) │
└──────────────┘                       └──────────────┘
```

---

## 3. 规划目录结构

```text
learning/03-framework/
├── README.md               # 框架架构设计说明
└── src/                    # 逐步抽离的核心模块
    ├── core/               # 智能体核心循环 (Runner / Engine)
    ├── memory/             # 记忆管理抽象接口
    ├── tools/              # 工具装饰器 / 注册器
    └── index.ts            # 框架入口导出
```
