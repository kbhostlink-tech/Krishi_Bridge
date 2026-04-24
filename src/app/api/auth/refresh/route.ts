import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const refreshCookie = req.cookies.get("refresh_token");

    if (!refreshCookie?.value) {
      return NextResponse.json(
        { error: "No refresh token" },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = await verifyRefreshToken(refreshCookie.value);
    } catch {
      const response = NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
      clearRefreshCookie(response);
      return response;
    }

    // Find user and verify tokenVersion
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      const response = NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
      clearRefreshCookie(response);
      return response;
    }

    // Token version mismatch → stolen token detected, revoke all sessions
    if (user.tokenVersion !== payload.tokenVersion) {
      // Increment tokenVersion to invalidate ALL refresh tokens for this user
      await prisma.user.update({
        where: { id: user.id },
        data: { tokenVersion: { increment: 1 } },
      });

      const response = NextResponse.json(
        { error: "Token revoked. Please log in again." },
        { status: 401 }
      );
      clearRefreshCookie(response);
      return response;
    }

    // Rotate: increment tokenVersion and issue new tokens
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 } },
    });

    const accessToken = await signAccessToken({
      userId: user.id,
      role: user.role,
      adminRole: user.adminRole,
      country: user.country,
      kycStatus: user.kycStatus,
    });

    const newRefreshToken = await signRefreshToken({
      userId: user.id,
      tokenVersion: updatedUser.tokenVersion,
    });

    const response = NextResponse.json({ accessToken });
    setRefreshCookie(response, newRefreshToken);

    return response;
  } catch (error) {
    console.error("[REFRESH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

