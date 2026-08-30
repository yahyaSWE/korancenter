import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  event: null as unknown,
  createAdminClient: vi.fn(),
  constructEvent: vi.fn(() => mocks.event),
  retrieveSubscription: vi.fn(),
  sendEnrollmentActivatedEmail: vi.fn(),
  sendStudentEnrollmentConfirmationEmail: vi.fn(),
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
  sendEnrollmentActivatedEmail: mocks.sendEnrollmentActivatedEmail,
  sendStudentEnrollmentConfirmationEmail: mocks.sendStudentEnrollmentConfirmationEmail,
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

function adminClient({
  updateError = null,
  priorPaymentStatus = "pending",
  confirmationSentAt = null,
}: {
  updateError?: { message: string } | null;
  priorPaymentStatus?: "pending" | "paid";
  confirmationSentAt?: string | null;
} = {}) {
  const update = vi.fn();
  const from = vi.fn((table: string) => {
    let action: "select" | "update" = "select";
    let selected = "";
    let filterColumn = "";
    let filterValue: unknown;
    const query = {
      select: vi.fn((columns: string) => {
        selected = columns;
        return query;
      }),
      update: vi.fn((values: unknown) => {
        action = "update";
        update(values);
        return query;
      }),
      eq: vi.fn((column: string, value: unknown) => {
        filterColumn = column;
        filterValue = value;
        return query;
      }),
      single: vi.fn(async () => {
        if (table === "enrollments" && selected === "payment_status, student_confirmation_sent_at") {
          return {
            data: {
              payment_status: priorPaymentStatus,
              student_confirmation_sent_at: confirmationSentAt,
            },
            error: null,
          };
        }
        if (table === "enrollments") {
          return {
            data: {
              id: "enrollment-1",
              student: { full_name: "Test Elev", email: "elev@example.com" },
              course: {
                title: "Nybörjare",
                teacher_id: "teacher-1",
                weekly_schedule: [
                  { enabled: true, time: "18:00" },
                  ...Array.from({ length: 6 }, () => ({ enabled: false, time: "18:00" })),
                ],
              },
            },
            error: null,
          };
        }
        if (table === "profiles" && filterColumn === "id" && filterValue === "teacher-1") {
          return { data: { email: "teacher@example.com" }, error: null };
        }
        return { data: null, error: null };
      }),
      then: (
        resolve: (value: unknown) => unknown,
        reject: (reason: unknown) => unknown,
      ) => Promise.resolve<unknown>(action === "update"
        ? { data: null, error: updateError }
        : table === "profiles" && filterColumn === "role"
          ? { data: [{ email: "admin@example.com" }], error: null }
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
    mocks.sendEnrollmentActivatedEmail.mockResolvedValue(undefined);
    mocks.sendStudentEnrollmentConfirmationEmail.mockResolvedValue(undefined);
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
    expect(mocks.sendEnrollmentActivatedEmail).toHaveBeenCalledWith(expect.objectContaining({
      studentName: "Test Elev",
      courseName: "Nybörjare",
    }));
    expect(mocks.sendStudentEnrollmentConfirmationEmail).toHaveBeenCalledWith(expect.objectContaining({
      toEmail: "elev@example.com",
      studentName: "Test Elev",
      courseName: "Nybörjare",
    }));
    expect(db.update).toHaveBeenCalledWith(expect.objectContaining({
      student_confirmation_sent_at: expect.any(String),
    }));
  });

  it("returnerar 500 så Stripe försöker igen när databasuppdateringen misslyckas", async () => {
    mocks.event = checkoutEvent("paid");
    const db = adminClient({ updateError: { message: "database unavailable" } });
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

  it("skickar inte bekräftelsen igen när den redan är registrerad", async () => {
    mocks.event = checkoutEvent("paid");
    const db = adminClient({
      priorPaymentStatus: "paid",
      confirmationSentAt: "2026-08-30T10:00:00.000Z",
    });
    mocks.createAdminClient.mockReturnValue(db.client);

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mocks.sendEnrollmentActivatedEmail).not.toHaveBeenCalled();
    expect(mocks.sendStudentEnrollmentConfirmationEmail).not.toHaveBeenCalled();
  });

  it("returnerar 500 så Stripe försöker igen om elevmejlet misslyckas", async () => {
    mocks.event = checkoutEvent("paid");
    const db = adminClient();
    mocks.createAdminClient.mockReturnValue(db.client);
    mocks.sendStudentEnrollmentConfirmationEmail.mockRejectedValueOnce(new Error("Resend unavailable"));

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(db.update).not.toHaveBeenCalledWith(expect.objectContaining({
      student_confirmation_sent_at: expect.any(String),
    }));
  });
});
