import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

interface ExerciseData {
  id: string
  name: string
  category: string
  body_part: string
  equipment: string
  instructions: Record<string, string>
  instruction_steps: Record<string, string[]>
  muscle_group: string
  secondary_muscles: string[]
  target: string
  image: string
  gif_url: string
  media_id: string
  created_at: string
  attribution: string
}

async function main() {
  console.log('🌱 Seeding exercises...')

  // Read the exercises JSON file
  const jsonPath = join(process.cwd(), '..', 'exercises-dataset-main', 'data', 'exercises.json')
  const rawData = readFileSync(jsonPath, 'utf-8')
  const exercises: ExerciseData[] = JSON.parse(rawData)

  console.log(`📚 Found ${exercises.length} exercises in dataset`)

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const exercise of exercises) {
    try {
      // Upsert exercise (insert or update if exists)
      await prisma.exercise.upsert({
        where: { id: exercise.id },
        create: {
          id: exercise.id,
          name: exercise.name,
          category: exercise.category,
          bodyPart: exercise.body_part,
          equipment: exercise.equipment,
          muscleGroup: exercise.muscle_group,
          target: exercise.target,
          secondaryMuscles: exercise.secondary_muscles,
          instructions: exercise.instructions,
          instructionSteps: exercise.instruction_steps,
          image: exercise.image,
          gifUrl: exercise.gif_url,
          attribution: exercise.attribution,
        },
        update: {
          name: exercise.name,
          category: exercise.category,
          bodyPart: exercise.body_part,
          equipment: exercise.equipment,
          muscleGroup: exercise.muscle_group,
          target: exercise.target,
          secondaryMuscles: exercise.secondary_muscles,
          instructions: exercise.instructions,
          instructionSteps: exercise.instruction_steps,
          image: exercise.image,
          gifUrl: exercise.gif_url,
          attribution: exercise.attribution,
        },
      })
      imported++

      // Progress indicator every 100 exercises
      if (imported % 100 === 0) {
        console.log(`  ⏳ Processed ${imported}/${exercises.length}...`)
      }
    } catch (error) {
      console.error(`  ❌ Error importing exercise ${exercise.id}:`, error)
      errors++
    }
  }

  console.log('\n✅ Seeding complete!')
  console.log(`   📊 Imported: ${imported}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
