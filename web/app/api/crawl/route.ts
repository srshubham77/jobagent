import { NextResponse } from 'next/server'

const DISCOVERY_URL = process.env.DISCOVERY_SERVICE_URL ?? 'http://localhost:8082'

export async function POST() {
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
