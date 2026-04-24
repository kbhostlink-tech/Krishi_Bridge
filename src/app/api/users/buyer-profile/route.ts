import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole } from "@/lib/auth";
import { buyerProfileSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["BUYER"]);
  if (roleCheck) return roleCheck;

  const profile = await prisma.buyerProfile.findUnique({
    where: { userId: authResult.userId },
  });

  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["BUYER"]);
  if (roleCheck) return roleCheck;

  const body = await req.json();
  const parsed = buyerProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Clean empty strings to null
  const cleanData = {
    companyName: data.companyName,
    tradeName: data.tradeName || null,
    buyerType: data.buyerType,
    fullAddress: data.fullAddress,
    city: data.city || null,
    website: data.website || null,
    contactDesignation: data.contactDesignation || null,
    alternateContact: data.alternateContact || null,
    mobile: data.mobile || null,
    registrationNumber: data.registrationNumber || null,
    taxId: data.taxId || null,
    importExportLicense: data.importExportLicense || null,
    yearsInBusiness: data.yearsInBusiness ?? null,
    typicalMonthlyVolumeMin: data.typicalMonthlyVolumeMin ?? null,
    typicalMonthlyVolumeMax: data.typicalMonthlyVolumeMax ?? null,
    preferredOrigins: data.preferredOrigins || [],
    preferredGrades: data.preferredGrades || [],
    packagingPreference: data.packagingPreference || null,
  };

  const profile = await prisma.$transaction(async (tx) => {
    const result = await tx.buyerProfile.upsert({
      where: { userId: authResult.userId },
      create: {
        userId: authResult.userId,
        ...cleanData,
      },
      update: cleanData,
    });

    // Mark onboarding as complete when buyer profile is first saved
    const user = await tx.user.findUnique({
      where: { id: authResult.userId },
      select: { onboardingComplete: true },
    });
    if (!user?.onboardingComplete) {
      await tx.user.update({
        where: { id: authResult.userId },
        data: { onboardingComplete: true },
      });
    }

    return result;
  });

  return NextResponse.json({ profile });
}

