import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkKycApproved } from "@/lib/auth";
import { tokenTransferSchema } from "@/lib/validations";
import { generateTokenHmac } from "@/lib/token-utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyUser } from "@/lib/notifications";
import { formatMoney, BASE_CURRENCY } from "@/lib/currency";

interface RouteParams {
  params: Promise<{ tokenId: string }>;
}

// POST /api/tokens/[tokenId]/transfer — Transfer token to another user
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const kycCheck = checkKycApproved(authResult);
    if (kycCheck) return kycCheck;

    // Rate limit: 10 transfers per hour per user
    const rateLimit = checkRateLimit(`token_transfer:${authResult.userId}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many transfer attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { tokenId } = await params;

    const body = await req.json();
    const parsed = tokenTransferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { toEmail, priceInr } = parsed.data;

    // Find recipient
    const recipient = await prisma.user.findUnique({
      where: { email: toEmail },
      select: { id: true, name: true, email: true, kycStatus: true },
    });

    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found. They must have an account." }, { status: 404 });
    }

    if (recipient.id === authResult.userId) {
      return NextResponse.json({ error: "Cannot transfer to yourself" }, { status: 400 });
    }

    if (recipient.kycStatus !== "APPROVED") {
      return NextResponse.json({ error: "Recipient must have approved KYC" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const token = await tx.token.findUnique({
        where: { id: tokenId },
        select: { id: true, ownerId: true, lotId: true, status: true, mintedAt: true, expiresAt: true },
      });

      if (!token) throw new Error("TOKEN_NOT_FOUND");
      if (token.ownerId !== authResult.userId) throw new Error("NOT_OWNER");
      if (token.status !== "ACTIVE") throw new Error("NOT_ACTIVE");
      if (new Date() > token.expiresAt) {
        throw new Error("TOKEN_EXPIRED");
      }

      // Create transfer record
      const transfer = await tx.tokenTransfer.create({
        data: {
          tokenId: token.id,
          fromUserId: authResult.userId,
          toUserId: recipient.id,
          priceInr,
        },
      });

      // Re-mint HMAC with new owner
      const newMintedAt = new Date().toISOString();
      const newHmac = generateTokenHmac({
        lotId: token.lotId,
        ownerId: recipient.id,
        mintedAt: newMintedAt,
      });

      // Update token ownership
      await tx.token.update({
        where: { id: tokenId },
        data: {
          ownerId: recipient.id,
          hmacHash: newHmac,
          status: "ACTIVE", // remains active for new owner
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "TOKEN_TRANSFERRED",
          entity: "Token",
          entityId: tokenId,
          metadata: {
            fromUserId: authResult.userId,
            toUserId: recipient.id,
            priceInr,
            transferId: transfer.id,
          },
        },
      });

      // In-app notifications (inside transaction for atomicity)
      await tx.notification.createMany({
        data: [
          {
            userId: authResult.userId,
            type: "IN_APP" as const,
            title: "Token transferred",
            body: `Your token has been transferred to ${recipient.name}. ${priceInr ? `Sale price: ${formatMoney(priceInr, BASE_CURRENCY)}` : ""}`,
            data: { tokenId, transferId: transfer.id },
          },
          {
            userId: recipient.id,
            type: "IN_APP" as const,
            title: "Token received!",
            body: "A commodity token has been transferred to you. View it in your token dashboard.",
            data: { tokenId, transferId: transfer.id },
          },
        ],
      });

      // Fetch lot info for email templates
      const lotInfo = token.lotId
        ? await tx.lot.findUnique({
            where: { id: token.lotId },
            select: { lotNumber: true, commodityType: true },
          })
        : null;

      return {
        transferId: transfer.id,
        newOwner: recipient.name,
        recipientId: recipient.id,
        senderId: authResult.userId,
        senderName: "", // Filled from auth context if available
        lotNumber: lotInfo?.lotNumber || "N/A",
        commodityType: lotInfo?.commodityType || "commodity",
        priceInr,
      };
    });

    // Fire-and-forget: email + push for sender (in-app already in transaction)
    const priceNote = result.priceInr
      ? `Sale price: ${formatMoney(Number(result.priceInr), BASE_CURRENCY)}`
      : "";
    notifyUser({
      userId: result.senderId,
      event: "TOKEN_TRANSFERRED",
      title: "Token transferred",
      body: `Your token for lot ${result.lotNumber} has been transferred to ${result.newOwner}.`,
      data: {
        tokenId,
        transferId: result.transferId,
        lotNumber: result.lotNumber,
        recipientName: result.newOwner,
        priceNote,
      },
      channels: ["email", "push"],
      link: "/dashboard/my-tokens",
    });

    // Email + push for recipient
    notifyUser({
      userId: result.recipientId,
      event: "TOKEN_RECEIVED",
      title: "Token received!",
      body: `A commodity token for lot ${result.lotNumber} (${result.commodityType}) has been transferred to you.`,
      data: {
        tokenId,
        transferId: result.transferId,
        lotNumber: result.lotNumber,
        commodityType: result.commodityType,
        senderName: "another user",
      },
      channels: ["email", "push"],
      link: "/dashboard/my-tokens",
    });

    return NextResponse.json({
      message: "Token transferred successfully",
      transferId: result.transferId,
      newOwner: result.newOwner,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const errorMap: Record<string, { msg: string; code: number }> = {
      TOKEN_NOT_FOUND: { msg: "Token not found", code: 404 },
      NOT_OWNER: { msg: "You are not the owner of this token", code: 403 },
      NOT_ACTIVE: { msg: "Token is not in active status", code: 400 },
      TOKEN_EXPIRED: { msg: "Token has expired", code: 400 },
    };

    const mapped = errorMap[message];
    if (mapped) {
      return NextResponse.json({ error: mapped.msg }, { status: mapped.code });
    }

    console.error("[TOKEN_TRANSFER]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
