import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/server-auth'

const TRACKER_URL = process.env.TRACKER_SERVICE_URL ?? 'http://localhost:8085'

// Proxy the OAuth redirect: tracker returns 302 → Google; we forward that location
export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const res = await fetch(`${TRACKER_URL}/tracker/auth`, {
      method: 'DELETE',
      headers: { 'X-User-Id': userId },
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Tracker service unavailable' }, { status: 503 })
  }
}
