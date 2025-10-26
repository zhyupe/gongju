import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { wordFilters } from '../../lib/word-filter'

interface RuleInputProps {
  filterId: string
  wordLength: number
  value: string[]
  onChange: (value: string[]) => void
}

export const ANY_VALUE = '__any__'

export default function RuleInput({
  filterId,
  wordLength,
  value,
  onChange,
}: RuleInputProps) {
  const filterConfig = wordFilters[filterId as keyof typeof wordFilters]

  // 确保value数组长度与wordLength匹配
  const normalizedValue = useMemo(() => {
    const result = [...value]
    while (result.length < wordLength) {
      result.push('')
    }
    return result.slice(0, wordLength)
  }, [value, wordLength])

  const handleValueChange = (index: number, newValue: string) => {
    const newValues = [...normalizedValue]
    newValues[index] = newValue
    onChange(newValues)
  }

  if (!filterConfig) {
    return <div>未知过滤器类型</div>
  }

  // 输入框模式
  return (
    <div className="border rounded-md p-2 grid gap-2 bg-accent">
      {normalizedValue.map((val, index) => {
        return (
          <div
            key={`${filterId}-input-${index}-${wordLength}`}
            className="grid grid-cols-[60px_1fr] gap-2 items-center"
          >
            <span className="text-sm font-medium text-center">
              第 {index + 1} 字
            </span>

            {filterConfig.type === 'select' && filterConfig.options ? (
              <Select
                value={val}
                onValueChange={(value) => handleValueChange(index, value)}
              >
                <SelectTrigger className="bg-background w-full">
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_VALUE}>任意</SelectItem>
                  {filterConfig.options?.map((option) => (
                    <SelectItem
                      key={option.value.toString()}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                className="bg-background"
                type="text"
                value={val}
                onChange={(e) => handleValueChange(index, e.target.value)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
