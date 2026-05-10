<script setup lang="ts">
import type { TagResponse } from '~/api/v3/types.gen'
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
  <PanelSection num="01" :title="t.dashboard.tags.tagList.title" :meta="meta" flush>
    <template #icon>
      <i class="i-tabler-tag text-[15px] text-ct-fg-muted" />
    </template>

    <div class="tag-toolbar">
      <div class="tag-toolbar-info">
        <span v-if="isFreeUser" class="tag-toolbar-hint">
          {{ t.dashboard.tags.tagList.freeUserLimit }}
        </span>
      </div>
      <UButton
        variant="subtle"
        icon-left="i-tabler-plus"
        :disabled="!canCreateMoreTags"
        @click="emit('createNew')"
      >
        {{ t.dashboard.tags.tagList.createTag }}
      </UButton>
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
        <div class="h-6 w-6 animate-pulse" style="background: var(--ct-surface-2); border-radius: var(--ct-radius-md)" />
        <div class="flex-1 space-y-1.5">
          <div class="h-3 w-24 animate-pulse" style="background: var(--ct-surface-2)" />
          <div class="h-2 w-16 animate-pulse" style="background: var(--ct-surface-2); opacity: 0.7" />
        </div>
      </div>
    </div>

    <!-- EMPTY -->
    <div v-else-if="tags.length === 0" class="tag-empty">
      <i class="i-tabler-tag-off text-3xl text-ct-fg-muted" />
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
  <UModal v-model="deleteModal" :title="t.dashboard.tags.deleteConfirm.deleteTag" width="440px">
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
    <template #footer>
      <UButton variant="ghost" @click="cancelDelete">
        {{ t.dashboard.tags.deleteConfirm.cancel }}
      </UButton>
      <UButton variant="danger" icon-left="i-tabler-trash" @click="confirmDelete">
        {{ t.dashboard.tags.deleteConfirm.delete }}
      </UButton>
    </template>
  </UModal>
</template>

<style scoped>
.tag-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--ct-border-subtle);
}
.tag-toolbar-info { display: flex; flex-direction: column; gap: 4px; }
.tag-toolbar-hint {
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
}
.tag-upgrade-hint {
  padding: 8px 18px;
  font-size: var(--ct-text-xs);
  color: var(--ct-primary);
  background: var(--ct-primary-soft);
  border-bottom: 1px solid var(--ct-border-subtle);
}

/* Hairline grid */
.tag-grid { display: grid; grid-template-columns: 1fr; }
@media (min-width: 640px) { .tag-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1024px) { .tag-grid { grid-template-columns: 1fr 1fr 1fr; } }

.tag-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 18px;
  background: transparent;
  border: 0;
  border-top: 1px solid var(--ct-border-subtle);
  border-left: 1px solid var(--ct-border-subtle);
  cursor: pointer;
  text-align: left;
  position: relative;
  transition: background-color var(--ct-duration-fast) var(--ct-ease);
}
.tag-cell:hover { background: var(--ct-surface-1); }
.tag-cell-active { background: var(--ct-primary-soft); }
.tag-cell-active:hover { background: color-mix(in srgb, var(--ct-primary) 18%, transparent); }
.tag-cell-active::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: var(--ct-primary);
}
@media (min-width: 640px) {
  .tag-cell:nth-child(2n+1) { border-left: 0; }
}
@media (min-width: 1024px) {
  .tag-cell:nth-child(2n+1) { border-left: 1px solid var(--ct-border-subtle); }
  .tag-cell:nth-child(3n+1) { border-left: 0; }
}
@media (max-width: 639px) {
  .tag-cell { border-left: 0; }
}

.tag-cell-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  font-family: var(--ct-font-mono);
  font-size: 12px;
  font-weight: var(--ct-weight-semibold);
  color: #fff;
  border-radius: var(--ct-radius-md);
  text-transform: uppercase;
}

.tag-cell-body { flex: 1; min-width: 0; }
.tag-cell-name {
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tag-cell-meta {
  margin-top: 2px;
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
}

.tag-cell-actions {
  display: inline-flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--ct-duration-fast) var(--ct-ease);
}
.tag-cell:hover .tag-cell-actions,
.tag-cell-active .tag-cell-actions { opacity: 1; }

.tag-cell-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: var(--ct-fg-muted);
  border-radius: var(--ct-radius-md);
  transition: color var(--ct-duration-fast) var(--ct-ease),
              background-color var(--ct-duration-fast) var(--ct-ease);
}
.tag-cell-action:hover { color: var(--ct-fg); background: var(--ct-surface-2); }
.tag-cell-action-danger:hover { color: var(--ct-danger); background: var(--ct-danger-soft); }

.tag-cell-skel { pointer-events: none; }

.tag-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 56px 16px;
  border-top: 1px solid var(--ct-border-subtle);
}
.tag-empty-text {
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-subtle);
}

/* Confirm modal */
.confirm-message {
  font-size: var(--ct-text-base);
  line-height: 1.6;
  color: var(--ct-fg-muted);
  margin: 0 0 12px;
}
.confirm-target {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
}
.confirm-target-name {
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
}
</style>
