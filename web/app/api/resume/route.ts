import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'

const PROFILE_URL = process.env.PROFILE_SERVICE_URL ?? 'http://localhost:8081'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  try {
    // Forward the multipart form data directly to the profile service
    const formData = await req.formData()
    const res = await fetch(`${PROFILE_URL}/profiles/me/resume`, {
      method: 'POST',
      headers: { 'X-User-Id': userId },
      body: formData,
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Profile service unavailable' }, { status: 503 })
  }
}
