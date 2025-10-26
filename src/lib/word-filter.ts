import { type IPinyin, zi } from './data'

export type WordFilterHandler<T = string> = (
  word: string,
  pinyin: IPinyin[],
  rules: T[],
) => boolean

interface IWordFilter<T = string> {
  /**
   * 过滤器的标题
   */
  title: string
  /**
   * 过滤器的描述
   */
  description?: string
  /**
   * 过滤器的展示方式
   */
  type: 'input' | 'select'
  /**
   * 过滤器的选项, 仅当 type 为 select 时有效
   */
  options?: {
    label: string
    value: T
  }[]
  /**
   * 解析过滤器的值
   * @param value - 值
   * @returns 解析后的值
   */
  parse?: (value: string) => T
  /**
   * 过滤器的处理函数
   * @param word - 单词
   * @param pinyin - 单词的拼音
   * @param rules - 过滤规则
   * @returns 是否通过过滤
   */
  handler: WordFilterHandler<T>
}

// 根据重复字符过滤
// 例如: AxAx, 匹配一心一意
const repeatChar: IWordFilter = {
  title: '重复字符',
  description: '过滤包含重复字符的单词',
  type: 'input',
  handler: (word, _pinyin, rules) => {
    const map = new Map<string, string>()
    for (let i = 0; i < word.length; i++) {
      const rule = rules[i]
      if (!rule) continue

      const char = word[i]
      const saved = map.get(rule)
      if (saved && saved !== char) {
        return false
      }
      map.set(rule, char)
    }

    return true
  },
}

const strokeCount: IWordFilter<number> = {
  title: '笔画数',
  description: '过滤包含指定笔画数的单词',
  type: 'input',
  parse: (value) => parseInt(value, 10) || 0,
  handler: (word, _pinyin, rules) => {
    for (let i = 0; i < word.length; i++) {
      const rule = rules[i]
      if (!rule) continue

      const char = word[i]
      const ziItem = zi[char]
      if (!ziItem) {
        console.warn(`未知字符 ${char}`)
        return false
      }

      if (ziItem.stroke !== rule) {
        return false
      }
    }
    return true
  },
}

const pinyinTone: IWordFilter<number> = {
  title: '拼音声调',
  description: '过滤包含拼音声调的单词',
  type: 'select',
  options: [
    { label: '一声', value: 1 },
    { label: '二声', value: 2 },
    { label: '三声', value: 3 },
    { label: '四声', value: 4 },
    { label: '轻声', value: 5 },
  ],
  parse: (value) => parseInt(value, 10),
  handler: (_word, pinyin, rules) => {
    for (let i = 0; i < pinyin.length; i++) {
      const rule = rules[i]
      if (!rule) continue

      const pinyinItem = pinyin[i]
      if (pinyinItem.tone !== rule) {
        return false
      }
    }
    return true
  },
}

export const wordFilters = {
  repeatChar,
  strokeCount,
  pinyinTone,
}
