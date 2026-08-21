export const SUPPORTED_LANGS = [
  'en',
  'es',
  'it',
  'tr',
  'ru',
  'zh',
  'hi',
  'pl',
  'ko',
  'fr',
] as const

export type SupportedLang = (typeof SUPPORTED_LANGS)[number]

// Resuelve la clave de idioma a usar dentro de un campo i18n.
// Cadena de fallback: lang -> es -> en -> primera clave disponible.
function resolveLangKey(field: unknown, lang: string): string | null {
  if (!field || typeof field !== 'object' || Array.isArray(field)) return null
  const keys = Object.keys(field as Record<string, unknown>)
  if (keys.length === 0) return null
  if (keys.includes(lang)) return lang
  if (keys.includes('es')) return 'es'
  if (keys.includes('en')) return 'en'
  return keys[0]
}

// Devuelve instructions/instructionSteps recortados al idioma pedido,
// o null si no se pidió idioma (el caller mantiene el JSON completo).
export function applyLang(
  exercise: { instructions: unknown; instructionSteps: unknown },
  lang?: string | null
): { instructions: string | null; instructionSteps: string[] | null } | null {
  if (!lang) return null

  const instructions = exercise.instructions as Record<string, string> | null
  const steps = exercise.instructionSteps as Record<string, string[]> | null

  const instKey = resolveLangKey(instructions, lang)
  const stepsKey = resolveLangKey(steps, lang)

  return {
    instructions: instKey ? (instructions?.[instKey] ?? null) : null,
    instructionSteps: stepsKey ? (steps?.[stepsKey] ?? null) : null,
  }
}

// Devuelve el ejercicio recortado al idioma pedido, o intacto si no hay lang.
export function localizeExercise<
  T extends { instructions: unknown; instructionSteps: unknown }
>(
  exercise: T,
  lang?: SupportedLang | null
): T {
  if (!lang) return exercise
  const trimmed = applyLang(exercise, lang)
  return {
    ...exercise,
    instructions: trimmed?.instructions ?? null,
    instructionSteps: trimmed?.instructionSteps ?? null,
  }
}
