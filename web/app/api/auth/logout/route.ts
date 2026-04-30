import { NextRequest, NextResponse } from 'next/server'

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:8086'

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value

  if (refreshToken) {
    try {
      await fetch(`${AUTH_URL}/auth/logout`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken }),
      })
    } catch {
      // Best-effort revocation — clear cookies regardless
    }
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.delete('access_token')
  response.cookies.delete('refresh_token')
  return response
}
