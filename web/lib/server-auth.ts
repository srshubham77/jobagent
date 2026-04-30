import { jwtVerify, createRemoteJWKSet } from 'jose'
import { cookies } from 'next/headers'

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJWKS() {
  // Evaluated at call time so Docker runtime env vars are used
  const AUTH_URL = process.env['AUTH_SERVICE_URL'] ?? 'http://localhost:8086'
  if (!jwks) jwks = createRemoteJWKSet(new URL(`${AUTH_URL}/auth/jwks`))
  return jwks
}

export async function getUserId(): Promise<string | null> {
  const token = cookies().get('access_token')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getJWKS())
    return (payload.sub as string) ?? null
  } catch {
    return null
  }
}

export async function getUserClaims(): Promise<{ userId: string; email?: string; name?: string } | null> {
  const token = cookies().get('access_token')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getJWKS())
    if (!payload.sub) return null
    return {
      userId: payload.sub as string,
      email:  payload['email'] as string | undefined,
      name:   payload['name'] as string | undefined,
    }
  } catch {
    return null
  }
}
