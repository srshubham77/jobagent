import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'

const TRACKER_URL = process.env.TRACKER_SERVICE_URL ?? 'http://localhost:8085'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  try {
    const res = await fetch(`${TRACKER_URL}/tracker/sync`, {
      method: 'POST',
      headers: { 'X-User-Id': userId },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Tracker service unavailable' }, { status: 503 })
  }
}
