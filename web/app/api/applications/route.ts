import { NextResponse } from 'next/server'

const APPLY_URL = process.env.APPLY_SERVICE_URL ?? 'http://localhost:8084'
const DEV_USER_ID = process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const res = await fetch(`${APPLY_URL}/applications`, {
      headers: { 'X-User-Id': DEV_USER_ID },
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
