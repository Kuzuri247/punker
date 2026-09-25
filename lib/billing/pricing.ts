import type { LanguageModelUsage } from "ai"

import { DOLLAR } from "@/lib/billing/format"
import type { GameModelId } from "@/lib/games/model-catalog"

/**
 * A rate quoted the way providers publish it — dollars per million tokens —
 * as billionths of a dollar per million tokens.
 *
 * Scaled through DOLLAR so the table below reads like the price list it came from.
 */
function perMillionTokens(dollars: number): bigint {
  return BigInt(Math.round(dollars * 1_000_000)) * (DOLLAR / 1_000_000n)
}

const TOKENS_PER_MILLION = 1_000_000n

type ModelRates = {
  /** Input tokens that were neither read from nor written to the cache. */
  input: bigint
  /** Input tokens served from the cache. */
  cacheRead: bigint
  /** Input tokens written to the cache. */
  cacheWrite: bigint
  output: bigint
}

/**
 * What each model in the catalog costs, per million tokens.
 *
 * Source: Google's published Gemini pricing.
 *
 * `satisfies` rather than an annotation, so a model added to the catalog and
 * forgotten here is a type error rather than an undefined rate that prices a
 * turn at zero.
 */
export const MODEL_RATES = {
  "gemini-3.8-flash": {
    input: perMillionTokens(0.15),
    cacheRead: perMillionTokens(0.0375),
    cacheWrite: perMillionTokens(0.15),
    output: perMillionTokens(0.6),
  },
  "gemini-3.6-flash": {
    input: perMillionTokens(0.1),
    cacheRead: perMillionTokens(0.025),
    cacheWrite: perMillionTokens(0.1),
    output: perMillionTokens(0.4),
  },
  "gemini-3.5-flash-lite": {
    input: perMillionTokens(0.075),
    cacheRead: perMillionTokens(0.01875),
    cacheWrite: perMillionTokens(0.075),
    output: perMillionTokens(0.3),
  },
  "claude-3-7-sonnet": {
    input: perMillionTokens(3.0),
    cacheRead: perMillionTokens(0.3),
    cacheWrite: perMillionTokens(3.75),
    output: perMillionTokens(15.0),
  },
  "claude-3-5-haiku": {
    input: perMillionTokens(0.8),
    cacheRead: perMillionTokens(0.08),
    cacheWrite: perMillionTokens(1.0),
    output: perMillionTokens(4.0),
  },
  "gpt-4o": {
    input: perMillionTokens(2.5),
    cacheRead: perMillionTokens(1.25),
    cacheWrite: perMillionTokens(2.5),
    output: perMillionTokens(10.0),
  },
  "gpt-4o-mini": {
    input: perMillionTokens(0.15),
    cacheRead: perMillionTokens(0.075),
    cacheWrite: perMillionTokens(0.15),
    output: perMillionTokens(0.6),
  },
} satisfies Record<GameModelId, ModelRates>

function costOf(tokens: number | undefined, rate: bigint): bigint {
  if (!tokens || tokens < 0) {
    return 0n
  }

  // Truncates the fraction below a billionth of a dollar, which at these rates
  // is a fraction of a single token's cost.
  return (BigInt(tokens) * rate) / TOKENS_PER_MILLION
}

/**
 * What one step of a turn cost, in billionths of a dollar.
 *
 * The four token classes are priced separately because they differ by more
 * than an order of magnitude: on Opus a cached input token costs a tenth of a
 * fresh one and a cache write costs a quarter more, so a long build — which is
 * mostly the same context read back over and over — is billed nothing like its
 * raw token count suggests.
 *
 * `inputTokens` is deliberately not used: it is the *total*, cached tokens
 * included, so pricing it at the fresh rate would charge full price for reads
 * that cost a tenth of it.
 */
export function priceStep({
  modelId,
  usage,
}: {
  modelId: GameModelId
  usage: LanguageModelUsage
}): bigint {
  const rates = MODEL_RATES[modelId]
  const { noCacheTokens, cacheReadTokens, cacheWriteTokens } =
    usage.inputTokenDetails

  // A provider that reports no breakdown at all has done no caching to report,
  // so the whole input is fresh. Anthropic always breaks it down; this is what
  // keeps a provider that doesn't from being billed as if input were free.
  const fresh =
    noCacheTokens === undefined &&
    cacheReadTokens === undefined &&
    cacheWriteTokens === undefined
      ? usage.inputTokens
      : noCacheTokens

  return (
    costOf(fresh, rates.input) +
    costOf(cacheReadTokens, rates.cacheRead) +
    costOf(cacheWriteTokens, rates.cacheWrite) +
    costOf(usage.outputTokens, rates.output)
  )
}
