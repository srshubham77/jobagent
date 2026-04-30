import { NextResponse } from 'next/server'

const PROFILE_URL = process.env.PROFILE_SERVICE_URL ?? 'http://localhost:8081'
const DEV_USER_ID = process.env.DEV_USER_ID ?? 'f4309bb2-433d-4465-bfba-5cd1472e49d7'

export async function GET() {
  try {
    const res = await fetch(`${PROFILE_URL}/profiles/me`, {
      headers: { 'X-User-Id': DEV_USER_ID },
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json(null, { status: 200 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(null, { status: 200 })
  }
}
