import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';
import { resolve, dirname } from 'node:path';
import dotenv from 'dotenv';

// 用绝对路径加载 .env：不再依赖进程 cwd。
// 旧写法是 `import 'dotenv/config'`，从 docs/ 或其它目录启动就读不到仓库根的 .env，
// 结果页面一直显示"仿真模式"，却看不出原因。
const here = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(here, '../..');
dotenv.config({ path: resolve(rootDir, '.env') });
dotenv.config({ path: resolve(here, '../.env') });

export default defineConfig({
  title: 'sh-agent 学习实战手册',
  description: '前端开发者的 Agent 系统学习之旅 —— 基于 Hello-Agents 的 TypeScript 重构实践',
  base: '/',
  lang: 'zh-CN',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]],
  vite: {
    resolve: {
      alias: [
        {
          find: '@fundamentals',
          replacement: fileURLToPath(new URL('../../learning/01-fundamentals/src', import.meta.url)),
        },
        {
          find: '@paradigms',
          replacement: fileURLToPath(new URL('../../learning/02-paradigms/src', import.meta.url)),
        },
        {
          find: '@framework',
          replacement: fileURLToPath(new URL('../../learning/03-framework/src', import.meta.url)),
        },
        {
          find: '@infra',
          replacement: fileURLToPath(new URL('../../learning/04-infrastructure/src', import.meta.url)),
        },
        {
          find: '@apps',
          replacement: fileURLToPath(new URL('../../learning/05-applications/src', import.meta.url)),
        },
        {
          find: '@',
          replacement: fileURLToPath(new URL('../../learning', import.meta.url)),
        },
      ],
    },
    plugins: [
      {
        name: 'sh-agent-local-runtime',
        configureServer(server) {
          // 本地 Agent 运行时：让 VitePress 的 5173 端口兼任轻量 Node 服务，
          // 学这一章不必额外启动 Express / Nest。
          server.middlewares.use('/api/agent/status', async (_req, res) => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            try {
              const { getRuntimeStatus } = await import('./server/playground-service.js');
              res.end(JSON.stringify({ status: 'online', ...getRuntimeStatus() }));
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              res.statusCode = 500;
              res.end(JSON.stringify({ status: 'error', message: msg }));
            }
          });

          server.middlewares.use('/api/agent/run', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              let payload: Record<string, unknown> = {};
              try {
                if (body) payload = JSON.parse(body);
              } catch {
                payload = {};
              }

              try {
                const { handlePlaygroundRun } = await import('./server/playground-service.js');
                await handlePlaygroundRun(payload, res);
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
                res.write(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`);
                res.write('data: [DONE]\n\n');
                res.end();
              }
            });
          });
        },
      },
    ],
  },
  themeConfig: {
    siteTitle: 'sh-agent 🤖',
    // 导航项控制在 5 个以内：VitePress 在 768px 才收起菜单，
    // 之前 9 项横向排列会把页面撑出 200px 横向滚动条。
    nav: [
      { text: '首页', link: '/' },
      {
        text: '学习手册',
        items: [
          { text: '① 智能体基础认知', link: '/01-fundamentals' },
          { text: '② 经典智能体范式', link: '/02-paradigms' },
          { text: '③ 自研 Agent 框架', link: '/03-framework' },
          { text: '④ 高级基础设施', link: '/04-infrastructure' },
          { text: '⑤ 综合实战', link: '/05-applications' },
        ],
      },
      { text: '2026 蓝图', link: '/roadmap-2026' },
      { text: '参考原版', link: 'http://localhost:3000' },
      { text: 'GitHub', link: 'https://github.com/sh-lsy/sh-agent' },
    ],
    sidebar: [
      {
        text: '📚 学习导航与进度',
        items: [
          { text: '项目概览与设计初衷', link: '/' },
          { text: '2026 现代架构与重构蓝图', link: '/roadmap-2026' },
        ],
      },
      {
        text: '第一部分：智能体基础认知',
        collapsed: false,
        items: [
          { text: '本章导读与学习地图', link: '/01-fundamentals' },
          { text: '1.1 什么是智能体', link: '/01-fundamentals/1.1-agent-essence' },
          { text: '1.2 三类分类维度与双系统', link: '/01-fundamentals/1.2-agent-types' },
          { text: '1.3 任务环境与 PEAS', link: '/01-fundamentals/1.3-environment' },
          { text: '1.4 Agent Loop 与上下文', link: '/01-fundamentals/1.4-agent-loop' },
          { text: '1.5 手写第一个智能体', link: '/01-fundamentals/1.5-first-agent' },
          { text: '1.6 协议栈与适用边界', link: '/01-fundamentals/1.6-protocols-and-boundary' },
          { text: '1.7 小结与自测', link: '/01-fundamentals/1.7-summary' },
        ],
      },
      {
        text: '第二部分：经典智能体范式 (TS 实现)',
        collapsed: true,
        items: [{ text: '02. ReAct / 规划 / 反思范式', link: '/02-paradigms' }],
      },
      {
        text: '第三部分：构建 Agent 框架',
        collapsed: true,
        items: [{ text: '03. 自研轻量级 TS Agent 框架', link: '/03-framework' }],
      },
      {
        text: '第四部分：高级基础设施',
        collapsed: true,
        items: [{ text: '04. 记忆 / 上下文 / MCP 通信', link: '/04-infrastructure' }],
      },
      {
        text: '第五部分：综合实战与应用',
        collapsed: true,
        items: [{ text: '05. 旅行助手 / Deep Research', link: '/05-applications' }],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/sh-lsy/sh-agent' }],
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
    darkModeSwitchLabel: '主题',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
  },
});
