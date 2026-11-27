import { describe, expect, it } from 'vitest'
import { emailDocument } from './content'

describe('emailDocument', () => {
  it('wraps HTML mail with a no-script policy and links that open a new tab', () => {
    const doc = emailDocument({ html: '<p>Hi <a href="https://example.com">there</a></p>', text: null })
    expect(doc).toContain(`script-src 'none'`)
    expect(doc).toContain('<base target="_blank">')
    expect(doc).toContain('<p>Hi <a href="https://example.com">there</a></p>')
  })

  it('escapes plain-text mail instead of interpreting it as markup', () => {
    const doc = emailDocument({ html: null, text: 'a < b & <script>alert(1)</script>' })
    expect(doc).toContain('a &lt; b &amp; &lt;script&gt;alert(1)&lt;/script&gt;')
    expect(doc).not.toContain('<script>alert(1)</script>')
  })
})
