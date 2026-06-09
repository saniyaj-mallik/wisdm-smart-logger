import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const session = await auth();
  if (!session) redirect("/login");

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return new Response("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set", { status: 500 });
  }

  redirect(getGoogleAuthUrl());
}
