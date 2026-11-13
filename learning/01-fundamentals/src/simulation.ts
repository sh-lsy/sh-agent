import type { AgentEvent } from './first-agent.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 演示用固定数据：不联网、不伪装实时，避免"上一句说晴朗、下一句返回英文烟霾"的自相矛盾 */
const CITY_FIXTURE: Record<string, { desc: string; temp: number; good: string; bad: string }> = {
  成都: {
    desc: '阴',
    temp: 17,
    good: '推荐清晨前往【成都大熊猫繁育研究基地】；午后到【人民公园】鹤鸣茶社喝盖碗茶，傍晚打卡【锦里】。',
    bad: '推荐【杜甫草堂博物馆】与【成都博物馆】室内游览，或在【宽窄巷子】茶馆听川剧变脸。',
  },
  北京: {
    desc: '晴',
    temp: 12,
    good: '推荐【颐和园】或【故宫博物院】，晴天视野通透。',
    bad: '推荐【中国国家博物馆】或【故宫珍宝馆】室内参观。',
  },
  上海: {
    desc: '小雨',
    temp: 19,
    good: '推荐【外滩滨江步道】与【豫园】，晴天出片。',
    bad: '推荐【浦东美术馆】或【上海科技馆】室内光影展。',
  },
  深圳: {
    desc: '多云',
    temp: 26,
    good: '推荐【深圳湾公园】骑行与【莲花山公园】登高。',
    bad: '推荐【深圳博物馆】或【海上世界文化艺术中心】。',
  },
};

function pickCity(prompt: string): string {
  const hit = Object.keys(CITY_FIXTURE).find((c) => prompt.includes(c));
  return hit || '成都';
}

/**
 * 离线仿真：在未配置 API Key 或用户显式勾选"仿真"时使用。
 *
 * 刻意保留与真实链路一致的事件序列（reasoning / thought / tool_call /
 * tool_result / usage / final_answer），这样前端只需要一套渲染逻辑。
 */
export async function* runSimulation(
  userPrompt: string,
  stepDelay = 620
): AsyncGenerator<AgentEvent> {
  const city = pickCity(userPrompt);
  const fx = CITY_FIXTURE[city];
  const isBad = /雨|雪|霾|雾|阴/.test(fx.desc);

  yield {
    type: 'round_start',
    round: 1,
  };

  await sleep(stepDelay);
  yield {
    type: 'reasoning',
    round: 1,
    content: `用户要${city}的天气和景点推荐。这两件事有依赖关系：景点推荐需要知道天气，所以必须先调 get_weather，拿到结果后再调 get_attraction。不能并行。`,
  };

  await sleep(stepDelay);
  yield {
    type: 'thought',
    round: 1,
    content: `好的，我先查一下${city}今天的实时天气，再根据天气为你挑合适的地方。`,
  };

  await sleep(stepDelay);
  yield {
    type: 'tool_call',
    round: 1,
    tool: 'get_weather',
    input: { city },
  };

  await sleep(stepDelay);
  const weatherText = `${city}当前天气：${fx.desc}，气温 ${fx.temp}℃（仿真数据，非实时）`;
  yield {
    type: 'tool_result',
    round: 1,
    tool: 'get_weather',
    output: weatherText,
    ok: true,
    durationMs: 386,
  };

  await sleep(stepDelay);
  yield {
    type: 'usage',
    round: 1,
    promptTokens: 486,
    completionTokens: 92,
    totalTokens: 578,
    sessionPromptTokens: 486,
    sessionTotalTokens: 578,
  };

  await sleep(stepDelay);
  yield {
    type: 'round_start',
    round: 2,
  };

  await sleep(stepDelay);
  yield {
    type: 'reasoning',
    round: 2,
    content: `天气是「${fx.desc}」。${isBad ? '属于不适合长时间户外的天气，推荐方向应偏向室内场馆。' : '适合户外活动，可以推开阔的景点。'}现在把 city 和 weather 一起传给 get_attraction。`,
  };

  await sleep(stepDelay);
  yield {
    type: 'tool_call',
    round: 2,
    tool: 'get_attraction',
    input: { city, weather: fx.desc },
  };

  await sleep(stepDelay);
  yield {
    type: 'tool_result',
    round: 2,
    tool: 'get_attraction',
    output: isBad ? fx.bad : fx.good,
    ok: true,
    durationMs: 142,
  };

  await sleep(stepDelay);
  yield {
    type: 'usage',
    round: 2,
    promptTokens: 712,
    completionTokens: 268,
    totalTokens: 980,
    sessionPromptTokens: 1198,
    sessionTotalTokens: 1558,
  };

  await sleep(stepDelay);
  yield {
    type: 'final_answer',
    round: 2,
    content: `**${city}今日出行建议**

**天气**：${fx.desc}，${fx.temp}℃

**推荐路线**：${isBad ? fx.bad : fx.good}

**小贴士**
- ${isBad ? '室内场馆周一多闭馆，出发前先查开放时间。' : '户外景点建议早上前往，人少光线好。'}
- 以上为离线仿真结果，用于演示事件流；配置 API Key 后会调用真实模型与实时天气。`,
  };
}
