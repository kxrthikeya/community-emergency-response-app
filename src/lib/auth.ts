import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyOTP } from "@/lib/otp-store";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      id: "phone",
      name: "Phone",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phoneNumber || !credentials?.otp) {
          return null;
        }

        // Verify OTP using the OTP store
        const isValid = verifyOTP(credentials.phoneNumber, credentials.otp);
        
        if (!isValid) {
          return null;
        }

        // Find or create user
        let user = await db
          .select()
          .from(users)
          .where(eq(users.phoneNumber, credentials.phoneNumber))
          .limit(1);

        if (user.length === 0) {
          const newUser = await db
            .insert(users)
            .values({
              phoneNumber: credentials.phoneNumber,
              role: "citizen",
              isGuest: false,
              createdAt: new Date().toISOString(),
            })
            .returning();
          user = newUser;
        }

        return {
          id: user[0].id.toString(),
          phoneNumber: user[0].phoneNumber,
          name: user[0].name,
          role: user[0].role,
        };
      },
    }),
    CredentialsProvider({
      id: "guest",
      name: "Guest",
      credentials: {},
      async authorize() {
        // Create guest user
        const guestUser = await db
          .insert(users)
          .values({
            name: `Guest ${Date.now()}`,
            role: "citizen",
            isGuest: true,
            createdAt: new Date().toISOString(),
          })
          .returning();

        return {
          id: guestUser[0].id.toString(),
          name: guestUser[0].name,
          role: guestUser[0].role,
          isGuest: true,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Find or create user with Google
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.googleId, account.providerAccountId))
          .limit(1);

        if (existingUser.length === 0) {
          await db.insert(users).values({
            googleId: account.providerAccountId,
            email: user.email,
            name: user.name,
            role: "citizen",
            isGuest: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.phoneNumber = user.phoneNumber;
        token.isGuest = user.isGuest;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.phoneNumber = token.phoneNumber as string;
        session.user.isGuest = token.isGuest as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
};