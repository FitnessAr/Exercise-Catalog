import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Skip health check endpoint
    if (request.nextUrl.pathname === '/api/health') {
      return NextResponse.next()
    }

    // Get API key from header
    const apiKey = request.headers.get('x-api-key')

    // Get expected API key from environment
    const expectedApiKey = process.env.CATALOG_API_KEY

    // Validate API key
    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing API key' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
