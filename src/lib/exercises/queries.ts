import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api/http'

export interface ExerciseFilters {
  category?: string
  bodyPart?: string
  equipment?: string
  muscleGroup?: string
  target?: string
  nameContains?: string
  ids?: string[]
}

export interface ListOptions {
  filters: ExerciseFilters
  offset: number
  limit: number
}

export interface FilterOption {
  value: string
  count: number
}

function buildWhere(filters: ExerciseFilters) {
  const where: Record<string, unknown> = {}
  if (filters.category) where.category = filters.category
  if (filters.bodyPart) where.bodyPart = filters.bodyPart
  if (filters.equipment) where.equipment = filters.equipment
  if (filters.muscleGroup) where.muscleGroup = filters.muscleGroup
  if (filters.target) where.target = filters.target
  if (filters.nameContains) {
    where.name = { contains: filters.nameContains, mode: 'insensitive' }
  }
  if (filters.ids) where.id = { in: filters.ids }
  return where
}

export async function findExercises({ filters, offset, limit }: ListOptions) {
  const where = buildWhere(filters)
  const [items, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { id: 'asc' },
    }),
    prisma.exercise.count({ where }),
  ])
  return { items, total }
}

export async function findExerciseById(id: string) {
  return prisma.exercise.findUnique({ where: { id } })
}

// Muestreo por salto aleatorio uniforme sobre el total, garantizando
// hasta `limit` resultados cuando la tabla alcanza.
export async function findRandomExercises(limit: number) {
  const total = await prisma.exercise.count()
  if (total === 0) return []
  const maxSkip = Math.max(total - limit, 0)
  const skip = Math.floor(Math.random() * (maxSkip + 1))
  return prisma.exercise.findMany({
    take: limit,
    skip,
    orderBy: { id: 'asc' },
  })
}

const META_FIELDS = [
  ['category', 'category'],
  ['body_part', 'bodyPart'],
  ['equipment', 'equipment'],
  ['muscle_group', 'muscleGroup'],
  ['target', 'target'],
] as const

type MetaField = (typeof META_FIELDS)[number][1]

async function groupCount(field: MetaField): Promise<FilterOption[]> {
  const rows = await prisma.exercise.groupBy({
    by: [field],
    _count: { _all: true },
  })
  return rows
    .filter((row) => row[field] !== null)
    .map((row) => ({ value: row[field] as string, count: row._count._all }))
    .sort((a, b) => a.value.localeCompare(b.value))
}

export async function getFilterOptions(): Promise<Record<string, FilterOption[]>> {
  const results = await Promise.all(META_FIELDS.map(([, field]) => groupCount(field)))
  return Object.fromEntries(
    META_FIELDS.map(([key], index) => [key, results[index]])
  )
}
