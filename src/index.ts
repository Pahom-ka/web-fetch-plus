/**
 * Model-facing `web_fetch` tool with render modes over `ctx.web`. This package
 * owns its schema, validation, and presentation — the extended fetch extracted
 * from `dsh-tool-web` so the shipped tool package stays upstream-clean. The
 * `mode` argument selects the output form: `raw` (markdown), `text` (structured
 * plain text), or `text_compact` (plain text without page chrome).
 * @module @deepseek-ai/dsh-tool-web-fetch-plus
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-web'
import { applyWebFetchTool } from './fetch.ts'

export {
  applyWebFetchTool,
  FETCH_MODES,
  formatFetchOutput,
  htmlToPlainText,
  parseFetchArgs,
  presentFetchCall,
  presentFetchResult,
  fetchMetaFromValue,
  fetchMetaFromResult,
} from './fetch.ts'
export type { FetchArgs, FetchMode, WebFetchMeta } from './fetch.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'tool-web-fetch-plus'

/** Services required by the fetch tool. */
export const inject = ['tools', 'web', 'systemPrompt']

/** Default cooperative tool-call timeout budget (ms) for the fetch tool. */
export const DEFAULT_FETCH_TIMEOUT_MS = 30_000

/**
 * Default cap on one `web_fetch` output and on source characters converted
 * synchronously (see `dsh-tool-web`'s matching constant for the rationale).
 */
export const DEFAULT_FETCH_MAX_OUTPUT_CHARS = 200_000

/** Plugin config: the fetch tool's budgets and output cap. */
export interface Config {
  /** Cooperative timeout budget (ms) for `web_fetch`. Defaults to 30000. */
  fetchTimeoutMs?: number
  /** Cap on source characters converted and complete `web_fetch` output characters. Defaults to 200000. */
  fetchMaxOutputChars?: number
}

export const Config: z<Config> = z.object({
  fetchTimeoutMs: z.number().default(DEFAULT_FETCH_TIMEOUT_MS),
  fetchMaxOutputChars: z.number().default(DEFAULT_FETCH_MAX_OUTPUT_CHARS),
})

/** Complete config after schemastery applies every field default. */
type ResolvedConfig = Required<Config>

/** Configured budgets must be positive integers. */
function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`tool-web-fetch-plus: ${name} must be a positive integer`)
  }
}

/**
 * Register the mode-aware `web_fetch` tool. Compose this package instead of
 * `dsh-tool-web`'s fetch half: a deployment wanting both web tools sets
 * `dsh-tool-web`'s `fetch: false` and mounts this row beside it. The tool's
 * cooperative timeout budget resolves here and attaches as
 * `ToolDefinition.timeoutMs` for `@deepseek-ai/dsh-tool-call-timeout-policy`.
 */
export function apply(ctx: Context, config: Config): void {
  // schemastery (Config) has already filled every defaulted field.
  const resolved = config as ResolvedConfig
  assertPositiveInteger('fetchTimeoutMs', resolved.fetchTimeoutMs)
  assertPositiveInteger('fetchMaxOutputChars', resolved.fetchMaxOutputChars)
  applyWebFetchTool(ctx, resolved.fetchTimeoutMs, resolved.fetchMaxOutputChars)
}
