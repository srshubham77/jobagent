import { NextRequest, NextResponse } from 'next/server'

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:8086'
const APP_URL  = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

const CALLBACK_URL = `${APP_URL}/api/auth/callback`

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=missing_params', req.url))
  }

  const storedState = req.cookies.get('oauth_state')?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/login?error=state_mismatch', req.url))
  }

  try {
    const res = await fetch(`${AUTH_URL}/auth/exchange`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code, redirectUri: CALLBACK_URL, state }),
    })

    if (!res.ok) {
      return NextResponse.redirect(new URL('/login?error=exchange_failed', req.url))
    }

    const { accessToken, refreshToken, expiresIn } = await res.json() as {
      accessToken: string
      refreshToken: string
      expiresIn: number
    }

    const response = NextResponse.redirect(new URL('/', req.url))
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   expiresIn,
      path:     '/',
    })
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60,
      path:     '/',
    })
    response.cookies.delete('oauth_state')
    return response
  } catch {
    return NextResponse.redirect(new URL('/login?error=server_error', req.url))
  }
}
