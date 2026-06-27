import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { dataDir, formatPinyin, libDir, resolvePinyin } from './common.mjs'

const outputPath = join(dataDir, 'words.json')
const ziPath = join(dataDir, 'zi.json')

const words = {}
const zi = JSON.parse(readFileSync(ziPath, 'utf-8'))

const addWord = (word, pinyin, split = ',', ziMap = null) => {
  if (!word) {
    return false
  }

  const len = word.length
  if (len <= 1 || /[,，]/.test(word)) {
    return false
  }

  const resolved = ziMap
    ? resolvePinyin(ziMap, word, pinyin)
    : pinyin
      ? formatPinyin(pinyin, split)
      : null
  if (!resolved) {
    return false
  }

  words[len] ??= {}
  if (words[len][word]) {
    return false
  }

  words[len][word] = true
  return true
}

const rimeIceHandler = (line) => {
  if (!line || line.startsWith('#')) {
    return false
  }

  const [word, pinyin] = line.split('\t')
  return addWord(word, pinyin, ' ', zi)
}

const list = [
  // frequency word list
  {
    path: join(
      libDir,
      'chinese-frequency-word-list/xiandaihaiyuchangyongcibiao.txt',
    ),
    handler: (line) => {
      const [word, pinyin] = line.split('\t')
      return addWord(word, pinyin, "'")
    },
  },
  // rime-ice base
  {
    path: join(libDir, 'rime-ice/cn_dicts/base.dict.yaml'),
    handler: rimeIceHandler,
  },
  // rime-ice ext
  {
    path: join(libDir, 'rime-ice/cn_dicts/ext.dict.yaml'),
    handler: rimeIceHandler,
  },
  // rime-ice tencent
  {
    path: join(libDir, 'rime-ice/cn_dicts/tencent.dict.yaml'),
    handler: rimeIceHandler,
  },
]

for (const { path, handler } of list) {
  let count = 0
  const content = readFileSync(path, 'utf-8')
  const lines = content.split('\n')
  for (const line of lines) {
    const added = handler(line)
    if (added) {
      count += 1
    }
  }

  console.log(`Parsed ${count} words from ${path}`)
}

const output = Object.fromEntries(
  Object.entries(words).map(([len, wordMap]) => [len, Object.keys(wordMap)]),
)

writeFileSync(outputPath, JSON.stringify(output))
