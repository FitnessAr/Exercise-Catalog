import type { NextRequest } from 'next/server'
import { json, withApi } from '@/lib/api/http'
import { clamp, parseLang, parseIntParam } from '@/lib/api/params'
import { findRandomExercises } from '@/lib/exercises/queries'
import { localizeExercise } from '@/lib/exercise-response'

// GET /api/exercises/random
// Ejercicios aleatorios (muestreo por salto aleatorio sobre el total).
export async function GET(request: NextRequest) {
  return withApi('GET /api/exercises/random', async () => {
    const limit = clamp(parseIntParam(request.nextUrl.searchParams, 'limit', 5), 1, 20)
    const lang = parseLang(request.nextUrl.searchParams)

    const exercises = await findRandomExercises(limit)

    return json({
      data: exercises.map((exercise) => localizeExercise(exercise, lang)),
      count: exercises.length,
    })
  })
}
