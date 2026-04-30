import { NextRequest, NextResponse } from 'next/server'

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:8086'
const APP_URL  = process.env.NEXTAUTH_URL     ?? 'http://localhost:3000'

export async function GET(req: NextRequest) {
  const callbackUrl  = req.nextUrl.searchParams.get('callbackUrl') ?? '/'
  const refreshToken = req.cookies.get('refresh_token')?.value

  if (!refreshToken) {
    return NextResponse.redirect(`${APP_URL}/login`)
  }

  try {
    const res = await fetch(`${AUTH_URL}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken }),
    })

    if (!res.ok) {
      const response = NextResponse.redirect(`${APP_URL}/login`)
      response.cookies.delete('access_token')
      response.cookies.delete('refresh_token')
      return response
    }

    const { accessToken, expiresIn, refreshToken: newRefreshToken } = await res.json() as {
      accessToken: string
      refreshToken: string
      expiresIn: number
    }

    const safeCallbackUrl = callbackUrl.startsWith('/') ? callbackUrl : '/'
    const response = NextResponse.redirect(`${APP_URL}${safeCallbackUrl}`)
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   expiresIn,
      path:     '/',
    })
    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60,
      path:     '/',
    })
    return response
  } catch {
    return NextResponse.redirect(`${APP_URL}/login`)
  }
}
