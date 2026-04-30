import { NextRequest, NextResponse } from 'next/server'

const PROFILE_URL = process.env.PROFILE_SERVICE_URL ?? 'http://localhost:8081'
const DEV_USER_ID = process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001'

export async function POST(req: NextRequest) {
  try {
    // Forward the multipart form data directly to the profile service
    const formData = await req.formData()
    const res = await fetch(`${PROFILE_URL}/profiles/me/resume`, {
      method: 'POST',
      headers: { 'X-User-Id': DEV_USER_ID },
      body: formData,
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Profile service unavailable' }, { status: 503 })
  }
}
