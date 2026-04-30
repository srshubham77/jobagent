import { NextResponse } from 'next/server'

const TRACKER_URL = process.env.TRACKER_SERVICE_URL ?? 'http://localhost:8085'
const DEV_USER_ID = process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001'

// Proxy the OAuth redirect: tracker returns 302 → Google; we forward that location
export async function GET() {
  try {
    const res = await fetch(`${TRACKER_URL}/tracker/auth`, {
      headers: { 'X-User-Id': DEV_USER_ID },
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
  try {
    const res = await fetch(`${TRACKER_URL}/tracker/auth`, {
      method: 'DELETE',
      headers: { 'X-User-Id': DEV_USER_ID },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Tracker service unavailable' }, { status: 503 })
  }
}
