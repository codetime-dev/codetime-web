import type { Translation } from './type'
import { de } from './de'
import { en } from './en'
import { es } from './es'
import { fr } from './fr'
import { it } from './it'
import { ja } from './ja'
import { ms } from './ms'
import { ptBR } from './ptBR'
import { ru } from './ru'
import { ua } from './ua'
import { zhCN } from './zhCN'
import { zhTW } from './zhTW'

const i18NMap = new Map<string, Partial<Translation>>([
  ['zh-CN', zhCN],
  ['zh-TW', zhTW],
  ['en', en],
  ['ja', ja],
  ['pt-BR', ptBR],
  ['it', it],
  ['ms', ms],
  ['ru', ru],
  ['ua', ua],
  ['es', es],
  ['fr', fr],
  ['de', de],
])

function mergeI18N(a: any, b: any): Translation {
  const result: any = { ...a }
  for (const key in b) {
    if (Object.hasOwn(b, key)) {
      if (Object.hasOwn(result, key)) {
        if (typeof result[key] === 'object' && typeof b[key] === 'object') {
          result[key] = mergeI18N(result[key], b[key])
        }
      }
      else {
        result[key] = b[key]
      }
    }
  }
  return result
}

export const locales = [...i18NMap.keys()]
export function useI18N() {
  return computed<Translation>(() => {
    const locale = useLocale()
    const i18N = i18NMap.get(locale.value) ?? zhCN
    return mergeI18N(i18N, en)
  })
}

export function getI18NObject(locale: string) {
  return i18NMap.get(locale) ?? en
}
