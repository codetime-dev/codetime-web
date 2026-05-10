<script setup lang="ts">
const user = useUser()
const t = useI18N()
const { getCheckoutLink } = await useCheckoutLink(ref(false), ref(true))
const checkoutLink = await getCheckoutLink()

const planLabel = computed(() => String(user.value?.plan ?? 'free').toUpperCase())
const isPro = computed(() => String(user.value?.plan ?? '').toLowerCase() === 'pro')
</script>

<template>
  <PanelSection num="01" :title="t.dashboard.settings.account.title" :meta="t.dashboard.settings.account.title">
    <template #icon>
      <i class="i-tabler-user-circle ws-icon" />
    </template>

    <p class="acc-desc">
      {{ t.dashboard.settings.account.description }}
    </p>

    <div v-if="user" class="acc-row">
      <div class="acc-avatar">
        <img v-if="user.avatar" :src="user.avatar" alt="">
        <i v-else class="i-tabler-user text-2xl" />
      </div>

      <div class="acc-info">
        <div class="acc-line">
          <span class="acc-name">{{ user.username }}</span>
          <UTag :tone="isPro ? 'primary' : 'neutral'" variant="soft" size="sm">
            {{ planLabel }}
          </UTag>
          <UTag
            v-if="user.plan !== 'free' && user.planStatus"
            tone="neutral"
            variant="outline"
            size="sm"
          >
            {{ t.plan.status(user.planStatus ?? 'paused') }}
          </UTag>
          <span
            v-if="(user.plan ?? 'free') !== 'free' && user.planStatus === 'active'"
            class="acc-expires"
          >
            {{ t.dashboard.settings.account.expiresIn }} {{ new Date(user.planExpiresAt ?? '').toLocaleDateString() }}
          </span>
        </div>
        <div class="acc-email">
          {{ user.email }}
        </div>
      </div>

      <div class="acc-action">
        <a
          v-if="user.plan !== 'free'"
          target="_blank"
          href="https://codetime.lemonsqueezy.com/billing"
          class="acc-action-link"
        >
          <UButton variant="secondary" icon-left="i-tabler-credit-card">
            {{ t.dashboard.settings.account.manageSubscription }}
          </UButton>
        </a>
        <a v-else :href="checkoutLink" class="acc-action-link">
          <UButton variant="secondary" icon-left="i-tabler-arrow-up-right">
            {{ t.dashboard.settings.account.subscribe }}
          </UButton>
        </a>
      </div>
    </div>
  </PanelSection>
</template>

<style scoped>
.ws-icon { color: var(--ct-fg-subtle); font-size: 15px; }
.acc-desc {
  font-size: var(--ct-text-sm);
  line-height: 1.6;
  color: var(--ct-fg-muted);
  margin: 0 0 14px;
}

.acc-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
}
@media (max-width: 599px) {
  .acc-row { grid-template-columns: 1fr; }
}

.acc-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: var(--ct-radius-full);
  background: var(--ct-surface-1);
  color: var(--ct-fg-subtle);
  overflow: hidden;
}
.acc-avatar img { width: 100%; height: 100%; object-fit: cover; }

.acc-info { min-width: 0; }
.acc-line { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.acc-name { font-size: var(--ct-text-base); font-weight: var(--ct-weight-semibold); color: var(--ct-fg); }
.acc-expires { font-size: var(--ct-text-xs); color: var(--ct-fg-subtle); }
.acc-email { font-size: var(--ct-text-sm); color: var(--ct-fg-muted); margin-top: 4px; }

.acc-action-link { text-decoration: none; }
</style>
