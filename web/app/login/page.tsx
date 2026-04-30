import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import LoginClient from './LoginClient'

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:8086'

export default async function LoginPage() {
  const token = cookies().get('access_token')?.value
  if (token) {
    try {
      const jwks = createRemoteJWKSet(new URL(`${AUTH_URL}/auth/jwks`))
      await jwtVerify(token, jwks)
      redirect('/')
    } catch {
      // Invalid token — show login page
    }
  }
  return <LoginClient />
}
