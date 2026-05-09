<script setup lang="ts">
type IdentityProps = {
  username?: string | null
  avatar?: string | null
  email?: string | null
  plan?: string | null
  timezone?: string | null
  userId: number
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
}

const props = defineProps<IdentityProps>()

const planLabel = computed(() => {
  if (!props.plan) {
    return 'FREE'
  }
  return String(props.plan).toUpperCase()
})

const isPro = computed(() => String(props.plan ?? '').toLowerCase() === 'pro')

function fmtDate(value?: string | Date | null): string {
  if (!value) {
    return '—'
  }
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const memberDays = computed(() => {
  if (!props.createdAt) {
    return null
  }
  const date = typeof props.createdAt === 'string' ? new Date(props.createdAt) : props.createdAt
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return Math.max(1, Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000)))
})

const infoItems = computed(() => [
  { key: 'ID', value: `#${props.userId}`, mono: true },
  { key: 'TZ', value: props.timezone || '—', mono: true },
  { key: 'JOIN', value: fmtDate(props.createdAt), mono: true },
  { key: 'MEMBER', value: memberDays.value === null ? '—' : `${memberDays.value}d`, mono: true },
  { key: 'UPDATED', value: fmtDate(props.updatedAt), mono: true },
])
</script>

<template>
  <div class="flex flex-col gap-5 items-start sm:flex-row sm:gap-7 sm:items-center">
    <div class="shrink-0">
      <div class="border-surface-dimmed/25 border rounded-full h-24 w-24 relative overflow-hidden">
        <img
          v-if="avatar"
          :src="avatar"
          :alt="username || `User ${userId}`"
          class="h-full w-full object-cover"
        >
        <div
          v-else
          class="bg-surface-variant-1/40 text-surface-dimmed/45 flex h-full w-full items-center justify-center"
        >
          <i class="i-tabler-user text-3xl" />
        </div>
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-2 min-w-0 w-full">
      <div class="flex flex-wrap gap-x-3 gap-y-2 items-center">
        <h1 class="text-[26px] text-surface leading-none tracking-tight font-semibold min-w-0 truncate sm:text-[28px]">
          {{ username || `User ${userId}` }}
        </h1>
        <span
          class="text-[10.5px] leading-none tracking-[0.18em] font-mono px-1.5 py-0.5 border uppercase"
          :class="isPro ? 'border-primary/45 text-primary bg-primary/10' : 'border-surface-dimmed/25 text-surface-dimmed/75'"
        >
          {{ planLabel }}
        </span>
      </div>

      <div v-if="email" class="text-surface-dimmed/70 text-[12px] font-mono truncate">
        {{ email }}
      </div>

      <div class="text-[11.5px] font-mono mt-1.5 flex flex-wrap gap-x-1 gap-y-1.5 items-baseline">
        <template v-for="(item, idx) in infoItems" :key="item.key">
          <span v-if="idx > 0" class="text-surface-dimmed/25 px-1.5">·</span>
          <span class="inline-flex gap-1.5 items-baseline">
            <span class="text-surface-dimmed/55 tracking-[0.16em] uppercase">{{ item.key }}</span>
            <span class="text-surface tabular-nums">{{ item.value }}</span>
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
