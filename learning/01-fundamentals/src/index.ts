import { chat, chatStream, DEFAULT_MODEL } from './llm-client.js';

async function main() {
  console.log('='.repeat(50));
  console.log('🚀 sh-agent 第一部分验证：大模型连通性与基础测试');
  console.log(`📌 当前默认模型: ${DEFAULT_MODEL}`);
  console.log('='.repeat(50));

  try {
    console.log('\n[测试 1] 正在请求单轮问答 (chat)...');
    const answer = await chat('请用一句话向一位前端工程师介绍什么是 AI Agent？');
    console.log(`🤖 回复: ${answer.trim()}`);

    console.log('\n[测试 2] 正在测试流式输出 (chatStream)...');
    process.stdout.write('🤖 流式输出: ');
    await chatStream('列举 3 个前端开发中最适合使用 Agent 的场景，简要说明。', (token) => {
      process.stdout.write(token);
    });
    console.log('\n\n✅ 基础环境与大模型通信测试完成！');
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('\n❌ 调用出错:', err.message);
    } else {
      console.error('\n❌ 发生未知错误:', err);
    }
    console.log('\n💡 提示：如果尚未配置 API Key，请先检查根目录下的 .env 文件。');
  }
}

main();
