import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  event: null as unknown,
  createAdminClient: vi.fn(),
  constructEvent: vi.fn(() => mocks.event),
  retrieveSubscription: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mocks.constructEvent },
    subscriptions: { retrieve: mocks.retrieveSubscription },
  }),
}));

vi.mock("@/lib/email", () => ({
  sendEnrollmentActivatedEmail: vi.fn(),
  sendEnrollmentCancelledEmail: vi.fn(),
  sendPaymentFailedEmail: vi.fn(),
}));

import { POST } from "./route";

function request() {
  return new NextRequest("https://korancenter.se/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": "test-signature" },
    body: "{}",
  });
}

function checkoutEvent(paymentStatus: "paid" | "unpaid") {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        mode: "payment",
        payment_status: paymentStatus,
        customer: "cus_test",
        metadata: { enrollment_id: "enrollment-1" },
      },
    },
  };
}

function adminClient(updateError: { message: string } | null = null) {
  const update = vi.fn();
  const from = vi.fn(() => {
    let action: "select" | "update" = "select";
    const query = {
      select: vi.fn(() => query),
      update: vi.fn((values: unknown) => {
        action = "update";
        update(values);
        return query;
      }),
      eq: vi.fn(() => query),
      single: vi.fn(async () => ({ data: { payment_status: "paid" }, error: null })),
      then: (
        resolve: (value: unknown) => unknown,
        reject: (reason: unknown) => unknown,
      ) => Promise.resolve<unknown>(action === "update"
        ? { data: null, error: updateError }
        : { data: [], error: null }).then(resolve, reject),
    };
    return query;
  });
  return { client: { from }, update };
}

describe("Stripe webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("aktiverar enrollment när checkout är betald", async () => {
    mocks.event = checkoutEvent("paid");
    const db = adminClient();
    mocks.createAdminClient.mockReturnValue(db.client);

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalledWith(expect.objectContaining({
      payment_status: "paid",
      stripe_customer_id: "cus_test",
    }));
  });

  it("returnerar 500 så Stripe försöker igen när databasuppdateringen misslyckas", async () => {
    mocks.event = checkoutEvent("paid");
    const db = adminClient({ message: "database unavailable" });
    mocks.createAdminClient.mockReturnValue(db.client);

    const response = await POST(request());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Internt fel vid bearbetning" });
  });

  it("aktiverar inte kursplatsen innan en fördröjd betalning är klar", async () => {
    mocks.event = checkoutEvent("unpaid");
    const db = adminClient();
    mocks.createAdminClient.mockReturnValue(db.client);

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(db.update).not.toHaveBeenCalled();
  });
});
