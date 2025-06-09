import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { JWT } from 'next-auth/jwt'
import type { Session, User } from 'next-auth'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'admin@recoverymail.com'
        },
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: 'admin123'
        }
      },
      async authorize(credentials) {
        // Validação básica para MVP - hardcoded para desenvolvimento
        if (credentials?.email === 'admin@recoverymail.com' && 
            credentials?.password === 'admin123') {
          return {
            id: '1',
            email: 'admin@recoverymail.com',
            name: 'Admin Recovery',
            organizationId: 'test-org-123'
          }
        }
        
        // Alternativa para testes
        if (credentials?.email === 'demo@recoverymail.com' && 
            credentials?.password === 'demo123') {
          return {
            id: '2',
            email: 'demo@recoverymail.com',
            name: 'Demo User',
            organizationId: 'test-org-123'
          }
        }
        
        return null
      },
    }),
  ],
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.organizationId = user.organizationId
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        (session.user as any).id = token.sub!
        ;(session.user as any).organizationId = token.organizationId as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
