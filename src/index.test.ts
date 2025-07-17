import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MockAgent, setGlobalDispatcher, getGlobalDispatcher } from 'undici'
import type { APIResponse } from './types'

// Mock @actions/core
vi.mock('@actions/core', () => ({
  error: vi.fn(),
  info: vi.fn(),
  setFailed: vi.fn(),
  getInput: vi.fn()
}))

// Mock console.log for debug function
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

// Import after mocking
const { runAction, debug, getConfig } = await import('./index')
const { error: mockError, info: mockInfo, setFailed: mockSetFailed, getInput: mockGetInput } = await import('@actions/core')

// Import the type separately
import type { Config } from './index'

describe('index.ts', () => {
  let mockAgent: MockAgent
  let originalDispatcher: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    mockConsoleLog.mockClear()

    // Setup undici mock agent
    mockAgent = new MockAgent()
    originalDispatcher = getGlobalDispatcher()
    setGlobalDispatcher(mockAgent)

    // Prevent real network requests
    mockAgent.disableNetConnect()
  })

  afterEach(() => {
    // Restore original dispatcher
    setGlobalDispatcher(originalDispatcher)
    mockAgent.close()
  })

  describe('debug function', () => {
    it('should log when debug is true', () => {
      debug('test message', true)
      expect(mockConsoleLog).toHaveBeenCalledWith('test message')
    })

    it('should not log when debug is false', () => {
      debug('test message', false)
      expect(mockConsoleLog).not.toHaveBeenCalled()
    })
  })

  describe('getConfig function', () => {
    it('should return config object with all inputs', () => {
      mockGetInput.mockImplementation((key: string) => {
        switch (key) {
          case 'domain-mode': return 'lock'
          case 'domain-name': return 'example.com'
          case 'appwarden-token': return 'test-token-123'
          case 'debug': return 'true'
          default: return ''
        }
      })

      const config = getConfig()

      expect(config).toEqual({
        mode: 'lock',
        domainName: 'example.com',
        appwardenApiToken: 'test-token-123',
        debug: true
      })
    })

    it('should handle debug as false when not "true"', () => {
      mockGetInput.mockImplementation((key: string) => {
        switch (key) {
          case 'domain-mode': return 'unlock'
          case 'domain-name': return 'test.com'
          case 'appwarden-token': return 'token'
          case 'debug': return 'false'
          default: return ''
        }
      })

      const config = getConfig()

      expect(config.debug).toBe(false)
    })

    it('should handle debug as false when empty string', () => {
      mockGetInput.mockImplementation((key: string) => {
        switch (key) {
          case 'domain-mode': return 'test-lock'
          case 'domain-name': return 'example.org'
          case 'appwarden-token': return 'my-token'
          case 'debug': return ''
          default: return ''
        }
      })

      const config = getConfig()

      expect(config.debug).toBe(false)
    })
  })

  describe('Configuration validation', () => {
    it('should fail when appwarden-token is missing', async () => {
      const config: Config = {
        appwardenApiToken: '',
        mode: 'lock',
        domainName: 'example.com',
        debug: false
      }

      await runAction(config)

      expect(mockError).toHaveBeenCalledWith('Provide an Appwarden API token parameter')
      expect(mockSetFailed).toHaveBeenCalledWith('🚨 Appwarden Action failed')
    })

    it('should fail when domain-mode is missing', async () => {
      const config: Config = {
        appwardenApiToken: 'test-token',
        mode: '',
        domainName: 'example.com',
        debug: false
      }

      await runAction(config)

      expect(mockError).toHaveBeenCalledWith('Provide an action parameter ["lock", "unlock", "test-lock", "test-unlock"]')
      expect(mockSetFailed).toHaveBeenCalledWith('🚨 Appwarden Action failed')
    })

    it('should fail when domain-mode is invalid', async () => {
      const config: Config = {
        appwardenApiToken: 'test-token',
        mode: 'invalid-mode',
        domainName: 'example.com',
        debug: false
      }

      await runAction(config)

      expect(mockError).toHaveBeenCalledWith('Invalid action parameter: invalid-mode')
      expect(mockSetFailed).toHaveBeenCalledWith('🚨 Appwarden Action failed')
    })

    it('should fail when domain-name is missing', async () => {
      const config: Config = {
        appwardenApiToken: 'test-token',
        mode: 'lock',
        domainName: '',
        debug: false
      }

      await runAction(config)

      expect(mockError).toHaveBeenCalledWith('Provide a domainName parameter')
      expect(mockSetFailed).toHaveBeenCalledWith('🚨 Appwarden Action failed')
    })
  })

  describe('Valid modes', () => {
    const validModes = ['lock', 'unlock', 'test-lock', 'test-unlock']

    validModes.forEach(mode => {
      it(`should accept valid mode: ${mode}`, async () => {
        // Mock successful API response
        const mockPool = mockAgent.get('https://bot-gateway.appwarden.io')
        mockPool.intercept({
          path: '/v1/domain-mode',
          method: 'POST'
        }).reply(200, {
          content: { success: true },
          context: null,
          error: undefined
        } as APIResponse)

        const config: Config = {
          appwardenApiToken: 'test-token',
          mode: mode,
          domainName: 'example.com',
          debug: false
        }

        await runAction(config)

        expect(mockError).not.toHaveBeenCalled()
        expect(mockSetFailed).not.toHaveBeenCalled()
      })
    })
  })

  describe('API interaction', () => {
    it('should handle successful API response', async () => {
      const mockPool = mockAgent.get('https://bot-gateway.appwarden.io')
      mockPool.intercept({
        path: '/v1/domain-mode',
        method: 'POST'
      }).reply(200, {
        content: { success: true },
        context: null,
        error: undefined
      } as APIResponse)

      const config: Config = {
        appwardenApiToken: 'test-token',
        mode: 'lock',
        domainName: 'https://example.com',
        debug: false
      }

      await runAction(config)

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('🏁 Appwarden placed https://example.com/ into lock mode')
      )
      expect(mockError).not.toHaveBeenCalled()
      expect(mockSetFailed).not.toHaveBeenCalled()
    })

    it('should handle API error response', async () => {
      const mockPool = mockAgent.get('https://bot-gateway.appwarden.io')
      mockPool.intercept({
        path: '/v1/domain-mode',
        method: 'POST'
      }).reply(200, {
        content: undefined,
        context: null,
        error: {
          message: 'Invalid API token',
          status: 401
        }
      } as APIResponse)

      const config: Config = {
        appwardenApiToken: 'test-token',
        mode: 'lock',
        domainName: 'https://example.com',
        debug: false
      }

      await runAction(config)

      expect(mockError).toHaveBeenCalledWith('Invalid API token')
      expect(mockSetFailed).toHaveBeenCalledWith('🚨 Appwarden Action failed')
    })

    it('should handle HTTP error status', async () => {
      const mockPool = mockAgent.get('https://bot-gateway.appwarden.io')
      mockPool.intercept({
        path: '/v1/domain-mode',
        method: 'POST'
      }).reply(500, 'Internal Server Error')

      const config: Config = {
        appwardenApiToken: 'test-token',
        mode: 'lock',
        domainName: 'https://example.com',
        debug: false
      }

      await runAction(config)

      expect(mockError).toHaveBeenCalledWith('Bad response from Appwarden API')
      expect(mockSetFailed).toHaveBeenCalledWith('🚨 Appwarden Action failed')
    })
  })

  describe('Test modes', () => {
    it('should generate correct success message for test-lock mode', async () => {
      const mockPool = mockAgent.get('https://bot-gateway.appwarden.io')
      mockPool.intercept({
        path: '/v1/domain-mode',
        method: 'POST'
      }).reply(200, {
        content: { success: true },
        context: null,
        error: undefined
      } as APIResponse)

      const config: Config = {
        appwardenApiToken: 'test-token',
        mode: 'test-lock',
        domainName: 'example.com',
        debug: false
      }

      await runAction(config)

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com/_appwarden/test into test-lock mode')
      )
    })

    it('should generate correct success message for test-unlock mode', async () => {
      const mockPool = mockAgent.get('https://bot-gateway.appwarden.io')
      mockPool.intercept({
        path: '/v1/domain-mode',
        method: 'POST'
      }).reply(200, {
        content: { success: true },
        context: null,
        error: undefined
      } as APIResponse)

      const config: Config = {
        appwardenApiToken: 'test-token',
        mode: 'test-unlock',
        domainName: 'example.com',
        debug: false
      }

      await runAction(config)

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com/_appwarden/test into test-unlock mode')
      )
    })
  })

  describe('Error handling edge cases', () => {
    it('should handle network errors', async () => {
      const mockPool = mockAgent.get('https://bot-gateway.appwarden.io')
      mockPool.intercept({
        path: '/v1/domain-mode',
        method: 'POST'
      }).replyWithError(new Error('Network error'))

      const config: Config = {
        appwardenApiToken: 'test-token',
        mode: 'lock',
        domainName: 'example.com',
        debug: false
      }

      await runAction(config)

      expect(mockError).toHaveBeenCalledWith('fetch failed')
      expect(mockSetFailed).toHaveBeenCalledWith('🚨 Appwarden Action failed')
    })
  })
})
