import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'

const DISCOVERY_URL = process.env.DISCOVERY_SERVICE_URL ?? 'http://localhost:8082'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const res = await fetch(`${DISCOVERY_URL}/crawl/trigger`, {
      method: 'POST',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Discovery service unavailable' }, { status: 503 })
  }
}
