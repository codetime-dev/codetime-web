<script setup lang="ts">
import type { TagResponse } from '~/api/v3/types.gen'
import { deleteV3TagsByTagId, getV3Tags, postV3Tags, putV3TagsByTagId } from '~/api/v3'

definePageMeta({
  layout: 'dashboard',
})
const t = useI18N()
const selectedTag = ref<TagResponse | null>(null)
const showTagForm = ref(false)
const editingTag = ref<TagResponse | null>(null)
const tagStatsRef = ref()

// 获取标签列表
const { data: tags, refresh: refreshTags } = useAsyncData('tags', async () => {
  try {
    const response = await getV3Tags()
    return response.data || []
  }
  catch (error_) {
    console.error('Failed to fetch tags:', error_)
    return []
  }
}, {
  server: false,
})

// 创建或更新标签
async function saveTag(tagData: { name: string, color: string, emoji?: string | null }) {
  try {
    await (editingTag.value
      ? putV3TagsByTagId({
          path: { tag_id: editingTag.value.id },
          body: {
            ...tagData,
            rules: (editingTag.value.rules || null) as unknown,
          } as any,
        })
      : postV3Tags({
          body: {
            ...tagData,
            rules: null as unknown,
          } as any,
        }))
    await refreshTags()
    // 刷新所有tag统计相关的缓存
    clearNuxtData('allTagStats')

    // 如果是编辑现有标签且当前有选中标签，更新选中标签的数据
    if (editingTag.value && selectedTag.value && tags.value) {
      const updatedTag = tags.value.find(tag => tag.id === selectedTag.value?.id)
      if (updatedTag) {
        selectedTag.value = updatedTag
      }
    }

    closeTagForm()
  }
  catch (error_) {
    console.error('Failed to save tag:', error_)
  }
}

// 编辑标签
function editTag(tag: TagResponse) {
  editingTag.value = tag
  showTagForm.value = true
}

// 删除标签
async function deleteTag(tagId: string) {
  try {
    await deleteV3TagsByTagId({
      path: { tag_id: tagId },
    } as any)
    await refreshTags()
    // 刷新所有tag统计相关的缓存
    clearNuxtData('allTagStats')
    if (selectedTag.value?.id === tagId) {
      selectedTag.value = null
    }
  }
  catch (error_) {
    console.error('Failed to delete tag:', error_)
  }
}

// 选择标签
function selectTag(tag: TagResponse) {
  selectedTag.value = tag
}

// 创建新标签
function createNewTag() {
  editingTag.value = null
  showTagForm.value = true
}

// 关闭表单
function closeTagForm() {
  showTagForm.value = false
  editingTag.value = null
}

// 处理规则更新后的刷新
async function handleRuleRefresh() {
  await refreshTags()
  // 刷新所有tag统计相关的缓存
  clearNuxtData('allTagStats')
  // 清除当前标签的统计数据缓存（所有时间范围）
  if (selectedTag.value) {
    clearNuxtData(`tag-stats-${selectedTag.value.id}-7d`)
    clearNuxtData(`tag-stats-${selectedTag.value.id}-30d`)
    clearNuxtData(`tag-stats-${selectedTag.value.id}-90d`)
  }
  // 如果当前有选中的标签，更新选中标签的数据
  if (selectedTag.value && tags.value) {
    const updatedTag = tags.value.find(tag => tag.id === selectedTag.value?.id)
    if (updatedTag) {
      selectedTag.value = updatedTag
    }
  }
  // 刷新 TagStats 组件的数据
  if (tagStatsRef.value) {
    await tagStatsRef.value.refreshStats()
  }
}
</script>

<template>
  <DashboardPageTitle
    num="00"
    :title="t.dashboard.pageHeader.title.tags"
    :description="t.dashboard.pageHeader.description.tags"
  />

  <DashboardPageContent>
    <div class="space-y-6">
      <!-- 标签列表 -->
      <TagList
        :tags="tags || []"
        :selected-tag="selectedTag"
        :loading="!tags"
        @select="selectTag"
        @edit="editTag"
        @delete="deleteTag"
        @create-new="createNewTag"
      />

      <!-- 标签统计数据 -->
      <div v-if="selectedTag" class="space-y-6">
        <TagRuleManager :tag="selectedTag" @refresh="handleRuleRefresh" />
        <TagStats ref="tagStatsRef" :tag="selectedTag" />
      </div>
    </div>
  </DashboardPageContent>

  <!-- 标签表单弹窗 -->
  <TagForm
    v-model="showTagForm"
    :tag="editingTag"
    @save="saveTag"
    @close="closeTagForm"
  />
</template>
