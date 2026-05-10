<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const locale = computed(
  () => route.params.locale as string,
)

const cookie = useCookie('locale', {
  expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 100),
})
const defaultLocale = locale.value ?? (cookie.value ?? 'en')

const languageOptions = [
  { label: 'English', id: 'en' },
  { label: '简体中文', id: 'zh-CN' },
  { label: '繁體中文', id: 'zh-TW' },
  { label: '日本語', id: 'ja' },
  { label: 'Deutsch', id: 'de' },
  { label: 'Français', id: 'fr' },
  { label: 'Português', id: 'pt-BR' },
  { label: 'Italiano', id: 'it' },
  { label: 'Русский', id: 'ru' },
  { label: 'Українська', id: 'ua' },
  { label: 'Bahasa Melayu', id: 'ms' },
  { label: 'Español', id: 'es' },
]

const currentId = ref<string>(defaultLocale)
const current = computed(() => languageOptions.find(o => o.id === currentId.value) ?? languageOptions[0])

const open = ref(false)
const root = ref<HTMLElement | null>(null)
onClickOutside(root, () => {
 open.value = false
})

function select(id: string) {
  currentId.value = id
  cookie.value = id
  open.value = false
}

watchEffect(() => {
  nextTick(() => {
    router.push({
      params: { locale: currentId.value },
      query: { ...route.query },
    })
  })
  useHead({
    htmlAttrs: {
      lang: currentId.value,
    },
  })
})
</script>

<template>
  <div ref="root" class="inline-block relative">
    <button
      type="button"
      aria-label="Language"
      :aria-expanded="open"
      class="lang-trigger"
      :class="{ 'lang-trigger-open': open }"
      @click="open = !open"
    >
      <i class="i-tabler-language text-sm opacity-70" />
      <span class="tracking-normal normal-case">{{ current?.label }}</span>
      <i class="i-tabler-chevron-down text-xs transition-transform" :class="{ 'rotate-180': open }" />
    </button>

    <Transition name="lang-fade">
      <div
        v-if="open"
        class="bg-surface-base/98 mt-1 min-w-[11rem] shadow-black/20 shadow-lg right-0 absolute z-50 backdrop-blur-sm"
      >
        <ul class="py-1 max-h-[60vh] overflow-y-auto">
          <li v-for="opt in languageOptions" :key="opt.id">
            <button
              type="button"
              class="text-[12.5px] font-mono px-3 py-1.5 text-left flex gap-2 w-full transition-colors items-center justify-between"
              :class="opt.id === currentId
                ? 'bg-surface-variant-1/55 text-primary'
                : 'text-surface-dimmed hover:bg-surface-variant-1/35 hover:text-surface'"
              @click="select(opt.id)"
            >
              <span>{{ opt.label }}</span>
              <span class="text-[10.5px] tracking-[0.12em] opacity-50 uppercase">{{ opt.id }}</span>
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.lang-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.25rem;
  padding: 0 0.85rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--r-surface-text-color) 65%, transparent);
  background-color: rgb(var(--r-color-surface-7) / 0.18);
  border: 0;
  cursor: pointer;
  transition: background-color 180ms ease, color 180ms ease;
}

.lang-trigger:hover,
.lang-trigger-open {
  color: var(--r-surface-text-color);
  background-color: rgb(var(--r-color-surface-7) / 0.32);
}

[data-scheme="light"] .lang-trigger {
  background-color: color-mix(in srgb, var(--r-surface-text-color) 5%, transparent);
}

[data-scheme="light"] .lang-trigger:hover,
[data-scheme="light"] .lang-trigger-open {
  background-color: color-mix(in srgb, var(--r-surface-text-color) 10%, transparent);
}

.lang-trigger > span:nth-child(2) {
  letter-spacing: 0;
  text-transform: none;
}

.lang-fade-enter-active,
.lang-fade-leave-active {
  transition: opacity 140ms ease, transform 140ms ease;
}
.lang-fade-enter-from,
.lang-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
