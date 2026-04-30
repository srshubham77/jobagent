import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/server-auth'

const APPLY_URL = process.env.APPLY_SERVICE_URL ?? 'http://localhost:8084'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const res = await fetch(`${APPLY_URL}/applications`, {
      headers: { 'X-User-Id': userId },
      cache: 'no-store',
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
