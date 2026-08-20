import { Check, Copy } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import RuleInput, { ANY_VALUE } from '@/components/word-search/rule-input'
import { resolveWordPinyin, words, zi } from '@/lib/data'
import { wordFilters } from '@/lib/word-filter'
import type {
  SearchFilter,
  SearchWordsRequest,
  SearchWordsResponse,
} from '@/lib/word-search'

interface FilterRule {
  value: string[]
  enabled: boolean
}

function WordResult({ word }: { word: string }) {
  const pinyin = resolveWordPinyin(word)
  const strokeCounts = word.split('').map((char) => zi[char]?.stroke || 0)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-col gap-2">
        <div className="text-center text-2xl font-semibold tracking-tight text-gray-800 dark:text-gray-100">
          {word}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {pinyin.map((item, index) => (
            <span key={`pinyin-${index}-${item.base}-${item.tone}`}>
              {item.base}
              <span className="select-none text-xs text-gray-400 dark:text-gray-500">
                {item.tone}
              </span>
            </span>
          ))}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          笔画：{strokeCounts.join(', ')}
        </div>
      </div>
    </div>
  )
}

const createFilterRules = () => {
  return Object.fromEntries(
    Object.keys(wordFilters).map((key) => [
      key,
      {
        value: [],
        enabled: false,
      },
    ]),
  )
}

const getAvailableLengths = () => {
  return Object.keys(words)
    .map(Number)
    .sort((a, b) => a - b)
}

export default function WordSearch() {
  const wordLengthId = useId()
  const [wordLength, setWordLength] = useState<number>(2)
  const [filters, setFilters] =
    useState<Record<string, FilterRule>>(createFilterRules)
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  )
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)

  const availableLengths = useMemo(getAvailableLengths, [])
  const displayedResults = useMemo(
    () => searchResults.slice(0, 1000),
    [searchResults],
  )

  const updateFilter = (id: string, value: string[], enabled: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [id]: {
        value,
        enabled,
      },
    }))
  }

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(
      ({ enabled, value }) =>
        enabled && value.some((item) => item.trim() !== ''),
    )
  }, [filters])

  const activeFilters = useMemo(() => {
    const nextFilters: SearchFilter[] = []
    for (const [id, filter] of Object.entries(filters)) {
      if (!filter.enabled) continue

      const filterConfig = wordFilters[id as keyof typeof wordFilters]
      if (!filterConfig) continue

      const values = filter.value.map((value) => {
        if (value === ANY_VALUE) return ''
        return filterConfig.parse ? filterConfig.parse(value) : value
      })

      nextFilters.push({ id, values })
    }

    return nextFilters
  }, [filters])

  useEffect(() => {
    const worker = new Worker(
      new URL('../../workers/word-search.worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<SearchWordsResponse>) => {
      const { requestId, results } = event.data
      if (requestId !== requestIdRef.current) {
        return
      }

      setSearchResults(results)
      setCopyStatus('idle')
    }

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!hasActiveFilters) {
      setSearchResults([])
      return
    }

    const worker = workerRef.current
    if (!worker) {
      return
    }

    requestIdRef.current += 1
    const payload: SearchWordsRequest = {
      requestId: requestIdRef.current,
      wordLength,
      filters: activeFilters,
    }
    worker.postMessage(payload)
  }, [activeFilters, hasActiveFilters, wordLength])

  const copyAllResults = async () => {
    try {
      await navigator.clipboard.writeText(searchResults.join(' '))
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
      <div className="flex-col">
        <FieldGroup>
          <FieldSet>
            <Field>
              <FieldLabel htmlFor={wordLengthId}>单词长度</FieldLabel>
              <Select
                value={wordLength.toString()}
                onValueChange={(value) => setWordLength(Number(value))}
              >
                <SelectTrigger id={wordLengthId}>
                  <SelectValue placeholder="请选择单词长度" />
                </SelectTrigger>
                <SelectContent>
                  {availableLengths.map((length) => (
                    <SelectItem key={length} value={length.toString()}>
                      {length} 字
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <FieldSeparator />
            <FieldGroup>
              <FieldLegend variant="label">过滤条件</FieldLegend>
              <FieldSet>
                {Object.entries(wordFilters).map(([key, filter]) => {
                  const filterState = filters[key as keyof typeof filters]

                  return (
                    <Field key={key}>
                      <Label className="flex cursor-pointer items-start">
                        <Checkbox
                          checked={filterState.enabled}
                          onCheckedChange={(checked: boolean) =>
                            updateFilter(key, [], checked)
                          }
                          className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                        />
                        <div className="grid gap-1.5 font-normal">
                          <p className="text-sm leading-none font-medium">
                            {filter.title}
                          </p>
                          {filter.description && (
                            <p className="text-muted-foreground text-sm">
                              {filter.description}
                            </p>
                          )}
                        </div>
                      </Label>
                      {filterState.enabled && (
                        <RuleInput
                          filterId={key}
                          wordLength={wordLength}
                          value={filterState.value}
                          onChange={(value) => updateFilter(key, value, true)}
                        />
                      )}
                    </Field>
                  )
                })}
              </FieldSet>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </div>

      <div className="flex-col">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
            <h3 className="text-lg font-semibold">查询结果</h3>
            {hasActiveFilters ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="text-sm text-muted-foreground">
                  共找到 {searchResults.length} 个单词
                  {searchResults.length > 1000 && (
                    <span className="ml-1">(仅显示前1000个)</span>
                  )}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={searchResults.length === 0}
                  onClick={copyAllResults}
                >
                  {copyStatus === 'copied' ? <Check /> : <Copy />}
                  {copyStatus === 'copied'
                    ? '已复制'
                    : copyStatus === 'failed'
                      ? '复制失败'
                      : '复制全部'}
                </Button>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                请设置查询条件
              </span>
            )}
          </div>

          {hasActiveFilters ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {displayedResults.map((word) => (
                <WordResult key={word} word={word} />
              ))}
            </div>
          ) : (
            <div className="h-400px flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-accent bg-accent/50 py-8">
              <div className="mb-2 text-3xl">🔍</div>
              <p className="mb-1 text-base font-medium">
                请至少启用一个过滤条件来开始查询
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
