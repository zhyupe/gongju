import { useId, useMemo, useState } from 'react'
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
import { words, zi } from '@/lib/data'
import { type WordFilterHandler, wordFilters } from '@/lib/word-filter'

interface FilterRule {
  value: string[]
  enabled: boolean
}

function WordResult({ word }: { word: string }) {
  const pinyin = words[word.length][word]
  const strokeCounts = word.split('').map((c) => zi[c]?.stroke || 0)
  return (
    <div
      key={word}
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex flex-col gap-2 shadow-sm"
    >
      <div className="text-2xl font-semibold tracking-tight text-center text-gray-800 dark:text-gray-100">
        {word}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {pinyin.map((p, i) => (
          <span key={`pinyin-${i}-${p.base}-${p.tone}`}>
            {p.base}
            <span className="text-xs text-gray-400 dark:text-gray-500 select-none">
              {p.tone}
            </span>
          </span>
        ))}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        笔画：{strokeCounts.join(', ')}
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

  // 获取可用的单词长度
  const availableLengths = useMemo(getAvailableLengths, [])

  // 更新过滤器状态
  const updateFilter = (id: string, value: string[], enabled: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [id]: {
        value,
        enabled,
      },
    }))
  }

  // 检查是否有启用的过滤器
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(
      ({ enabled, value }) => enabled && value.some((v) => v.trim() !== ''),
    )
  }, [filters])

  // 执行查询
  const searchResults = useMemo(() => {
    const activeFilters: Array<[string, any[], WordFilterHandler<any>]> = []
    for (const [id, filter] of Object.entries(filters)) {
      if (!filter.enabled) continue

      const filterConfig = wordFilters[id as keyof typeof wordFilters]
      if (!filterConfig) continue

      const values = filter.value.map((v) => {
        if (v === ANY_VALUE) return ''
        return filterConfig.parse ? filterConfig.parse(v) : v
      })
      activeFilters.push([id, values, filterConfig.handler])
      console.log(id, values)
    }

    // 如果没有启用的过滤器，不返回结果
    if (activeFilters.length === 0) return []

    const wordList = words[wordLength]
    if (!wordList) return []

    const results: string[] = []

    for (const [word, pinyin] of Object.entries(wordList)) {
      // 检查所有启用的过滤器
      let passed = true
      for (const [, rules, filter] of activeFilters) {
        if (!filter(word, pinyin, rules)) {
          passed = false
          break
        }
      }

      if (passed) {
        results.push(word)
        // 限制最多返回1000个结果
        if (results.length >= 1000) break
      }
    }

    return results
  }, [wordLength, filters])

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
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
                      <Label className="flex items-start cursor-pointer">
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
          <div className="flex items-center justify-between pb-2 border-b">
            <h3 className="text-lg font-semibold">查询结果</h3>
            {hasActiveFilters ? (
              <span className="text-sm text-muted-foreground">
                共找到 {searchResults.length} 个单词
                {searchResults.length >= 1000 && (
                  <span className="ml-1">(已限制显示前1000个)</span>
                )}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                请设置查询条件
              </span>
            )}
          </div>

          {hasActiveFilters ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {searchResults.map((word) => (
                <WordResult key={word} word={word} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 rounded-md bg-accent/50 border border-dashed border-accent gap-2 h-400px">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-base font-medium mb-1">
                请至少启用一个过滤条件来开始查询
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
