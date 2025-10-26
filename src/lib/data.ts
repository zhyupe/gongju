import $words from '../data/words.json'
import $zi from '../data/zi.json'

export interface IPinyin {
  base: string
  tone: number
}

export const zi: Record<
  string,
  {
    zi: string
    stroke: number
    pinyin: IPinyin[]
    jyutping: IPinyin[]
    english: string | null
    radical: string | null
    variant: string | null
  }
> = $zi as any

export const words: Record<number, Record<string, IPinyin[]>> = $words as any
