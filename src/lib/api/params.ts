import { ApiError } from '@/lib/api/http'
import { SUPPORTED_LANGS } from '@/lib/exercise-response'

export type Lang = (typeof SUPPORTED_LANGS)[number]

export function parseLang(searchParams: URLSearchParams): Lang | null {
  const raw = searchParams.get('lang')
  const lang = raw?.trim().toLowerCase() || null
  if (!lang) return null
  if (!(SUPPORTED_LANGS as readonly string[]).includes(lang)) {
    throw new ApiError(
      400,
      `Unsupported language: ${raw}. Valid: ${SUPPORTED_LANGS.join(', ')}`
    )
  }
  return lang as Lang
}

export function parseIntParam(
  searchParams: URLSearchParams,
  name: string,
  fallback: number
): number {
  const raw = searchParams.get(name)
  if (raw === null || raw.trim() === '') return fallback
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed)) {
    throw new ApiError(400, `Invalid ${name}: "${raw}"`)
  }
  return parsed
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
