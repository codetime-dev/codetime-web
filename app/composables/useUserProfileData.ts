import {
  getV3PublicUsersByUserIdCodingHistory,
  getV3PublicUsersByUserIdOverallRank,
  getV3PublicUsersByUserIdTopLanguagesRank,
  getV3UsersByUserId,
  getV3UsersByUserIdPublicTopProjects,
} from '~/api/v3'

// Handlers extracted to module scope so their `.toString()` is identical at
// every call site. Nuxt hashes the handler when registering useAsyncData and
// warns "different handler" if the same key is registered with a closure that
// looks different. Sharing the module-level function makes both the page
// (pages/[locale]/user/[uid]/index.vue) and the inner UserProfile.vue agree.

export type UserProfileFetchResult = {
  user: Awaited<ReturnType<typeof getV3UsersByUserId>>['data'] | null
  isHidden: boolean
  notFound: boolean
}

export async function fetchUserProfile(userId: number): Promise<UserProfileFetchResult> {
  try {
    const response = await getV3UsersByUserId({ path: { user_id: userId } })
    return { user: response.data, isHidden: false, notFound: false }
  }
  catch (error: any) {
    if (error?.status_code === 403 || error?.status === 403) {
      return { user: null, isHidden: true, notFound: false }
    }
    return { user: null, isHidden: false, notFound: true }
  }
}

export async function fetchUserOverallRank(userId: number) {
  try {
    const response = await getV3PublicUsersByUserIdOverallRank({ path: { user_id: userId } })
    return response.data ?? null
  }
  catch {
    return null
  }
}

export async function fetchUserTopLanguages(userId: number) {
  try {
    const response = await getV3PublicUsersByUserIdTopLanguagesRank({ path: { user_id: userId } })
    return response.data ?? null
  }
  catch {
    return null
  }
}

export async function fetchUserTopProjects(userId: number) {
  try {
    const response = await getV3UsersByUserIdPublicTopProjects({ path: { user_id: userId } })
    return response.data ?? null
  }
  catch {
    return null
  }
}

export async function fetchUserCodingHistory(userId: number, days: number) {
  try {
    const response = await getV3PublicUsersByUserIdCodingHistory({
      path: { user_id: userId },
      query: { days },
    })
    return response.data ?? null
  }
  catch {
    return null
  }
}
