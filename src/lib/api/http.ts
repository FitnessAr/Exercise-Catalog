import { NextResponse } from 'next/server'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function withApi(context: string, handler: () => Promise<NextResponse>) {
  return handler().catch((error: unknown) => {
    if (error instanceof ApiError) {
      return json({ error: error.message }, error.status)
    }
    console.error(`Unhandled API error in ${context}:`, error)
    return json({ error: 'Internal server error' }, 500)
  })
}
