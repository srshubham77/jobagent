import { type NextRequest, NextResponse } from 'next/server'
import { jwtVerify, createRemoteJWKSet } from 'jose'

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:8086'

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJWKS() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(`${AUTH_URL}/auth/jwks`))
  return jwks
}

export async function middleware(request: NextRequest) {
  const token        = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value

  if (token) {
    try {
      await jwtVerify(token, getJWKS())
      return NextResponse.next()
    } catch {
      // Token invalid or expired — fall through to refresh or redirect
    }
  }

  if (refreshToken) {
    const refreshUrl = new URL('/api/auth/refresh', request.url)
    refreshUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(refreshUrl)
  }

  const loginUrl = new URL('/login', request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!api/auth|login|_next/static|_next/image|favicon\\.ico).*)'],
}
