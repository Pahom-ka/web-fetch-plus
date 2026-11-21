# web-fetch-plus

Model-facing `web_fetch` tool with render modes over the DeepSeek Harness web
capability seam (`ctx.web`).

Extracted from `dsh-tool-web` so the shipped tool package stays upstream-clean.
The `mode` argument selects the output form:

| mode           | behavior |
| -------------- | -------- |
| `text_compact` (default) | maximally compact plain text — page chrome (header except title, footer, nav, aside, scripts, styles, forms, comments) stripped, main content only |
| `text`         | full plain text: `<br>` → newline, block elements → blank-line paragraph breaks, no markup |
| `raw`          | extended form: the whole page converted to markdown with links and structure (GFM tables, strikethrough) |

Safety properties:

- External content is labeled `EXTERNAL_WEB_CONTENT_NOTICE` so provider text
  stays visibly outside agent instructions.
- A lexical nesting-depth ceiling (`MAX_CONVERSION_DEPTH = 512`) plus a source
  prefix cap keep synchronous HTML conversion bounded; pathological input is
  omitted rather than passed through raw.
- Output is capped as a whole (`fetchMaxOutputChars`), with an explicit
  truncation footer; the fetch card's `truncated` flag is derived from the same
  render, so UI never disagrees with the text the model saw.

## Usage

Compose this package instead of `dsh-tool-web`'s fetch half: set
`dsh-tool-web`'s `fetch: false` and mount this row beside it.

```yaml
- id: tool-web
  name: '@deepseek-ai/dsh-tool-web'
  config:
    fetch: false
    searchTimeoutMs: 60000

- id: tool-web-fetch-plus
  name: '@deepseek-ai/dsh-tool-web-fetch-plus'
  config:
    fetchTimeoutMs: 30000        # cooperative tool-call budget (ms)
    fetchMaxOutputChars: 200000  # cap on complete rendered output
```

## Repository layout

- `src/` — plugin source (Cordis plugin `tool-web-fetch-plus`)
- `tests/` — vitest unit tests
- `patches/web-fetch-http-accept-header.patch` — companion change to
  `dsh-web-fetch-http`: a browser-compatible `Accept` header (default
  `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`) that
  avoids bot-mitigation 406s from front-ends like hh.ru.

Credentials: this package reads no secrets. There is no key, token, or
endpoint credential anywhere in the code or history.

## License

MIT
