import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";
import { z } from "zod";

const platformAccountSchema = z.object({
  accountHolderName: z.string().min(1, "Account holder name is required").max(200),
  accountNumber: z.string().min(1, "Account number is required").max(100),
  bankName: z.string().min(1, "Bank name is required").max(200),
  branchName: z.string().max(200).optional().or(z.literal("")),
  ifscCode: z.string().max(50).optional().or(z.literal("")),
  swiftCode: z.string().max(50).optional().or(z.literal("")),
  upiId: z.string().max(100).optional().or(z.literal("")),
  additionalInstructions: z.string().max(1000).optional().or(z.literal("")),
});

const SETTINGS_KEY = "platform_bank_account";

// GET /api/admin/platform-settings — Get platform bank account details
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;

  try {
    const setting = await prisma.platformSettings.findUnique({
      where: { key: SETTINGS_KEY },
    });

    return NextResponse.json({
      settings: setting?.value || null,
      updatedBy: setting?.updatedBy || null,
      updatedAt: setting?.updatedAt || null,
    });
  } catch (error) {
    console.error("[PLATFORM_SETTINGS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/platform-settings — Set platform bank account details
export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;

  const permErr = requireAdminPermission(authResult, "escrow.release");
  if (permErr) return permErr;

  try {
    const body = await req.json();
    const parsed = platformAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const setting = await prisma.platformSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: parsed.data,
        updatedBy: authResult.userId,
      },
      update: {
        value: parsed.data,
        updatedBy: authResult.userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: authResult.userId,
        action: "PLATFORM_SETTINGS_UPDATED",
        entity: "PlatformSettings",
        entityId: setting.id,
        metadata: { key: SETTINGS_KEY },
      },
    });

    return NextResponse.json({ message: "Platform account settings updated", settings: setting.value });
  } catch (error) {
    console.error("[PLATFORM_SETTINGS_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
