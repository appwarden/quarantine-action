type AnyRecord = Record<string, unknown>

export type APIResponseContent = AnyRecord[] | AnyRecord | null
export type APIResponseContext = any
export type APIResponseError = {
  message: string
  status?: number
}

export type APIResponse<T extends APIResponseContent = AnyRecord> = {
  content: T | undefined
  context: APIResponseContext | undefined
  error: APIResponseError | undefined
}
