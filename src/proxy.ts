import { NextResponse } from "next/server";
import { requireDemoAccess } from "@/lib/demo-access";

export async function proxy(request: Request) {
  const response = (await requireDemoAccess(request)) ?? NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Vary", "Authorization");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export const config = { matcher: "/:path*" };
