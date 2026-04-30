import { NextRequest, NextResponse } from 'next/server'

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:8086'

export async function GET(req: NextRequest) {
  const callbackUrl = req.nextUrl.searchParams.get('callbackUrl') ?? '/'
  const refreshToken = req.cookies.get('refresh_token')?.value

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const res = await fetch(`${AUTH_URL}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken }),
    })

    if (!res.ok) {
      const response = NextResponse.redirect(new URL('/login', req.url))
      response.cookies.delete('access_token')
      response.cookies.delete('refresh_token')
      return response
    }

    const { accessToken, expiresIn, refreshToken: newRefreshToken } = await res.json() as {
      accessToken: string
      refreshToken: string
      expiresIn: number
    }

    const response = NextResponse.redirect(new URL(callbackUrl, req.url))
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
    return NextResponse.redirect(new URL('/login', req.url))
  }
}
