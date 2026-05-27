<script setup lang="ts">
// In-context privacy consent. Shown when a user tries to use a facet in the
// widget builder that they currently keep private — one click flips it
// public (via usePrivacy().patch) so the badge can surface it.
defineProps<{
  open: boolean
  // Human label of the facet, e.g. "current project".
  label: string
  busy?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <UModal
    :model-value="open"
    :title="`Make ${label} public?`"
    width="420px"
    @update:model-value="emit('update:open', $event)"
  >
    <p class="consent-body">
      <strong>{{ label }}</strong> is currently private. Making it public lets it appear
      anywhere your badges are embedded and on your public profile. You can switch it back
      anytime in Privacy settings.
    </p>
    <template #footer>
      <UButton variant="ghost" :disabled="busy" @click="emit('update:open', false)">
        Cancel
      </UButton>
      <UButton variant="primary" icon-left="i-tabler-world" :loading="busy" @click="emit('confirm')">
        Make public
      </UButton>
    </template>
  </UModal>
</template>

<style scoped>
.consent-body {
  font-size: var(--ct-text-sm);
  line-height: 1.7;
  color: var(--ct-fg-muted);
}
.consent-body strong { color: var(--ct-fg); }
</style>
