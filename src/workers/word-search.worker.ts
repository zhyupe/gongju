import { resolveWordPinyin, words } from '@/lib/data'
import { wordFilters } from '@/lib/word-filter'
import type { SearchWordsRequest, SearchWordsResponse } from '@/lib/word-search'

self.onmessage = (event: MessageEvent<SearchWordsRequest>) => {
  const { requestId, wordLength, filters } = event.data
  const wordList = words[wordLength]

  if (!wordList || filters.length === 0) {
    const response: SearchWordsResponse = {
      requestId,
      results: [],
    }
    self.postMessage(response)
    return
  }

  const needsPinyin = filters.some((filter) => filter.id === 'pinyinTone')
  const results: string[] = []
  for (const word of wordList) {
    const pinyin = needsPinyin ? resolveWordPinyin(word) : []
    let passed = true

    for (const filter of filters) {
      const handler =
        wordFilters[filter.id as keyof typeof wordFilters]?.handler
      if (!handler || !handler(word, pinyin, filter.values as never[])) {
        passed = false
        break
      }
    }

    if (!passed) {
      continue
    }

    results.push(word)
  }

  const response: SearchWordsResponse = {
    requestId,
    results,
  }
  self.postMessage(response)
}
