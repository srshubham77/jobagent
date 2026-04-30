import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/server-auth'

const PROFILE_URL = process.env.PROFILE_SERVICE_URL ?? 'http://localhost:8081'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json(null, { status: 401 })

  try {
    const res = await fetch(`${PROFILE_URL}/profiles/me`, {
      headers: { 'X-User-Id': userId },
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json(null, { status: 200 })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json(null, { status: 200 })
  }
}
