<script setup lang="ts">
const variant = defineModel<string>()
const t = useI18N()
</script>

<template>
  <div class="pt-tabs">
    <button
      type="button"
      class="pt-tab"
      :class="{ 'pt-tab-active': variant === 'monthly' }"
      @click="() => variant = 'monthly'"
    >
      <span class="pt-tab-name">{{ t.plan.monthly }}</span>
      <span class="pt-tab-meta">{{ t.plan.mostFlexible }}</span>
    </button>
    <button
      type="button"
      class="pt-tab"
      :class="{ 'pt-tab-active': variant === 'one-time' }"
      @click="() => variant = 'one-time'"
    >
      <span class="pt-tab-name">{{ t.plan.oneTime }}</span>
      <span class="pt-tab-meta pt-tab-icons">
        <i class="i-ant-design-alipay-circle-outlined" />
        <i class="i-ant-design-wechat-filled" />
        <i class="i-entypo-social-paypal" />
      </span>
    </button>
    <button
      type="button"
      class="pt-tab"
      :class="{ 'pt-tab-active': variant === 'annual' }"
      @click="() => variant = 'annual'"
    >
      <span class="pt-tab-name">{{ t.plan.yearly }}</span>
      <span class="pt-tab-meta">{{ t.plan.save25 }}</span>
    </button>
  </div>
</template>

<style scoped>
.pt-tabs {
  display: inline-flex;
  padding: 6px;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
  border-radius: 999px;
  gap: 4px;
}
.pt-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 28px;
  min-width: 140px;
  font-size: var(--ct-text-sm);
  background: transparent;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  color: var(--ct-fg-muted);
  transition: background-color 200ms ease, color 200ms ease, transform 200ms ease;
}
.pt-tab:hover { color: var(--ct-fg); background: var(--ct-surface-2); }
.pt-tab-active {
  background: var(--ct-surface);
  color: var(--ct-fg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
}
.pt-tab-active:hover {
  background: var(--ct-surface);
  color: var(--ct-fg);
}
.pt-tab-name {
  font-weight: var(--ct-weight-semibold);
  font-size: 15px;
  letter-spacing: 0.01em;
}
.pt-tab-meta {
  font-size: 11px;
  color: var(--ct-fg-subtle);
  font-family: var(--ct-font-mono);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.pt-tab-icons {
  display: inline-flex;
  gap: 6px;
  font-size: 14px;
  text-transform: none;
}
.pt-tab-active .pt-tab-meta { color: var(--ct-primary); }

@media (max-width: 640px) {
  .pt-tabs { width: 100%; }
  .pt-tab { flex: 1; min-width: 0; padding: 10px 12px; }
  .pt-tab-name { font-size: 13px; }
}
</style>
