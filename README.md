# sh-agent 🤖

> **前端开发者的 Agent 系统学习之旅** —— 基于 Datawhale 开源教程 [Hello-Agents](https://hello-agents.datawhale.cc/)（《从零开始构建智能体》）的系统化学习笔记、TypeScript 源码重构与工程化实践。

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11+-orange.svg)](https://pnpm.io/)
[![VitePress](https://img.shields.io/badge/VitePress-1.6+-emerald.svg)](https://vitepress.dev/)

---

## 🎯 项目愿景与设计初衷

1. **从前端视角系统掌握 Agent 原理**：许多经典的 AI Agent 教程以 Python 生态为主。作为 Vue 3 前端开发者，通过使用 **TypeScript / ESM** 从零手写 Agent 循环，更深刻地理解 LLM 的思考、规划、工具调用（Function Calling）与异步状态驱动本质。
2. **双版本本地文档同屏对照**：
   * **参考文档**：完整的 Hello-Agents 官方教程（基于 Docsify），本地 3000 端口开箱即读，杜绝网络故障。
   * **学习文档**：基于 **VitePress** 搭建的自主实战手册（本地 5173 端口），契合 Vue 3 开发者习惯，沉淀笔记与交互式 Agent 组件。
   * 支持一键双开，左右分屏高效对照。
3. **零踩坑跨电脑无缝同步**：提供一键环境初始化脚本与明确的 AI / 开发者引导，在新电脑上克隆后一键补齐所有子模块与缺失配置。
4. **硬核 API Key 防泄漏安全机制**：内置 Git Pre-commit 钩子，每次提交自动扫描暂存区敏感 Token（如 `sk-xxxx`），彻底杜绝密钥意外推送到 GitHub 公开仓库。

---

## 📂 仓库整体架构与目录约定

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
├── docs/                       # [自主学习站点] 基于 VitePress 构建的学习实战手册
│   ├── .vitepress/config.mts   # VitePress 导航、侧边栏与主题配置
│   └── index.md                # 学习站点首页与章节导航
│
├── scripts/                    # 工程与自动化运维脚本
│   ├── check-secrets.mjs       # Git Pre-commit API Key 敏感信息扫描拦截器
│   └── setup.mjs               # 跨电脑一键初始化与环境对齐脚本
│
├── .env.example                # 环境变量模板 (包含 DeepSeek/通义/硅基流动/OpenAI 等配置)
├── AGENT.md                    # 针对 AI 编辑器与协同 Agent 的架构上下文与编码规范
├── package.json                # 项目依赖与双文档启动脚本 (pnpm 管理)
├── tsconfig.json               # TypeScript ESM 严格配置
└── README.md                   # 仓库主说明文档
```

---

## ⚡ 首次拉取与跨电脑初始化指南 (重要)

当你（或 AI 编程助手）在一台新电脑上初次拉取本仓库时，请按以下步骤操作：

### 方案 A：标准自动化流程（推荐）

```bash
# 1. 递归克隆主仓库与子模块
git clone --recurse-submodules https://github.com/sh-lsy/sh-agent.git
cd sh-agent

# 2. 安装项目依赖
pnpm install

# 3. 运行一键初始化脚本 (自动补齐子模块、生成 .env、安装 Pre-commit 安全钩子)
pnpm run setup
```

运行 `pnpm run setup` 会自动完成：
1. 检查 `references/hello-agents` 是否为空，若为空自动执行 `git submodule update --init --recursive`。
2. 检查本地是否存在 `.env`，若缺失则自动从 `.env.example` 复制生成（**不会覆盖已有配置**）。
3. 自动将 `scripts/check-secrets.mjs` 安装到 `.git/hooks/pre-commit`，激活敏感密钥防泄漏保护。

### 方案 B：纯手动分步执行（适合排错或无脚本环境）

```bash
# 若克隆时忘记加 --recurse-submodules，手动拉取子模块
git submodule update --init --recursive

# 手动复制环境变量模板
cp .env.example .env    # Linux / macOS
Copy-Item .env.example .env # Windows PowerShell

# 手动编辑 .env 文件，填入你的 OPENAI_API_KEY
```

---

## 🔒 密钥防泄漏安全机制 (API Key Protection)

为了保护你的个人财产与 API 额度，本项目部署了**双层防护**：

1. **第一层（忽略层）**：`.gitignore` 严格忽略 `.env`、`.env.local` 及所有包含私密配置的文件。
2. **第二层（拦截层）**：`scripts/check-secrets.mjs` 会在每次 `git commit` 时自动扫描暂存区所有变更，若发现任何包含真实 `sk-xxxx` 密钥特征或明文赋值，将**强行中断提交并在控制台红色报警**。

> [!CAUTION]
> 绝不要将真实 API Key 写入代码中或提交到公共仓库。若必须在示例中演示，请使用 `your_api_key_here` 或 `sk-xxxx` 等白名单占位符。

---

## 📖 双版本本地文档启动说明

你可以根据需要单独启动某一个版本的文档，或使用一键命令同时打开两个文档对照学习：

| 启动命令 | 文档类型 | 本地访问地址 | 说明 |
| :--- | :--- | :--- | :--- |
| **`pnpm run docs:ref`** | **Hello-Agents 官方教程** | [http://localhost:3000](http://localhost:3000) | 原版教程，Docsify 驱动，适合查看原版概念与思路 |
| **`pnpm run docs:learn`** | **sh-agent 自主学习手册** | [http://localhost:5173](http://localhost:5173) | VitePress 驱动，包含你的笔记、TS 重构思路与组件演示 |
| **`pnpm run docs:all`** | **双文档同时启动 (推荐)** | 3000 + 5173 端口 | 同时启动两个服务，建议左右分屏对照阅读 |

---

## 🔄 多台电脑日常协同工作流备忘

| 操作场景 | 执行命令 |
| :--- | :--- |
| **开机开始学习前（拉取最新进度）** | `git pull origin main` |
| **今日学习提交推送（自动触发防泄漏检查）** | `git add .`<br>`git commit -m "feat(paradigms): 完成 ReAct 循环 TS 实现"`<br>`git push origin main` |
| **上游 Hello-Agents 官方教程更新时** | `git submodule update --remote --merge` |

---

## 🗺️ 学习路线与进度看板

* [x] **基础设施搭建**：Git 仓库初始化、子模块挂载、TS/pnpm 环境配置、AI 开发规范设定。
* [x] **双版本文档站点**：官方 Docsify 本地镜像 (3000) + 自主 VitePress 学习手册 (5173)。
* [x] **多端环境对齐与防泄漏拦截**：`pnpm run setup` 一键同步 + Pre-commit 密钥拦截。
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
