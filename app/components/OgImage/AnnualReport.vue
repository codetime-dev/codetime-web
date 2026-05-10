<script setup lang="ts">
// OG image template for the user annual report page.
// Used by nuxt-og-image via defineOgImageComponent('AnnualReport', {...}).
// Rendered at 1200x630 by satori — keep styles inline and avoid runtime APIs.

withDefaults(
  defineProps<{
    username?: string
    avatar?: string
    year?: number
    totalHours?: number
    activeDays?: number
    title?: string
    description?: string
  }>(),
  {
    username: '',
    avatar: '',
    year: new Date().getFullYear(),
    totalHours: 0,
    activeDays: 0,
    title: 'Annual Code Time Report',
    description: 'codetime.dev',
  },
)
</script>

<template>
  <div
    style="
      width: 1200px;
      height: 630px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 72px 80px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0067cc 100%);
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
    "
  >
    <div style="display: flex; align-items: center; gap: 16px;">
      <img src="https://codetime.dev/icon.png" width="48" height="48" alt="" style="border-radius: 12px;">
      <span style="font-size: 28px; font-weight: 600; letter-spacing: 0.02em;">Code Time</span>
    </div>

    <div style="display: flex; flex-direction: column; gap: 18px;">
      <span style="font-size: 22px; opacity: 0.7; font-family: monospace; letter-spacing: 0.12em; text-transform: uppercase;">
        {{ year }} · Annual Report
      </span>
      <span style="font-size: 64px; font-weight: 700; line-height: 1.1; max-width: 900px;">
        {{ title }}
      </span>
      <span style="font-size: 26px; opacity: 0.85; max-width: 900px;">
        {{ description }}
      </span>
    </div>

    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 20px;">
        <img
          v-if="avatar"
          :src="avatar"
          width="64"
          height="64"
          alt=""
          style="border-radius: 999px; border: 2px solid rgba(255,255,255,0.4);"
        >
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 24px; font-weight: 600;">{{ username || 'codetime.dev' }}</span>
          <span style="font-size: 18px; opacity: 0.7;">codetime.dev</span>
        </div>
      </div>

      <div style="display: flex; gap: 36px;">
        <div style="display: flex; flex-direction: column; align-items: flex-end;">
          <span style="font-size: 14px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.1em;">Hours</span>
          <span style="font-size: 40px; font-weight: 700;">{{ totalHours }}</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end;">
          <span style="font-size: 14px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.1em;">Active Days</span>
          <span style="font-size: 40px; font-weight: 700;">{{ activeDays }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
