<script setup lang="ts">
type Variant = 'monthly' | 'annual' | 'one-time'

const props = withDefaults(defineProps<{
  reason?: string
  initialVariant?: Variant
}>(), {
  initialVariant: 'monthly',
})

const open = defineModel<boolean>('open', { default: false })

const t = useI18N()
const user = useUser()

const variant = ref<Variant>(props.initialVariant)
watch(() => props.initialVariant, (v) => { variant.value = v })

const isAnnual = computed(() => variant.value === 'annual')
const isOneTime = computed(() => variant.value === 'one-time')

const { getCheckoutLink } = useCheckoutLink(isAnnual, isOneTime)

const tabs = computed<{ id: Variant, label: string, meta?: string }[]>(() => [
  { id: 'monthly', label: t.value.plan.monthly },
  { id: 'one-time', label: t.value.plan.oneTime },
  { id: 'annual', label: t.value.plan.yearly, meta: t.value.plan.save25 },
])

const price = computed(() => {
  if (isAnnual.value) {
    return { amount: '$36', unit: t.value.plan.pro.preYear }
  }
  return { amount: '$4', unit: t.value.plan.pro.preMonth }
})

const features = computed(() => [
  t.value.plan.pro.features.item.include,
  t.value.plan.pro.features.item.browseAll,
  t.value.plan.pro.features.item.workspace,
  t.value.plan.pro.features.item.tag,
  t.value.plan.pro.features.item.rule,
  t.value.plan.pro.features.item.widgetCustom,
  t.value.plan.pro.features.item.widgetUnlimited,
])

const bullets = computed(() => [t.value.plan.modal.p1, t.value.plan.modal.p2, t.value.plan.modal.p3])

function close() {
  open.value = false
}

async function onSubscribe() {
  if (globalThis.window === undefined) {
    return
  }
  if (!user.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    close()
    return
  }
  const link = await getCheckoutLink()
  if (link) {
    globalThis.location.href = link
  }
}

function onScroll(e: WheelEvent) {
  e.stopPropagation()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    close()
  }
}

watch(open, (v) => {
  if (globalThis.document === undefined) {
    return
  }
  if (v) {
    document.body.style.overflow = 'hidden'
  }
  else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  if (globalThis.document) {
    document.body.style.overflow = ''
  }
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="pum">
      <div
        v-if="open"
        class="pum-root"
        role="dialog"
        aria-modal="true"
        :aria-label="t.plan.modal.title"
      >
        <div class="pum-overlay" @click="close" />
        <div class="pum-card" @wheel="onScroll">
          <button type="button" class="pum-close" :aria-label="'Close'" @click="close">
            <i class="i-tabler-x" />
          </button>

          <div class="pum-glow" aria-hidden="true" />

          <section class="pum-intro">
            <div class="pum-eyebrow">
              <i class="i-tabler-sparkles" />
              <span>Codetime Pro</span>
            </div>

            <h2 class="pum-headline">
              {{ t.plan.modal.title }}
            </h2>

            <div v-if="reason" class="pum-reason">
              <span class="pum-reason-bar" />
              <span class="pum-reason-text">{{ reason }}</span>
            </div>

            <ul class="pum-bullets">
              <li v-for="(line, idx) in bullets" :key="idx">
                <i class="i-tabler-sparkles pum-bullet-icon" />
                <span>{{ line }}</span>
              </li>
            </ul>

            <a class="pum-mail" href="mailto:admin@codetime.dev">
              <i class="i-tabler-mail" />
              <span>admin@codetime.dev</span>
              <i class="i-tabler-arrow-up-right pum-mail-arrow" />
            </a>
          </section>

          <aside class="pum-plan">
            <div class="pum-tabs" role="tablist">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                role="tab"
                :aria-selected="variant === tab.id"
                class="pum-tab"
                :class="{ 'pum-tab-active': variant === tab.id }"
                @click="variant = tab.id"
              >
                <span>{{ tab.label }}</span>
                <span v-if="tab.meta" class="pum-tab-meta">{{ tab.meta }}</span>
              </button>
            </div>

            <div class="pum-price-row">
              <span
                class="pum-price"
                :class="{ 'pum-price-accent': isAnnual }"
              >{{ price.amount }}</span>
              <span class="pum-price-unit">{{ price.unit }}</span>
            </div>

            <ul class="pum-features">
              <li v-for="(f, idx) in features" :key="idx">
                <i class="i-tabler-check pum-feature-icon" />
                <span>{{ f }}</span>
              </li>
            </ul>

            <ClientOnly>
              <button
                v-if="user && user.plan === 'pro' && user.planStatus"
                type="button"
                class="pum-cta pum-cta-secondary"
                disabled
              >
                <i class="i-tabler-check" />
                {{ t.plan.status(user.planStatus) }}
              </button>
              <button
                v-else-if="!user"
                type="button"
                class="pum-cta pum-cta-secondary"
                @click="onSubscribe"
              >
                {{ t.plan.needLogin }}
              </button>
              <button
                v-else
                type="button"
                class="pum-cta pum-cta-primary lemonsqueezy-button"
                @click="onSubscribe"
              >
                <i class="i-tabler-credit-card" />
                {{ t.plan.pro.button }}
              </button>
            </ClientOnly>
          </aside>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pum-root {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.pum-overlay {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, #000 55%, transparent);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.pum-card {
  position: relative;
  width: 100%;
  max-width: 820px;
  max-height: calc(100vh - 48px);
  overflow: auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  padding: 36px;
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: 24px;
  box-shadow:
    0 24px 60px -20px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  isolation: isolate;
}

@media (min-width: 720px) {
  .pum-card {
    grid-template-columns: 1.05fr 1fr;
    gap: 36px;
    padding: 40px;
  }
}

.pum-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 70%;
  height: 100%;
  background: radial-gradient(ellipse at 85% 15%, var(--ct-primary-soft), transparent 65%);
  pointer-events: none;
  z-index: -1;
  border-top-right-radius: 24px;
  border-bottom-right-radius: 24px;
}

.pum-close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: var(--ct-fg-subtle);
  border-radius: var(--ct-radius-full);
  cursor: pointer;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease);
}
.pum-close:hover { background: var(--ct-surface-2); color: var(--ct-fg); }

/* Intro */
.pum-intro { display: flex; flex-direction: column; gap: 16px; }
.pum-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: max-content;
  padding: 4px 10px;
  font-size: var(--ct-text-xs);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-primary);
  background: var(--ct-primary-soft);
  border-radius: var(--ct-radius-full);
  letter-spacing: 0.02em;
}
.pum-eyebrow i { font-size: 13px; }
.pum-headline {
  margin: 0;
  font-size: var(--ct-text-2xl);
  font-weight: var(--ct-weight-semibold);
  letter-spacing: var(--ct-tracking-tight);
  color: var(--ct-fg);
  line-height: 1.2;
}
.pum-reason { display: flex; align-items: stretch; gap: 10px; padding: 4px 0; }
.pum-reason-bar {
  width: 2px;
  background: linear-gradient(180deg, var(--ct-primary), color-mix(in srgb, var(--ct-primary) 30%, transparent));
  border-radius: 1px;
  flex-shrink: 0;
}
.pum-reason-text { font-size: var(--ct-text-sm); color: var(--ct-fg); font-weight: var(--ct-weight-medium); line-height: 1.5; }

.pum-bullets {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pum-bullets li {
  display: grid;
  grid-template-columns: 18px 1fr;
  align-items: start;
  gap: 10px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  line-height: 1.55;
}
.pum-bullet-icon {
  margin-top: 3px;
  width: 14px;
  height: 14px;
  color: var(--ct-primary);
}

.pum-mail {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: max-content;
  padding-top: 12px;
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
  border-top: 1px dashed var(--ct-border-subtle);
  transition: color 160ms var(--ct-ease);
}
.pum-mail i { font-size: 12px; }
.pum-mail-arrow { opacity: 0; transform: translate(-2px, 2px); transition: all 160ms var(--ct-ease); }
.pum-mail:hover { color: var(--ct-primary); }
.pum-mail:hover .pum-mail-arrow { opacity: 1; transform: translate(0, 0); }

/* Plan */
.pum-plan { display: flex; flex-direction: column; gap: 18px; }

.pum-tabs {
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 4px;
  padding: 4px;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border-subtle);
  border-radius: var(--ct-radius-full);
}
.pum-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  color: var(--ct-fg-muted);
  font-size: var(--ct-text-xs);
  font-weight: var(--ct-weight-medium);
  border-radius: var(--ct-radius-full);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease);
}
.pum-tab:hover { color: var(--ct-fg); }
.pum-tab-active {
  background: var(--ct-surface);
  color: var(--ct-fg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
.pum-tab-meta {
  font-size: 10px;
  font-family: var(--ct-font-mono);
  color: var(--ct-primary);
  letter-spacing: 0.04em;
}

.pum-price-row { display: flex; gap: 10px; align-items: baseline; }
.pum-price {
  font-size: 40px;
  font-weight: var(--ct-weight-semibold);
  letter-spacing: var(--ct-tracking-tight);
  color: var(--ct-fg);
  line-height: 1;
}
.pum-price-accent { color: var(--ct-primary); }
.pum-price-unit { font-size: var(--ct-text-sm); color: var(--ct-fg-subtle); }

.pum-features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pum-features li {
  display: grid;
  grid-template-columns: 18px 1fr;
  align-items: start;
  gap: 10px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  line-height: 1.5;
}
.pum-feature-icon {
  margin-top: 3px;
  width: 14px;
  height: 14px;
  color: var(--ct-primary);
}

.pum-cta {
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--ct-radius-lg);
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  cursor: pointer;
  border: 0;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease),
              opacity var(--ct-duration-fast) var(--ct-ease);
}
.pum-cta-primary {
  color: var(--ct-fg-on-brand);
  background: var(--ct-primary);
}
.pum-cta-primary:hover { background: var(--ct-primary-hover); }
.pum-cta-secondary {
  color: var(--ct-fg);
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
}
.pum-cta-secondary:hover { background: var(--ct-surface-2); }
.pum-cta:disabled { cursor: not-allowed; opacity: 0.7; }
.pum-cta i { font-size: 14px; }

/* Transitions */
.pum-enter-active, .pum-leave-active {
  transition: opacity 200ms var(--ct-ease);
}
.pum-enter-active .pum-card, .pum-leave-active .pum-card {
  transition: transform 220ms var(--ct-ease), opacity 220ms var(--ct-ease);
}
.pum-enter-from, .pum-leave-to { opacity: 0; }
.pum-enter-from .pum-card, .pum-leave-to .pum-card {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
</style>
