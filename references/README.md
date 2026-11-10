# 第三方参考资料归档说明 (References Attribution & Index)

本目录为开源教程 **Hello-Agents（《从零开始构建智能体》）** 的本地参考归档，作为学习 Agent 系统架构的核心参考资料。

---

## 1. 原始来源与版权归属 (Attribution & License)

| 属性 | 说明 |
| :--- | :--- |
| **项目名称** | Hello-Agents (《从零开始构建智能体》) |
| **出品团队** | [Datawhale 开源学习社区](https://www.datawhale.cn/) |
| **在线阅读地址** | [https://hello-agents.datawhale.cc/](https://hello-agents.datawhale.cc/) |
| **GitHub 仓库** | [https://github.com/datawhalechina/hello-agents](https://github.com/datawhalechina/hello-agents) |
| **开源许可证** | **CC BY-NC-SA 4.0** (知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议) |
| **许可证全文** | 见本地文件 [`references/hello-agents/LICENSE.txt`](./hello-agents/LICENSE.txt) |

> [!IMPORTANT]
> **开源许可证合规说明 (CC BY-NC-SA 4.0)**：
> 1. **署名 (Attribution)**：本项目引用或重构 Hello-Agents 教程设计思想时，均严格注明原作者与出处链接。
> 2. **非商业性使用 (NonCommercial)**：本仓库所有学习笔记、实践代码及重构内容仅供个人学习与技术交流，严禁任何形式的商业盈利行为。
> 3. **相同方式共享 (ShareAlike)**：若对原教程内容进行修改或衍生，需在相同协议下发布。

---

## 2. 目录管理与隔离原则 (Storage Strategy)

为了保障第三方资料的完整性、版权独立性以及主仓库的整洁，本仓库采取 **Git Submodule（子模块）** 方式管理：

* **源码与文档存放路径**：[`references/hello-agents/`](./hello-agents/)
* **完全隔离**：主仓库仅记录子模块的 Git Commit 指针，第三方提交记录不会污染主仓库 `sh-agent` 的提交历史。
* **上游保持同步**：上游如有章节内容增补或勘误，可在根目录下直接拉取最新内容：
  ```bash
  git submodule update --remote --merge
  ```

---

## 3. 本地离线阅读教程 (Local Offline Docs)

Hello-Agents 的教程基于 **Docsify** 构建，无需构建或编译即可在浏览器中本地离线阅读：

```bash
# 方式 1：通过 Node.js 工具一键启动本地文档服务器（推荐）
pnpm run docs
# 或使用 npm / npx
npx serve references/hello-agents/docs -l 3000 --cors

# 方式 2：通过 Python 内置 HTTP 服务启动
pnpm run docs:py
# 即：python -m http.server 3000 -d references/hello-agents/docs
```
启动后在浏览器打开 [http://localhost:3000](http://localhost:3000) 即可离线浏览全部教程，完全避免网络波动或网站无法访问的问题。

---

## 4. 教程全章节索引与源码映射 (Chapter Index)

| 阶段 / 部分 | 章节名称 | 本地文档路径 | Python 原版代码路径 | 学习重构目录 |
| :--- | :--- | :--- | :--- | :--- |
| **第一部分：智能体与语言模型基础** | 第一章 初识智能体 | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter1/第一章%20初识智能体.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter1) | `learning/01-fundamentals/` |
| | 第二章 智能体发展史 | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter2/第二章%20智能体发展史.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter2) | `learning/01-fundamentals/` |
| | 第三章 大语言模型基础 | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter3/第三章%20大语言模型基础.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter3) | `learning/01-fundamentals/` |
| **第二部分：构建你的大语言模型智能体** | 第四章 智能体经典范式构建 (ReAct/Plan-Solve/Reflection) | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter4/第四章%20智能体经典范式构建.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter4) | `learning/02-paradigms/` |
| | 第五章 基于低代码平台的搭建 | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter5/第五章%20基于低代码平台的智能体搭建.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter5) | `learning/02-paradigms/` |
| | 第六章 框架开发实践 | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter6/第六章%20框架开发实践.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter6) | `learning/03-framework/` |
| | 第七章 构建你的Agent框架 | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter7/第七章%20构建你的Agent框架.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter7) | `learning/03-framework/` |
| **第三部分：高级知识扩展** | 第八章 记忆与检索 | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter8/第八章%20记忆与检索.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter8) | `learning/04-infrastructure/` |
| | 第九章 上下文工程 | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter9/第九章%20上下文工程.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter9) | `learning/04-infrastructure/` |
| | 第十章 智能体通信协议 (MCP/A2A) | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter10/第十章%20智能体通信协议.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter10) | `learning/04-infrastructure/` |
| | 第十一章 Agentic-RL | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter11/第十一章%20Agentic-RL.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter11) | `learning/04-infrastructure/` |
| | 第十二章 智能体性能评估 | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter12/第十二章%20智能体性能评估.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter12) | `learning/04-infrastructure/` |
| **第四部分：综合案例进阶** | 第十三章 智能旅行助手 | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter13/第十三章%20智能旅行助手.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter13) | `learning/05-applications/` |
| | 第十四章 自动化深度研究智能体 | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter14/第十四章%20自动化深度研究智能体.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter14) | `learning/05-applications/` |
| | 第十五章 构建赛博小镇 | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter15/第十五章%20构建赛博小镇.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter15) | `learning/05-applications/` |
| **第五部分：毕业设计及未来展望** | 第十六章 毕业设计 | [Docs](file:///E:/AI/sh-agent/references/hello-agents/docs/chapter16/第十六章%20毕业设计.md) | [Code](file:///E:/AI/sh-agent/references/hello-agents/code/chapter16) | `learning/05-applications/` |

---

## 5. 多电脑克隆注意事项 (Multi-machine Setup)

当你在另一台电脑拉取本仓库时，必须递归初始化子模块，否则 `references/hello-agents/` 目录会为空：

```bash
# 克隆时直接带上递归参数（最简推荐）
git clone --recurse-submodules https://github.com/sh-lsy/sh-agent.git

# 或者如果已经执行了普通 git clone，执行补全命令：
git submodule update --init --recursive
```
