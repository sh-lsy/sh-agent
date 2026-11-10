import { defaultTools } from './tools.js';

async function main() {
  console.log('='.repeat(55));
  console.log('🧩 sh-agent 第二部分：智能体经典范式（Paradigms）准备');
  console.log('='.repeat(55));

  console.log('\n[工具箱验证] 已加载并注册的基础 Agent 工具：');
  for (const tool of defaultTools) {
    console.log(`  🔧 [${tool.name}]: ${tool.description}`);
  }

  // 运行计算器自测
  const calc = defaultTools.find((t) => t.name === 'calculator')!;
  const calcRes = await calc.execute({ expression: '365 * 24' });
  console.log(`\n  👉 计算器测试 (一年有多少小时): 365 * 24 = ${calcRes}`);

  // 运行天气查询自测
  const weather = defaultTools.find((t) => t.name === 'get_current_weather')!;
  const weatherRes = await weather.execute({ city: '北京' });
  console.log(`  👉 天气测试 (北京): ${weatherRes}`);

  console.log('\n📚 经典范式后续演进计划：');
  console.log('  1. ReAct 智能体循环 (Thought -> Action -> Observation -> Answer)');
  console.log('  2. Plan-and-Solve 任务拆解与求解器');
  console.log('  3. Reflection 生成-反思双循环优化器');
  console.log('\n💡 详见本目录下的 README.md 对应映射与学习笔记。');
}

main();
