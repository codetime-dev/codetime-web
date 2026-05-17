import type { UserSelfPublic } from '~/api/v3/types.gen'
import { getV3UsersSelf, getV3UsersSelfStats, getV3UsersSelfStatsTime, getV3UsersSelfTop } from '~/api/v3'

export type StatsRange = {
  startTime?: MaybeRefOrGetter<Date | null | undefined>
  endTime?: MaybeRefOrGetter<Date | null | undefined>
}

export function fetchStats(
  limit: Ref<number>,
  by: string = 'time',
  unit: 'minutes' | 'days' | 'hours' = 'minutes',
  range?: StatsRange,
) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const startRef = computed(() => (range?.startTime ? toValue(range.startTime) : null) ?? null)
  const endRef = computed(() => (range?.endTime ? toValue(range.endTime) : null) ?? null)
  const hasRange = computed(() => !!startRef.value && !!endRef.value)
  const rangeKey = computed(() => hasRange.value
    ? `${startRef.value!.toISOString()}-${endRef.value!.toISOString()}`
    : `limit-${limit.value}`)

  return by === 'time'
    ? useAsyncData(`stats-time-${unit}-${tz}-${rangeKey.value}`, async () => {
        const resp = await getV3UsersSelfStatsTime({
          query: {
            unit,
            tz,
            limit: hasRange.value ? undefined : limit.value,
            start_time: startRef.value ?? undefined,
            end_time: endRef.value ?? undefined,
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
        watch: [limit, startRef, endRef],
      })
    : useAsyncData(`stats-${by}-${unit}-${tz}-${rangeKey.value}`, async () => {
        const resp = await getV3UsersSelfStats({
          query: {
            by: by as any,
            unit,
            tz,
            limit: hasRange.value ? undefined : limit.value,
            start_time: startRef.value ?? undefined,
            end_time: endRef.value ?? undefined,
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
        watch: [limit, startRef, endRef],
      })
}

export function fetchUser() {
  return useAsyncData('user-self', async () => {
    const resp = await getV3UsersSelf()
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

    const resp = await getV3UsersSelfTop({
      query: {
        field: field as any,
        minutes: minutes.value,
        limit,
        platforms: platformFilters.length > 0 ? platformFilters : undefined,
        workspaces: workspaceFilters.length > 0 ? workspaceFilters : undefined,
        languages: languageFilters.length > 0 ? languageFilters : undefined,
        editors: editorFilters.length > 0 ? editorFilters : undefined,
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
