import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;

  const PROTECTED = [
    "/dashboard",
    "/logs",
    "/projects",
    "/reports",
    "/profile",
    "/admin",
  ];
  const isProtected = PROTECTED.some((p) => path.startsWith(p));

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/logs/:path*",
    "/projects/:path*",
    "/reports/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
