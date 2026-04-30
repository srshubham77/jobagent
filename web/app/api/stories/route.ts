import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'

const PROFILE_URL = process.env.PROFILE_SERVICE_URL ?? 'http://localhost:8081'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  try {
    const res = await fetch(`${PROFILE_URL}/stories`, {
      headers: { 'X-User-Id': userId },
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  try {
    const body = await req.json()
    const res = await fetch(`${PROFILE_URL}/stories`, {
      method: 'POST',
      headers: { 'X-User-Id': userId, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Profile service unavailable' }, { status: 503 })
  }
}
