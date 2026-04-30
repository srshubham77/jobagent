import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/server-auth'

const TRACKER_URL = process.env.TRACKER_SERVICE_URL ?? 'http://localhost:8085'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const res = await fetch(`${TRACKER_URL}/tracker/status`, {
      headers: { 'X-User-Id': userId },
      cache: 'no-store',
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ connected: false, lastEventAt: null, totalEvents: 0 }, { status: 200 })
  }
}
