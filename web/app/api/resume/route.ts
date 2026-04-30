import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/server-auth'

const PROFILE_URL = process.env.PROFILE_SERVICE_URL ?? 'http://localhost:8081'

export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Forward the multipart form data directly to the profile service
    const formData = await req.formData()
    const res = await fetch(`${PROFILE_URL}/profiles/me/resume`, {
      method: 'POST',
      headers: { 'X-User-Id': userId },
      body: formData,
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Profile service unavailable' }, { status: 503 })
  }
}
