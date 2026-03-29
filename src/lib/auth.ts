import { SignJWT, jwtVerify, JWTPayload } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { UserRole, KycStatus, CountryCode } from "@/generated/prisma/client";

// ─── TYPES ───────────────────────────────────

export interface JwtPayload extends JWTPayload {
  userId: string;
  role: UserRole;
  country: CountryCode;
  kycStatus: KycStatus;
}

export interface RefreshPayload extends JWTPayload {
  userId: string;
  tokenVersion: number;
}

export interface AuthUser {
  userId: string;
  role: UserRole;
  country: CountryCode;
  kycStatus: KycStatus;
}

// ─── CONSTANTS ───────────────────────────────

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");
const REFRESH_SECRET = new TextEncoder().encode(process.env.REFRESH_SECRET || "dev-refresh-secret-change-me");
const ACCESS_TOKEN_EXPIRY = "24h";
const REFRESH_TOKEN_EXPIRY = "7d";
const BCRYPT_ROUNDS = 12;

// ─── PASSWORD HELPERS ────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT HELPERS ─────────────────────────────

export async function signAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: Omit<RefreshPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as JwtPayload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshPayload> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload as RefreshPayload;
}

// ─── COOKIE HELPERS ──────────────────────────

export function setRefreshCookie(response: NextResponse, token: string): void {
  response.cookies.set("refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}

export function clearRefreshCookie(response: NextResponse): void {
  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

// ─── MIDDLEWARE HELPERS ──────────────────────

/**
 * Extract and verify the JWT from the Authorization header.
 * Returns the decoded user payload or null.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  try {
    const payload = await verifyAccessToken(token);
    return {
      userId: payload.userId,
      role: payload.role,
      country: payload.country,
      kycStatus: payload.kycStatus,
    };
  } catch {
    return null;
  }
}

/**
 * Require authentication. Returns 401 if not authenticated.
 */
export async function requireAuth(
  req: NextRequest
): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  return user;
}

/**
 * Check if user has one of the allowed roles.
 */
export function checkRole(
  user: AuthUser,
  allowedRoles: UserRole[]
): NextResponse | null {
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Check if user's KYC is approved (for financial actions).
 */
export function checkKycApproved(user: AuthUser): NextResponse | null {
  if (user.kycStatus !== "APPROVED") {
    return NextResponse.json(
      { error: "KYC verification required to perform this action" },
      { status: 403 }
    );
  }
  return null;
}

// ─── OTP HELPERS ─────────────────────────────

export function generateOtp(): string {
  // Generate secure 6-digit OTP using crypto
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}
