import { type NextRequest, NextResponse } from 'next/server'

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' && payload.exp > Date.now() / 1000
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const token        = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value

  if (token && isTokenValid(token)) {
    return NextResponse.next()
  }

  if (refreshToken) {
    const refreshUrl = new URL('/api/auth/refresh', request.url)
    refreshUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(refreshUrl)
  }

  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!api/auth|login|_next/static|_next/image|favicon\\.ico).*)'],
}
