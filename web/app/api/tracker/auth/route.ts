import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'

const TRACKER_URL = process.env.TRACKER_SERVICE_URL ?? 'http://localhost:8085'

// Proxy the OAuth redirect: tracker returns 302 → Google; we forward that location
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  try {
    const res = await fetch(`${TRACKER_URL}/tracker/auth`, {
      headers: { 'X-User-Id': userId },
      redirect: 'manual',
    })
    const location = res.headers.get('location')
    if (location) return NextResponse.redirect(location)
    return NextResponse.json({ error: 'No redirect from tracker' }, { status: 502 })
  } catch {
    return NextResponse.json({ error: 'Tracker service unavailable' }, { status: 503 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  try {
    const res = await fetch(`${TRACKER_URL}/tracker/auth`, {
      method: 'DELETE',
      headers: { 'X-User-Id': userId },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Tracker service unavailable' }, { status: 503 })
  }
}
