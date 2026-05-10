<script setup lang="ts">
const t = useI18N()
const props = defineProps<{
  link: string
}>()
const link = computed(() => props.link)
const markdown = computed(() => `[![CodeTime Badge](${link.value})](https://codetime.dev)`)
const html = computed(() => `<img href="https://codetime.dev" alt="CodeTime Badge" src="${link.value}">`)
</script>

<template>
  <PanelSection num="03" :title="t.dashboard.badge.embed" meta="markdown · html · url" flush>
    <template #icon>
      <i class="i-tabler-clipboard-text text-surface-dimmed/70 text-[15px]" />
    </template>
    <div class="embed-list">
      <div class="embed-row">
        <div class="embed-tag">
          <i class="i-tabler-markdown" />
          <span>md</span>
        </div>
        <input
          :value="markdown"
          class="embed-field"
          type="text"
          readonly
        >
        <RCopyBtn :value="markdown" class="embed-copy" />
      </div>
      <div class="embed-row">
        <div class="embed-tag">
          <i class="i-tabler-code" />
          <span>html</span>
        </div>
        <input
          :value="html"
          class="embed-field"
          type="text"
          readonly
        >
        <RCopyBtn :value="html" class="embed-copy" />
      </div>
      <div class="embed-row">
        <div class="embed-tag">
          <i class="i-tabler-link" />
          <span>url</span>
        </div>
        <input
          :value="link"
          class="embed-field"
          type="text"
          readonly
        >
        <RCopyBtn :value="link" class="embed-copy" />
      </div>
    </div>
  </PanelSection>
</template>

<style scoped>
.embed-list {
  display: flex;
  flex-direction: column;
}

.embed-row {
  display: grid;
  grid-template-columns: 5rem 1fr auto;
  align-items: stretch;
  height: 2.75rem;
  background-color: rgb(var(--r-color-surface-7) / 0.18);
  border-top: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
  transition: background-color 180ms ease;
}

.embed-row:first-child {
  border-top: 0;
}

.embed-row:hover {
  background-color: rgb(var(--r-color-surface-7) / 0.26);
}

.embed-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0 1rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--color-primary-1);
  border-right: 1px solid color-mix(in srgb, var(--r-surface-border-color) 25%, transparent);
}

.embed-field {
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0 1rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  color: var(--r-surface-text-color);
  background: transparent;
  border: 0;
  outline: 0;
}

.embed-field::selection {
  background-color: color-mix(in srgb, var(--color-primary-1) 35%, transparent);
}

.embed-copy {
  height: 100% !important;
  align-self: stretch;
}
</style>
