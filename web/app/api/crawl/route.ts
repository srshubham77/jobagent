import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/server-auth'

const DISCOVERY_URL = process.env.DISCOVERY_SERVICE_URL ?? 'http://localhost:8082'

export async function POST() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const res = await fetch(`${DISCOVERY_URL}/crawl/trigger`, { method: 'POST' })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Discovery service unavailable' }, { status: 503 })
  }
}
