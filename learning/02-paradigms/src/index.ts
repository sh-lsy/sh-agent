import { defaultTools, getOpenAITools } from './tools.js';

async function main() {
  console.log('='.repeat(60));
  console.log('🧩 sh-agent 第二部分：2026 现代工具定义体系 (defineTool 验证)');
  console.log('='.repeat(60));

  console.log('\n[1] 验证工具注册与描述：');
  for (const tool of defaultTools) {
    console.log(`  🔧 工具 [${tool.name}]: ${tool.description}`);
  }

  console.log('\n[2] 验证大模型原生 Function Calling Schema 导出 (toOpenAITool)：');
  const openAITools = getOpenAITools();
  console.log(JSON.stringify(openAITools[0], null, 2));

  console.log('\n[3] 验证正常调用 (runSafe)：');
  const calc = defaultTools.find((t) => t.name === 'calculator')!;
  const goodRes = await calc.runSafe(JSON.stringify({ expression: '52 * 7 * 24' }));
  console.log(`  👉 算式计算结果: 52 * 7 * 24 = ${goodRes}`);

  console.log('\n[4] 验证防御性自愈拦截 (传入错误格式或空参数)：');
  const badRes = await calc.runSafe('{"invalid_param": 123}');
  console.log(`  🛡️ 拦截异常输出 (可直接作为 Observation 回传给大模型自愈):\n  ${badRes}`);

  console.log('\n✅ defineTool 现代化工具体系验证完毕！');
}

main();
