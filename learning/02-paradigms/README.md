# 第二部分：智能体经典范式构建 (02-Paradigms)

> 对应 Hello-Agents 教程：**第四章 智能体经典范式构建**、**第五章 基于低代码平台的智能体搭建**。
> 参考 Python 源码目录：[`references/hello-agents/code/chapter4/`](../../references/hello-agents/code/chapter4/)

---

## 1. 核心智能体范式解析

本章节实现三个最经典、最基石的 Agent 推理与执行架构：

1. **ReAct 范式 (Reasoning + Acting)**：
   * **循环机制**：`Thought` (思考) -> `Action` (选择工具与参数) -> `Observation` (执行工具获取结果) -> `Thought` ... -> `Final Answer`。
   * **核心解决的问题**：让大模型不仅能“空想”，还能借助外部计算器、搜索、数据库来获取实时环境反馈。
2. **Plan-and-Solve 范式 (规划与解决)**：
   * **核心思想**：先由 Planner 将宏观复杂任务拆解成有序的具体子步骤列表（Plan），再由 Solver 逐个执行子任务并累积上下文。
   * **对比 ReAct**：适合步骤相对确定、多步骤协同的分析计算任务，避免 ReAct 在长任务中容易出现的迷航或死循环。
3. **Reflection 范式 (反思与自我纠错)**：
   * **核心思想**：Generator (生成者) 产生初始草稿 -> Evaluator (评估/反思者) 依据评测标准挑刺并输出修改建议 -> Generator 根据反馈迭代修正。
   * **应用场景**：代码审查与修复、高规格公文润色、学术论文论证。

---

## 2. Python 原作与 TypeScript 实现映射对照

| 教程 Python 文件 (`chapter4/`) | TypeScript 实现文件 | 核心技术差异与 TS 优势 |
| :--- | :--- | :--- |
| `tools.py` | `src/tools.ts` | Python 使用 dict 定义参数 schema；TS 使用 **Zod** 定义工具参数，天然具备强类型提示与运行时校验 |
| `llm_client.py` | `../01-fundamentals/src/llm-client.ts` | 复用统一的异步 OpenAI 兼容客户端 |
| `ReAct.py` | `src/react-agent.ts` | 采用标准的正则或结构化 JSON 解析 Thought 与 Action，全流程 Promise 化 |
| `Plan_and_solve.py` | `src/plan-and-solve.ts` | 结构化步骤数组 `Array<PlanStep>` 与类型守卫 |
| `Reflection.py` | `src/reflection-agent.ts` | 双角色提示词闭环，控制最大反思轮数（Max Iterations） |

---

## 3. 本地代码结构

```text
learning/02-paradigms/
├── README.md               # 范式原理与设计笔记
└── src/
    ├── types.ts            # Agent、Tool、Action、Observation 的通用 TypeScript 类型
    ├── tools.ts            # 基础工具库（计算器、查询天气模拟、简单搜索等）
    └── index.ts            # 范式运行演示入口
```

---

## 4. 运行与验证

在根目录下执行：
```bash
pnpm run dev:02
# 或使用 npx
npx tsx learning/02-paradigms/src/index.ts
```
