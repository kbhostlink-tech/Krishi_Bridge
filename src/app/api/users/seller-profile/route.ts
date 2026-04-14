import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole } from "@/lib/auth";
import { sellerProfileSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["FARMER", "AGGREGATOR"]);
  if (roleCheck) return roleCheck;

  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: authResult.userId },
  });

  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["FARMER", "AGGREGATOR"]);
  if (roleCheck) return roleCheck;

  const body = await req.json();
  const parsed = sellerProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Clean empty strings to null
  const cleanData = {
    sellerType: data.sellerType,
    entityName: data.entityName || null,
    contactPersonName: data.contactPersonName || null,
    mobile: data.mobile || null,
    languagePreference: data.languagePreference || null,
    state: data.state || null,
    district: data.district || null,
    village: data.village || null,
    registrationId: data.registrationId || null,
    fpoName: data.fpoName || null,
    yearsOfActivity: data.yearsOfActivity ?? null,
    typicalAnnualVolume: data.typicalAnnualVolume ?? null,
    originRegion: data.originRegion || null,
    harvestSeason: data.harvestSeason || null,
    postHarvestProcess: data.postHarvestProcess || null,
    indicativePriceExpectation: data.indicativePriceExpectation ?? null,
    minAcceptableQuantity: data.minAcceptableQuantity ?? null,
    willingToNegotiate: data.willingToNegotiate ?? true,
    bankAccountName: data.bankAccountName || null,
    bankAccountNumber: data.bankAccountNumber || null,
    bankName: data.bankName || null,
    bankBranch: data.bankBranch || null,
    bankIfscCode: data.bankIfscCode || null,
  };

  const profile = await prisma.$transaction(async (tx) => {
    const result = await tx.sellerProfile.upsert({
      where: { userId: authResult.userId },
      create: {
        userId: authResult.userId,
        ...cleanData,
      },
      update: cleanData,
    });

    // Mark onboarding as complete when seller profile is first saved
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
