<script setup lang="ts">
import { ref } from 'vue';

/**
 * 「写死流程」vs「智能体循环」对照图
 *
 * 初学者最容易卡在"B 到底在转什么"。这里用同一个意外（城市名写错）同时打两边：
 * A 直接断掉，B 绕回去重试。一个开关就能看出差别。
 */

const incident = ref(false);
</script>

<template>
  <div class="pc sh-no-print">
    <div class="pc__switch" role="group" aria-label="场景切换">
      <button type="button" :class="{ 'is-active': !incident }" @click="incident = false">正常情况</button>
      <button type="button" :class="{ 'is-active': incident }" @click="incident = true">遇到意外：城市名写错了</button>
    </div>

    <div class="pc__grid">
      <!-- A：写死 -->
      <section class="pc__panel" :class="{ 'is-broken': incident }">
        <header class="pc__head">
          <span class="pc__tag pc__tag--a">A · 写死流程</span>
          <span class="pc__sub">下一步总是你写的那样</span>
        </header>

        <ol class="pc__steps">
          <li class="pc__step" :class="{ 'is-error': incident }">
            <span class="pc__n">1</span>
            <div>
              <strong>调用 getWeather("成都市区")</strong>
              <p v-if="!incident">拿到：局部多云 17.7℃</p>
              <p v-else class="pc__err">❌ 接口返回：未找到城市</p>
            </div>
          </li>
          <li class="pc__arrow" aria-hidden="true">↓</li>
          <li class="pc__step" :class="{ 'is-muted': incident }">
            <span class="pc__n">2</span>
            <div>
              <strong>调用 getAttraction(城市, 天气)</strong>
              <p>{{ incident ? '拿不到天气，这一步没有输入' : '拿到：杜甫草堂、成都博物馆' }}</p>
            </div>
          </li>
          <li class="pc__arrow" aria-hidden="true">↓</li>
          <li class="pc__step" :class="{ 'is-muted': incident }">
            <span class="pc__n">3</span>
            <div>
              <strong>总结成一段话</strong>
              <p>{{ incident ? '走不到这一步' : '输出给用户' }}</p>
            </div>
          </li>
        </ol>

        <p v-if="incident" class="pc__verdict pc__verdict--bad">
          流程在这里<strong>终止</strong>：你没写过"城市名可能写错"这个分支，代码不会自己想出来。
        </p>
        <p v-else class="pc__verdict">三步走完。快、稳、可预测——前提是一切都按你预想的来。</p>
      </section>

      <!-- B：Agent 循环 -->
      <section class="pc__panel" :class="{ 'is-retry': incident }">
        <header class="pc__head">
          <span class="pc__tag pc__tag--b">B · Agent 循环</span>
          <span class="pc__sub">下一步由模型看着"本子"决定</span>
        </header>

        <ol class="pc__steps">
          <li class="pc__step">
            <span class="pc__n">↻</span>
            <div>
              <strong>模型读本子，决定下一步</strong>
              <p>本子 = 系统提示 + 你的问题 + 之前所有结果</p>
            </div>
          </li>
          <li class="pc__arrow" aria-hidden="true">↓ 点单</li>
          <li class="pc__step" :class="{ 'is-error': incident }">
            <span class="pc__n">!</span>
            <div>
              <strong>工具执行 get_weather("成都市区")</strong>
              <p v-if="!incident">返回：局部多云 17.7℃</p>
              <p v-else class="pc__err">返回：未找到城市「成都市区」，请换常见城市名重试</p>
            </div>
          </li>
          <li class="pc__arrow" aria-hidden="true">↓ 结果写回本子</li>
          <li class="pc__step" :class="{ 'is-loop': incident }">
            <span class="pc__n">↺</span>
            <div>
              <strong>{{ incident ? '带着这行错误，回到第 1 步' : '带着结果，回到第 1 步' }}</strong>
              <p v-if="!incident">模型看到天气，接着点 get_attraction</p>
              <p v-else>模型读到"未找到城市"，自己把参数改成「成都」再试一次</p>
            </div>
          </li>
          <li class="pc__arrow" aria-hidden="true">↓ 直到它不再点单</li>
          <li class="pc__step pc__step--final">
            <span class="pc__n">✓</span>
            <div>
              <strong>输出答案</strong>
              <p>没有 tool_calls 就收尾</p>
            </div>
          </li>
        </ol>

        <p class="pc__verdict pc__verdict--good">
          {{ incident ? '同一个错误，B 用一轮循环自己修好了——因为它读得到错误文本。' : '正常路径下，B 和 A 结果一样，只是路径是它自己选的。' }}
        </p>
      </section>
    </div>

    <p class="pc__foot">
      差别不在"谁更聪明"，而在<strong>错误信息有没有进入模型能读到的位置</strong>。
      这也解释了为什么工具的错误提示必须写清楚。
    </p>
  </div>
</template>

<style scoped>
.pc {
  margin: 20px 0;
  padding: 14px;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-lg);
  background: var(--sh-surface-2);
}

.pc__switch {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.pc__switch button {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--sh-border);
  background: var(--sh-surface);
  color: var(--vp-c-text-2);
  cursor: pointer;
  white-space: nowrap;
}
.pc__switch button.is-active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 700;
}

.pc__grid {
  display: grid;
  align-items: start;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.pc__panel {
  padding: 12px;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius);
  background: var(--sh-surface);
  transition: border-color 0.2s var(--sh-ease-out);
}
.pc__panel.is-broken {
  border-color: var(--sh-danger);
}
.pc__panel.is-retry {
  border-color: var(--sh-observe);
}

.pc__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 10px;
}
.pc__tag {
  align-self: flex-start;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 999px;
}
.pc__tag--a {
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
}
.pc__tag--b {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.pc__sub {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

.pc__steps {
  list-style: none;
  margin: 0;
  padding: 0;
}

.pc__step {
  display: flex;
  gap: 8px;
  padding: 7px 9px;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-sm);
  background: var(--sh-surface-2);
  transition: opacity 0.2s, border-color 0.2s;
}
.pc__step strong {
  display: block;
  font-size: 12.5px;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}
.pc__step p {
  margin: 2px 0 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}
.pc__step.is-muted {
  opacity: 0.45;
}
.pc__step.is-error {
  border-color: var(--sh-danger);
  background: rgba(190, 18, 60, 0.08);
}
.pc__step.is-loop {
  border-color: var(--sh-observe);
  background: var(--sh-observe-bg);
}
.pc__step--final {
  border-color: var(--sh-final);
  background: var(--sh-final-bg);
}

.pc__n {
  flex: none;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--vp-c-text-3);
  background: var(--vp-c-default-soft);
}

.pc__err {
  color: var(--sh-danger) !important;
  font-weight: 600;
}

.pc__arrow {
  text-align: center;
  font-size: 11px;
  color: var(--vp-c-text-3);
  padding: 3px 0;
}

.pc__verdict {
  margin: 10px 0 0;
  padding: 8px 10px;
  border-radius: var(--sh-radius-sm);
  font-size: 12px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
}
.pc__verdict--bad {
  color: var(--sh-danger);
  background: rgba(190, 18, 60, 0.08);
}
.pc__verdict--good {
  color: var(--sh-observe);
  background: var(--sh-observe-bg);
}

.pc__foot {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.65;
  color: var(--vp-c-text-3);
}
.pc__foot strong {
  color: var(--vp-c-text-2);
}

@media (max-width: 760px) {
  .pc__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
