import { describe, expect, it } from 'vitest'
import {
  FETCH_MODES,
  formatFetchOutput,
  htmlToPlainText,
  parseFetchArgs,
} from '../src/fetch.ts'
import type { WebFetchResult } from '@deepseek-ai/dsh-web'

/** An HTML fetch result with the given body. */
function htmlResult(html: string): WebFetchResult {
  return { url: 'https://a.test/page', statusCode: 200, body: { kind: 'html', content: html }, truncated: false }
}

describe('parseFetchArgs', () => {
  it('validates url (non-empty) and mode (known), no timeout parameter', () => {
    expect(() => parseFetchArgs({ url: ' ' })).toThrow('non-empty')
    expect(parseFetchArgs({ url: 'https://a.test' })).toEqual({ url: 'https://a.test', mode: 'text_compact' })
    expect(parseFetchArgs({ url: 'https://a.test', mode: 'text_compact' })).toEqual({ url: 'https://a.test', mode: 'text_compact' })
    expect(() => parseFetchArgs({ url: 'https://a.test', mode: 'bogus' as never })).toThrow('mode must be one of')
    expect([...FETCH_MODES]).toEqual(['raw', 'text', 'text_compact'])
  })
})

describe('htmlToPlainText', () => {
  it('turns <br> into single newlines and blocks into paragraph breaks', () => {
    const text = htmlToPlainText('<p>first<br>second</p><div>third</div>', false)
    expect(text).toBe('first\nsecond\n\nthird')
  })

  it('decodes entities', () => {
    expect(htmlToPlainText('<p>a &amp; b &laquo;q&raquo; &hellip;</p>', false)).toBe('a & b «q» …')
  })

  it('compact drops chrome and keeps the title as the first line', () => {
    const page = '<html><head><title>T</title><style>x{}</style></head>'
      + '<body><header>menu</header><nav>nav</nav><main><p>content</p></main><footer>f</footer></body></html>'
    expect(htmlToPlainText(page, true)).toBe('T\n\ncontent')
  })

  it('non-compact keeps nav/footer text but drops scripts and styles', () => {
    const page = '<script>bad()</script><p>ok</p>'
    expect(htmlToPlainText(page, false)).toBe('ok')
  })
})

describe('formatFetchOutput', () => {
  it('raw mode converts HTML to markdown', () => {
    const out = formatFetchOutput(htmlResult('<h1>Title</h1><p>Body</p>'), 10_000)
    expect(out).toContain('# Title')
    expect(out).toContain('Body')
    expect(out).toContain('Fetched https://a.test/page (HTTP 200)')
  })

  it('text mode strips markup', () => {
    const out = formatFetchOutput(htmlResult('<h1>Title</h1><p>Body</p>'), 10_000, 'text')
    expect(out).not.toContain('#')
    expect(out).toContain('Title')
    expect(out).toContain('Body')
  })

  it('caps the complete output and appends the truncation notice', () => {
    const out = formatFetchOutput(htmlResult(`<p>${'x'.repeat(5_000)}</p>`), 500)
    expect(out.length).toBeLessThanOrEqual(500)
    expect(out).toContain('Content truncated')
  })
})
