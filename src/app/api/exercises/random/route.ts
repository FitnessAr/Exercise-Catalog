import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyLang, SUPPORTED_LANGS } from '@/lib/exercise-response'

// GET /api/exercises/random
// Ejercicios aleatorios (muestreo por salto aleatorio sobre el total).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const limitParam = parseInt(searchParams.get('limit') || '5', 10)
    const limit = Math.min(Math.max(Number.isNaN(limitParam) ? 5 : limitParam, 1), 20)

    const rawLang = searchParams.get('lang')
    const lang = rawLang?.trim().toLowerCase() || null
    if (lang && !(SUPPORTED_LANGS as readonly string[]).includes(lang)) {
      return NextResponse.json(
        {
          error: `Unsupported language: ${rawLang}. Valid: ${SUPPORTED_LANGS.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const total = await prisma.exercise.count()
    if (total === 0) {
      return NextResponse.json({ data: [], count: 0 })
    }

    const skip = Math.floor(Math.random() * total)
    const exercises = await prisma.exercise.findMany({
      take: limit,
      skip,
      orderBy: { id: 'asc' },
    })

    const data = lang
      ? exercises.map((exercise) => {
          const trimmed = applyLang(exercise, lang)
          return {
            ...exercise,
            instructions: trimmed?.instructions ?? null,
            instructionSteps: trimmed?.instructionSteps ?? null,
          }
        })
      : exercises

    return NextResponse.json({ data, count: exercises.length })
  } catch (error) {
    console.error('Error fetching random exercises:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
