import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";

type NotifyRfqEditParams = {
  rfqId: string;
  buyerId: string;
  sellerId: string;
  commodityType: string;
  notifyBuyer: boolean;
  notifySeller: boolean;
};

export async function notifyRfqEditRecipients({
  rfqId,
  buyerId,
  sellerId,
  commodityType,
  notifyBuyer,
  notifySeller,
}: NotifyRfqEditParams) {
  const commodity = commodityType.replace(/_/g, " ");
  const title = "RFQ updated by platform";
  const body = `An admin has updated content on your ${commodity} RFQ. Please review the latest terms on the platform.`;
  const link = `/rfq/${rfqId}`;

  const recipients: string[] = [];
  if (notifyBuyer) recipients.push(buyerId);
  if (notifySeller) recipients.push(sellerId);

  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      type: "IN_APP" as const,
      title,
      body,
      data: { rfqId },
    })),
  });

  await Promise.all(
    recipients.map((userId) =>
      notifyUser({
        userId,
        event: "RFQ_COUNTER_OFFER",
        title,
        body,
        data: { rfqId, commodityType: commodity },
        channels: ["push"],
        link,
      })
    )
  );
}

export async function loadAdminRfqResponseContext(rfqId: string, responseId: string) {
  const [rfq, response] = await Promise.all([
    prisma.rfqRequest.findUnique({
      where: { id: rfqId },
      select: { id: true, buyerId: true, commodityType: true },
    }),
    prisma.rfqResponse.findUnique({
      where: { id: responseId },
      select: {
        id: true,
        rfqId: true,
        sellerId: true,
        adminForwarded: true,
        offeredPriceInr: true,
        adminEditedPriceInr: true,
        currency: true,
        deliveryDays: true,
        notes: true,
      },
    }),
  ]);

  if (!rfq || !response || response.rfqId !== rfqId) {
    return null;
  }

  return { rfq, response };
}
