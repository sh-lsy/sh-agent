import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import type { App } from 'vue';

import './styles/tokens.css';
import './styles/component.css';

// 布局偏好的客户端兜底：dev 态是纯客户端壳，类在首绘前就位不会闪；
// build 态另有 config.mts head 内联脚本负责 SSR 首绘前恢复（需重启 dev server 才生效）。
// tsconfig 的 lib 不含 DOM（learning 侧是 Node 代码），这里用结构化类型访问浏览器全局。
const browserGlobal = globalThis as {
  document?: { documentElement: { classList: { add: (...cls: string[]) => void } } };
  localStorage?: { getItem: (key: string) => string | null };
};
if (browserGlobal.document) {
  browserGlobal.document.documentElement.classList.add('sh-wide');
  try {
    if (browserGlobal.localStorage?.getItem('sh-sidebar-collapsed') === '1') {
      browserGlobal.document.documentElement.classList.add('sh-collapsed');
    }
  } catch {
    // 忽略隐私模式等持久化不可用场景
  }
}

import AgentLoopLab from './components/AgentLoopLab.vue';
import AgentAnatomy from './components/AgentAnatomy.vue';
import TradeoffCurve from './components/TradeoffCurve.vue';
import FigureBox from './components/FigureBox.vue';
import QuizCard from './components/QuizCard.vue';
import ProtocolStack from './components/ProtocolStack.vue';
import HarnessDiagram from './components/HarnessDiagram.vue';
import PathCompare from './components/PathCompare.vue';
import WorkflowVsAgent from './components/WorkflowVsAgent.vue';
import ContextBudget from './components/ContextBudget.vue';
import EnvironmentMap from './components/EnvironmentMap.vue';
import EventFlow from './components/EventFlow.vue';
import SidebarToggle from './components/SidebarToggle.vue';

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-content-before': () => h(SidebarToggle),
    }),
  enhanceApp({ app }: { app: App }) {
    app.component('AgentLoopLab', AgentLoopLab);
    app.component('AgentAnatomy', AgentAnatomy);
    app.component('TradeoffCurve', TradeoffCurve);
    app.component('FigureBox', FigureBox);
    app.component('QuizCard', QuizCard);
    app.component('ProtocolStack', ProtocolStack);
    app.component('HarnessDiagram', HarnessDiagram);
    app.component('PathCompare', PathCompare);
    app.component('WorkflowVsAgent', WorkflowVsAgent);
    app.component('ContextBudget', ContextBudget);
    app.component('EnvironmentMap', EnvironmentMap);
    app.component('EventFlow', EventFlow);
  },
};
