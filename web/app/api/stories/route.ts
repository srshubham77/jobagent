import { NextRequest, NextResponse } from 'next/server'

const PROFILE_URL = process.env.PROFILE_SERVICE_URL ?? 'http://localhost:8081'
const DEV_USER_ID = process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const res = await fetch(`${PROFILE_URL}/stories`, {
      headers: { 'X-User-Id': DEV_USER_ID },
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${PROFILE_URL}/stories`, {
      method: 'POST',
      headers: { 'X-User-Id': DEV_USER_ID, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Profile service unavailable' }, { status: 503 })
  }
}
