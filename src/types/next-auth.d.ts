import { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
    authMethod?: "otp" | "password";
    authAt?: number;
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    authMethod?: "otp" | "password";
    authAt?: number;
  }
}
