// Per-locale font selection for OG images.
// Each entry is loaded only when a page is rendered in that locale,
// keeping satori bundle size small for non-CJK languages.

const cjkFontByLocale: Record<string, string> = {
  'zh-CN': 'Noto+Sans+SC',
  'zh-TW': 'Noto+Sans+TC',
  'ja': 'Noto+Sans+JP',
  'ko': 'Noto+Sans+KR',
}

const baseFonts = ['Inter:400', 'Inter:600', 'Inter:700']

export function getOgFonts(locale: string | undefined | null): string[] {
  if (!locale) {
    return baseFonts
  }
  const lc = locale.toLowerCase()
  // Exact match first (zh-cn, zh-tw)
  let family: string | undefined
  for (const k of Object.keys(cjkFontByLocale)) {
    if (lc === k.toLowerCase()) {
      family = cjkFontByLocale[k]
      break
    }
  }
  // Fallback by base subtag: zh* → SC, ja* → JP, ko* → KR
  if (!family) {
    const base = lc.split('-')[0]
    if (base === 'zh') {
      family = cjkFontByLocale['zh-CN']
    }
    else if (base === 'ja') {
      family = cjkFontByLocale.ja
    }
    else if (base === 'ko') {
      family = cjkFontByLocale.ko
    }
  }
  if (!family) {
    return baseFonts
  }
  return [...baseFonts, `${family}:400`, `${family}:700`]
}
