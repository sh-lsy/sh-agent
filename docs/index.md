---
layout: home

hero:
  name: "sh-agent"
  text: "前端开发者的 Agent 系统学习手册"
  tagline: "基于 Datawhale Hello-Agents 教程的 TypeScript 实践与工程重构"
  image:
    src: /images/art/hero-loop.png
    alt: 智能体循环：模型在环中反复推理与行动
    width: 694
    height: 687
  actions:
    - theme: brand
      text: 开始学习 🚀
      link: /01-fundamentals
    - theme: alt
      text: 查看经典范式 (ReAct)
      link: /02-paradigms
    - theme: alt
      text: 查看官方原版参考 📖
      link: http://localhost:3000

features:
  - title: 🎨 前端工程师视角
    details: 面向 Vue 3 / 前端开发者，打破 Python 生态垄断，从状态驱动到 Agent 循环驱动，彻底理解 AI 大脑与工具协同本质。
  - title: 🛡️ TypeScript 严格类型
    details: 使用 ESM 模块标准，结合 Zod 实现 100% 强类型工具调用参数校验与结构化输出，告别 Python 松散字典。
  - title: 📖 双版本文档同屏对照
    details: 支持同时启动官方 Hello-Agents 原版教程（Docsify 3000 端口）与自主实战手册（VitePress 5173 端口），对照学习更高效。
  - title: 🔒 密钥防泄漏安全机制
    details: 内置 Git Pre-Commit 正则扫描拦截器，杜绝 API Key 与私密配置误提交至 GitHub 公开仓库。
---

## 🗺️ 学习进展与核心模块

| 章节模块 | 原著内容对照 | 实践与 TS 重构重点 | 状态 |
| :--- | :--- | :--- | :--- |
| **01. 基础认知** | Hello-Agents Ch 1（骨架对齐，观点校准到 2026-11） | 7 节子页 + 可回放 Agent Loop 实验台、协议栈、PEAS、12 题自测 | 🟢 已完成 |
| **02. 经典范式** | Hello-Agents Ch 4~5 | ReAct 推理机、Plan-and-Solve 求解器、Reflection 反思机制 | 🟡 进行中 |
| **03. 自研框架** | Hello-Agents Ch 6~7 | 组合式 Agent 运行时架构、事件驱动、中间件机制 | ⚪ 规划中 |
| **04. 基础设施** | Hello-Agents Ch 8~12 | 记忆系统、上下文预算裁剪、MCP (Model Context Protocol) 协议 | ⚪ 规划中 |
| **05. 综合实战** | Hello-Agents Ch 13~16 | 智能旅行助手、自动化 Deep Research 深度研究 Agent、赛博小镇 | ⚪ 规划中 |
