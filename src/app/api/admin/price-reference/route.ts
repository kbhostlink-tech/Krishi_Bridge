import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkAdminPermission } from "@/lib/auth";
import { calculateReferenceBand } from "@/lib/price-reference";

// GET /api/admin/price-reference?commodity=LARGE_CARDAMOM&grade=A&country=IN
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    if (!checkAdminPermission(authResult, "rfq.set_terms") && !checkAdminPermission(authResult, "rfq.view")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const commodity = searchParams.get("commodity");
    const grade = searchParams.get("grade");
    const country = searchParams.get("country");

    if (!commodity) {
      return NextResponse.json(
        { error: "commodity parameter is required" },
        { status: 400 }
      );
    }

    const band = await calculateReferenceBand(commodity, grade, country);

    return NextResponse.json({
      commodity,
      grade: grade || null,
      country: country || null,
      band,
      notice: band
        ? "Reference band is advisory only. Admin must not use it to influence pricing or privilege any party."
        : "Insufficient data to calculate reference band (minimum 5 samples needed).",
    });
  } catch (error) {
    console.error("[ADMIN_PRICE_REFERENCE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
