import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Build where clause
    const where: Record<string, unknown> = {}

    if (category) where.category = category
    if (bodyPart) where.bodyPart = bodyPart
    if (equipment) where.equipment = equipment
    if (muscleGroup) where.muscleGroup = muscleGroup
    if (target) where.target = target

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

    return NextResponse.json({
      data: exercises,
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
