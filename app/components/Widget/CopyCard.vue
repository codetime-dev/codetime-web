<script setup lang="ts">
const props = defineProps<{
  link: string
  alt?: string
  num?: string
}>()
const t = useI18N()
const link = computed(() => props.link)
const alt = computed(() => props.alt ?? 'CodeTime Widget')
const markdown = computed(() => `[![${alt.value}](${link.value})](https://codetime.dev)`)
const html = computed(() => `<a href="https://codetime.dev"><img alt="${alt.value}" src="${link.value}"></a>`)
</script>

<template>
  <PanelSection :num="num ?? '03'" :title="t.dashboard.badge.embed" meta="markdown · html · url" flush>
    <template #icon>
      <i class="i-tabler-clipboard-text text-[15px] text-ct-fg-muted" />
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
        <UCopyBtn :value="markdown" class="embed-copy" />
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
        <UCopyBtn :value="html" class="embed-copy" />
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
        <UCopyBtn :value="link" class="embed-copy" />
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
  height: 44px;
  background: var(--ct-surface-1);
  border-top: 1px solid var(--ct-border-subtle);
  transition: background-color var(--ct-duration-fast) var(--ct-ease);
}
.embed-row:first-child { border-top: 0; }
.embed-row:hover { background: var(--ct-surface-2); }

.embed-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-primary);
  border-right: 1px solid var(--ct-border-subtle);
}

.embed-field {
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0 14px;
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-sm);
  color: var(--ct-fg);
  background: transparent;
  border: 0;
  outline: 0;
}
.embed-field::selection {
  background: color-mix(in srgb, var(--ct-primary) 28%, transparent);
}

.embed-copy {
  height: 100% !important;
  align-self: stretch;
}
</style>
