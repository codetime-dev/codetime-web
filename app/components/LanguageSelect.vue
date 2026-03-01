<script setup lang="ts">
import { Select } from '@roku-ui/vue'

const route = useRoute()
const router = useRouter()
const locale = computed(
  () => route.params.locale as string,
)

const cookie = useCookie('locale', {
  expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 100),
})
const defaultLocale = locale.value ?? (cookie.value ?? 'en')

function onChange(value: { label: string, id: string } | undefined) {
  cookie.value = value?.id ?? 'en'
}

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
const currentLocaleObj = ref<{ label: string, id: string } | undefined>(languageOptions.find(item => item.id === defaultLocale) ?? languageOptions[0])
const currentLocale = computed(() => currentLocaleObj.value?.id ?? defaultLocale)
watchEffect(() => {
  nextTick(() => {
    router.push({
      params: { locale: currentLocale.value },
      query: { ...route.query },
    })
  })
  useHead({
    htmlAttrs: {
      lang: currentLocale.value,
    },
  })
})
</script>

<template>
  <Select
    v-model="currentLocaleObj"
    aria-label="Language"
    class="max-w-full w-[min(11.5rem,calc(100vw-5.5rem))]"
    :options="languageOptions"
    @change="onChange"
  />
</template>
