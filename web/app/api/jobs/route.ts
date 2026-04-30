import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/server-auth'

const MATCHER_URL = process.env.MATCHER_SERVICE_URL ?? 'http://localhost:8083'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const res = await fetch(`${MATCHER_URL}/match/feed`, {
      headers: { 'X-User-Id': userId },
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json([], { status: 200 })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
