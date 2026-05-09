<template>
  <h1 class="landing-title leading-[0.92] font-mono text-center flex flex-col gap-1 items-center">
    <span class="title-line">
      <span class="title-code" data-text="CODE">CODE</span>
    </span>
    <span class="title-line">
      <span class="title-time" data-text="TIME">TIME</span>
    </span>
  </h1>
</template>

<style scoped>
.landing-title {
  font-size: clamp(4rem, 18vw, 11rem);
  letter-spacing: -0.025em;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.title-line {
  display: inline-flex;
  position: relative;
}

.title-code {
  position: relative;
  background: linear-gradient(135deg, var(--color-primary-1) 0%, var(--color-primary-2) 55%, var(--color-primary-3) 100%);
  background-size: 200% 200%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: title-shimmer 9s ease-in-out infinite;
}

.title-time {
  position: relative;
  color: var(--r-surface-foreground-color);
  opacity: 0.94;
}

.title-time::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  -webkit-text-stroke: 1px color-mix(in srgb, var(--color-primary-1) 65%, transparent);
  color: transparent;
  transform: translate(0.06em, 0.06em);
  opacity: 0.35;
  pointer-events: none;
}

@keyframes title-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
</style>
