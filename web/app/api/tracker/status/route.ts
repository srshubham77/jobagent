import { NextResponse } from 'next/server'

const TRACKER_URL = process.env.TRACKER_SERVICE_URL ?? 'http://localhost:8085'
const DEV_USER_ID = process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const res = await fetch(`${TRACKER_URL}/tracker/status`, {
      headers: { 'X-User-Id': DEV_USER_ID },
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ connected: false, lastEventAt: null, totalEvents: 0 }, { status: 200 })
  }
}
