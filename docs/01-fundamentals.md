# 第一部分：智能体与大模型基础认知

> 对应原版教程：**第一章 初识智能体**、**第二章 智能体发展史**、**第三章 大语言模型基础**。

---

## 1. 核心理论梳理

### 什么是智能体 (Agent)？

大语言模型（LLM）本身是一个强大的文本预测与泛化计算引擎，但它存在天然的局限：
* **无时效性**：只能基于训练截止期前的数据回答。
* **无行动力**：无法直接读写文件、查询实时数据库或调用外部 API。
* **易产生幻觉**：面对复杂长链条多步推理容易中间出现逻辑偏差。

**智能体 (Agent)** 则赋予了 LLM “手和脚”：
* **大脑 (Brain)**：负责规划、意图理解与决策。
* **感知 (Perception)**：接收外部用户输入、多模态信息或系统告警。
* **记忆 (Memory)**：短期工作记忆（上下文窗口）+ 长期记忆（向量检索）。
* **行动 (Action / Tools)**：调用外部 API、计算器、检索工具或执行系统命令。

---

## 2. 前端开发者心智迁移

对于 Vue 3 开发者来说，Agent 的运行机制与前端状态驱动有着惊人的相似之处：

```text
前端响应式范式:
UI = Render(State)
Event -> Update(State) -> Re-Render(UI)

智能体决策范式:
Action = LLM(Context, Tools)
Observation = Execute(Action) -> AppendToContext -> Next LLM Loop
```

---

## 3. TypeScript 客户端实现设计

在 `learning/01-fundamentals/src/llm-client.ts` 中，我们使用官方 `openai` Node.js SDK 构建了开箱即用的统一客户端：

```typescript
import OpenAI from 'openai';

export function createLLMClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.deepseek.com/v1';
  return new OpenAI({ apiKey, baseURL });
}
```

### 验证运行
```bash
pnpm run dev:01
```
