import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;

  const AUTH_ROUTES = ["/login", "/register"];
  const PROTECTED = [
    "/dashboard",
    "/logs",
    "/projects",
    "/reports",
    "/profile",
    "/admin",
  ];

  const isAuthRoute = AUTH_ROUTES.some((r) => path.startsWith(r));
  const isProtected = PROTECTED.some((p) => path.startsWith(p));

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/logs/:path*",
    "/projects/:path*",
    "/reports/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
