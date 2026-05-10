import type { UserSelfPublic } from '~/api/v3/types.gen'
import { v3GetUserSelf, v3ListSelfStats, v3ListSelfStatsTime, v3ListSelfTop } from '~/api/v3'

export function fetchStats(limit: Ref<number>, by: string = 'time', unit: 'minutes' | 'days' | 'hours' = 'minutes') {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  return by === 'time'
    ? useAsyncData(`stats-time-${unit}-${tz}-${limit.value}`, async () => {
        const resp = await v3ListSelfStatsTime({
          query: {
            unit,
            tz,
            limit: limit.value,
          },
        })
        return {
          data: resp.data?.data.map(item => ({
            duration: item.duration,
            time: item.time,
            by: undefined,
          })) ?? [],
        }
      }, {
        server: false,
        watch: [limit],
      })
    : useAsyncData(`stats-${by}-${unit}-${tz}-${limit.value}`, async () => {
        const resp = await v3ListSelfStats({
          query: {
            by: by as any,
            unit,
            tz,
            limit: limit.value,
          },
        })
        return {
          data: resp.data?.data.map(item => ({
            duration: item.duration,
            time: item.time,
            by: item.by,
          })) ?? [],
        }
      }, {
        server: false,
        watch: [limit],
      })
}

export function fetchUser() {
  return useAsyncData('user-self', async () => {
    const resp = await v3GetUserSelf()
    return resp.data
  }, {
    server: false,
  })
}

export function useUser() {
  return inject<Ref<UserSelfPublic | null>>('user', ref(null))
}

export type TopData = {
  field: string
  minutes: number
  icon?: string
}

export function fetchTop(field: string, minutes: ComputedRef<number>, limit: number = 5, filters: MaybeRef<FilterItem[]>, options?: any) {
  const filterArray = unref(filters)
  const filterKey = JSON.stringify(filterArray)

  return useAsyncData(`top-${field}-${minutes.value}-${limit}-${filterKey}`, async () => {
    const activeFilters = unref(filters)

    // Convert filters to arrays for the API
    const platformFilters = activeFilters.filter(f => f.key === 'platform').map(f => f.value)
    const workspaceFilters = activeFilters.filter(f => f.key === 'workspace').map(f => f.value)
    const languageFilters = activeFilters.filter(f => f.key === 'language').map(f => f.value)
    const editorFilters = activeFilters.filter(f => f.key === 'editor').map(f => f.value)

    const resp = await v3ListSelfTop({
      query: {
        field: field as any,
        minutes: minutes.value,
        limit,
        platforms: platformFilters.length > 0 ? platformFilters : null,
        workspaces: workspaceFilters.length > 0 ? workspaceFilters : null,
        languages: languageFilters.length > 0 ? languageFilters : null,
        editors: editorFilters.length > 0 ? editorFilters : null,
      },
    })
    return resp.data?.map(item => ({
      field: item.field,
      minutes: item.minutes,
      icon: undefined,
    })) ?? []
  }, {
    server: false,
    watch: [minutes, isRef(filters) ? filters : () => unref(filters)],
    ...options,
  })
}

export type FilterItem = {
  key: string
  value: string
}

export * as Plot from '@observablehq/plot'
