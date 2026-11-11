#!/usr/bin/env node
import { execSync } from 'node:child_process';

/**
 * 敏感信息与 API Key 提交拦截器 (Git Pre-Commit Hook)
 * 用于在代码提交前扫描暂存区，杜绝泄漏私密 Token / Key
 */

const SECRET_PATTERNS = [
  {
    name: 'OpenAI / DeepSeek / 通用大模型 API Key',
    regex: /sk-[a-zA-Z0-9_\-]{20,}/g,
  },
  {
    name: 'Tavily 搜索 API Key (第 13、14 章实战必用)',
    regex: /tvly-[a-zA-Z0-9_\-]{20,}/g,
  },
  {
    name: 'LangSmith / LangChain API Key',
    regex: /lsv2_(?:pt|sk)_[a-zA-Z0-9_\-]{20,}/g,
  },
  {
    name: 'HuggingFace Token',
    regex: /hf_[a-zA-Z0-9]{20,}/g,
  },
  {
    name: '硬编码的 API_KEY / Token 赋值语句',
    regex: /(?:OPENAI_API_KEY|API_KEY|SECRET_KEY|TAVILY_API_KEY|TOKEN)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/gi,
  },
];

// 允许包含占位符的白名单列表
const WHITELIST_KEYWORDS = [
  'your_api_key_here',
  'sk-xxxx',
  'your_zhipu_api_key',
  'ollama',
  'process.env',
];

function isWhitelisted(matchText) {
  return WHITELIST_KEYWORDS.some((kw) => matchText.toLowerCase().includes(kw.toLowerCase()));
}

try {
  // 获取所有本次 git commit 暂存区的文件列表
  const stagedFilesOutput = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
  const stagedFiles = stagedFilesOutput
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);

  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  let hasError = false;

  for (const file of stagedFiles) {
    // 1. 绝对禁止提交任何本地私密环境变量文件
    if (file === '.env' || file.startsWith('.env.') && !file.endsWith('.example')) {
      console.error(`\n❌ [安全拦截] 严禁提交环境配置文件: ${file}`);
      console.error('💡 提示：请执行 git reset HEAD .env 撤销暂存，密码必须妥善保存在本地。');
      hasError = true;
      continue;
    }

    // 忽略二进制文件、子模块指针、第三方参考目录
    if (file.startsWith('references/hello-agents') || file.endsWith('.png') || file.endsWith('.jpg')) {
      continue;
    }

    // 读取暂存区文件内容
    let content = '';
    try {
      content = execSync(`git show :${file}`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    } catch {
      // 文件可能被删除
      continue;
    }

    // 2. 检查敏感正则模式
    for (const pattern of SECRET_PATTERNS) {
      const matches = content.match(pattern.regex);
      if (matches) {
        for (const match of matches) {
          if (!isWhitelisted(match)) {
            console.error(`\n🚨 [安全警报] 在文件 "${file}" 中检测到疑似明文敏感密钥！`);
            console.error(`   规则类别: ${pattern.name}`);
            console.error(`   匹配内容: ${match.slice(0, 7)}...${match.slice(-4)}`);
            console.error('   💡 请将密钥存放在本地 .env 中，代码中使用 process.env.OPENAI_API_KEY 读取。');
            hasError = true;
          }
        }
      }
    }
  }

  if (hasError) {
    console.error('\n🛑 Git Commit 已被强制终止！请清理上述敏感信息后再尝试提交。\n');
    process.exit(1);
  }

  process.exit(0);
} catch (error) {
  // 无法获取 git 差异时，安全放行但输出提示
  process.exit(0);
}
