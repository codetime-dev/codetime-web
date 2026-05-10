<script setup lang="ts">
import type { TagResponse } from '~/api/v3/types.gen'
import { v3UpdateTag } from '~/api/v3'
import { useUser } from '~/utils'
import { getTagDisplay } from '~/utils/tag'

type RuleConditionType = 'CONTAINS' | 'EQUALS' | 'STARTS_WITH' | 'ENDS_WITH' | 'REGEX' | 'NOT_CONTAINS' | 'NOT_EQUALS' | 'NOT_STARTS_WITH' | 'NOT_ENDS_WITH' | 'NOT_REGEX'

type RuleCondition = {
  field: string
  conditionType: RuleConditionType
  value: string
}

type RuleGroup = {
  operator: 'AND' | 'OR'
  conditions: (RuleCondition | RuleGroup)[]
}

type Props = {
  tag: TagResponse
}

type Emits = {
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const t = useI18N()
const user = useUser()

const saving = ref(false)

type EditingRuleGroup = {
  id: string
  conditions: RuleCondition[]
}

const isEditing = ref(false)
const editingRuleGroups = ref<EditingRuleGroup[]>([])

const rules = computed(() => {
  return props.tag.rules as (RuleCondition | RuleGroup | null | undefined)
})

const hasGroupChanges = computed(() => {
  const originalGroups = convertRulesToEditingGroups(rules.value)
  return JSON.stringify(originalGroups) !== JSON.stringify(editingRuleGroups.value)
})

const hasChanges = computed(() => {
  return isEditing.value && hasGroupChanges.value
})

function convertRulesToEditingGroups(apiRules: RuleCondition | RuleGroup | null | undefined): EditingRuleGroup[] {
  if (!apiRules) {
    return []
  }
  if ('field' in apiRules) {
    return [{
      id: `group-${Date.now()}`,
      conditions: [apiRules],
    }]
  }
  if ('operator' in apiRules) {
    if (apiRules.operator === 'OR') {
      return apiRules.conditions.map((condition, index) =>
        'field' in condition
          ? {
              id: `group-${Date.now()}-${index}`,
              conditions: [condition],
            }
          : convertRulesToEditingGroups(condition)[0] || {
            id: `group-${Date.now()}-${index}`,
            conditions: [],
          },
      )
    }
    else if (apiRules.operator === 'AND') {
      const conditions: RuleCondition[] = []
      for (const condition of apiRules.conditions) {
        if ('field' in condition) {
          conditions.push(condition)
        }
      }
      return [{
        id: `group-${Date.now()}`,
        conditions,
      }]
    }
  }
  return []
}

function convertEditingGroupsToRules(groups: EditingRuleGroup[]): RuleCondition | RuleGroup | null {
  if (groups.length === 0) {
    return null
  }
  if (groups.length === 1) {
    const group = groups[0]
    if (group && group.conditions.length === 1) {
      return group.conditions[0] || null
    }
    else if (group && group.conditions.length > 1) {
      return {
        operator: 'AND',
        conditions: group.conditions,
      }
    }
  }
  const orConditions: (RuleCondition | RuleGroup)[] = groups
    .filter(group => group && group.conditions.length > 0)
    .map(group => group.conditions.length === 1
      ? group.conditions[0]
      : {
          operator: 'AND',
          conditions: group.conditions,
        },
    )
    .filter(condition => condition !== undefined) as (RuleCondition | RuleGroup)[]

  return {
    operator: 'OR',
    conditions: orConditions,
  }
}

const isFreeUser = computed(() => user.value?.plan === 'free')
const maxRulesForFree = 1

const canCreateMoreRules = computed(() => {
  if (!isFreeUser.value) {
    return true
  }
  const currentLength = isEditing.value
    ? editingRuleGroups.value.length
    : convertRulesToEditingGroups(rules.value).length
  return currentLength < maxRulesForFree
})

watch(rules, (newRules) => {
  if (!isEditing.value) {
    editingRuleGroups.value = convertRulesToEditingGroups(newRules)
  }
}, { immediate: true })

watch(() => props.tag.id, () => {
  if (isEditing.value) {
    isEditing.value = false
  }
})

const displayRuleGroups = computed(() => {
  if (isEditing.value) {
    return editingRuleGroups.value
  }
  return convertRulesToEditingGroups(rules.value)
})

const fieldOptions = computed(() => [
  { label: t.value.dashboard.tags.fields.workspaceName, id: 'workspaceName' },
  { label: t.value.dashboard.tags.fields.language, id: 'language' },
  { label: t.value.dashboard.tags.fields.gitOrigin, id: 'gitOrigin' },
  { label: t.value.dashboard.tags.fields.gitBranch, id: 'gitBranch' },
  { label: t.value.dashboard.tags.fields.platform, id: 'platform' },
  { label: t.value.dashboard.tags.fields.editor, id: 'editor' },
  { label: t.value.dashboard.tags.fields.absoluteFile, id: 'absoluteFile' },
  { label: t.value.dashboard.tags.fields.relativeFile, id: 'relativeFile' },
])
const fieldDisplayMap = computed(() => {
  return Object.fromEntries(fieldOptions.value.map(f => [f.id, f.label]))
})

const conditionTypeOptions = computed(() => [
  { label: t.value.dashboard.tags.conditionTypes.CONTAINS, id: 'CONTAINS' },
  { label: t.value.dashboard.tags.conditionTypes.EQUALS, id: 'EQUALS' },
  { label: t.value.dashboard.tags.conditionTypes.STARTS_WITH, id: 'STARTS_WITH' },
  { label: t.value.dashboard.tags.conditionTypes.ENDS_WITH, id: 'ENDS_WITH' },
  { label: t.value.dashboard.tags.conditionTypes.REGEX, id: 'REGEX' },
  { label: t.value.dashboard.tags.conditionTypes.NOT_CONTAINS, id: 'NOT_CONTAINS' },
  { label: t.value.dashboard.tags.conditionTypes.NOT_EQUALS, id: 'NOT_EQUALS' },
  { label: t.value.dashboard.tags.conditionTypes.NOT_STARTS_WITH, id: 'NOT_STARTS_WITH' },
  { label: t.value.dashboard.tags.conditionTypes.NOT_ENDS_WITH, id: 'NOT_ENDS_WITH' },
  { label: t.value.dashboard.tags.conditionTypes.NOT_REGEX, id: 'NOT_REGEX' },
])
const conditionTypeDisplayMap = computed(() => {
  return Object.fromEntries(conditionTypeOptions.value.map(c => [c.id, c.label]))
})

function startEditing() {
  isEditing.value = true
  editingRuleGroups.value = rules.value ? convertRulesToEditingGroups(rules.value) : []
}

function createRuleGroup() {
  if (!isEditing.value) {
    startEditing()
  }
  const newCondition: RuleCondition = {
    field: 'workspaceName',
    conditionType: 'CONTAINS' as RuleConditionType,
    value: '',
  }
  const newGroup: EditingRuleGroup = {
    id: `temp-group-${Date.now()}`,
    conditions: [newCondition],
  }
  editingRuleGroups.value.push(newGroup)
}

function updateCondition(groupId: string, conditionIndex: number, field: string, conditionType: RuleConditionType, value: string) {
  if (!isEditing.value) {
    startEditing()
  }
  const group = editingRuleGroups.value.find(g => g.id === groupId)
  if (group && group.conditions[conditionIndex]) {
    group.conditions[conditionIndex] = {
      ...group.conditions[conditionIndex],
      field,
      conditionType,
      value,
    }
  }
}

function addConditionToGroup(groupId: string) {
  if (!isEditing.value) {
    startEditing()
  }
  const group = editingRuleGroups.value.find(g => g.id === groupId)
  if (group) {
    const newCondition: RuleCondition = {
      field: 'workspaceName',
      conditionType: 'CONTAINS' as RuleConditionType,
      value: '',
    }
    group.conditions.push(newCondition)
  }
}

function removeCondition(groupId: string, conditionIndex: number) {
  if (!isEditing.value) {
    startEditing()
  }
  const group = editingRuleGroups.value.find(g => g.id === groupId)
  if (group && group.conditions.length > 1) {
    group.conditions.splice(conditionIndex, 1)
  }
}

async function saveChanges() {
  try {
    saving.value = true
    const newRules = convertEditingGroupsToRules(editingRuleGroups.value)
    await v3UpdateTag({
      path: { tag_id: props.tag.id },
      body: {
        name: props.tag.name,
        color: props.tag.color,
        emoji: props.tag.emoji,
        rules: newRules as unknown,
      } as any,
    })
    emit('refresh')
    isEditing.value = false
  }
  catch (error) {
    console.error('Failed to save changes:', error)
  }
  finally {
    saving.value = false
  }
}

function cancelEditing() {
  isEditing.value = false
  editingRuleGroups.value = rules.value ? convertRulesToEditingGroups(rules.value) : []
}

function removeRuleGroup(groupId: string) {
  if (!isEditing.value) {
    startEditing()
  }
  const groupIndex = editingRuleGroups.value.findIndex(g => g.id === groupId)
  if (groupIndex !== -1) {
    editingRuleGroups.value.splice(groupIndex, 1)
  }
}
</script>

<template>
  <PanelSection num="02" :title="t.dashboard.tags.tagRules.title" :meta="isEditing ? 'editing' : 'or · and · condition'" flush>
    <template #icon>
      <i class="i-tabler-rules text-[15px] text-ct-fg-muted" />
    </template>

    <!-- Toolbar -->
    <div class="rules-toolbar">
      <div class="rules-tag">
        <div
          class="rules-tag-glyph"
          :style="{ backgroundColor: tag.color }"
        >
          {{ getTagDisplay(tag) }}
        </div>
        <div class="rules-tag-meta">
          <div class="rules-tag-name">
            {{ tag.name }}
          </div>
          <div class="rules-tag-hint">
            {{ isEditing ? t.dashboard.tags.common.editingMode : t.dashboard.tags.common.ruleRelationship }}
            <span v-if="isFreeUser" class="rules-tag-quota">
              · {{ convertRulesToEditingGroups(rules || null).length }}/{{ maxRulesForFree }}
            </span>
          </div>
        </div>
      </div>
      <div class="rules-actions">
        <template v-if="isEditing">
          <button type="button" class="line-btn" @click="cancelEditing">
            {{ t.dashboard.tags.ruleForm.cancel }}
          </button>
          <button
            type="button"
            class="line-btn line-btn-primary"
            :disabled="!hasChanges || saving"
            @click="saveChanges"
          >
            <i v-if="saving" class="i-tabler-loader text-sm animate-spin" />
            <i v-else class="i-tabler-check text-sm" />
            <span>{{ t.dashboard.tags.ruleForm.save }}</span>
          </button>
        </template>
        <template v-else>
          <button type="button" class="line-btn" @click="startEditing">
            <i class="i-tabler-edit text-sm" />
            <span>{{ t.dashboard.tags.tagRules.edit }}</span>
          </button>
        </template>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="displayRuleGroups.length === 0" class="rules-empty">
      <i class="i-tabler-rules-off text-3xl text-ct-fg-muted" />
      <p class="rules-empty-text">
        {{ t.dashboard.tags.tagRules.noRules }}
      </p>
      <p v-if="isFreeUser" class="rules-empty-hint">
        {{ t.dashboard.tags.common.freeUserRuleLimit }}
      </p>
      <button
        type="button"
        class="line-btn line-btn-primary"
        :disabled="!canCreateMoreRules"
        @click="createRuleGroup"
      >
        <i class="i-tabler-plus text-sm" />
        <span>{{ t.dashboard.tags.tagRules.createRule }}</span>
      </button>
      <p v-if="!canCreateMoreRules && isFreeUser" class="rules-empty-hint">
        {{ t.dashboard.tags.common.upgradeForMoreRules }}
      </p>
    </div>

    <!-- Rule groups -->
    <div v-else class="rules-list">
      <template v-for="(group, groupIndex) in displayRuleGroups" :key="group.id">
        <div v-if="groupIndex > 0" class="rules-or">
          <span class="rules-or-line" />
          <span class="rules-or-label">OR</span>
          <span class="rules-or-line" />
        </div>

        <div class="rules-group">
          <div class="rules-group-conditions">
            <template v-for="(condition, conditionIndex) in group.conditions" :key="conditionIndex">
              <div v-if="conditionIndex > 0" class="rules-and">
                AND
              </div>

              <div class="rules-condition">
                <template v-if="isEditing">
                  <select
                    class="line-select"
                    :value="condition.field"
                    @change="(e) => updateCondition(group.id, conditionIndex, (e.target as HTMLSelectElement).value, condition.conditionType, condition.value)"
                  >
                    <option v-for="f in fieldOptions" :key="f.id" :value="f.id">
                      {{ f.label }}
                    </option>
                  </select>

                  <select
                    class="line-select"
                    :value="condition.conditionType"
                    @change="(e) => updateCondition(group.id, conditionIndex, condition.field, (e.target as HTMLSelectElement).value as RuleConditionType, condition.value)"
                  >
                    <option v-for="c in conditionTypeOptions" :key="c.id" :value="c.id">
                      {{ c.label }}
                    </option>
                  </select>

                  <input
                    type="text"
                    class="line-input rules-value-input"
                    :value="condition.value"
                    :placeholder="t.dashboard.tags.ruleForm.valuePlaceholder"
                    autocomplete="off"
                    spellcheck="false"
                    @input="(e) => updateCondition(group.id, conditionIndex, condition.field, condition.conditionType, (e.target as HTMLInputElement).value)"
                  >

                  <button
                    type="button"
                    class="rules-remove"
                    :title="t.dashboard.tags.ruleForm.cancel"
                    @click="group.conditions.length > 1 ? removeCondition(group.id, conditionIndex) : removeRuleGroup(group.id)"
                  >
                    <i class="i-tabler-x text-sm" />
                  </button>
                </template>
                <template v-else>
                  <span class="rules-pill rules-pill-field">{{ fieldDisplayMap[condition.field] || condition.field }}</span>
                  <span class="rules-pill rules-pill-op">{{ conditionTypeDisplayMap[condition.conditionType] || condition.conditionType }}</span>
                  <span class="rules-pill rules-pill-value">"{{ condition.value }}"</span>
                </template>
              </div>
            </template>

            <button
              v-if="isEditing"
              type="button"
              class="line-btn line-btn-ghost rules-add-and"
              @click="addConditionToGroup(group.id)"
            >
              <i class="i-tabler-plus text-sm" />
              <span>AND</span>
            </button>
          </div>
        </div>
      </template>

      <div v-if="isEditing && editingRuleGroups.length > 0" class="rules-add-or">
        <button
          type="button"
          class="line-btn line-btn-ghost"
          :disabled="!canCreateMoreRules"
          @click="createRuleGroup"
        >
          <i class="i-tabler-plus text-sm" />
          <span>OR</span>
        </button>
      </div>
    </div>
  </PanelSection>
</template>

<style scoped>
.rules-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--ct-border-subtle);
}

.rules-tag {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.rules-tag-glyph {
  width: 1.85rem;
  height: 1.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--ct-font-mono);
  font-size: 12px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.rules-tag-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.rules-tag-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rules-tag-hint {
  font-size: var(--ct-text-xs);
      color: var(--ct-fg-subtle);
}

.rules-tag-quota {
  color: color-mix(in srgb, var(--color-primary-1) 80%, transparent);
}

.rules-actions {
  display: inline-flex;
  gap: 0.5rem;
}

/* Empty */
.rules-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  padding: 3rem 1rem;
}

.rules-empty-text {
  font-size: var(--ct-text-xs);
  letter-spacing: 0.2em;
    color: var(--ct-fg-subtle);
}

.rules-empty-hint {
  font-size: 11.5px;
  color: var(--ct-fg-subtle);
  text-align: center;
}

/* Group list */
.rules-list {
  display: flex;
  flex-direction: column;
  padding: 0.5rem 1.25rem 1rem;
  gap: 0.5rem;
}

.rules-or {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0;
}

.rules-or-line {
  flex: 1;
  height: 1px;
  background: var(--ct-border);
}

.rules-or-label {
  font-size: var(--ct-text-xs);
  font-weight: 600;
  letter-spacing: 0.32em;
  color: var(--color-primary-1);
}

.rules-group {
  padding: 0.85rem 1rem;
  background-color: var(--ct-surface-1);
}

.rules-group-conditions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.rules-and {
  font-size: var(--ct-text-xs);
  font-weight: 600;
    color: var(--ct-fg-subtle);
  padding: 0 0.25rem;
}

.rules-condition {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.rules-pill {
  display: inline-flex;
  align-items: center;
  height: 1.85rem;
  padding: 0 0.7rem;
  font-size: var(--ct-text-xs);
  background-color: var(--ct-surface-2);
  color: var(--ct-fg);
}

.rules-pill-op {
  color: var(--color-primary-1);
  letter-spacing: 0.08em;
    font-size: 10.5px;
}

.rules-pill-value {
  color: color-mix(in srgb, var(--ct-fg) 90%, transparent);
}

/* Inputs */
.line-input {
  display: inline-block;
  height: 2.25rem;
  padding: 0 0.75rem;
  font-family: var(--ct-font-mono);
  font-size: 12px;
  color: var(--ct-fg);
  background-color: var(--ct-surface-1);
  border: 0;
  outline: 0;
  transition: background-color 180ms ease, box-shadow 180ms ease;
}

.line-input:hover {
  background-color: var(--ct-surface-2);
}

.line-input:focus {
  background-color: var(--ct-surface-2);
  box-shadow: inset 0 -1px 0 var(--color-primary-1);
}

.line-input::placeholder {
  color: var(--ct-fg-subtle);
}

.rules-value-input {
  min-width: 10rem;
  flex: 1;
}

.line-select {
  height: 2.25rem;
  padding: 0 1.85rem 0 0.75rem;
  font-family: var(--ct-font-mono);
  font-size: 12px;
  color: var(--ct-fg);
  background-color: var(--ct-surface-1);
  border: 0;
  outline: 0;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 0.6rem center;
  background-size: 12px 12px;
  transition: background-color 180ms ease;
}

.line-select:hover {
  background-color: var(--ct-surface-2);
}

/* Remove btn */
.rules-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: var(--ct-surface-1);
  border: 0;
  cursor: pointer;
  color: var(--ct-fg-muted);
  transition: color 180ms ease, background-color 180ms ease;
}

.rules-remove:hover {
  color: var(--ct-danger);
  background-color: color-mix(in srgb, var(--ct-danger) 18%, transparent);
}

.rules-add-and {
  height: 1.85rem !important;
  padding: 0 0.75rem !important;
  font-size: 10.5px !important;
}

.rules-add-or {
  margin-top: 0.5rem;
  display: flex;
  justify-content: flex-start;
}

/* Buttons — aligned with U/Button md */
.line-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  font-family: var(--ct-font-sans);
  font-size: var(--ct-text-base);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg);
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-lg);
  cursor: pointer;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              border-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease);
}
.line-btn:hover:not(:disabled) { background: var(--ct-surface-1); border-color: var(--ct-border-strong); }
.line-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.line-btn-primary {
  color: var(--ct-on-primary);
  background: var(--ct-primary);
  border-color: var(--ct-primary);
}
.line-btn-primary:hover:not(:disabled) {
  background: var(--ct-primary-hover);
  border-color: var(--ct-primary-hover);
}

.line-btn-ghost {
  background: transparent;
  color: var(--ct-fg-muted);
  border-color: var(--ct-border);
}
.line-btn-ghost:hover:not(:disabled) {
  color: var(--ct-fg);
  background: var(--ct-surface-1);
}
</style>
