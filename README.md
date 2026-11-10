# sh-agent 🤖

> **前端开发者的 Agent 系统学习之旅** —— 基于 Datawhale 开源教程 [Hello-Agents](https://hello-agents.datawhale.cc/)（《从零开始构建智能体》）的系统化学习笔记、TypeScript 源码重构与工程化实践。

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11+-orange.svg)](https://pnpm.io/)

---

## 🎯 项目愿景与设计初衷

1. **从前端视角系统掌握 Agent 原理**：许多经典的 AI Agent 教程以 Python 生态（LangChain, LlamaIndex, AutoGen）为主。作为 Vue 3 前端开发者，通过使用 **TypeScript / ESM** 从零手写 Agent 循环，能够更深刻地理解 LLM 的思考、规划、工具调用（Function Calling）与异步状态驱动本质。
2. **源码完整对照，随时离线学习**：完整归档 Hello-Agents 教程源码与文档作为本地镜像，免除因网络问题无法访问官方文档的困扰，支持一键在本地浏览器中极速离线阅读。
3. **多台电脑无缝同步**：设计了清晰规范的 Git 工作流与环境配置模板，支持公司电脑、家庭电脑随时无痛拉取最新进度并继续学习。
4. **AI 友好协同 (Agent-Ready)**：配备完善的 `AGENT.md` 上下文规约，方便后续使用 Antigravity、Cursor、Claude Code 等 AI 编程助手进行高质量结对编程与代码辅导。

---

## 📂 仓库整体架构与目录约定

仓库采用“**参考资料隔离，学习成果独立**”的设计哲学：

```text
sh-agent/
├── references/                 # [只读镜像] 第三方参考资料
│   ├── README.md               # 教程来源、版权声明 (CC BY-NC-SA 4.0) 及全章节索引
│   └── hello-agents/           # Git Submodule 挂载的 Hello-Agents 官方仓库
│       ├── docs/               # 官方 Markdown 教程全文 (基于 Docsify)
│       └── code/               # 官方 Python 原版示例源码 (chapter1 ~ chapter16)
│
├── learning/                   # [核心自主目录] 学习笔记、练习与 TypeScript 重构
│   ├── 01-fundamentals/        # 第一部分：智能体与大模型基础 (Ch 1~3)
│   ├── 02-paradigms/           # 第二部分：经典范式构建 (ReAct/Plan-Solve/Reflection) (Ch 4~5)
│   ├── 03-framework/           # 第三部分：从零构建 TypeScript Agent 框架 (Ch 6~7)
│   ├── 04-infrastructure/      # 第四部分：高级基础设施 (记忆/上下文/MCP通信/评估) (Ch 8~12)
│   └── 05-applications/        # 第五部分：实战进阶与毕业设计 (旅行助手/Deep Research) (Ch 13~16)
│
├── .env.example                # 环境变量模板 (包含 DeepSeek/通义/硅基流动/OpenAI 等配置)
├── AGENT.md                    # 针对 AI 编辑器与协同 Agent 的架构上下文与编码规范
├── package.json                # 项目依赖与便捷脚本 (pnpm 管理)
├── tsconfig.json               # TypeScript ESM 严格配置
└── README.md                   # 仓库主说明文档
```

---

## ⚡ 快速上手与多电脑同步

### 1. 初次克隆（多台电脑拉取）

由于参考资料采用 **Git Submodule** 挂载，克隆时请附带 `--recurse-submodules` 参数：

```bash
# 推荐克隆命令
git clone --recurse-submodules https://github.com/sh-lsy/sh-agent.git
cd sh-agent

# 若初次克隆时未加子模块参数，可运行以下命令补全拉取：
git submodule update --init --recursive
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 一键在本地浏览器离线阅读 Hello-Agents 教程

原教程自带基于 Docsify 的网页结构，无需任何复杂构建即可本地极速预览：

```bash
pnpm run docs
```
启动后访问 [http://localhost:3000](http://localhost:3000) 即可开始沉浸式离线阅读。

### 4. 配置模型 API Key

复制环境变量模板并填入你的大模型 Key（默认推荐 DeepSeek 或 硅基流动，性价比极高且完全兼容 OpenAI 协议）：

```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```
用编辑器打开 `.env` 文件，填入你的 `OPENAI_API_KEY`。

### 5. 运行第一阶段验证测试

```bash
pnpm run dev:01
```

---

## 🔄 多台电脑日常协同工作流备忘

| 操作场景 | 执行命令 |
| :--- | :--- |
| **开机开始学习前（拉取最新进度）** | `git pull origin main` |
| **完成今日练习后（提交并推送）** | `git add .`<br>`git commit -m "feat(chapter-02): 完成 ReAct 循环 TS 实现"`<br>`git push origin main` |
| **上游官方教程有勘误或更新时** | `git submodule update --remote --merge` |

---

## 🗺️ 学习路线与进度看板

* [x] **基础设施搭建**：Git 仓库初始化、子模块挂载、TS/pnpm 环境配置、AI 开发规范设定。
* [ ] **第一部分：智能体与语言模型基础**
  * [x] 通用 LLM 客户端与连通性验证 (`learning/01-fundamentals/src/llm-client.ts`)
  * [ ] 提示词工程（Prompt Engineering）与结构化输出
* [ ] **第二部分：智能体经典范式构建**
  * [x] 工具抽象与 Zod 参数校验 (`learning/02-paradigms/src/tools.ts`)
  * [ ] ReAct 循环推理机 (Reasoning + Acting)
  * [ ] Plan-and-Solve (规划与求解器)
  * [ ] Reflection (双角色生成与反思纠错)
* [ ] **第三部分：构建你的 Agent 框架**
  * [ ] 核心架构抽象与事件驱动设计
  * [ ] 工具插件系统与状态管理
* [ ] **第四部分：高级知识扩展与基础设施**
  * [ ] 记忆系统与内存向量检索 (Memory & RAG)
  * [ ] 上下文工程与 Token 动态裁剪
  * [ ] 智能体通信协议 (TypeScript 版 MCP 实现)
  * [ ] 智能体自动化评估 (Evaluation)
* [ ] **第五部分：综合案例进阶与毕业设计**
  * [ ] 智能旅行助手实战
  * [ ] 自动化深度研究智能体 (Deep Research)
  * [ ] 赛博小镇多智能体社交模拟

---

## 📜 版权声明与致谢

* 本仓库的核心参考资料源自 Datawhale 社区的开源杰作 **[Hello-Agents](https://github.com/datawhalechina/hello-agents)**，原作者团队享有原教程的全部知识产权。
* 参考材料遵循 **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)** 开源许可证。
* 本仓库中自行编写的 TypeScript 实现代码与学习笔记仅供非商业学习与交流，同样遵循 CC BY-NC-SA 4.0 协议开源。
