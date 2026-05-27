import type { PrivacySettings } from '~/api/v3/types.gen'
import { client } from '~/api/v3/client.gen'

// Shared access to the authenticated user's privacy settings. Backed by
// useState so the settings page and every widget builder see the same
// object — an in-context "make public" from the badge builder is reflected
// everywhere. `patch` sends a partial body; the server deep-merges it onto
// the stored settings (see server/utils/privacy.ts::mergePrivacy).
export function usePrivacy() {
  const privacy = useState<PrivacySettings | null>('user-privacy', () => null)
  const loading = ref(false)
  const saving = ref(false)

  async function load(force = false): Promise<PrivacySettings | null> {
    if (privacy.value && !force) {
      return privacy.value
    }
    loading.value = true
    try {
      const r = await client.get<{ 200: PrivacySettings }>({ url: '/v3/users/self/privacy', throwOnError: false })
      privacy.value = r.data ?? null
    }
    finally {
      loading.value = false
    }
    return privacy.value
  }

  async function patch(body: Record<string, unknown>): Promise<PrivacySettings | null> {
    saving.value = true
    try {
      const r = await client.post<{ 200: PrivacySettings }>({
        url: '/v3/users/self/privacy',
        body,
        headers: { 'Content-Type': 'application/json' },
        throwOnError: false,
      })
      if (r.data) {
        privacy.value = r.data
      }
      return r.data ?? null
    }
    finally {
      saving.value = false
    }
  }

  return { privacy, loading, saving, load, patch }
}
