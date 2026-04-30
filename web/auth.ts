import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const PROFILE_URL = process.env.PROFILE_SERVICE_URL ?? 'http://localhost:8081'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async signIn({ user }) {
      try {
        const res = await fetch(`${PROFILE_URL}/users/bootstrap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        })
        if (!res.ok) {
          console.error('bootstrap failed:', res.status, await res.text())
          return false
        }
        const data = await res.json() as { id: string }
        user.id = data.id
        return true
      } catch (err) {
        console.error('bootstrap error:', err)
        return false
      }
    },

    async jwt({ token, user }) {
      if (user?.id) token.userId = user.id
      return token
    },

    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string
      return session
    },
  },
}
