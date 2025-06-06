import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Tentar fazer login na API do backend
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            throw new Error('Backend not available');
          }

          const data = await response.json();
          
          if (!data.success) {
            return null;
          }

          return {
            id: data.data.user.id,
            email: data.data.user.email,
            name: data.data.user.name,
            accessToken: data.data.token,
          };
        } catch (error) {
          console.warn('Backend not available, using mock authentication:', error);
          
          // Fallback para autenticação mock quando backend não estiver disponível
          if (credentials.email === 'admin@inboxrecovery.com' && credentials.password === 'admin123') {
            return {
              id: 'mock-user-id',
              email: credentials.email,
              name: 'Admin Recovery',
              accessToken: 'mock-jwt-token',
            };
          }
          
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
}; 