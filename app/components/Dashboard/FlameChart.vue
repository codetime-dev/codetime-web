<script setup lang="ts">
import type { WorkspaceFileActivity } from '~/api/v3'
import { max } from 'd3'

const props = withDefaults(defineProps<{
  data: WorkspaceFileActivity[] | null
  lineHeight?: number
}>(), {
  lineHeight: 32,
})

function normalizeMinutes(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const relativeFileCountList = computed(() => {
  // sum minutes by relativeFile so the flame chart reflects actual activity
  const countMap = new Map<string, number>()
  if (props.data) {
    for (const item of props.data) {
      const duration = normalizeMinutes(item.minutes)
      const minutes = countMap.get(item.relativeFile) ?? 0
      countMap.set(item.relativeFile, minutes + duration)
    }
  }
  return [...countMap.entries()].toSorted((a, b) => b[1] - a[1])
})
const t = useI18N()
type PathValue = [string, number]
type TreeNode = {
  path: string
  value: number
  children: TreeNode[]
}

function buildHierarchy(data: PathValue[]): TreeNode {
  const root: TreeNode = { path: '/', value: 0, children: [] }

  for (const [path, value] of data) {
    const pathLayers = path.split('/').filter(layer => layer !== '') // 分割路径并去除空层
    let currentNode = root

    for (const layer of pathLayers) {
      let childNode = currentNode.children.find(child => child.path === layer)
      if (!childNode) {
        childNode = { path: layer, value: 0, children: [] }
        currentNode.children.push(childNode)
      }
      currentNode = childNode
    }
    currentNode.value += value
  }

  calculateNodeValues(root)

  return root
}

function calculateNodeValues(node: TreeNode) {
  for (const child of node.children) {
    calculateNodeValues(child)
    node.value += child.value
  }
}

type FlameNode = {
  name: string
  start: number
  end: number
  depth: number
  value: number
  path: string
}

function calculateFlareNodes(data: TreeNode[], start: number, end: number, depth = 0, parentPath = '/'): FlameNode[] {
  const totalValue = data.reduce((acc, node) => acc + node.value, 0)
  let currentStart = start
  const flareNodes: FlameNode[] = []

  for (const node of data) {
    const ratio = node.value / totalValue
    const nodeStart = currentStart
    const nodeEnd = currentStart + (end - start) * ratio
    const path = parentPath === '/' ? node.path : `${parentPath}/${node.path}`
    flareNodes.push({
      path,
      name: node.path,
      start: nodeStart,
      end: nodeEnd,
      value: node.value,
      depth,
    })

    if (node.children.length > 0) {
      const childFlareNodes = calculateFlareNodes(node.children, nodeStart, nodeEnd, depth + 1, path)
      flareNodes.push(...childFlareNodes)
    }

    currentStart = nodeEnd
  }

  return flareNodes
}

const basicFlameNodes = computed(() => {
  const data = relativeFileCountList.value
  const res = buildHierarchy(data)
  const flareNodes = calculateFlareNodes([res], 0, 1)
  return flareNodes
})

function isParentOf(parent: FlameNode, child: FlameNode) {
  return parent.start <= child.start && parent.end >= child.end
}

const selectedFlareNode = ref<FlameNode | null>(null)
const flameNodes = computed(() => {
  const selected = basicFlameNodes.value.find(n => n.path === selectedFlareNode.value?.path)
  if (!selected) {
    return basicFlameNodes.value
  }
  const nodes: FlameNode[] = structuredClone(basicFlameNodes.value)
  const result: FlameNode[] = []
  for (const node of nodes) {
    if (isParentOf(selected, node)) {
      node.start = (node.start - selected.start) / (selected.end - selected.start)
      node.end = (node.end - selected.start) / (selected.end - selected.start)
      result.push(node)
    }
    else if (isParentOf(node, selected)) {
      node.start = 0
      node.end = 1
      result.push(node)
    }
  }
  return result
})
function onClickNode(flareNode: FlameNode) {
  selectedFlareNode.value = selectedFlareNode.value?.path === flareNode.path
    ? (basicFlameNodes.value[0] ?? null)
    : flareNode
}
function getAscii(str: string) {
  return str.replaceAll(/[\u4E00-\u9FA5]/g, '##').length
}
</script>

<template>
  <Transition
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
  >
    <div
      v-if="data"
      class="text-sm transition-width,left,opacity duration-1000 relative"
      :style="{
        height: `${(max(basicFlameNodes.map(node => node.depth + 1)) ?? 0) * lineHeight}px`,
      }"
    >
      <TransitionGroup
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-for="flareNode in flameNodes"
          :key="flareNode.path"
          class="cursor-pointer transition-width,left,opacity duration-500 absolute overflow-hidden"
          :style="{
            height: `${lineHeight}px`,
            width: `${(flareNode.end - flareNode.start) * 100}%`,
            left: `${flareNode.start * 100}%`,
            top: `${flareNode.depth * lineHeight}px`,
            filter: selectedFlareNode?.path !== flareNode.path && selectedFlareNode !== null && flareNode.start === 0 && flareNode.end === 1 ? 'opacity(0.5)' : 'opacity(1)',
          }"
          @click="onClickNode(flareNode)"
        >
          <div class="p-1px h-full">
            <div
              :style="`background-color: var(--ct-brand-${(getAscii(flareNode.path) % 4 + 4) * 100})`"
              class="text-white px-2 flex h-full w-full text-nowrap items-center box-border overflow-hidden"
            >
              {{ flareNode.name }} ({{ getDurationString(flareNode.value * 60 * 1000) }}, {{ Math.floor(((flareNode.end - flareNode.start) * 100)) }}%)
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
    <div
      v-else
      class="op50 flex h-full min-h-32 w-full pointer-events-none select-none items-center justify-center"
    >
      <div class="flex flex-col gap-2">
        <div>
          {{ t.dashboard.workspace.flameGraph.noData }}
        </div>
      </div>
    </div>
  </Transition>
</template>
