import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { dataDir, formatPinyin, libDir } from './common.mjs'

const outputPath = join(dataDir, 'words.json')

const words = {}

// frequency word list
const frequencyWordListPath = join(libDir, 'chinese-frequency-word-list/xiandaihaiyuchangyongcibiao.txt')
const frequencyWordList = readFileSync(frequencyWordListPath, 'utf-8')
const frequencyWordListLines = frequencyWordList.split('\n')
for (const line of frequencyWordListLines) {
  const [word, pinyin] = line.split('\t')

  const len = word.length
  if (len <= 1 || /[,，]/.test(word)) {
    continue
  }


  words[len] ??= {}
  words[len][word] = formatPinyin(pinyin, "'")
}

writeFileSync(outputPath, JSON.stringify(words, null, 2))