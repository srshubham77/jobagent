import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'

const PROFILE_URL = process.env.PROFILE_SERVICE_URL ?? 'http://localhost:8081'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json(null, { status: 401 })
  const userId = session.user.id

  try {
    const res = await fetch(`${PROFILE_URL}/profiles/me`, {
      headers: { 'X-User-Id': userId },
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json(null, { status: 200 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(null, { status: 200 })
  }
}
