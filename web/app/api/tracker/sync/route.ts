import { NextResponse } from 'next/server'

const TRACKER_URL = process.env.TRACKER_SERVICE_URL ?? 'http://localhost:8085'
const DEV_USER_ID = process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001'

export async function POST() {
  try {
    const res = await fetch(`${TRACKER_URL}/tracker/sync`, {
      method: 'POST',
      headers: { 'X-User-Id': DEV_USER_ID },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Tracker service unavailable' }, { status: 503 })
  }
}
