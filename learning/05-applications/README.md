# 第五部分：综合实战项目与毕业设计 (05-Applications)

> 对应 Hello-Agents 教程：
> * **第十三章 智能旅行助手** (Travel Assistant)
> * **第十四章 自动化深度研究智能体** (Automated Deep Research)
> * **第十五章 构建赛博小镇** (Cyber Town 多智能体社交模拟)
> * **第十六章 毕业设计与未来展望** (Capstone Project)
> 
> 参考 Python 源码目录：[`references/hello-agents/code/chapter13/`](../../references/hello-agents/code/chapter13/) ~ [`chapter16/`](../../references/hello-agents/code/chapter16/)

---

## 1. 综合实战案例剖析

1. **案例一：智能旅行助手**
   * 多工具调用链（航班/高铁查询、酒店预订模拟、天气查询、个性化日程安排）。
   * 前端展现优势：结合 Vue 3 组件化，将 Agent 的中间思考过程和生成的结构化旅行卡片做富文本交互呈现。
2. **案例二：自动化深度研究智能体 (Deep Research)**
   * 模仿 OpenAI Deep Research 范式，支持自主分解研究大纲、网页搜索、深度递归爬取、交叉验证并生成长篇 Markdown 调研报告。
3. **案例三：构建赛博小镇 (Cyber Town)**
   * 多 Agent 自主交互与环境模拟，基于 Generative Agents 原理，赋予小镇居民记忆、性格、日常作息与社交对话能力。

---

## 2. 规划目录结构

```text
learning/05-applications/
├── README.md               # 综合案例技术设计与笔记
└── src/
    ├── travel-assistant/   # 智能旅行助手实践
    ├── deep-research/      # 自动化深度研究智能体
    └── cyber-town/         # 赛博小镇多智能体模拟
```
