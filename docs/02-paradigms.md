# 第二部分：经典智能体范式 (ReAct / Plan-and-Solve / Reflection)

> 对应原版教程：**第四章 智能体经典范式构建**、**第五章 基于低代码平台的智能体搭建**。
> 参考 Python 源码：`references/hello-agents/code/chapter4/`

---

## 1. 三大核心范式对比

| 范式名称 | 核心思路 | 优势 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **ReAct** (Reason + Act) | 思考 (Thought) 与行动 (Action) 交替迭代 | 动态应变能力极强，随时根据环境反馈调整决策 | 开放式多步骤问答、工具交互、实时检索 |
| **Plan-and-Solve** | 先生成全局计划，再逐项拆解求解 | 避免长链条迷航，步骤清晰可溯 | 确定性流程分析、多阶段数学/数据计算 |
| **Reflection** | 生成者与反思者双角色对抗纠错 | 输出质量极高，具备自愈修复能力 | 代码编写与自测、高精度文本生成 |

---

## 2. 现代 TypeScript 工具抽象 (Zod-based)

原版 Python 示例中通常使用简单的 `dict` 结构描述工具的输入输出，缺少编译时与运行时的严格类型校验。

在本项目中，我们使用 **Zod** 定义强类型工具参数：

```typescript
import { z } from 'zod';
import type { AgentTool } from './types.js';

export const calculatorTool: AgentTool = {
  name: 'calculator',
  description: '用于执行数学计算，输入必须是一个合法的数学算式',
  parameters: z.object({
    expression: z.string().describe('数学表达式字符串'),
  }),
  execute: ({ expression }) => {
    // 安全白名单过滤与安全执行
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    return String(Function(`'use strict'; return (${sanitized})`)());
  },
};
```

---

## 3. 本地验证
```bash
pnpm run dev:02
```
