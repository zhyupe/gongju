import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
export const libDir = join(__dirname, '../lib/')
export const dataDir = join(__dirname, '../src/data/')

const pinyinToneMarks = {
  'ā': ['a', 1], 'á': ['a', 2], 'ǎ': ['a', 3], 'à': ['a', 4],
  'ē': ['e', 1], 'é': ['e', 2], 'ě': ['e', 3], 'è': ['e', 4],
  'ī': ['i', 1], 'í': ['i', 2], 'ǐ': ['i', 3], 'ì': ['i', 4],
  'ō': ['o', 1], 'ó': ['o', 2], 'ǒ': ['o', 3], 'ò': ['o', 4],
  'ū': ['u', 1], 'ú': ['u', 2], 'ǔ': ['u', 3], 'ù': ['u', 4],
  'ǖ': ['v', 1], 'ǘ': ['v', 2], 'ǚ': ['v', 3], 'ǜ': ['v', 4],
  'ü': ['v', 0], // special case for neutral ü
}
const pinyinToneRegex = new RegExp(`[${Object.keys(pinyinToneMarks).join('')}]`, 'g')

// 过滤数据集中混在汉语拼音中的粤语拼音
export const pinyinRegex = /^(?:[bpmfdtnlgkhjqxryw]|[zcs]h?)?(?:[aeiouv]|ai|ei|ui|ou|uai?|uo|ia|iu|[iuv]e|er|[aeiuv]n|[aeio]ng|i?ao|iong|iang?|uang?)?$/


export const formatPinyin = (pinyin, split = ',') => {
  if (!pinyin) return []
  return pinyin.split(split).map(p => {
    p = p.trim()

    const toneMatch = p.match(/(\d)$/)
    if (toneMatch) {
      return {
        base: p.slice(0, -1),
        tone: parseInt(toneMatch[1], 10),
      }
    }

    let tone = 5 // neutral
    const replaced = p.replace(pinyinToneRegex, (match) => {
      const [base, tone1] = pinyinToneMarks[match]
      if (tone1) {
        tone = tone1
      }
      return base
    })

    return {
      base: replaced,
      tone,
    }
  })
}