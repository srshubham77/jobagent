import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'

const PROFILE_URL = process.env.PROFILE_SERVICE_URL ?? 'http://localhost:8081'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  try {
    const body = await req.json()
    const res = await fetch(`${PROFILE_URL}/stories/${params.id}`, {
      method: 'PUT',
      headers: { 'X-User-Id': userId, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Profile service unavailable' }, { status: 503 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  try {
    const res = await fetch(`${PROFILE_URL}/stories/${params.id}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': userId },
    })
    return new NextResponse(null, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Profile service unavailable' }, { status: 503 })
  }
}
