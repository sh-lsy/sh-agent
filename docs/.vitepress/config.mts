import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'sh-agent 学习实战手册',
  description: '前端开发者的 Agent 系统学习之旅 —— 基于 Hello-Agents 的 TypeScript 重构实践',
  base: '/',
  lang: 'zh-CN',
  themeConfig: {
    siteTitle: 'sh-agent 🤖',
    nav: [
      { text: '首页', link: '/' },
      { text: '基础认知', link: '/01-fundamentals' },
      { text: '经典范式', link: '/02-paradigms' },
      { text: '自研框架', link: '/03-framework' },
      { text: '基础设施', link: '/04-infrastructure' },
      { text: '综合实战', link: '/05-applications' },
      { text: '参考原版', link: 'http://localhost:3000' },
      { text: 'GitHub', link: 'https://github.com/sh-lsy/sh-agent' },
    ],
    sidebar: [
      {
        text: '📚 学习导航与进度',
        items: [
          { text: '项目概览与设计初衷', link: '/' },
        ],
      },
      {
        text: '第一部分：大模型与智能体基础',
        collapsed: false,
        items: [
          { text: '01. 基础认知与 LLM 客户端', link: '/01-fundamentals' },
        ],
      },
      {
        text: '第二部分：经典智能体范式 (TS 实现)',
        collapsed: false,
        items: [
          { text: '02. ReAct / 规划 / 反思范式', link: '/02-paradigms' },
        ],
      },
      {
        text: '第三部分：构建 Agent 框架',
        collapsed: true,
        items: [
          { text: '03. 自研轻量级 TS Agent 框架', link: '/03-framework' },
        ],
      },
      {
        text: '第四部分：高级基础设施',
        collapsed: true,
        items: [
          { text: '04. 记忆 / 上下文 / MCP 通信', link: '/04-infrastructure' },
        ],
      },
      {
        text: '第五部分：综合实战与应用',
        collapsed: true,
        items: [
          { text: '05. 旅行助手 / Deep Research', link: '/05-applications' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/sh-lsy/sh-agent' },
    ],
    footer: {
      message: '基于 CC BY-NC-SA 4.0 许可证开源 | 参考 Hello-Agents (Datawhale)',
      copyright: 'Copyright © 2026 sh-lsy',
    },
    outline: {
      level: [2, 3],
      label: '本页目录',
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
  },
});
