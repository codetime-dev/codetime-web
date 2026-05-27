<script setup lang="ts" generic="T extends string">
// Styled native <select> for widget form rows that have more options than
// fit comfortably in a segmented control (e.g. the usage range picker's
// calendar + rolling sets). Groups render as <optgroup>.

type Option = {
  id: T
  label: string
}

type Group = {
  label?: string
  options: Option[]
}

defineProps<{
  groups: Group[]
}>()

const model = defineModel<T>({ required: true })

function onChange(e: Event) {
  model.value = (e.target as HTMLSelectElement).value as T
}
</script>

<template>
  <div class="wf-select-wrap">
    <select class="wf-select" :value="model" @change="onChange">
      <template v-for="(group, gi) in groups" :key="gi">
        <optgroup v-if="group.label" :label="group.label">
          <option v-for="opt in group.options" :key="String(opt.id)" :value="opt.id">
            {{ opt.label }}
          </option>
        </optgroup>
        <option v-for="opt in group.options" v-else :key="String(opt.id)" :value="opt.id">
          {{ opt.label }}
        </option>
      </template>
    </select>
  </div>
</template>

<style scoped>
.wf-select-wrap {
  width: 100%;
}
.wf-select {
  width: 100%;
  height: 36px;
  padding: 0 32px 0 12px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg);
  background-color: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-lg);
  outline: 0;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px 12px;
  transition: border-color var(--ct-duration-fast) var(--ct-ease),
              background-color var(--ct-duration-fast) var(--ct-ease);
}
.wf-select:hover {
  border-color: var(--ct-border);
  background-color: var(--ct-surface-2);
}
.wf-select:focus {
  border-color: var(--ct-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-primary) 18%, transparent);
}
</style>
