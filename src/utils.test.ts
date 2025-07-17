import { describe, it, expect } from 'vitest'
import { ensureProtocol, ignoreProtocol } from './utils'

describe('ensureProtocol', () => {
  it('should add https:// to domain without protocol', () => {
    expect(ensureProtocol('example.com')).toBe('https://example.com')
    expect(ensureProtocol('subdomain.example.com')).toBe('https://subdomain.example.com')
    expect(ensureProtocol('localhost')).toBe('https://localhost')
    expect(ensureProtocol('127.0.0.1')).toBe('https://127.0.0.1')
  })

  it('should preserve existing https:// protocol', () => {
    expect(ensureProtocol('https://example.com')).toBe('https://example.com')
    expect(ensureProtocol('https://subdomain.example.com')).toBe('https://subdomain.example.com')
    expect(ensureProtocol('https://localhost:3000')).toBe('https://localhost:3000')
  })

  it('should preserve existing http:// protocol', () => {
    expect(ensureProtocol('http://example.com')).toBe('http://example.com')
    expect(ensureProtocol('http://subdomain.example.com')).toBe('http://subdomain.example.com')
    expect(ensureProtocol('http://localhost:3000')).toBe('http://localhost:3000')
  })

  it('should handle case insensitive protocols', () => {
    expect(ensureProtocol('HTTP://example.com')).toBe('HTTP://example.com')
    expect(ensureProtocol('HTTPS://example.com')).toBe('HTTPS://example.com')
    expect(ensureProtocol('Http://example.com')).toBe('Http://example.com')
    expect(ensureProtocol('Https://example.com')).toBe('Https://example.com')
  })

  it('should handle edge cases', () => {
    expect(ensureProtocol('')).toBe('https://')
    expect(ensureProtocol('   ')).toBe('https://   ')
    expect(ensureProtocol('example.com:8080')).toBe('https://example.com:8080')
    expect(ensureProtocol('example.com/path')).toBe('https://example.com/path')
    expect(ensureProtocol('example.com?query=value')).toBe('https://example.com?query=value')
  })

  it('should handle domains with paths and query parameters', () => {
    expect(ensureProtocol('example.com/api/v1')).toBe('https://example.com/api/v1')
    expect(ensureProtocol('example.com/path?param=value')).toBe('https://example.com/path?param=value')
    expect(ensureProtocol('example.com/path#fragment')).toBe('https://example.com/path#fragment')
  })

  it('should add https:// to non-http/https protocols', () => {
    expect(ensureProtocol('ftp://example.com')).toBe('https://ftp://example.com')
    expect(ensureProtocol('file://example.com')).toBe('https://file://example.com')
  })
})

describe('ignoreProtocol', () => {
  it('should remove https:// protocol', () => {
    expect(ignoreProtocol('https://example.com')).toBe('example.com')
    expect(ignoreProtocol('https://subdomain.example.com')).toBe('subdomain.example.com')
    expect(ignoreProtocol('https://localhost:3000')).toBe('localhost:3000')
  })

  it('should remove http:// protocol', () => {
    expect(ignoreProtocol('http://example.com')).toBe('example.com')
    expect(ignoreProtocol('http://subdomain.example.com')).toBe('subdomain.example.com')
    expect(ignoreProtocol('http://localhost:3000')).toBe('localhost:3000')
  })

  it('should handle case insensitive protocols', () => {
    expect(ignoreProtocol('HTTP://example.com')).toBe('example.com')
    expect(ignoreProtocol('HTTPS://example.com')).toBe('example.com')
    expect(ignoreProtocol('Http://example.com')).toBe('example.com')
    expect(ignoreProtocol('Https://example.com')).toBe('example.com')
  })

  it('should return unchanged string if no protocol present', () => {
    expect(ignoreProtocol('example.com')).toBe('example.com')
    expect(ignoreProtocol('subdomain.example.com')).toBe('subdomain.example.com')
    expect(ignoreProtocol('localhost')).toBe('localhost')
    expect(ignoreProtocol('127.0.0.1')).toBe('127.0.0.1')
  })

  it('should handle edge cases', () => {
    expect(ignoreProtocol('')).toBe('')
    expect(ignoreProtocol('   ')).toBe('   ')
    expect(ignoreProtocol('https://')).toBe('')
    expect(ignoreProtocol('http://')).toBe('')
  })

  it('should handle domains with paths and query parameters', () => {
    expect(ignoreProtocol('https://example.com/api/v1')).toBe('example.com/api/v1')
    expect(ignoreProtocol('http://example.com/path?param=value')).toBe('example.com/path?param=value')
    expect(ignoreProtocol('https://example.com/path#fragment')).toBe('example.com/path#fragment')
  })

  it('should not remove non-http/https protocols', () => {
    expect(ignoreProtocol('ftp://example.com')).toBe('ftp://example.com')
    expect(ignoreProtocol('file://example.com')).toBe('file://example.com')
    expect(ignoreProtocol('ws://example.com')).toBe('ws://example.com')
    expect(ignoreProtocol('wss://example.com')).toBe('wss://example.com')
  })

  it('should handle multiple protocol occurrences correctly', () => {
    expect(ignoreProtocol('https://example.com/https://nested')).toBe('example.com/https://nested')
    expect(ignoreProtocol('http://example.com/http://nested')).toBe('example.com/http://nested')
  })
})

describe('utils integration tests', () => {
  it('should be reversible for domains without protocol', () => {
    const domain = 'example.com'
    const withProtocol = ensureProtocol(domain)
    const withoutProtocol = ignoreProtocol(withProtocol)
    expect(withoutProtocol).toBe(domain)
  })

  it('should handle round-trip transformations', () => {
    const testCases = [
      'example.com',
      'subdomain.example.com',
      'localhost:3000',
      'example.com/path',
      'example.com?query=value'
    ]

    testCases.forEach(domain => {
      const result = ignoreProtocol(ensureProtocol(domain))
      expect(result).toBe(domain)
    })
  })
})
