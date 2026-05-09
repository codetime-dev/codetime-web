<template>
  <div class="dash-page-frame mx-auto max-w-7xl w-full">
    <slot />
  </div>
</template>

<style scoped>
.dash-page-frame {
  position: relative;
}
.dash-page-frame::before,
.dash-page-frame::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--r-surface-border-color);
  opacity: 0.3;
  pointer-events: none;
}
.dash-page-frame::before {
  left: 0;
}
.dash-page-frame::after {
  right: 0;
}
</style>
