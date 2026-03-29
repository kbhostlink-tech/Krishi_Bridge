import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { warehouseIntakeSchema } from "@/lib/validations";
import { uploadToR2, buildR2Key } from "@/lib/r2";
import {
  generateLotNumber,
  generateHmacSignature,
  generateQrCodeBuffer,
  type QrPayload,
} from "@/lib/lot-utils";

export async function POST(req: NextRequest) {
  // 1. Auth — only WAREHOUSE_STAFF and ADMIN
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["WAREHOUSE_STAFF", "ADMIN"]);
  if (roleCheck) return roleCheck;

  try {
    const body = await req.json();
    const parsed = warehouseIntakeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 2. Verify farmer exists and has FARMER role
    const farmer = await prisma.user.findUnique({
      where: { id: data.farmerId },
      select: { id: true, role: true, name: true },
    });

    if (!farmer || farmer.role !== "FARMER") {
      return NextResponse.json(
        { error: "Invalid farmer. User must have FARMER role." },
        { status: 400 }
      );
    }

    // 3. Verify warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouseId },
      select: { id: true, name: true, isActive: true },
    });

    if (!warehouse || !warehouse.isActive) {
      return NextResponse.json(
        { error: "Invalid or inactive warehouse" },
        { status: 400 }
      );
    }

    // 4. Generate unique lot number (retry up to 5 times for uniqueness)
    let lotNumber = "";
    for (let i = 0; i < 5; i++) {
      lotNumber = generateLotNumber(data.commodityType, data.origin.state);
      const existing = await prisma.lot.findUnique({ where: { lotNumber } });
      if (!existing) break;
      if (i === 4) {
        return NextResponse.json(
          { error: "Failed to generate unique lot number. Please retry." },
          { status: 500 }
        );
      }
    }

    // 5. Create Lot + QualityCheck in a fast transaction (DB only — no file I/O to avoid timeout)
    const { lot, qualityCheck } = await prisma.$transaction(async (tx) => {
      const lot = await tx.lot.create({
        data: {
          lotNumber,
          farmerId: data.farmerId,
          warehouseId: data.warehouseId,
          commodityType: data.commodityType,
          grade: data.grade,
          quantityKg: data.quantityKg,
          description: data.description || null,
          images: [],
          origin: data.origin,
          status: "INTAKE",
          listingMode: "AUCTION",
        },
      });

      const qualityCheck = await tx.qualityCheck.create({
        data: {
          lotId: lot.id,
          moisturePct: data.moisturePct ?? null,
          podSizeMm: data.podSizeMm ?? null,
          colourGrade: data.colourGrade ?? null,
          inspectedBy: authResult.userId,
          notes: data.inspectorNotes ?? null,
        },
      });

      return { lot, qualityCheck };
    });

    // 6. Generate and upload QR code OUTSIDE the transaction (prevents 5s timeout)
    const qrPayload: QrPayload = {
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      commodityType: data.commodityType,
      grade: data.grade,
      quantityKg: Number(data.quantityKg),
      warehouseId: data.warehouseId,
    };

    const hmacSignature = generateHmacSignature(qrPayload);
    const qrBuffer = await generateQrCodeBuffer(qrPayload, hmacSignature);
    const qrKey = buildR2Key("qr-codes", lot.id, `${lotNumber}.png`);
    await uploadToR2(qrKey, qrBuffer, "image/png");

    // 7. Create QrCode record + audit log (fast DB ops, no transaction needed)
    const [qrCode] = await Promise.all([
      prisma.qrCode.create({
        data: {
          lotId: lot.id,
          qrData: JSON.stringify({ ...qrPayload, signature: hmacSignature }),
          qrImageUrl: qrKey,
          hmacSignature,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "LOT_INTAKE",
          entity: "Lot",
          entityId: lot.id,
          metadata: {
            lotNumber,
            farmerId: data.farmerId,
            commodityType: data.commodityType,
            grade: data.grade,
            quantityKg: data.quantityKg,
            warehouseId: data.warehouseId,
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        },
      }),
    ]);

    return NextResponse.json(
      {
        lot: {
          id: lot.id,
          lotNumber: lot.lotNumber,
          commodityType: lot.commodityType,
          grade: lot.grade,
          quantityKg: lot.quantityKg,
          status: lot.status,
          origin: lot.origin,
          createdAt: lot.createdAt,
        },
        qualityCheck: {
          id: qualityCheck.id,
          moisturePct: qualityCheck.moisturePct,
          podSizeMm: qualityCheck.podSizeMm,
          colourGrade: qualityCheck.colourGrade,
        },
        qrCode: {
          id: qrCode.id,
          qrImageUrl: qrCode.qrImageUrl,
          hmacSignature: qrCode.hmacSignature,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[WAREHOUSE_INTAKE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
