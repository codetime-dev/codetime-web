<script setup lang="ts">
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
        class="lang-menu"
      >
        <ul>
          <li v-for="opt in languageOptions" :key="opt.id">
            <button
              type="button"
              class="lang-item"
              :class="{ 'lang-item-active': opt.id === currentId }"
              @click="select(opt.id)"
            >
              <span>{{ opt.label }}</span>
              <span class="lang-item-id">{{ opt.id }}</span>
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
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg-muted);
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-lg);
  cursor: pointer;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease),
              border-color var(--ct-duration-fast) var(--ct-ease);
}
.lang-trigger:hover,
.lang-trigger-open {
  color: var(--ct-fg);
  border-color: var(--ct-border-strong);
  background: var(--ct-surface-1);
}

.lang-menu {
  position: absolute;
  right: 0;
  margin-top: 6px;
  min-width: 12rem;
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-lg);
  box-shadow: var(--ct-shadow-lg);
  z-index: 50;
  overflow: hidden;
}
.lang-menu ul {
  padding: 4px;
  max-height: 60vh;
  overflow-y: auto;
}
.lang-item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  border-radius: var(--ct-radius-md);
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease);
}
.lang-item:hover {
  background: var(--ct-surface-1);
  color: var(--ct-fg);
}
.lang-item-active {
  background: var(--ct-primary-soft);
  color: var(--ct-primary);
}
.lang-item-active:hover {
  background: color-mix(in srgb, var(--ct-primary) 18%, transparent);
  color: var(--ct-primary);
}
.lang-item-id {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ct-fg-subtle);
}
.lang-item-active .lang-item-id { color: var(--ct-primary); opacity: 0.75; }

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
