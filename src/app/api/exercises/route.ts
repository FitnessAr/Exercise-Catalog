import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyLang, SUPPORTED_LANGS } from '@/lib/exercise-response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get filter parameters
    const category = searchParams.get('category')
    const bodyPart = searchParams.get('body_part')
    const equipment = searchParams.get('equipment')
    const muscleGroup = searchParams.get('muscle_group')
    const target = searchParams.get('target')

    // Get pagination parameters
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

    // Get language parameter
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

    // Build where clause
    const where: Record<string, unknown> = {}

    if (category) where.category = category
    if (bodyPart) where.bodyPart = bodyPart
    if (equipment) where.equipment = equipment
    if (muscleGroup) where.muscleGroup = muscleGroup
    if (target) where.target = target

    // Text search on name (case-insensitive)
    const q = searchParams.get('q')?.trim()
    if (q) where.name = { contains: q, mode: 'insensitive' }

    // Batch fetch by ids
    const idsRaw = searchParams.get('ids')
    if (idsRaw !== null) {
      const ids = idsRaw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
      if (ids.length > 100) {
        return NextResponse.json(
          { error: 'Too many ids (max 100)' },
          { status: 400 }
        )
      }
      if (ids.length > 0) where.id = { in: ids }
    }

    // Execute query
    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      prisma.exercise.count({ where }),
    ])

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

    return NextResponse.json({
      data,
      total,
      offset,
      limit,
    })
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
