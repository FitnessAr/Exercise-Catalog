import type { NextRequest } from 'next/server'
import { ApiError, json, withApi } from '@/lib/api/http'
import { clamp, parseLang, parseIntParam } from '@/lib/api/params'
import { findExercises, type ExerciseFilters } from '@/lib/exercises/queries'
import { localizeExercise } from '@/lib/exercise-response'

export async function GET(request: NextRequest) {
  return withApi('GET /api/exercises', async () => {
    const { searchParams } = request.nextUrl

    const filters: ExerciseFilters = {}
    const category = searchParams.get('category')
    if (category) filters.category = category
    const bodyPart = searchParams.get('body_part')
    if (bodyPart) filters.bodyPart = bodyPart
    const equipment = searchParams.get('equipment')
    if (equipment) filters.equipment = equipment
    const muscleGroup = searchParams.get('muscle_group')
    if (muscleGroup) filters.muscleGroup = muscleGroup
    const target = searchParams.get('target')
    if (target) filters.target = target
    const q = searchParams.get('q')?.trim()
    if (q) filters.nameContains = q

    const idsRaw = searchParams.get('ids')
    if (idsRaw !== null) {
      const ids = idsRaw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
      if (ids.length > 100) throw new ApiError(400, 'Too many ids (max 100)')
      if (ids.length > 0) filters.ids = ids
    }

    const offset = parseIntParam(searchParams, 'offset', 0)
    if (offset < 0) throw new ApiError(400, 'offset must be >= 0')
    const limit = clamp(parseIntParam(searchParams, 'limit', 20), 0, 100)
    const lang = parseLang(searchParams)

    const { items, total } = await findExercises({ filters, offset, limit })

    return json({
      data: items.map((exercise) => localizeExercise(exercise, lang)),
      total,
      offset,
      limit,
    })
  })
}
