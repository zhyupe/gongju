import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { formatPinyin, pinyinRegex, libDir, dataDir } from './common.mjs'

const ziDatasetPath = join(libDir, 'zi-dataset', 'zi-dataset.tsv')
const outputPath = join(dataDir, 'zi.json')

const data = readFileSync(ziDatasetPath, 'utf-8')
const lines = data.split('\n')
const keys = lines[0].split('\t')

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