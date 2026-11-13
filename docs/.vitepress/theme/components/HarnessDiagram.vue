<script setup lang="ts">
/**
 * Harness 六层结构图
 *
 * 用 CSS 网格而不是 ASCII 画，原因很实际：ASCII 在手机上会横向溢出，
 * 而这张图要表达的核心恰恰是"模型被六个部件包住"。
 */

const parts = [
  { n: '①', name: '工具定义与校验', plain: '模型能点什么菜', side: 'top' },
  { n: '②', name: '上下文装配', plain: '每轮喂什么给它', side: 'top' },
  { n: '③', name: '循环与停止条件', plain: '什么时候该收手', side: 'top' },
  { n: '④', name: '权限与沙箱', plain: '它能动什么', side: 'bottom' },
  { n: '⑤', name: '重试与恢复', plain: '错了怎么办', side: 'bottom' },
  { n: '⑥', name: '观测与评估', plain: '怎么知道它做对了', side: 'bottom' },
];

const top = parts.filter((p) => p.side === 'top');
const bottom = parts.filter((p) => p.side === 'bottom');
</script>

<template>
  <div class="hd sh-no-print">
    <div class="hd__label">Harness（你写的部分）</div>

    <div class="hd__row">
      <div v-for="p in top" :key="p.n" class="hd__part">
        <span class="hd__n">{{ p.n }}</span>
        <strong>{{ p.name }}</strong>
        <span class="hd__plain">{{ p.plain }}</span>
      </div>
    </div>

    <div class="hd__model">
      <div class="hd__model-title">Model</div>
      <div class="hd__model-sub">唯一的"智能"来源，也是可替换的耗材与黑箱</div>
    </div>

    <div class="hd__row">
      <div v-for="p in bottom" :key="p.n" class="hd__part">
        <span class="hd__n">{{ p.n }}</span>
        <strong>{{ p.name }}</strong>
        <span class="hd__plain">{{ p.plain }}</span>
      </div>
    </div>

    <p class="hd__foot">
      换模型通常只是改一行配置；这六个部件里任何一处改好，<strong>所有任务</strong>都跟着受益。
    </p>
  </div>
</template>

<style scoped>
.hd {
  margin: 20px 0;
  padding: 14px;
  border: 1px solid var(--sh-border);
  border-radius: var(--sh-radius-lg);
  background: var(--sh-surface-2);
}

.hd__label {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  margin-bottom: 8px;
}

.hd__row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.hd__part {
  display: grid;
  gap: 2px;
  padding: 9px 10px;
  border: 1px dashed var(--sh-border-strong);
  border-radius: var(--sh-radius);
  background: var(--sh-surface);
}

.hd__n {
  font-size: 11px;
  color: var(--vp-c-brand-1);
  font-weight: 700;
}

.hd__part strong {
  font-size: 12.5px;
  color: var(--vp-c-text-1);
  line-height: 1.35;
}

.hd__plain {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
  line-height: 1.4;
}

.hd__model {
  margin: 8px 0;
  padding: 12px 14px;
  border-radius: var(--sh-radius);
  border: 1.5px solid var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  text-align: center;
}

.hd__model-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  letter-spacing: 0.02em;
}

.hd__model-sub {
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--vp-c-text-2);
}

.hd__foot {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--vp-c-text-3);
  text-align: center;
}

@media (max-width: 700px) {
  .hd__row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
