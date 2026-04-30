import { NextRequest, NextResponse } from 'next/server'

const PROFILE_URL = process.env.PROFILE_SERVICE_URL ?? 'http://localhost:8081'
const DEV_USER_ID = process.env.DEV_USER_ID ?? 'f4309bb2-433d-4465-bfba-5cd1472e49d7'

export async function GET() {
  try {
    const res = await fetch(`${PROFILE_URL}/preferences`, {
      headers: { 'X-User-Id': DEV_USER_ID },
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Profile service unavailable' }, { status: 503 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${PROFILE_URL}/preferences`, {
      method: 'PUT',
      headers: { 'X-User-Id': DEV_USER_ID, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Profile service unavailable' }, { status: 503 })
  }
}
