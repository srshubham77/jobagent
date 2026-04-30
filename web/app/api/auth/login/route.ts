import { NextRequest, NextResponse } from 'next/server'

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:8086'
const APP_URL  = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

const CALLBACK_URL = `${APP_URL}/api/auth/callback`

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${AUTH_URL}/auth/google-url?callbackUrl=${encodeURIComponent(CALLBACK_URL)}`)
    const { url, state } = await res.json() as { url: string; state: string }

    const response = NextResponse.redirect(url)
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 300,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.redirect(new URL('/login?error=auth_unavailable', req.url))
  }
}
