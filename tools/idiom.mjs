import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { dataDir, formatPinyin, libDir } from './common.mjs'

const outputPath = join(dataDir, 'idiom.json')

const idiom = {}
const titleRegex = /《(.*?)》/g
const extractAllTitle = (text) => {
  const matches = text.matchAll(titleRegex)
  return Array.from(matches).map((match) => match[1])
}

// frequency word list
const idiomPath = join(libDir, 'chinese-xinhua/data/idiom.json')
const idiomData = JSON.parse(readFileSync(idiomPath, 'utf-8'))
for (const item of idiomData) {
  const len = item.word.length
  if (len <= 1) {
    continue
  }

  idiom[len] ??= {}
  idiom[len][item.word] = {
    pinyin: formatPinyin(item.pinyin, ' '),
    derivation: extractAllTitle(item.derivation),
    // example: item.example,
    // explanation: item.explanation,
  }
}

writeFileSync(outputPath, JSON.stringify(idiom, null, 2))
