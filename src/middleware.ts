import { NextRequest, NextResponse } from 'next/server'

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Max-Age': '86400',
}

function withCors(response: NextResponse, origin: string | null): NextResponse {
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  return response
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')

  // El preflight va antes del auth: los browsers no envían x-api-key en OPTIONS.
  if (request.method === 'OPTIONS') {
    const headers: Record<string, string> = { ...corsHeaders }
    if (origin && allowedOrigins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin
    }
    return new NextResponse(null, { status: 204, headers })
  }

  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (request.nextUrl.pathname === '/api/health') {
    return withCors(NextResponse.next(), origin)
  }

  const apiKey = request.headers.get('x-api-key')
  const expectedApiKey = process.env.CATALOG_API_KEY

  if (!apiKey || apiKey !== expectedApiKey) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing API key' },
      { status: 401 }
    )
  }

  return withCors(NextResponse.next(), origin)
}

export const config = {
  matcher: '/api/:path*',
}
