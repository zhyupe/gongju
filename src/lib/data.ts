import $words from '../data/words.json'
import $zi from '../data/zi.json'

export interface IPinyin {
  base: string
  tone: number
}

interface IZiItem {
  stroke: number | null
  pinyin: IPinyin[]
  jyutping: IPinyin[]
  english: string[] | null
  radical: string[] | null
  variant: string[] | null
  parts: string[] | null
  asParts: string[] | null
}

export const zi: Record<string, IZiItem> = $zi

export const words = $words as Record<number, string[]>

export const resolveWordPinyin = (word: string): IPinyin[] => {
  const resolved: IPinyin[] = []
  for (const char of word) {
    const pinyin = zi[char]?.pinyin?.[0]
    if (!pinyin) {
      return []
    }

    resolved.push(pinyin)
  }

  return resolved
}
