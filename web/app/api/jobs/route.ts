import { NextRequest, NextResponse } from 'next/server'

const MATCHER_URL = process.env.MATCHER_SERVICE_URL ?? 'http://localhost:8083'
const DEV_USER_ID = process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001'

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get('page') ?? '0'
  try {
    const res = await fetch(`${MATCHER_URL}/scores?userId=${DEV_USER_ID}&page=${page}&size=50`, {
      headers: { 'X-User-Id': DEV_USER_ID },
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
