<script setup lang="ts">
import Auxlines from 'auxlines'
import 'auxlines/style.css'

definePageMeta({
  middleware: ['i18n'],
  layout: 'landing',
})
const t = useI18N()

// Enhanced SEO meta tags
watchEffect(() => {
  useSeoMeta({
    title: 'Code Time - Programming Time Analytics & Insights',
    description: 'Track your programming time, analyze coding patterns, and get insights into your development productivity. Compatible with VS Code, JetBrains IDEs, and more.',
    keywords: 'programming time tracker, coding analytics, developer productivity, code metrics, programming insights, VS Code extension, JetBrains plugin',
    ogTitle: 'Code Time - Programming Time Analytics & Insights',
    ogDescription: 'Track your programming time, analyze coding patterns, and get insights into your development productivity. Compatible with VS Code, JetBrains IDEs, and more.',
    ogType: 'website',
    ogImage: '/icon.png',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Code Time - Programming Time Analytics & Insights',
    twitterDescription: 'Track your programming time, analyze coding patterns, and get insights into your development productivity.',
  })
})

// JSON-LD structured data for Organization
// TODO: Add structured data when @nuxtjs/seo is properly configured
// useSchemaOrg([
//   defineOrganization({
//     name: 'Code Time',
//     url: 'https://codetime.dev',
//     logo: 'https://codetime.dev/icon.png',
//     description: 'Programming time analytics and insights platform',
//     foundingDate: '2021',
//     sameAs: [
//       // Add social media URLs if available
//     ],
//     contactPoint: {
//       '@type': 'ContactPoint',
//       contactType: 'customer support',
//       availableLanguage: ['English', '中文', 'Japanese', 'German', 'French', 'Spanish', 'Italian', 'Russian', 'Ukrainian', 'Malay', 'Portuguese']
//     }
//   }),
//   defineWebSite({
//     name: 'Code Time',
//     url: 'https://codetime.dev',
//     description: 'Programming time analytics and insights platform',
//     inLanguage: locale.value,
//     potentialAction: {
//       '@type': 'SearchAction',
//       target: 'https://codetime.dev/{locale}/dashboard?search={search_term_string}',
//       'query-input': 'required name=search_term_string'
//     }
//   })
// ])
</script>

<template>
  <Auxlines
    :min-deepth="1"
    :max-deepth="4"
  >
    <div class="pb-8 pt-32 flex justify-center">
      <div
        class="px-8 flex flex-col max-w-4xl items-center space-y-6"
      >
        <LandingTitle />
        <div class="text-lg text-surface leading-relaxed px-4 py-2 text-center max-w-2xl">
          {{ t.landing.description }}
        </div>
      </div>
    </div>
  </Auxlines>
  <div class="m-8 flex justify-center">
    <LoginButton />
  </div>
  <div class="mt-32">
    <LandingSumHours />
  </div>

  <div class="overflow-x-hidden children:px-2">
    <div class="m-auto mt-12 px-4 py-6 max-w-6xl w-full sm:mt-16 sm:p-10">
      <h2 class="text-2xl font-bold my-4 flex flex-col max-w-xl relative sm:text-3xl md:max-w-6xl">
        {{ t.landing.features.visualization.title }}
      </h2>
      <div class="text-base mb-2 mt-4 sm:text-lg">
        {{ t.landing.features.visualization.description }}
      </div>
      <div class="my-6 flex flex-col gap-2 sm:my-8">
        <div class="flex flex-col gap-2 lg:flex-row">
          <div class="min-w-0 w-full overflow-x-hidden lg:shrink-0 lg:w-86">
            <DashboardTopCardTemplateDemo />
          </div>
          <div class="min-w-0 w-full overflow-x-hidden">
            <DashboardCalendarCardDemo
              class="w-full"
            />
          </div>
        </div>
        <div class="pb-1 overscroll-x-contain min-w-0 overflow-x-auto">
          <DashboardProjectYDotCardDemo />
        </div>
        <div class="pb-1 overscroll-x-contain min-w-0 overflow-x-auto">
          <PoltDailyDistributionTemplateDemo />
        </div>
      </div>
    </div>

    <div class="bg-surface-low my-20 py-24 relative overflow-hidden">
      <div class="mx-auto px-6 text-center max-w-4xl relative">
        <div class="mb-6 inline-block relative">
          <h2 class="text-4xl font-bold md:text-5xl">
            {{ t.landing.features.save.title }}
          </h2>
          <i
            class="i-line-md-calendar text-blue-500 opacity-20 h-16 w-16 rotate-12 absolute md:h-20 md:w-20 -right-16 -top-8"
          />
        </div>
        <div class="text-xl text-surface-dimmed leading-relaxed mx-auto max-w-2xl">
          {{ t.landing.features.save.description }}
        </div>
      </div>
    </div>

    <div class="py-24 text-center relative overflow-hidden">
      <div class="mx-auto px-6 max-w-4xl relative">
        <div class="mb-6 inline-block relative">
          <h2 class="text-4xl font-bold md:text-5xl">
            {{ t.landing.features.export.title }}
          </h2>
          <i
            class="i-line-md-cloud-down-twotone text-purple-500 opacity-20 h-16 w-16 rotate-12 absolute md:h-20 md:w-20 -right-16 -top-8"
          />
        </div>
        <div class="text-xl text-surface-dimmed leading-relaxed mx-auto max-w-2xl">
          {{ t.landing.features.export.description }}
        </div>
      </div>
    </div>

    <div class="bg-surface-low my-20 py-24 relative overflow-hidden">
      <div class="mx-auto px-6 flex flex-col gap-12 max-w-6xl items-center justify-center relative lg:flex-row">
        <div class="text-center flex-1 lg:text-left">
          <h2 class="text-4xl font-bold mb-6 md:text-5xl">
            {{ t.landing.features.editor.title }}
          </h2>
          <div class="text-xl text-surface-dimmed leading-relaxed max-w-xl">
            {{ t.landing.features.editor.description }}
          </div>
        </div>
        <div class="flex gap-8 items-center">
          <div class="transform transition-all duration-300 hover:scale-110">
            <i class="i-logos-visual-studio-code h-20 w-20 md:h-24 md:w-24" />
          </div>
          <div class="transform transition-all duration-300 hover:scale-110">
            <i class="i-logos-jetbrains h-20 w-20 md:h-24 md:w-24" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <PriceTable />
</template>
