import crypto from "crypto";
import type { CountryCode, CurrencyCode, PaymentMethod } from "@/generated/prisma/client";

// ─── GATEWAY INTERFACE ───────────────────────

export interface CreateOrderParams {
  transactionId: string;
  amount: number;        // in local currency
  currency: CurrencyCode;
  description: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  returnUrl: string;     // redirect after payment
  webhookUrl: string;    // server-to-server callback
}

export interface CreateOrderResult {
  gatewayOrderId: string;
  redirectUrl: string | null;  // null for manual flows (bank transfer)
  paymentMethod: PaymentMethod;
  metadata?: Record<string, string>;
}

export interface WebhookVerifyResult {
  verified: boolean;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  status: "success" | "failed";
  amount?: number;
  currency?: string;
}

export interface PaymentGateway {
  name: string;
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyWebhook(headers: Record<string, string>, body: string): WebhookVerifyResult;
}

// ─── RAZORPAY (India) ────────────────────────

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

export const razorpayGateway: PaymentGateway = {
  name: "razorpay",

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    // Amount in smallest currency unit (paise for INR)
    const amountInPaise = Math.round(params.amount * 100);

    const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: params.currency,
        receipt: params.transactionId,
        notes: {
          transactionId: params.transactionId,
          buyerEmail: params.buyerEmail,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Razorpay order creation failed: ${text}`);
    }

    const order = await response.json();

    // Razorpay uses client-side checkout — return order details for the frontend
    return {
      gatewayOrderId: order.id,
      redirectUrl: null, // Client-side checkout modal
      paymentMethod: "UPI",
      metadata: {
        razorpayKeyId: RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: String(amountInPaise),
        currency: params.currency,
      },
    };
  },

  verifyWebhook(headers: Record<string, string>, body: string): WebhookVerifyResult {
    const signature = headers["x-razorpay-signature"] || "";
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    const verified = signature.length > 0 && crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    const parsed = JSON.parse(body);
    const payment = parsed?.payload?.payment?.entity || {};

    return {
      verified,
      gatewayOrderId: payment.order_id || "",
      gatewayPaymentId: payment.id || "",
      status: payment.status === "captured" ? "success" : "failed",
      amount: payment.amount ? payment.amount / 100 : undefined,
      currency: payment.currency,
    };
  },
};

// ─── STRIPE (UAE) ─────────────────────────────

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export const stripeGateway: PaymentGateway = {
  name: "stripe",

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const amountInFils = Math.round(params.amount * 100);

    const body = new URLSearchParams({
      amount: String(amountInFils),
      currency: params.currency.toLowerCase(),
      "metadata[transactionId]": params.transactionId,
      "metadata[buyerEmail]": params.buyerEmail,
      "payment_method_types[]": "card",
    });

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "line_items[0][price_data][currency]": params.currency.toLowerCase(),
        "line_items[0][price_data][product_data][name]": params.description,
        "line_items[0][price_data][unit_amount]": String(amountInFils),
        "line_items[0][quantity]": "1",
        mode: "payment",
        success_url: `${params.returnUrl}?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${params.returnUrl}?status=cancelled`,
        "metadata[transactionId]": params.transactionId,
        customer_email: params.buyerEmail,
      }).toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Stripe session creation failed: ${text}`);
    }

    const session = await response.json();

    return {
      gatewayOrderId: session.id,
      redirectUrl: session.url,
      paymentMethod: "STRIPE",
    };
  },

  verifyWebhook(headers: Record<string, string>, body: string): WebhookVerifyResult {
    const signature = headers["stripe-signature"] || "";
    // Stripe webhook signature verification (simplified — uses t=timestamp,v1=signature)
    const elements = signature.split(",");
    const timestampPart = elements.find((e) => e.startsWith("t="));
    const signaturePart = elements.find((e) => e.startsWith("v1="));

    if (!timestampPart || !signaturePart) {
      return { verified: false, gatewayOrderId: "", gatewayPaymentId: "", status: "failed" };
    }

    const timestamp = timestampPart.split("=")[1];
    const sigValue = signaturePart.split("=")[1];
    const signedPayload = `${timestamp}.${body}`;
    const expectedSignature = crypto
      .createHmac("sha256", STRIPE_WEBHOOK_SECRET)
      .update(signedPayload)
      .digest("hex");

    let verified = false;
    try {
      verified = crypto.timingSafeEqual(
        Buffer.from(sigValue),
        Buffer.from(expectedSignature)
      );
    } catch {
      verified = false;
    }

    const event = JSON.parse(body);
    const session = event?.data?.object || {};

    return {
      verified,
      gatewayOrderId: session.id || "",
      gatewayPaymentId: session.payment_intent || "",
      status: event?.type === "checkout.session.completed" ? "success" : "failed",
      amount: session.amount_total ? session.amount_total / 100 : undefined,
      currency: session.currency?.toUpperCase(),
    };
  },
};

// ─── TAP PAYMENTS (KSA, Oman) ──────────────

const TAP_SECRET_KEY = process.env.TAP_SECRET_KEY || "";
const TAP_WEBHOOK_SECRET = process.env.TAP_WEBHOOK_SECRET || "";

export const tapGateway: PaymentGateway = {
  name: "tap",

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const response = await fetch("https://api.tap.company/v2/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TAP_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        reference: { transaction: params.transactionId },
        receipt: { email: true, sms: false },
        customer: { first_name: params.buyerName, email: params.buyerEmail, phone: { number: params.buyerPhone || "" } },
        source: { id: "src_all" },
        redirect: { url: params.returnUrl },
        post: { url: params.webhookUrl },
        metadata: { transactionId: params.transactionId },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Tap charge creation failed: ${text}`);
    }

    const charge = await response.json();

    return {
      gatewayOrderId: charge.id,
      redirectUrl: charge.transaction?.url || null,
      paymentMethod: "TAP",
    };
  },

  verifyWebhook(headers: Record<string, string>, body: string): WebhookVerifyResult {
    const signature = headers["hashstring"] || headers["tap-signature"] || "";
    const expectedSignature = crypto
      .createHmac("sha256", TAP_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    let verified = false;
    try {
      verified = signature.length > 0 && crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      verified = false;
    }

    const parsed = JSON.parse(body);

    return {
      verified,
      gatewayOrderId: parsed.id || "",
      gatewayPaymentId: parsed.id || "",
      status: parsed.status === "CAPTURED" ? "success" : "failed",
      amount: parsed.amount,
      currency: parsed.currency,
    };
  },
};

// ─── eSewa (Nepal) ────────────────────────────

const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "";
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "";
const ESEWA_BASE_URL = process.env.ESEWA_BASE_URL || "https://rc-epay.esewa.com.np";

export const esewaGateway: PaymentGateway = {
  name: "esewa",

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    // eSewa uses form redirect — build the redirect URL with HMAC signature
    const total = params.amount;
    const message = `total_amount=${total},transaction_uuid=${params.transactionId},product_code=${ESEWA_PRODUCT_CODE}`;
    const signature = crypto
      .createHmac("sha256", ESEWA_SECRET_KEY)
      .update(message)
      .digest("base64");

    const searchParams = new URLSearchParams({
      amount: String(total),
      tax_amount: "0",
      total_amount: String(total),
      transaction_uuid: params.transactionId,
      product_code: ESEWA_PRODUCT_CODE,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${params.webhookUrl}?status=success`,
      failure_url: `${params.webhookUrl}?status=failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    });

    return {
      gatewayOrderId: params.transactionId,
      redirectUrl: `${ESEWA_BASE_URL}/api/epay/main/v2/form?${searchParams.toString()}`,
      paymentMethod: "ESEWA",
    };
  },

  verifyWebhook(_headers: Record<string, string>, body: string): WebhookVerifyResult {
    // eSewa sends a base64-encoded response as query params
    const parsed = JSON.parse(body);
    const encodedData = parsed.data || "";

    let decoded: Record<string, string> = {};
    try {
      decoded = JSON.parse(Buffer.from(encodedData, "base64").toString("utf-8"));
    } catch {
      return { verified: false, gatewayOrderId: "", gatewayPaymentId: "", status: "failed" };
    }

    // Verify signature
    const message = `transaction_code=${decoded.transaction_code},status=${decoded.status},total_amount=${decoded.total_amount},transaction_uuid=${decoded.transaction_uuid},product_code=${ESEWA_PRODUCT_CODE},signed_field_names=${decoded.signed_field_names}`;
    const expectedSignature = crypto
      .createHmac("sha256", ESEWA_SECRET_KEY)
      .update(message)
      .digest("base64");

    let verified = false;
    try {
      verified = decoded.signature ? crypto.timingSafeEqual(
        Buffer.from(decoded.signature),
        Buffer.from(expectedSignature)
      ) : false;
    } catch {
      verified = false;
    }

    return {
      verified,
      gatewayOrderId: decoded.transaction_uuid || "",
      gatewayPaymentId: decoded.transaction_code || "",
      status: decoded.status === "COMPLETE" ? "success" : "failed",
      amount: decoded.total_amount ? parseFloat(decoded.total_amount) : undefined,
    };
  },
};

// ─── Khalti (Nepal) ──────────────────────────

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY || "";
const KHALTI_BASE_URL = process.env.KHALTI_BASE_URL || "https://a.khalti.com";

export const khaltiGateway: PaymentGateway = {
  name: "khalti",

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const amountInPaisa = Math.round(params.amount * 100);

    const response = await fetch(`${KHALTI_BASE_URL}/api/v2/epayment/initiate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${KHALTI_SECRET_KEY}`,
      },
      body: JSON.stringify({
        return_url: params.returnUrl,
        website_url: params.returnUrl.split("/").slice(0, 3).join("/"),
        amount: amountInPaisa,
        purchase_order_id: params.transactionId,
        purchase_order_name: params.description,
        customer_info: { name: params.buyerName, email: params.buyerEmail, phone: params.buyerPhone || "" },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Khalti initiation failed: ${text}`);
    }

    const data = await response.json();

    return {
      gatewayOrderId: data.pidx,
      redirectUrl: data.payment_url,
      paymentMethod: "KHALTI",
    };
  },

  verifyWebhook(_headers: Record<string, string>, body: string): WebhookVerifyResult {
    // Khalti uses lookup API for verification — the pidx comes from the redirect
    const parsed = JSON.parse(body);
    // This gets called from our return URL handler after we verify via lookup API
    return {
      verified: parsed.verified === true,
      gatewayOrderId: parsed.pidx || "",
      gatewayPaymentId: parsed.pidx || "",
      status: parsed.status === "Completed" ? "success" : "failed",
      amount: parsed.total_amount ? parsed.total_amount / 100 : undefined,
    };
  },
};

// ─── Bank Transfer (Bhutan) — Manual flow ───

export const bankTransferGateway: PaymentGateway = {
  name: "bank_transfer",

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    // No external API call — just return instructions
    return {
      gatewayOrderId: `BT-${params.transactionId}`,
      redirectUrl: null, // No redirect — show bank details page
      paymentMethod: "BANK_TRANSFER",
      metadata: {
        bankName: "Bank of Bhutan",
        accountNumber: process.env.BOB_ACCOUNT_NUMBER || "200XXXXXXXXX",
        accountName: "Krishibridge Platform",
        amount: String(params.amount),
        currency: params.currency,
        reference: params.transactionId,
      },
    };
  },

  verifyWebhook(): WebhookVerifyResult {
    // Bank transfers are verified manually by admin
    return { verified: true, gatewayOrderId: "", gatewayPaymentId: "", status: "success" };
  },
};

// ─── GATEWAY FACTORY ─────────────────────────

const GATEWAY_MAP: Record<string, PaymentGateway> = {
  IN: razorpayGateway,
  NP_ESEWA: esewaGateway,
  NP_KHALTI: khaltiGateway,
  BT: bankTransferGateway,
  AE: stripeGateway,
  SA: tapGateway,
  OM: tapGateway,
};

/**
 * Select payment gateway based on buyer's country and preferred method.
 */
export function getPaymentGateway(
  countryCode: CountryCode,
  preferredMethod?: string
): PaymentGateway {
  if (countryCode === "NP") {
    if (preferredMethod === "KHALTI") return khaltiGateway;
    return esewaGateway; // default for Nepal
  }
  return GATEWAY_MAP[countryCode] || stripeGateway; // fallback to Stripe
}

/**
 * Get available payment methods for a country.
 */
export function getAvailableMethods(countryCode: CountryCode): { method: PaymentMethod; label: string }[] {
  const methods: Record<CountryCode, { method: PaymentMethod; label: string }[]> = {
    IN: [
      { method: "UPI", label: "UPI" },
      { method: "CARD", label: "Card" },
      { method: "NET_BANKING", label: "Net Banking" },
    ],
    NP: [
      { method: "ESEWA", label: "eSewa" },
      { method: "KHALTI", label: "Khalti" },
    ],
    BT: [
      { method: "BANK_TRANSFER", label: "Bank Transfer (Manual)" },
    ],
    AE: [
      { method: "STRIPE", label: "Card (Stripe)" },
    ],
    SA: [
      { method: "TAP", label: "Card (Tap)" },
    ],
    OM: [
      { method: "TAP", label: "Card (Tap)" },
    ],
  };
  return methods[countryCode] || [{ method: "STRIPE", label: "Card" }];
}
