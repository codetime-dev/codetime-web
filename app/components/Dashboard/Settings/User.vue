<script setup lang="ts">
const user = useUser()
const t = useI18N()
const { getCheckoutLink } = await useCheckoutLink(ref(false), ref(true))
const checkoutLink = await getCheckoutLink()

const planLabel = computed(() => String(user.value?.plan ?? 'free').toUpperCase())
const isPro = computed(() => String(user.value?.plan ?? '').toLowerCase() === 'pro')
</script>

<template>
  <PanelSection num="01" :title="t.dashboard.settings.account.title" :meta="t.dashboard.settings.account.title" flush>
    <template #icon>
      <i class="i-tabler-user-circle text-surface-dimmed/70 text-[15px]" />
    </template>

    <div class="acc-desc-wrap">
      <p class="acc-desc">
        {{ t.dashboard.settings.account.description }}
      </p>
    </div>

    <div v-if="user" class="acc-row">
      <div class="acc-avatar">
        <img
          v-if="user.avatar"
          :src="user.avatar"
          alt=""
        >
        <i v-else class="i-tabler-user text-2xl" />
      </div>

      <div class="acc-info">
        <div class="acc-line">
          <span class="acc-name">{{ user.username }}</span>
          <span
            class="acc-pill"
            :class="isPro ? 'acc-pill-primary' : ''"
          >
            {{ planLabel }}
          </span>
          <span
            v-if="user.plan !== 'free' && user.planStatus"
            class="acc-pill"
          >
            {{ t.plan.status(user.planStatus ?? 'paused') }}
          </span>
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
          class="line-btn"
        >
          <i class="i-tabler-credit-card text-sm" />
          <span>{{ t.dashboard.settings.account.manageSubscription }}</span>
        </a>
        <a
          v-else
          :href="checkoutLink"
          class="line-btn line-btn-primary"
        >
          <i class="i-tabler-arrow-up-right text-sm" />
          <span>{{ t.dashboard.settings.account.subscribe }}</span>
        </a>
      </div>
    </div>
  </PanelSection>
</template>

<style scoped>
.acc-desc-wrap {
  padding: 1rem 1.25rem 0;
}

.acc-desc {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.7;
  color: color-mix(in srgb, var(--r-surface-text-color) 75%, transparent);
}

.acc-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem 1.25rem;
}

@media (max-width: 599px) {
  .acc-row {
    grid-template-columns: 1fr;
    text-align: left;
  }
}

.acc-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background-color: rgb(var(--r-color-surface-7) / 0.18);
  color: color-mix(in srgb, var(--r-surface-text-color) 50%, transparent);
  overflow: hidden;
}

.acc-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.acc-info {
  min-width: 0;
}

.acc-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
}

.acc-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  font-weight: 500;
  color: var(--r-surface-text-color);
}

.acc-pill {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 0.18rem 0.55rem;
  border-radius: 9999px;
  background-color: rgb(var(--r-color-surface-7) / 0.32);
  color: color-mix(in srgb, var(--r-surface-text-color) 70%, transparent);
}

.acc-pill-primary {
  color: var(--color-primary-1);
  background-color: color-mix(in srgb, var(--color-primary-1) 16%, transparent);
}

.acc-expires {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  color: color-mix(in srgb, var(--r-surface-text-color) 55%, transparent);
}

.acc-email {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11.5px;
  color: color-mix(in srgb, var(--r-surface-text-color) 55%, transparent);
  margin-top: 0.3rem;
}

.acc-action {
  display: inline-flex;
  align-items: center;
}

/* line-btn */
.line-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.25rem;
  padding: 0 0.95rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--r-surface-text-color);
  background-color: rgb(var(--r-color-surface-7) / 0.18);
  border: 0;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 180ms ease, color 180ms ease;
}

.line-btn:hover {
  background-color: rgb(var(--r-color-surface-7) / 0.32);
}

.line-btn-primary {
  color: var(--color-primary-1);
  background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent);
}

.line-btn-primary:hover {
  background-color: color-mix(in srgb, var(--color-primary-1) 24%, transparent);
}
</style>
