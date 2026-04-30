import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'

const APPLY_URL = process.env.APPLY_SERVICE_URL ?? 'http://localhost:8084'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  try {
    const res = await fetch(`${APPLY_URL}/applications`, {
      headers: { 'X-User-Id': userId },
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
