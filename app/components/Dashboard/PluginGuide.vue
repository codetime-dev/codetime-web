<script setup lang="ts">
import { Btn, TextField } from '@roku-ui/vue'

const user = useUser()
const token = computed(() => user.value?.uploadToken ?? '')
const t = useI18N()
</script>

<template>
  <div class="px-4 w-full space-y-8 md:px-6 md:space-y-10">
    <!-- Welcome Section -->
    <div class="space-y-2">
      <div class="text-xl font-semibold md:text-2xl">
        {{ t.dashboard.pluginGuide.title }}
      </div>
      <div class="text-base text-surface-dimmed leading-relaxed md:text-lg">
        {{ t.dashboard.pluginGuide.description }}
      </div>
    </div>

    <!-- Token Section -->
    <div class="space-y-3">
      <div class="text-base font-semibold">
        {{ t.dashboard.pluginGuide.token.title }}
      </div>
      <div class="text-surface-dimmed mb-6">
        {{ t.dashboard.pluginGuide.token.description }}
      </div>
      <div class="flex gap-3 max-w-md">
        <TextField
          v-model="token"
          readonly
          style="letter-spacing: 4px"
          password
          class="flex-grow children:w-full"
        />
        <RCopyBtn :value="token" />
      </div>
    </div>

    <!-- Plugin Downloads -->
    <div class="space-y-4">
      <div class="text-base font-semibold">
        {{ t.dashboard.pluginGuide.plugins.title }}
      </div>

      <div class="gap-4 grid grid-cols-1 md:gap-6 md:grid-cols-2">
        <!-- VSCode Family Button -->
        <a
          href="https://marketplace.visualstudio.com/items?itemName=jannchie.codetime"
          target="_blank"
          class="w-full block"
        >
          <Btn size="lg" class="p-5 text-left min-h-28 w-full">
            <div class="flex gap-4 items-center">
              <i class="i-mdi-microsoft-visual-studio-code text-4xl flex-shrink-0" />
              <div class="text-left">
                <div class="text-base font-semibold md:text-lg">
                  {{ t.dashboard.pluginGuide.vscode.title }}
                </div>
                <div class="text-sm text-surface-dimmed">
                  {{ t.dashboard.pluginGuide.vscode.description }}
                </div>
              </div>
            </div>
          </Btn>
        </a>

        <!-- JetBrains Family Button -->
        <a
          href="https://plugins.jetbrains.com/plugin/15507-codetime"
          target="_blank"
          class="w-full block"
        >
          <Btn size="lg" class="p-5 text-left min-h-28 w-full">
            <div class="flex gap-4 items-center">
              <i class="i-simple-icons-jetbrains text-4xl flex-shrink-0" />
              <div class="text-left">
                <div class="text-base font-semibold md:text-lg">
                  {{ t.dashboard.pluginGuide.jetbrains.title }}
                </div>
                <div class="text-sm text-surface-dimmed">
                  {{ t.dashboard.pluginGuide.jetbrains.description }}
                </div>
              </div>
            </div>
          </Btn>
        </a>
      </div>
    </div>

    <!-- Setup Instructions -->
    <div class="space-y-4">
      <div class="text-base font-semibold flex gap-2 items-center">
        <i class="i-tabler-info-circle" />
        {{ t.dashboard.pluginGuide.setup.title }}
      </div>
      <ol class="space-y-4 md:space-y-5">
        <li class="flex gap-4 items-start">
          <span class="text-primary-on text-sm font-bold rounded-full bg-primary flex flex-shrink-0 h-8 w-8 items-center justify-center">1</span>
          <span class="text-base">{{ t.dashboard.pluginGuide.setup.step1 }}</span>
        </li>
        <li class="flex gap-4 items-start">
          <span class="text-primary-on text-sm font-bold rounded-full bg-primary flex flex-shrink-0 h-8 w-8 items-center justify-center">2</span>
          <span class="text-base">{{ t.dashboard.pluginGuide.setup.step2 }}</span>
        </li>
        <li class="flex gap-4 items-start">
          <span class="text-primary-on text-sm font-bold rounded-full bg-primary flex flex-shrink-0 h-8 w-8 items-center justify-center">3</span>
          <span class="text-base">{{ t.dashboard.pluginGuide.setup.step3 }}</span>
        </li>
        <li class="flex gap-4 items-start">
          <span class="text-primary-on text-sm font-bold rounded-full bg-primary flex flex-shrink-0 h-8 w-8 items-center justify-center">4</span>
          <span class="text-base">{{ t.dashboard.pluginGuide.setup.step4 }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>
