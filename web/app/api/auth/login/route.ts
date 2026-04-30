import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  const AUTH_URL     = process.env.AUTH_SERVICE_URL ?? 'http://localhost:8086'
  const APP_URL      = process.env.NEXTAUTH_URL     ?? 'http://localhost:3000'
  const CALLBACK_URL = `${APP_URL}/api/auth/callback`

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
  } catch (err) {
    console.error('[auth/login] failed to reach auth service:', err)
    return NextResponse.redirect(`${APP_URL}/login?error=auth_unavailable`)
  }
}
