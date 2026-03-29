import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getDownloadPresignedUrl } from "@/lib/r2";

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Large Cardamom", TEA: "Tea", GINGER: "Ginger",
  TURMERIC: "Turmeric", PEPPER: "Pepper", COFFEE: "Coffee",
  SAFFRON: "Saffron", ARECA_NUT: "Areca Nut", CINNAMON: "Cinnamon", OTHER: "Other",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lotId: string; locale: string }>;
}): Promise<Metadata> {
  const { lotId } = await params;

  try {
    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      select: {
        lotNumber: true,
        commodityType: true,
        grade: true,
        quantityKg: true,
        description: true,
        images: true,
        origin: true,
        startingPriceUsd: true,
        farmer: { select: { name: true } },
      },
    });

    if (!lot) {
      return {
        title: "Lot Not Found — AgriExchange",
        description: "This commodity lot could not be found.",
      };
    }

    const commodityName = COMMODITY_LABELS[lot.commodityType] || lot.commodityType;
    const title = `${commodityName} — Grade ${lot.grade} — ${lot.lotNumber} | AgriExchange`;
    const description = lot.description
      || `${Number(lot.quantityKg).toLocaleString()} kg of Grade ${lot.grade} ${commodityName} from ${lot.farmer.name}. Available on AgriExchange.`;

    let ogImage: string | undefined;
    if (lot.images.length > 0) {
      try {
        ogImage = await getDownloadPresignedUrl(lot.images[0], 86400);
      } catch {
        // fallback — no image
      }
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: `${commodityName} — ${lot.lotNumber}` }] } : {}),
      },
      twitter: {
        card: ogImage ? "summary_large_image" : "summary",
        title,
        description,
        ...(ogImage ? { images: [ogImage] } : {}),
      },
    };
  } catch {
    return {
      title: "Lot Detail — AgriExchange",
      description: "View commodity lot details on AgriExchange.",
    };
  }
}

export default function LotDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
