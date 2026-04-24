import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const user = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      country: true,
      preferredCurrency: true,
      preferredLang: true,
      kycStatus: true,
      emailVerified: true,
      onboardingComplete: true,
      isActive: true,
      adminRole: true,
      uniquePaymentCode: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, phone, preferredLang } = parsed.data;

  // Build update data — only include fields that were provided
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone || null;
  if (preferredLang !== undefined) updateData.preferredLang = preferredLang;

  const user = await prisma.user.update({
    where: { id: authResult.userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      adminRole: true,
      country: true,
      preferredCurrency: true,
      preferredLang: true,
      kycStatus: true,
      emailVerified: true,
    },
  });

  return NextResponse.json({ user });
}

