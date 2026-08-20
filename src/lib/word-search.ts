export interface SearchFilter {
  id: string
  values: Array<string | number | RegExp>
}

export interface SearchWordsRequest {
  requestId: number
  wordLength: number
  filters: SearchFilter[]
}

export interface SearchWordsResponse {
  requestId: number
  results: string[]
}
