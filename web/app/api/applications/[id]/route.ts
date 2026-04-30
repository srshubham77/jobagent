import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'

const APPLY_URL = process.env.APPLY_SERVICE_URL ?? 'http://localhost:8084'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  try {
    const body = await req.json()
    const res = await fetch(`${APPLY_URL}/applications/${params.id}`, {
      method: 'PATCH',
      headers: { 'X-User-Id': userId, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Apply service unavailable' }, { status: 503 })
  }
}
