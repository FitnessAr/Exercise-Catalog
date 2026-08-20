import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyLang, SUPPORTED_LANGS } from '@/lib/exercise-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const exercise = await prisma.exercise.findUnique({
      where: { id },
    })

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    const rawLang = new URL(request.url).searchParams.get('lang')
    const lang = rawLang?.trim().toLowerCase() || null
    if (lang && !(SUPPORTED_LANGS as readonly string[]).includes(lang)) {
      return NextResponse.json(
        {
          error: `Unsupported language: ${rawLang}. Valid: ${SUPPORTED_LANGS.join(', ')}`,
        },
        { status: 400 }
      )
    }

    if (lang) {
      const trimmed = applyLang(exercise, lang)
      return NextResponse.json({
        data: {
          ...exercise,
          instructions: trimmed?.instructions ?? null,
          instructionSteps: trimmed?.instructionSteps ?? null,
        },
      })
    }

    return NextResponse.json({ data: exercise })
  } catch (error) {
    console.error('Error fetching exercise:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
