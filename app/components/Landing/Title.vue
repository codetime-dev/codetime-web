<template>
  <div class="landing-title font-bold text-center flex flex-wrap gap-x-4 gap-y-1 max-w-full min-w-0 justify-center">
    <span class="gradient-text title-code transition-transform duration-300">Code</span>
    <span class="gradient-text title-time transition-transform duration-300">Time</span>
  </div>
</template>

<style scoped>
.landing-title {
  font-size: clamp(2.4rem, 12vw, 7.5rem);
  line-height: 0.95;
}

.gradient-text {
  font-family: "Share Tech Mono", monospace;
  display: inline-block;
  max-width: 100%;
  background-clip: text;
  background-size: 500% 500%;
  -webkit-background-clip: text;
  color: transparent;
  animation: spin 12s infinite;
}

@media (max-width: 380px) {
  .landing-title {
    gap: 0.25rem;
  }
}

.title-code {
  background-image: linear-gradient(-45deg, #0000 10%,  #2ad 50%);
}

.title-time {
  background-image: linear-gradient(135deg, #777 40%,  #0000 90%);
}

@keyframes spin {
  0% {
    background-position: 100% 50%;
  }
  50% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}
</style>
