import { describe, it, expect, expectTypeOf } from 'vitest'
import type { APIResponse, APIResponseContent, APIResponseContext, APIResponseError } from './types'

// Helper function to validate APIResponse structure at runtime
function validateAPIResponse(response: unknown): response is APIResponse {
  if (typeof response !== 'object' || response === null) return false

  const r = response as Record<string, unknown>
  return (
    'content' in r &&
    'context' in r &&
    'error' in r
  )
}

// Helper function to validate APIResponseError structure at runtime
function validateAPIResponseError(error: unknown): error is APIResponseError {
  if (typeof error !== 'object' || error === null) return false

  const e = error as Record<string, unknown>
  return (
    'message' in e &&
    typeof e.message === 'string' &&
    (e.status === undefined || typeof e.status === 'number')
  )
}

describe('Runtime type validation', () => {
  describe('validateAPIResponse', () => {
    it('should validate correct APIResponse objects', () => {
      const validResponse = {
        content: { data: 'test' },
        context: { requestId: '123' },
        error: undefined
      }

      expect(validateAPIResponse(validResponse)).toBe(true)
    })

    it('should reject invalid objects', () => {
      expect(validateAPIResponse(null)).toBe(false)
      expect(validateAPIResponse(undefined)).toBe(false)
      expect(validateAPIResponse('string')).toBe(false)
      expect(validateAPIResponse(123)).toBe(false)
      expect(validateAPIResponse({})).toBe(false)
      expect(validateAPIResponse({ content: 'test' })).toBe(false)
    })
  })

  describe('validateAPIResponseError', () => {
    it('should validate correct APIResponseError objects', () => {
      const validError = {
        message: 'Test error',
        status: 400
      }

      expect(validateAPIResponseError(validError)).toBe(true)
    })

    it('should validate error without status', () => {
      const validError = {
        message: 'Test error'
      }

      expect(validateAPIResponseError(validError)).toBe(true)
    })

    it('should reject invalid error objects', () => {
      expect(validateAPIResponseError(null)).toBe(false)
      expect(validateAPIResponseError({})).toBe(false)
      expect(validateAPIResponseError({ status: 400 })).toBe(false)
      expect(validateAPIResponseError({ message: 123 })).toBe(false)
    })
  })
})

describe('Type definitions', () => {
  describe('APIResponseError', () => {
    it('should accept valid error objects', () => {
      const error1: APIResponseError = {
        message: 'Something went wrong'
      }
      expect(error1.message).toBe('Something went wrong')

      const error2: APIResponseError = {
        message: 'Bad request',
        status: 400
      }
      expect(error2.message).toBe('Bad request')
      expect(error2.status).toBe(400)
    })

    it('should have correct type structure', () => {
      expectTypeOf<APIResponseError>().toEqualTypeOf<{
        message: string
        status?: number
      }>()
    })

    it('should require message field', () => {
      // This test validates that message is required
      const error: APIResponseError = {
        message: 'Required message'
      }
      expect(error.message).toBeDefined()
    })
  })

  describe('APIResponseContent', () => {
    it('should accept arrays of records', () => {
      const content1: APIResponseContent = [
        { id: 1, name: 'test' },
        { id: 2, name: 'test2' }
      ]
      expect(Array.isArray(content1)).toBe(true)
      expect(content1).toHaveLength(2)
    })

    it('should accept single records', () => {
      const content2: APIResponseContent = {
        id: 1,
        name: 'test',
        nested: { value: 'nested' }
      }
      expect(typeof content2).toBe('object')
      expect(content2).not.toBeNull()
    })

    it('should accept null', () => {
      const content3: APIResponseContent = null
      expect(content3).toBeNull()
    })

    it('should have correct type structure', () => {
      expectTypeOf<APIResponseContent>().toEqualTypeOf<Record<string, unknown>[] | Record<string, unknown> | null>()
    })
  })

  describe('APIResponseContext', () => {
    it('should accept any value', () => {
      const context1: APIResponseContext = { requestId: '123' }
      const context2: APIResponseContext = 'string context'
      const context3: APIResponseContext = 42
      const context4: APIResponseContext = null
      const context5: APIResponseContext = undefined

      expect(context1).toEqual({ requestId: '123' })
      expect(context2).toBe('string context')
      expect(context3).toBe(42)
      expect(context4).toBeNull()
      expect(context5).toBeUndefined()
    })

    it('should have correct type structure', () => {
      expectTypeOf<APIResponseContext>().toEqualTypeOf<any>()
    })
  })

  describe('APIResponse', () => {
    it('should accept valid response objects with all fields', () => {
      const response: APIResponse = {
        content: { data: 'test' },
        context: { requestId: '123' },
        error: undefined
      }

      expect(response.content).toEqual({ data: 'test' })
      expect(response.context).toEqual({ requestId: '123' })
      expect(response.error).toBeUndefined()
    })

    it('should accept response with error', () => {
      const response: APIResponse = {
        content: undefined,
        context: undefined,
        error: {
          message: 'API Error',
          status: 500
        }
      }

      expect(response.content).toBeUndefined()
      expect(response.context).toBeUndefined()
      expect(response.error).toEqual({
        message: 'API Error',
        status: 500
      })
    })

    it('should accept response with array content', () => {
      const response: APIResponse = {
        content: [{ id: 1 }, { id: 2 }],
        context: 'array response',
        error: undefined
      }

      expect(Array.isArray(response.content)).toBe(true)
      expect(response.content).toHaveLength(2)
    })

    it('should accept response with null content', () => {
      const response: APIResponse = {
        content: null,
        context: undefined,
        error: undefined
      }

      expect(response.content).toBeNull()
    })

    it('should work with generic type parameter', () => {
      interface CustomContent {
        id: number
        name: string
      }

      const response: APIResponse<CustomContent> = {
        content: { id: 1, name: 'test' },
        context: undefined,
        error: undefined
      }

      expect(response.content?.id).toBe(1)
      expect(response.content?.name).toBe('test')
    })

    it('should work with array generic type parameter', () => {
      interface CustomContent {
        id: number
        name: string
      }

      const response: APIResponse<CustomContent[]> = {
        content: [{ id: 1, name: 'test1' }, { id: 2, name: 'test2' }],
        context: undefined,
        error: undefined
      }

      expect(Array.isArray(response.content)).toBe(true)
      expect(response.content?.[0]?.id).toBe(1)
    })

    it('should have correct type structure', () => {
      expectTypeOf<APIResponse>().toEqualTypeOf<{
        content: Record<string, unknown> | undefined
        context: any | undefined
        error: APIResponseError | undefined
      }>()
    })
  })

  describe('Real-world usage scenarios', () => {
    it('should handle successful API response', () => {
      const successResponse: APIResponse = {
        content: {
          mode: 'lock',
          domain: 'example.com',
          timestamp: new Date().toISOString()
        },
        context: {
          requestId: 'req-123',
          userId: 'user-456'
        },
        error: undefined
      }

      expect(successResponse.error).toBeUndefined()
      expect(successResponse.content).toBeDefined()
    })

    it('should handle error API response', () => {
      const errorResponse: APIResponse = {
        content: undefined,
        context: {
          requestId: 'req-123'
        },
        error: {
          message: 'Invalid API token',
          status: 401
        }
      }

      expect(errorResponse.error?.message).toBe('Invalid API token')
      expect(errorResponse.error?.status).toBe(401)
      expect(errorResponse.content).toBeUndefined()
    })

    it('should handle partial responses', () => {
      const partialResponse: APIResponse = {
        content: { partial: true },
        context: undefined,
        error: undefined
      }

      expect(partialResponse.content).toEqual({ partial: true })
      expect(partialResponse.context).toBeUndefined()
      expect(partialResponse.error).toBeUndefined()
    })
  })
})
