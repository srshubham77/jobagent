import { NextRequest, NextResponse } from 'next/server'

const APPLY_URL = process.env.APPLY_SERVICE_URL ?? 'http://localhost:8084'
const DEV_USER_ID = process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const res = await fetch(`${APPLY_URL}/applications/${params.id}`, {
      method: 'PATCH',
      headers: { 'X-User-Id': DEV_USER_ID, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Apply service unavailable' }, { status: 503 })
  }
}
