<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
})
const t = useI18N()

const boards = computed(() => [
  { num: '01', days: 28, label: t.value.dashboard.leaderboard.title(28) },
  { num: '02', days: 7, label: t.value.dashboard.leaderboard.title(7) },
  { num: '03', days: 1, label: t.value.dashboard.leaderboard.title(1) },
])

const active = ref(0)
</script>

<template>
  <DashboardPageTitle
    num="00"
    :title="t.dashboard.pageHeader.title.leaderboard"
    :description="t.dashboard.pageHeader.description.leaderboard"
  />
  <DashboardPageContent>
    <!-- Segmented switcher (mobile) -->
    <div class="lb-switch">
      <button
        v-for="(board, i) in boards"
        :key="board.days"
        type="button"
        class="lb-switch-btn"
        :class="active === i ? 'lb-switch-btn-active' : ''"
        @click="active = i"
      >
        <span class="lb-switch-num">{{ board.num }}</span>
        <span>{{ board.label }}</span>
      </button>
    </div>

    <div class="lb-grid">
      <div
        v-for="(board, i) in boards"
        :key="board.days"
        class="lb-col"
        :class="i !== active ? 'lb-col-hidden lg:lb-col-show' : ''"
      >
        <LeaderboardCard :num="board.num" :days="board.days" />
      </div>
    </div>
  </DashboardPageContent>
</template>

<style scoped>
/* Segmented switcher */
.lb-switch {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: 1rem;
}

@media (min-width: 1024px) {
  .lb-switch {
    display: none;
  }
}

.lb-switch-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.85rem 0.5rem;
  font-size: var(--ct-text-xs);
      color: var(--ct-fg-subtle);
  background: transparent;
  border: 0;
  border-left: 1px solid var(--ct-border-subtle);
  cursor: pointer;
  transition: color 180ms ease, background-color 180ms ease;
}

.lb-switch-btn:first-child {
  border-left: 0;
}

.lb-switch-btn:hover {
  color: var(--ct-fg);
  background-color: var(--ct-surface-2);
}

.lb-switch-btn-active {
  color: var(--color-primary-1);
  background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent);
}

.lb-switch-num {
  font-size: 9.5px;
    opacity: 0.7;
}

/* Grid */
.lb-grid {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .lb-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
  .lb-grid > .lb-col + .lb-col {
    border-left: 1px solid var(--ct-border-subtle);
  }
}

.lb-col-hidden {
  display: none;
}

@media (min-width: 1024px) {
  .lb-col-hidden {
    display: block;
  }
}
</style>
