import { chat, chatStream, DEFAULT_MODEL } from './llm-client.js';
import { runFirstAgent } from './first-agent.js';

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 sh-agent 第一部分验证：大模型连通性与第一个 Agent 演练');
  console.log(`📌 当前默认模型: ${DEFAULT_MODEL}`);
  console.log('='.repeat(60));

  try {
    // --------------------------------------------------------------------------
    // 阶段 1：基础连通性校验
    // --------------------------------------------------------------------------
    console.log('\n[步骤 1/3] 正在请求单轮问答 (chat)...');
    const answer = await chat('请用一句话向一位前端工程师介绍什么是 AI Agent？');
    console.log(`🤖 回复: ${answer.trim()}`);

    console.log('\n[步骤 2/3] 正在测试流式输出 (chatStream)...');
    process.stdout.write('🤖 流式输出: ');
    await chatStream('列举 2 个前端开发中最适合使用 Agent 的场景，简要说明。', (token) => {
      process.stdout.write(token);
    });
    console.log('\n');

    // --------------------------------------------------------------------------
    // 阶段 2：执行我们的第一个 Agent (Chapter 1.3 旅游规划助手)
    // --------------------------------------------------------------------------
    console.log('\n[步骤 3/3] 正在启动第一个智能体 (first-agent)...');
    const question = '你好，请帮我查询一下今天北京的天气，然后根据天气推荐一个合适的旅游景点。';
    console.log(`👤 用户目标: "${question}"\n`);

    const eventStream = runFirstAgent(question);
    for await (const event of eventStream) {
      switch (event.type) {
        case 'round_start':
          console.log(`\n──────── 第 ${event.round} 轮循环 ────────`);
          break;
        case 'reasoning':
          console.log(`💭 [Reasoning 思维链]: ${event.content}`);
          break;
        case 'thought':
          console.log(`🧠 [Thought 思考]: ${event.content}`);
          break;
        case 'tool_call':
          console.log(`🔧 [Action 工具调用]: ${event.tool}(${JSON.stringify(event.input)})`);
          break;
        case 'tool_result':
          console.log(`👁️ [Observation 观察${event.ok ? '' : '(失败)'}]: ${event.output}`);
          break;
        case 'usage':
          console.log(
            `🪙 [Usage]: 本轮 ${event.totalTokens} tokens，会话累计 ${event.sessionTotalTokens}`
          );
          break;
        case 'final_answer':
          console.log('\n🎯 [Final Answer 最终回复]:');
          console.log(event.content);
          break;
        case 'error':
          console.error(`❌ [Agent 报错]: ${event.message}`);
          break;
      }
    }

    console.log('\n✅ 恭喜！第一章环境检测与第一个智能体运行完成！');
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
