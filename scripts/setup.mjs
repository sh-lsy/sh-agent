#!/usr/bin/env node
import { existsSync, copyFileSync, writeFileSync, chmodSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();

console.log('='.repeat(60));
console.log('🚀 sh-agent 项目一键初始化与跨电脑环境对齐脚本');
console.log('='.repeat(60));

// 1. 检查并补全 Git Submodule (Hello-Agents 原料库)
console.log('\n[1/4] 检查参考资料子模块 (Git Submodule)...');
const submoduleDocsPath = resolve(rootDir, 'references/hello-agents/docs/index.html');
if (!existsSync(submoduleDocsPath)) {
  console.log('  ⚠️ 检测到子模块未初始化或内容为空，正在自动拉取 Hello-Agents...');
  try {
    execSync('git submodule update --init --recursive', { stdio: 'inherit' });
    console.log('  ✅ 子模块初始化拉取成功！');
  } catch (err) {
    console.error('  ❌ 子模块拉取失败，请检查网络或执行 git submodule update --init --recursive');
  }
} else {
  console.log('  ✅ 参考资料子模块已就绪 (references/hello-agents)');
}

// 2. 检查并初始化本地环境变量 .env
console.log('\n[2/4] 检查本地大模型配置文件 (.env)...');
const envPath = resolve(rootDir, '.env');
const envExamplePath = resolve(rootDir, '.env.example');

if (!existsSync(envPath)) {
  if (existsSync(envExamplePath)) {
    copyFileSync(envExamplePath, envPath);
    console.log('  ✅ 已自动从 .env.example 生成本地 .env 文件');
    console.log('  👉 记得打开 .env 填入你的大模型 API Key（推荐使用 DeepSeek 或 硅基流动）！');
  } else {
    console.log('  ⚠️ 未找到 .env.example 模板');
  }
} else {
  console.log('  ✅ 本地 .env 文件已存在，无需覆盖');
}

// 3. 安装 Git Pre-Commit 防泄漏安全钩子
console.log('\n[3/4] 配置 Git Pre-Commit 敏感密钥防泄漏拦截器...');
const gitHooksDir = resolve(rootDir, '.git/hooks');
if (existsSync(gitHooksDir)) {
  const preCommitHookPath = join(gitHooksDir, 'pre-commit');
  const hookScript = `#!/bin/sh\nnode scripts/check-secrets.mjs\n`;
  try {
    writeFileSync(preCommitHookPath, hookScript, { encoding: 'utf-8', mode: 0o755 });
    console.log('  ✅ Git Pre-commit 钩子配置成功！将在每次 commit 时自动扫描拦截 API Key 泄漏。');
  } catch (err) {
    console.log('  ⚠️ 写入 pre-commit 钩子失败:', err.message);
  }
} else {
  console.log('  ℹ️ 未检测到 .git 目录，跳过钩子配置。');
}

// 4. 依赖完整性提示
console.log('\n[4/4] 依赖与环境状态核验...');
console.log('  ✅ Node.js 版本:', process.version);
console.log('  ✅ 工作目录:', rootDir);

console.log('\n' + '='.repeat(60));
console.log('🎉 初始化检查全部完成！你可以随时运行以下命令：');
console.log('  📖 阅读官方参考教程:    pnpm run docs:ref   (http://localhost:3000)');
console.log('  📝 打开自主学习实战文档: pnpm run docs:learn (http://localhost:5173)');
console.log('  🚀 同时启动双版本文档:   pnpm run docs:all');
console.log('  ⚡ 测试大模型连通性:     pnpm run dev:01');
console.log('='.repeat(60) + '\n');
