<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * 自测题卡片
 * 只做一件事：选了立刻判对错并给解释，不收藏分数——自测的目的是暴露盲区。
 */
const props = withDefaults(
  defineProps<{
    index?: number;
    question: string;
    options: string[];
    answer: number;
    explain: string;
  }>(),
  { index: 0 }
);

const picked = ref<number | null>(null);
const revealed = computed(() => picked.value !== null);
const isRight = computed(() => picked.value === props.answer);

function choose(i: number) {
  if (revealed.value) return;
  picked.value = i;
}

function retry() {
  picked.value = null;
}
</script>

<template>
  <div class="quiz" :class="{ 'is-right': revealed && isRight, 'is-wrong': revealed && !isRight }">
    <div class="quiz__q">
      <span class="quiz__num">Q{{ index }}</span>
      <span v-html="question"></span>
    </div>

    <ul class="quiz__options">
      <li v-for="(opt, i) in options" :key="i">
        <button
          type="button"
          class="quiz__opt"
          :class="{
            'is-picked': picked === i,
            'is-answer': revealed && i === answer,
            'is-miss': revealed && picked === i && i !== answer,
          }"
          :disabled="revealed"
          @click="choose(i)"
        >
          <span class="quiz__key">{{ String.fromCharCode(65 + i) }}</span>
          <span v-html="opt"></span>
        </button>
      </li>
    </ul>

    <div v-if="revealed" class="quiz__feedback" aria-live="polite">
      <p class="quiz__verdict">
        {{ isRight ? '✅ 正确' : `❌ 正确答案是 ${String.fromCharCode(65 + answer)}` }}
      </p>
      <p class="quiz__explain" v-html="explain"></p>
      <button type="button" class="quiz__retry" @click="retry">再试一次</button>
    </div>
  </div>
</template>

<style scoped>
.quiz {
  margin: 16px 0;
  padding: 14px 16px;
  border: 1px solid var(--sh-border);
  border-left: 3px solid var(--vp-c-brand-1);
  border-radius: var(--sh-radius);
  background: var(--sh-surface);
}
.quiz.is-right {
  border-left-color: var(--sh-observe);
}
.quiz.is-wrong {
  border-left-color: var(--sh-danger);
}

.quiz__q {
  display: flex;
  gap: 8px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--vp-c-text-1);
}
.quiz__num {
  flex: none;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  padding-top: 2px;
}

.quiz__options {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.quiz__opt {
  width: 100%;
  display: flex;
  gap: 9px;
  align-items: flex-start;
  text-align: left;
  padding: 8px 11px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--vp-c-text-1);
  background: var(--sh-surface-2);
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-sm);
  cursor: pointer;
  transition: border-color 0.15s var(--sh-ease-out), background 0.15s var(--sh-ease-out);
}
.quiz__opt:hover:not(:disabled) {
  border-color: var(--vp-c-brand-2);
  background: var(--vp-c-brand-soft);
}
.quiz__opt:disabled {
  cursor: default;
}
.quiz__opt.is-answer {
  border-color: var(--sh-observe);
  background: var(--sh-observe-bg);
}
.quiz__opt.is-miss {
  border-color: var(--sh-danger);
  background: rgba(190, 18, 60, 0.08);
}

.quiz__key {
  flex: none;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  font-size: 10.5px;
  font-weight: 700;
  border-radius: 4px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}

.quiz__feedback {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--sh-border);
}
.quiz__verdict {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}
.quiz__explain {
  margin: 6px 0 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}
.quiz__retry {
  margin-top: 8px;
  font-size: 11.5px;
  padding: 3px 10px;
  border: 1px solid var(--sh-border);
  border-radius: 999px;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
</style>
