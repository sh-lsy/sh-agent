<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * 该用工作流还是 Agent？—— 三个问题给出结论
 *
 * 这比"记住概念"更有用：读者可以拿自己手上的需求直接套。
 */

const q1 = ref<boolean | null>(null); // 步骤固定？
const q2 = ref<boolean | null>(null); // 分支无法穷举、且依赖上一步？
const q3 = ref<boolean | null>(null); // 跨组织且不能共享上下文？

const verdict = computed(() => {
  if (q1.value === null) {
    return {
      key: 'idle',
      title: '先回答第一个问题',
      body: '大多数需求在这一步就能定下来：步骤固定的，一律用工作流。',
    };
  }
  if (q1.value === true) {
    return {
      key: 'workflow',
      title: '用工作流（Workflow）',
      body: '步骤能提前写死，就用代码把顺序固定下来。更快、更便宜、出错能精确定位到第几步。不需要 Agent。',
    };
  }
  if (q2.value === null) {
    return {
      key: 'idle',
      title: '继续回答第二个问题',
      body: '步骤不固定时，才需要判断"分支能不能穷举"。',
    };
  }
  if (q2.value === false) {
    return {
      key: 'workflow',
      title: '仍然用工作流（带条件分支）',
      body: '步骤虽然不固定，但分支是有限的、你能列全的，那就写成 if/else 或状态机，不要让模型自己决定。',
    };
  }
  if (q3.value === true) {
    return {
      key: 'multi',
      title: '单 Agent 优先，跨组织时才考虑 A2A',
      body: '只有参与者属于不同组织、且不能共享内部上下文时，才值得上多智能体协议。否则多一个 Agent 就多一份上下文、多一份账单、多一层误差累积。',
    };
  }
  return {
    key: 'agent',
    title: '用单个 Agent（循环 + 工具）',
    body: '分支无法穷举、下一步又依赖上一步结果——这才是 Agent 的正当理由。记得配上最大轮数和预算上限。',
  };
});

function reset() {
  q1.value = null;
  q2.value = null;
  q3.value = null;
}
</script>

<template>
  <div class="wa sh-no-print">
    <div class="wa__grid">
      <!-- 左：两种形状 -->
      <div class="wa__shapes">
        <div class="wa__shape">
          <div class="wa__shape-title">工作流：一条固定的线</div>
          <div class="wa__chain">
            <span>取数</span><i>→</i><span>计算</span><i>→</i><span>套模板</span><i>→</i><span>发送</span>
          </div>
          <p class="wa__shape-note">顺序写死在代码里，出错能定位到具体哪一步。</p>
        </div>
        <div class="wa__shape">
          <div class="wa__shape-title">Agent：一个会绕圈的环</div>
          <div class="wa__chain wa__chain--loop">
            <span>看情况</span><i>↻</i><span>调工具</span><i>↻</i><span>看结果</span>
          </div>
          <p class="wa__shape-note">走几步、走到哪，运行时才定，所以要加停止条件。</p>
        </div>
      </div>

      <!-- 右：三问 -->
      <div class="wa__quiz">
        <div class="wa__row">
          <p>① 步骤能否提前写死？</p>
          <div class="wa__btns">
            <button type="button" :class="{ on: q1 === true }" @click="q1 = true">能</button>
            <button type="button" :class="{ on: q1 === false }" @click="q1 = false">不能</button>
          </div>
        </div>

        <div class="wa__row" :class="{ 'is-dim': q1 !== false }">
          <p>② 分支是否无法穷举，且下一步依赖上一步结果？</p>
          <div class="wa__btns">
            <button type="button" :class="{ on: q2 === true }" @click="q2 = true">是</button>
            <button type="button" :class="{ on: q2 === false }" @click="q2 = false">不是</button>
          </div>
        </div>

        <div class="wa__row" :class="{ 'is-dim': q1 !== false || q2 !== true }">
          <p>③ 参与者是否跨组织、且不能共享上下文？</p>
          <div class="wa__btns">
            <button type="button" :class="{ on: q3 === true }" @click="q3 = true">是</button>
            <button type="button" :class="{ on: q3 === false }" @click="q3 = false">不是</button>
          </div>
        </div>

        <div class="wa__verdict" :class="`is-${verdict.key}`" aria-live="polite">
          <strong>{{ verdict.title }}</strong>
          <p>{{ verdict.body }}</p>
        </div>

        <button type="button" class="wa__reset" @click="reset">重新选</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wa {
  margin: 20px 0;
  padding: 14px;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-lg);
  background: var(--sh-surface-2);
}

.wa__grid {
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: 14px;
}

.wa__shapes {
  display: grid;
  gap: 10px;
  align-content: start;
}

.wa__shape {
  padding: 10px 12px;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius);
  background: var(--sh-surface);
}

.wa__shape-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 6px;
}

.wa__chain {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.wa__chain span {
  font-size: 11.5px;
  padding: 3px 8px;
  border-radius: var(--sh-radius-sm);
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
  white-space: nowrap;
}
.wa__chain i {
  font-style: normal;
  color: var(--vp-c-text-3);
  font-size: 11px;
}
.wa__chain--loop span {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.wa__chain--loop i {
  color: var(--vp-c-brand-1);
}

.wa__shape-note {
  margin: 6px 0 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--vp-c-text-3);
}

.wa__quiz {
  display: grid;
  gap: 8px;
  align-content: start;
}

.wa__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius);
  background: var(--sh-surface);
  transition: opacity 0.2s var(--sh-ease-out);
}
.wa__row.is-dim {
  opacity: 0.5;
}
.wa__row p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--vp-c-text-1);
}

.wa__btns {
  display: flex;
  gap: 4px;
  flex: none;
}
.wa__btns button {
  font-size: 11.5px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--sh-border);
  background: var(--sh-surface-2);
  color: var(--vp-c-text-2);
  cursor: pointer;
  white-space: nowrap;
}
.wa__btns button.on {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 700;
}

.wa__verdict {
  padding: 10px 12px;
  border-radius: var(--sh-radius);
  border-left: 3px solid var(--sh-border-strong);
  background: var(--sh-surface);
}
.wa__verdict strong {
  font-size: 13px;
  color: var(--vp-c-text-1);
}
.wa__verdict p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}
.wa__verdict.is-workflow {
  border-left-color: var(--sh-action);
}
.wa__verdict.is-agent {
  border-left-color: var(--vp-c-brand-1);
}
.wa__verdict.is-multi {
  border-left-color: var(--sh-final);
}

.wa__reset {
  justify-self: start;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--sh-border);
  background: none;
  color: var(--vp-c-text-3);
  cursor: pointer;
}

@media (max-width: 760px) {
  .wa__grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .wa__row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
