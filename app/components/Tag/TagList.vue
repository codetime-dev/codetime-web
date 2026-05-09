<script setup lang="ts">
import type { TagResponse } from '~/api/v3/types.gen'
import { Modal, Paper } from '@roku-ui/vue'
import { useUser } from '~/utils'
import { getTagDisplay } from '~/utils/tag'

type Props = {
  tags: TagResponse[]
  selectedTag: TagResponse | null
  loading: boolean
}

type Emits = {
  (e: 'select', tag: TagResponse): void
  (e: 'edit', tag: TagResponse): void
  (e: 'delete', tagId: string): void
  (e: 'createNew'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const t = useI18N()
const user = useUser()

const deleteModal = ref(false)
const tagToDelete = ref<TagResponse | null>(null)

const isFreeUser = computed(() => user.value?.plan === 'free')
const maxTagsForFree = 3
const canCreateMoreTags = computed(() => {
  if (!isFreeUser.value) {
    return true
  }
  return (props.tags?.length || 0) < maxTagsForFree
})

const meta = computed(() => {
  if (isFreeUser.value) {
    return `${props.tags?.length || 0} / ${maxTagsForFree}`
  }
  return `${props.tags?.length || 0} TAGS`
})

function showDeleteConfirm(tag: TagResponse) {
  tagToDelete.value = tag
  deleteModal.value = true
}

function confirmDelete() {
  if (tagToDelete.value) {
    emit('delete', tagToDelete.value.id)
    deleteModal.value = false
    tagToDelete.value = null
  }
}

function cancelDelete() {
  deleteModal.value = false
  tagToDelete.value = null
}
</script>

<template>
  <PanelSection num="01" title="TAGS" :meta="meta" flush>
    <template #icon>
      <i class="i-tabler-tag text-surface-dimmed/70 text-[15px]" />
    </template>

    <div class="tag-toolbar">
      <div class="tag-toolbar-info">
        <span v-if="isFreeUser" class="tag-toolbar-hint">
          {{ t.dashboard.tags.tagList.freeUserLimit }}
        </span>
      </div>
      <button
        type="button"
        class="line-btn line-btn-primary"
        :disabled="!canCreateMoreTags"
        @click="emit('createNew')"
      >
        <i class="i-tabler-plus text-sm" />
        <span>{{ t.dashboard.tags.tagList.createTag }}</span>
      </button>
    </div>

    <div v-if="!canCreateMoreTags && isFreeUser" class="tag-upgrade-hint">
      {{ t.dashboard.tags.tagList.upgradeForMore }}
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="tag-grid">
      <div
        v-for="i in 6"
        :key="i"
        class="tag-cell tag-cell-skel"
      >
        <div class="bg-surface-variant-1/50 h-6 w-6 animate-pulse" />
        <div class="flex-1 space-y-1.5">
          <div class="bg-surface-variant-1/50 h-3 w-24 animate-pulse" />
          <div class="bg-surface-variant-1/40 h-2 w-16 animate-pulse" />
        </div>
      </div>
    </div>

    <!-- EMPTY -->
    <div v-else-if="tags.length === 0" class="tag-empty">
      <i class="i-tabler-tag-off text-surface-dimmed/50 text-3xl" />
      <p class="tag-empty-text">
        {{ t.dashboard.tags.tagList.noTags }}
      </p>
    </div>

    <!-- GRID -->
    <div v-else class="tag-grid">
      <button
        v-for="tag in tags"
        :key="tag.id"
        type="button"
        class="tag-cell group"
        :class="selectedTag?.id === tag.id ? 'tag-cell-active' : ''"
        @click="emit('select', tag)"
      >
        <div
          class="tag-cell-glyph"
          :style="{ backgroundColor: tag.color }"
        >
          {{ getTagDisplay(tag) }}
        </div>
        <div class="tag-cell-body">
          <div class="tag-cell-name">
            {{ tag.name }}
          </div>
          <div class="tag-cell-meta">
            {{ new Date(tag.createdAt).toLocaleDateString() }}
          </div>
        </div>
        <div class="tag-cell-actions" @click.stop>
          <button
            type="button"
            class="tag-cell-action"
            :title="t.dashboard.tags.tagList.editTag"
            @click="emit('edit', tag)"
          >
            <i class="i-tabler-edit text-sm" />
          </button>
          <button
            type="button"
            class="tag-cell-action tag-cell-action-danger"
            :title="t.dashboard.tags.tagList.deleteTag"
            @click="showDeleteConfirm(tag)"
          >
            <i class="i-tabler-trash text-sm" />
          </button>
        </div>
      </button>
    </div>
  </PanelSection>

  <!-- DELETE CONFIRM -->
  <Modal v-model="deleteModal">
    <Paper class="w-md" with-border>
      <div class="confirm-modal">
        <div class="confirm-head">
          <div class="confirm-eyebrow">
            <span class="confirm-eyebrow-bracket">[</span>
            <span class="confirm-eyebrow-num">!</span>
            <span class="confirm-eyebrow-sep">/</span>
            <span>delete</span>
            <span class="confirm-eyebrow-bracket">]</span>
          </div>
          <h3 class="confirm-title">
            {{ t.dashboard.tags.deleteConfirm.deleteTag }}
          </h3>
        </div>

        <p class="confirm-message">
          {{ t.dashboard.tags.deleteConfirm.deleteTagMessage }}
        </p>

        <div v-if="tagToDelete" class="confirm-target">
          <div
            class="tag-cell-glyph"
            :style="{ backgroundColor: tagToDelete.color }"
          >
            {{ getTagDisplay(tagToDelete) }}
          </div>
          <span class="confirm-target-name">{{ tagToDelete.name }}</span>
        </div>

        <div class="confirm-actions">
          <button type="button" class="line-btn" @click="cancelDelete">
            {{ t.dashboard.tags.deleteConfirm.cancel }}
          </button>
          <button type="button" class="line-btn line-btn-danger" @click="confirmDelete">
            <i class="i-tabler-trash text-sm" />
            <span>{{ t.dashboard.tags.deleteConfirm.delete }}</span>
          </button>
        </div>
      </div>
    </Paper>
  </Modal>
</template>

<style scoped>
.tag-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
}

.tag-toolbar-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tag-toolbar-hint {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--r-surface-text-color) 50%, transparent);
}

.tag-upgrade-hint {
  padding: 0.5rem 1.25rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--color-primary-1) 80%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
}

/* Hairline grid */
.tag-grid {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .tag-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .tag-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.tag-cell {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 1rem 1.25rem;
  background: transparent;
  border: 0;
  border-top: 1px solid color-mix(in srgb, var(--r-surface-border-color) 22%, transparent);
  border-left: 1px solid color-mix(in srgb, var(--r-surface-border-color) 22%, transparent);
  cursor: pointer;
  text-align: left;
  position: relative;
  transition: background-color 180ms ease;
}

.tag-cell:hover {
  background-color: rgb(var(--r-color-surface-7) / 0.16);
}

.tag-cell-active {
  background-color: color-mix(in srgb, var(--color-primary-1) 8%, transparent);
}

.tag-cell-active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-primary-1);
}

@media (min-width: 640px) {
  .tag-cell:nth-child(2n+1) {
    border-left: 0;
  }
}

@media (min-width: 1024px) {
  .tag-cell:nth-child(2n+1) {
    border-left: 1px solid color-mix(in srgb, var(--r-surface-border-color) 22%, transparent);
  }
  .tag-cell:nth-child(3n+1) {
    border-left: 0;
  }
}

@media (max-width: 639px) {
  .tag-cell {
    border-left: 0;
  }
}

.tag-cell-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

.tag-cell-body {
  flex: 1;
  min-width: 0;
}

.tag-cell-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--r-surface-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-cell-meta {
  margin-top: 0.2rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: color-mix(in srgb, var(--r-surface-text-color) 45%, transparent);
}

.tag-cell-actions {
  display: inline-flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 180ms ease;
}

.tag-cell:hover .tag-cell-actions,
.tag-cell-active .tag-cell-actions {
  opacity: 1;
}

.tag-cell-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: color-mix(in srgb, var(--r-surface-text-color) 55%, transparent);
  transition: color 180ms ease, background-color 180ms ease;
}

.tag-cell-action:hover {
  color: var(--r-surface-text-color);
  background-color: rgb(var(--r-color-surface-7) / 0.32);
}

.tag-cell-action-danger:hover {
  color: var(--r-color-error-1, #ef4444);
  background-color: color-mix(in srgb, var(--r-color-error-1, #ef4444) 18%, transparent);
}

.tag-cell-skel {
  pointer-events: none;
}

.tag-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  padding: 3.5rem 1rem;
  border-top: 1px solid color-mix(in srgb, var(--r-surface-border-color) 22%, transparent);
}

.tag-empty-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--r-surface-text-color) 50%, transparent);
}

/* Shared button */
.line-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.25rem;
  padding: 0 0.95rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--r-surface-text-color);
  background-color: rgb(var(--r-color-surface-7) / 0.18);
  border: 0;
  cursor: pointer;
  transition: background-color 180ms ease, color 180ms ease, opacity 180ms ease;
}

.line-btn:hover {
  background-color: rgb(var(--r-color-surface-7) / 0.32);
}

.line-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.line-btn-primary {
  color: var(--color-primary-1);
  background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent);
}

.line-btn-primary:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-primary-1) 24%, transparent);
}

.line-btn-danger {
  color: var(--r-color-error-1, #ef4444);
  background-color: color-mix(in srgb, var(--r-color-error-1, #ef4444) 14%, transparent);
}

.line-btn-danger:hover {
  background-color: color-mix(in srgb, var(--r-color-error-1, #ef4444) 24%, transparent);
}

/* Confirm modal */
.confirm-modal {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.confirm-head {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.confirm-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--r-color-error-1, #ef4444);
}

.confirm-eyebrow-bracket,
.confirm-eyebrow-sep {
  opacity: 0.55;
}

.confirm-eyebrow-num {
  color: var(--r-surface-text-color);
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--r-surface-text-color);
}

.confirm-message {
  font-size: 13px;
  line-height: 1.6;
  color: color-mix(in srgb, var(--r-surface-text-color) 70%, transparent);
}

.confirm-target {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: rgb(var(--r-color-surface-7) / 0.18);
}

.confirm-target-name {
  font-size: 13px;
  font-weight: 500;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
