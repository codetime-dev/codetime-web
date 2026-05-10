<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

withDefaults(defineProps<{
  reason?: string
  variant?: 'monthly' | 'yearly'
  width?: string
}>(), {
  variant: 'monthly',
  width: '720px',
})

const t = useI18N()
</script>

<template>
  <UModal v-model="open" :title="t.plan.modal.title" :width="width">
    <div class="pro-modal">
      <div class="pro-modal-intro">
        <div v-if="reason" class="pro-modal-reason">
          <i class="i-tabler-sparkles text-[15px]" />
          <span>{{ reason }}</span>
        </div>
        <div class="pro-modal-text">
          <p>{{ t.plan.modal.p1 }}</p>
          <p>{{ t.plan.modal.p2 }}</p>
          <p>{{ t.plan.modal.p3 }}</p>
          <a class="pro-modal-mail" href="mailto:admin@codetime.dev">
            <i class="i-tabler-mail text-[14px]" />
            <span>admin@codetime.dev</span>
          </a>
        </div>
      </div>
      <ProPricePaper :variant="variant" class="pro-modal-price" />
    </div>
  </UModal>
</template>

<style scoped>
.pro-modal {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 720px) {
  .pro-modal {
    grid-template-columns: 1fr 1fr;
    align-items: stretch;
  }
}

.pro-modal-intro {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pro-modal-reason {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-primary);
  background: color-mix(in srgb, var(--ct-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--ct-primary) 24%, var(--ct-border));
  border-radius: var(--ct-radius-md);
}

.pro-modal-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  line-height: 1.55;
}

.pro-modal-mail {
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  color: var(--ct-primary);
}
.pro-modal-mail:hover { text-decoration: underline; }

.pro-modal-price {
  min-height: 480px;
}
</style>
