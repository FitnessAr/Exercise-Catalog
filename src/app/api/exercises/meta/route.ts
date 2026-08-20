import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/exercises/meta
// Valores disponibles de cada filtro con la cantidad de ejercicios por valor.
export async function GET() {
  try {
    const [category, bodyPart, equipment, muscleGroup, target] = await Promise.all([
      prisma.exercise.groupBy({
        by: ['category'],
        where: { category: { not: null } },
        _count: { _all: true },
        orderBy: { category: 'asc' },
      }),
      prisma.exercise.groupBy({
        by: ['bodyPart'],
        where: { bodyPart: { not: null } },
        _count: { _all: true },
        orderBy: { bodyPart: 'asc' },
      }),
      prisma.exercise.groupBy({
        by: ['equipment'],
        where: { equipment: { not: null } },
        _count: { _all: true },
        orderBy: { equipment: 'asc' },
      }),
      prisma.exercise.groupBy({
        by: ['muscleGroup'],
        where: { muscleGroup: { not: null } },
        _count: { _all: true },
        orderBy: { muscleGroup: 'asc' },
      }),
      prisma.exercise.groupBy({
        by: ['target'],
        where: { target: { not: null } },
        _count: { _all: true },
        orderBy: { target: 'asc' },
      }),
    ])

    const toOptions = (
      rows: Array<{ value: string | null; count: number }>
    ) =>
      rows
        .filter((row) => row.value !== null)
        .map((row) => ({ value: row.value as string, count: row.count }))

    return NextResponse.json({
      data: {
        category: toOptions(category.map((row) => ({ value: row.category, count: row._count._all }))),
        body_part: toOptions(bodyPart.map((row) => ({ value: row.bodyPart, count: row._count._all }))),
        equipment: toOptions(equipment.map((row) => ({ value: row.equipment, count: row._count._all }))),
        muscle_group: toOptions(muscleGroup.map((row) => ({ value: row.muscleGroup, count: row._count._all }))),
        target: toOptions(target.map((row) => ({ value: row.target, count: row._count._all }))),
      },
    })
  } catch (error) {
    console.error('Error fetching exercise metadata:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
