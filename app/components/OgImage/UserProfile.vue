<script setup lang="ts">
// OG image for the public user profile page.
// Rendered at 1200x630 by satori — keep styles inline.

withDefaults(
  defineProps<{
    username?: string
    avatar?: string
    bio?: string
    totalHours?: number
    languages?: number
    plan?: string
    locale?: string
  }>(),
  {
    username: '',
    avatar: '',
    bio: '',
    totalHours: 0,
    languages: 0,
    plan: 'free',
    locale: 'en',
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
      font-family: 'Inter', 'Noto Sans SC', 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans KR', sans-serif;
    "
  >
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <img src="https://codetime.dev/icon.png" width="48" height="48" alt="" style="border-radius: 12px;">
        <span style="font-size: 28px; font-weight: 600; letter-spacing: 0.02em;">Code Time</span>
      </div>
      <span
        v-if="plan && plan.toLowerCase() !== 'free'"
        style="
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.16em;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          text-transform: uppercase;
        "
      >{{ plan }}</span>
    </div>

    <div style="display: flex; align-items: center; gap: 32px;">
      <img
        v-if="avatar"
        :src="avatar"
        width="160"
        height="160"
        alt=""
        style="border-radius: 999px; border: 4px solid rgba(255,255,255,0.45);"
      >
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 820px;">
        <span style="font-size: 64px; font-weight: 700; line-height: 1.1;">
          {{ username || 'CodeTime user' }}
        </span>
        <span
          v-if="bio"
          style="font-size: 26px; opacity: 0.85; line-height: 1.4;"
        >{{ bio }}</span>
      </div>
    </div>

    <div style="display: flex; align-items: center; justify-content: space-between;">
      <span style="font-size: 18px; opacity: 0.7;">codetime.dev</span>
      <div style="display: flex; gap: 36px;">
        <div style="display: flex; flex-direction: column; align-items: flex-end;">
          <span style="font-size: 14px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.1em;">Hours</span>
          <span style="font-size: 40px; font-weight: 700;">{{ totalHours }}</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end;">
          <span style="font-size: 14px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.1em;">Languages</span>
          <span style="font-size: 40px; font-weight: 700;">{{ languages }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
