import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, clearRefreshCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);

    // Even if token is invalid, clear the cookie
    if (user) {
      // Increment tokenVersion to invalidate all refresh tokens
      await prisma.user.update({
        where: { id: user.userId },
        data: { tokenVersion: { increment: 1 } },
      });
    }

    const response = NextResponse.json({ message: "Logged out" });
    clearRefreshCookie(response);

    return response;
  } catch (error) {
    console.error("[LOGOUT]", error);
    // Still clear cookie even on error
    const response = NextResponse.json({ message: "Logged out" });
    clearRefreshCookie(response);
    return response;
  }
}
