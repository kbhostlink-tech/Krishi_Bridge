import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["WAREHOUSE_STAFF", "ADMIN"]);
  if (roleCheck) return roleCheck;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const farmers = await prisma.user.findMany({
      where: {
        role: "FARMER",
        isActive: true,
        ...(search.length > 0 && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        country: true,
        kycStatus: true,
      },
      take: 20,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ farmers });
  } catch (error) {
    console.error("[WAREHOUSE_FARMERS]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
