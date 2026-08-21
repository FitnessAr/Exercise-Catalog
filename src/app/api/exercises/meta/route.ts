import { json, withApi } from '@/lib/api/http'
import { getFilterOptions } from '@/lib/exercises/queries'

// GET /api/exercises/meta
// Valores disponibles de cada filtro con la cantidad de ejercicios por valor.
export async function GET() {
  return withApi('GET /api/exercises/meta', async () => {
    return json({ data: await getFilterOptions() })
  })
}
