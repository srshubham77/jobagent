import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/server-auth'

const APPLY_URL = process.env.APPLY_SERVICE_URL ?? 'http://localhost:8084'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const res = await fetch(`${APPLY_URL}/applications/${params.id}`, {
      method: 'PATCH',
      headers: { 'X-User-Id': userId, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Apply service unavailable' }, { status: 503 })
  }
}
