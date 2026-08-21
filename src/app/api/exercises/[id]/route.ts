import type { NextRequest } from 'next/server'
import { ApiError, json, withApi } from '@/lib/api/http'
import { parseLang } from '@/lib/api/params'
import { findExerciseById } from '@/lib/exercises/queries'
import { localizeExercise } from '@/lib/exercise-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApi('GET /api/exercises/[id]', async () => {
    const { id } = await params
    const lang = parseLang(request.nextUrl.searchParams)

    const exercise = await findExerciseById(id)
    if (!exercise) throw new ApiError(404, 'Exercise not found')

    return json({ data: localizeExercise(exercise, lang) })
  })
}
