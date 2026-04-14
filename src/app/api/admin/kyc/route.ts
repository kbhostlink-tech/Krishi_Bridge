import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";
import { getDownloadPresignedUrl } from "@/lib/r2";

// GET /api/admin/kyc — list KYC submissions (admin only)
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;
  const permErr = requireAdminPermission(authResult, "kyc.view");
  if (permErr) return permErr;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "UNDER_REVIEW";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where = status === "ALL"
      ? {}
      : { kycStatus: status as "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          country: true,
          kycStatus: true,
          createdAt: true,
          kycDocuments: {
            select: {
              id: true,
              docType: true,
              docUrl: true,
              remarks: true,
              verifiedAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Generate signed view URLs for docs
    const usersWithUrls = await Promise.all(
      users.map(async (user) => ({
        ...user,
        kycDocuments: await Promise.all(
          user.kycDocuments.map(async (doc) => ({
            ...doc,
            viewUrl: await getDownloadPresignedUrl(doc.docUrl, 3600),
          }))
        ),
      }))
    );

    return NextResponse.json({
      users: usersWithUrls,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[ADMIN_KYC_LIST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
