import { NextRequest, NextResponse } from 'next/server'

const AUTH_URL     = process.env.AUTH_SERVICE_URL ?? 'http://localhost:8086'
const APP_URL      = process.env.NEXTAUTH_URL     ?? 'http://localhost:3000'
const CALLBACK_URL = `${APP_URL}/api/auth/callback`

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/login?error=missing_params`)
  }

  const storedState = req.cookies.get('oauth_state')?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${APP_URL}/login?error=state_mismatch`)
  }

  try {
    const res = await fetch(`${AUTH_URL}/auth/exchange`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code, redirectUri: CALLBACK_URL, state }),
    })

    if (!res.ok) {
      console.error('exchange failed:', res.status, await res.text())
      return NextResponse.redirect(`${APP_URL}/login?error=exchange_failed`)
    }

    const { accessToken, refreshToken, expiresIn } = await res.json() as {
      accessToken: string
      refreshToken: string
      expiresIn: number
    }

    const response = NextResponse.redirect(`${APP_URL}/`)
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
  } catch (err) {
    console.error('callback error:', err)
    return NextResponse.redirect(`${APP_URL}/login?error=server_error`)
  }
}
