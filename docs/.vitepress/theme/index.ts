import DefaultTheme from 'vitepress/theme';
import type { App } from 'vue';

import './styles/tokens.css';
import './styles/component.css';

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

export default {
  extends: DefaultTheme,
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
  },
};
