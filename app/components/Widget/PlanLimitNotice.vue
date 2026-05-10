<script setup lang="ts">
withDefaults(defineProps<{
  text: string
  ctaText?: string
  // Stronger visual treatment when the user has already exceeded the cap.
  variant?: 'info' | 'warning'
}>(), {
  variant: 'info',
})

const open = ref(false)
</script>

<template>
  <div
    class="plan-notice"
    :class="variant === 'warning' ? 'plan-notice-warning' : 'plan-notice-info'"
    role="note"
  >
    <div class="plan-notice-icon">
      <i :class="variant === 'warning' ? 'i-tabler-alert-triangle' : 'i-tabler-lock'" class="text-[14px]" />
    </div>
    <div class="plan-notice-body">
      <span class="plan-notice-tag">PRO</span>
      <span class="plan-notice-text">{{ text }}</span>
    </div>
    <button
      type="button"
      class="plan-notice-cta"
      @click="open = true"
    >
      {{ ctaText ?? 'Upgrade' }}
      <i class="i-tabler-arrow-up-right text-[12px]" />
    </button>

    <ProUpgradeModal v-model:open="open" :reason="text" />
  </div>
</template>

<style scoped>
.plan-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-width: 1px;
  border-style: solid;
}

.plan-notice-info {
  background: color-mix(in srgb, var(--ct-primary) 7%, var(--ct-surface));
  border-color: color-mix(in srgb, var(--ct-primary) 24%, var(--ct-border));
}

.plan-notice-warning {
  background: color-mix(in srgb, var(--ct-warning, #f59e0b) 9%, var(--ct-surface));
  border-color: color-mix(in srgb, var(--ct-warning, #f59e0b) 30%, var(--ct-border));
}

.plan-notice-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  width: 22px;
  border-radius: 50%;
  flex-shrink: 0;
}

.plan-notice-info .plan-notice-icon {
  background: color-mix(in srgb, var(--ct-primary) 18%, transparent);
  color: var(--ct-primary);
}

.plan-notice-warning .plan-notice-icon {
  background: color-mix(in srgb, var(--ct-warning, #f59e0b) 22%, transparent);
  color: var(--ct-warning, #f59e0b);
}

.plan-notice-body {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
}

.plan-notice-tag {
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  font-weight: var(--ct-weight-semibold);
  letter-spacing: 0.08em;
  color: var(--ct-primary);
  background: color-mix(in srgb, var(--ct-primary) 16%, transparent);
  padding: 2px 6px;
  border-radius: var(--ct-radius-sm);
  flex-shrink: 0;
}

.plan-notice-text {
  min-width: 0;
}

.plan-notice-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: var(--ct-radius-sm);
  font-size: var(--ct-text-xs);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-bg);
  background: var(--ct-primary);
  border: 0;
  cursor: pointer;
  transition: background-color var(--ct-duration-fast) var(--ct-ease);
  white-space: nowrap;
}

.plan-notice-cta:hover {
  background: color-mix(in srgb, var(--ct-primary) 86%, white);
}
</style>
