import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "OTP",
      credentials: {
        mobile: { label: "Mobile", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const mobile = credentials?.mobile as string;
        const code = credentials?.code as string;

        if (!mobile || !code) return null;

        // بررسی اعتبار کد تایید در دیتابیس
        const validOtp = await prisma.verificationCode.findFirst({
          where: {
            mobile,
            code,
            expiresAt: { gt: new Date() },
          },
        });

        if (!validOtp) return null;

        // حذف کد مصرف‌شده
        await prisma.verificationCode.delete({ where: { id: validOtp.id } });

        // ثبت‌نام یا ورود کاربر
        const user = await prisma.user.upsert({
          where: { mobile },
          update: {},
          create: { mobile },
        });

        return {
          id: user.id,
          name: user.name || user.mobile,
          email: user.email || user.mobile,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "default_secret_for_dev",
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token }) {
      if (token.sub) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            role: true,
            name: true,
            email: true,
            mobile: true,
          },
        });

        token.role = user?.role || "USER";
        token.name = user?.name || user?.mobile || "کاربر AI-Shop";
        token.email = user?.email || undefined;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role || "USER";
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
  },
};
