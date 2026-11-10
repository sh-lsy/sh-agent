# 第四部分：高级知识扩展与基础设施 (04-Infrastructure)

> 对应 Hello-Agents 教程：
> * **第八章 记忆与检索** (Memory & RAG)
> * **第九章 上下文工程** (Context Engineering)
> * **第十章 智能体通信协议 (MCP / A2A)** (Model Context Protocol & Multi-Agent)
> * **第十一章 Agentic-RL** (智能体强化学习机制)
> * **第十二章 智能体性能评估** (Evaluation)
> 
> 参考 Python 源码目录：[`references/hello-agents/code/chapter8/`](../../references/hello-agents/code/chapter8/) ~ [`chapter12/`](../../references/hello-agents/code/chapter12/)

---

## 1. 核心技术模块规划

1. **第八章 记忆系统 (Memory & RAG)**：
   * 短期记忆（Short-term Memory）：基于 Sliding Window 或 Token 预算的会话缓冲。
   * 长期记忆（Long-term Memory）：基于向量嵌入（Embedding）与向量库（如内存向量索引、Chroma 或 pgvector）的相似度检索。
2. **第九章 上下文工程 (Context Engineering)**：
   * 上下文压缩（Summarization）、结构化截断、动态 System Prompt 注入。
3. **第十章 通信协议 (MCP & A2A)**：
   * **MCP (Model Context Protocol)**：Anthropic 推出的开放协议，前端开发者可用 TypeScript SDK 快速编写 MCP Server 与 Client，接入文件系统、GitHub、浏览器等工具源。
   * **A2A (Agent to Agent)**：多智能体协作会话总线。
4. **第十二章 智能体评估 (Evaluation)**：
   * 自动化基准测试：任务完成率、幻觉率、Token 消耗与响应延时。

---

## 2. 规划目录结构

```text
learning/04-infrastructure/
├── README.md               # 基础设施概念与笔记
└── src/
    ├── memory/             # 记忆与嵌入向量检索
    ├── context/            # 上下文预算管理与压缩
    ├── mcp/                # TypeScript 实现的 MCP Client / Server
    └── eval/               # 评测与断言工具
```
