import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ziDatasetPath = join(__dirname, '../lib/zi-dataset/zi-dataset.tsv')
const outputPath = join(__dirname, '../src/data/zi.json')

const data = readFileSync(ziDatasetPath, 'utf-8')
const lines = data.split('\n')
const keys = lines[0].split('\t')

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
const pinyinRegex = /^(?:[bpmfdtnlgkhjqxryw]|[zcs]h?)?(?:[aeiouv]|ai|ei|ui|ou|uai?|uo|ia|iu|[iuv]e|er|[aeiuv]n|[aeio]ng|i?ao|iong|iang?|uang?)?$/

const formatPinyin = (pinyin) => {
  if (!pinyin) return []
  return pinyin.split(',').map(p => {
    p = p.trim()

    const toneMatch = p.match(/(\d)$/)
    if (toneMatch) {
      return {
        base: p.slice(0, -1),
        tone: parseInt(toneMatch[1]),
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

const zi = lines.slice(1).map(line => {
  const values = line.split('\t')
  const item = keys.reduce((acc, key, index) => {
    acc[key] = values[index]
    return acc
  }, {})

  const strokeMatch = item.stroke_count?.match(/(\d+)画/)
  const stroke = strokeMatch ? parseInt(strokeMatch[1]) : null

  const pinyin = formatPinyin(item.mandarin_pinyin)
  const jyutping = formatPinyin(item.cantonese_pinyin)

  for (let i = 0; i < pinyin.length;) {
    const pinyinItem = pinyin[i]
    if (pinyinItem.tone > 5 || !pinyinRegex.test(pinyinItem.base)) {
      pinyin.splice(i, 1)
      jyutping.push(pinyinItem)

      console.warn(`Moving pinyin to jyutping: ${item.zi} ${pinyinItem.base} ${pinyinItem.tone}`)
    } else {
      i++
    }
  }

  return {
    zi: item.zi,
    stroke,
    pinyin,
    jyutping,
    english: item.english?.trim() || null,
    radical: item.radical?.trim() || null,
    variant: item.variant?.trim() || null,
  }
})

writeFileSync(outputPath, JSON.stringify(zi, null, 2))