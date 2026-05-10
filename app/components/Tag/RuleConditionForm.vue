<script setup lang="ts">
import type { TagResponse } from '~/api/v3/types.gen'

type RuleConditionType = 'CONTAINS' | 'EQUALS' | 'STARTS_WITH' | 'ENDS_WITH' | 'REGEX' | 'NOT_CONTAINS' | 'NOT_EQUALS' | 'NOT_STARTS_WITH' | 'NOT_ENDS_WITH' | 'NOT_REGEX'

type RuleCondition = {
  field: string
  conditionType: RuleConditionType
  value: string
}

type RuleGroup = {
  conditions: RuleCondition[]
  name?: string
}

type Props = {
  tag: TagResponse
  rule?: RuleGroup | null
}

type Emits = {
  (e: 'save', data: { name: string | null, conditions: RuleCondition[] }): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const modelValue = defineModel<boolean>('modelValue', { required: true })
const t = useI18N()

const formData = reactive({
  conditions: props.rule?.conditions.map((c: RuleCondition) => ({
    field: c.field,
    conditionType: c.conditionType,
    value: c.value,
  })) || [{
    field: 'workspaceName',
    conditionType: 'CONTAINS' as RuleConditionType,
    value: '',
  }],
})

const isEditing = computed(() => !!props.rule)
const saving = ref(false)

const fieldOptions = computed(() => [
  { label: t.value.dashboard.tags.fields.workspaceName, value: 'workspaceName' },
  { label: t.value.dashboard.tags.fields.language, value: 'language' },
  { label: t.value.dashboard.tags.fields.gitOrigin, value: 'gitOrigin' },
  { label: t.value.dashboard.tags.fields.gitBranch, value: 'gitBranch' },
  { label: t.value.dashboard.tags.fields.platform, value: 'platform' },
  { label: t.value.dashboard.tags.fields.editor, value: 'editor' },
  { label: t.value.dashboard.tags.fields.absoluteFile, value: 'absoluteFile' },
  { label: t.value.dashboard.tags.fields.relativeFile, value: 'relativeFile' },
])

const conditionTypeOptions = computed(() => [
  { label: t.value.dashboard.tags.conditionTypes.CONTAINS, value: 'CONTAINS' as const },
  { label: t.value.dashboard.tags.conditionTypes.EQUALS, value: 'EQUALS' as const },
  { label: t.value.dashboard.tags.conditionTypes.STARTS_WITH, value: 'STARTS_WITH' as const },
  { label: t.value.dashboard.tags.conditionTypes.ENDS_WITH, value: 'ENDS_WITH' as const },
  { label: t.value.dashboard.tags.conditionTypes.REGEX, value: 'REGEX' as const },
  { label: `不${t.value.dashboard.tags.conditionTypes.CONTAINS}`, value: 'NOT_CONTAINS' as const },
  { label: `不${t.value.dashboard.tags.conditionTypes.EQUALS}`, value: 'NOT_EQUALS' as const },
  { label: `不${t.value.dashboard.tags.conditionTypes.STARTS_WITH}`, value: 'NOT_STARTS_WITH' as const },
  { label: `不${t.value.dashboard.tags.conditionTypes.ENDS_WITH}`, value: 'NOT_ENDS_WITH' as const },
  { label: `不${t.value.dashboard.tags.conditionTypes.REGEX}`, value: 'NOT_REGEX' as const },
])

function addCondition() {
  formData.conditions.push({
    field: 'workspaceName',
    conditionType: 'CONTAINS' as RuleConditionType,
    value: '',
  })
}

function removeCondition(index: number) {
  if (formData.conditions.length > 1) {
    formData.conditions.splice(index, 1)
  }
}

async function handleSave() {
  if (formData.conditions.some((c: RuleCondition) => !c.value.trim())) {
    return
  }
  try {
    saving.value = true
    emit('save', {
      name: null,
      conditions: formData.conditions.filter((c: RuleCondition) => c.value.trim()),
    })
    modelValue.value = false
  }
  finally {
    saving.value = false
  }
}

function handleClose() {
  modelValue.value = false
  emit('close')
}
</script>

<template>
  <UModal
    v-model="modelValue"
    :title="isEditing ? t.dashboard.tags.ruleForm.edit : t.dashboard.tags.ruleForm.create"
    width="720px"
  >
    <form id="rule-form" @submit.prevent="handleSave">
      <div class="rcf-row rcf-row-head">
        <span class="rcf-label">{{ t.dashboard.tags.ruleForm.conditions }}</span>
        <UButton
          type="button"
          variant="subtle"
          icon-left="i-tabler-plus"
          @click="addCondition"
        >
          {{ t.dashboard.tags.ruleForm.addCondition }}
        </UButton>
      </div>

      <div class="rcf-conditions">
        <div
          v-for="(condition, index) in formData.conditions"
          :key="index"
          class="rcf-cond"
        >
          <div class="rcf-cond-grid">
            <div>
              <label class="rcf-sublabel">{{ t.dashboard.tags.ruleForm.field }}</label>
              <USelect
                v-model="condition.field"
                :options="fieldOptions"
                :placeholder="t.dashboard.tags.ruleForm.field"
              />
            </div>
            <div>
              <label class="rcf-sublabel">{{ t.dashboard.tags.ruleForm.conditionType }}</label>
              <USelect
                v-model="condition.conditionType"
                :options="conditionTypeOptions"
                :placeholder="t.dashboard.tags.ruleForm.conditionType"
              />
            </div>
            <div>
              <label class="rcf-sublabel">{{ t.dashboard.tags.ruleForm.value }}</label>
              <UInput
                v-model="condition.value"
                :placeholder="t.dashboard.tags.ruleForm.valuePlaceholder"
              />
            </div>
            <div class="rcf-cond-action">
              <UButton
                v-if="formData.conditions.length > 1"
                type="button"
                variant="ghost"
                icon-left="i-tabler-trash"
                @click="removeCondition(index)"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
    <template #footer>
      <UButton variant="ghost" type="button" @click="handleClose">
        {{ t.dashboard.tags.ruleForm.cancel }}
      </UButton>
      <UButton
        form="rule-form"
        type="submit"
        variant="primary"
        :loading="saving"
        :disabled="formData.conditions.some((c: RuleCondition) => !c.value.trim())"
        icon-left="i-tabler-check"
        @click="handleSave"
      >
        {{ isEditing ? t.dashboard.tags.ruleForm.save : t.dashboard.tags.ruleForm.create }}
      </UButton>
    </template>
  </UModal>
</template>

<style scoped>
.rcf-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.rcf-row-head { margin-bottom: 12px; }
.rcf-label { font-size: var(--ct-text-sm); font-weight: var(--ct-weight-medium); color: var(--ct-fg); }

.rcf-conditions { display: flex; flex-direction: column; gap: 12px; }
.rcf-cond {
  border: 1px solid var(--ct-border);
  padding: 14px;
}
.rcf-cond-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .rcf-cond-grid { grid-template-columns: 1.2fr 1.2fr 1.6fr 44px; align-items: end; }
}
.rcf-sublabel {
  display: block;
  font-size: var(--ct-text-xs);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg-muted);
  margin-bottom: 6px;
}
.rcf-cond-action { display: flex; align-items: end; }
</style>
