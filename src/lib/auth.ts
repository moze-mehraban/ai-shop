import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MOBILE_PATTERN, normalizeDigits, normalizeMobile } from "@/lib/digits";
import { prisma } from "@/lib/prisma";

const MAX_OTP_ATTEMPTS = 5;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "OTP",
      credentials: {
        mobile: { label: "Mobile", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const mobile = normalizeMobile(String(credentials?.mobile ?? ""));
        const code = normalizeDigits(String(credentials?.code ?? "")).trim();

        if (!MOBILE_PATTERN.test(mobile) || !/^\d{5}$/.test(code)) return null;

        // فقط آخرین کد فعال این شماره بررسی می‌شود
        const activeOtp = await prisma.verificationCode.findFirst({
          where: { mobile, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        });

        if (!activeOtp) return null;

        if (activeOtp.code !== code) {
          // بعد از ۵ تلاش اشتباه، کد باطل می‌شود
          await prisma.verificationCode.update({
            where: { id: activeOtp.id },
            data:
              activeOtp.attempts + 1 >= MAX_OTP_ATTEMPTS
                ? { attempts: { increment: 1 }, expiresAt: new Date() }
                : { attempts: { increment: 1 } },
          });
          return null;
        }

        // کد مصرف‌شده باطل می‌شود (رکورد برای محدودیت ساعتی باقی می‌ماند)
        await prisma.verificationCode.update({
          where: { id: activeOtp.id },
          data: { expiresAt: new Date() },
        });

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
  // در محیط production حتماً باید NEXTAUTH_SECRET تنظیم شود
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : "default_secret_for_dev"),
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
        token.name = user?.name || user?.mobile || "کاربر";
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
