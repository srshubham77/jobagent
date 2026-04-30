import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'

const MATCHER_URL = process.env.MATCHER_SERVICE_URL ?? 'http://localhost:8083'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  try {
    const res = await fetch(`${MATCHER_URL}/match/feed`, {
      headers: { 'X-User-Id': userId },
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json([], { status: 200 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
