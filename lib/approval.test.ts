import { describe, expect, it, vi } from "vitest";
import {
  runApprovalFlow,
  type ApplicationWithCourse,
  type ApprovalDependencies,
} from "./approval";

type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;
type Filter = { kind: "eq" | "neq"; column: string; value: unknown };

class FakeQuery {
  private action: "select" | "insert" | "update" = "select";
  private filters: Filter[] = [];
  private payload: Row | null = null;
  private maxRows: number | null = null;

  constructor(
    private table: string,
    private tables: Tables,
    private log: string[],
  ) {}

  select() { return this; }
  insert(payload: Row) { this.action = "insert"; this.payload = payload; return this; }
  update(payload: Row) { this.action = "update"; this.payload = payload; return this; }
  eq(column: string, value: unknown) { this.filters.push({ kind: "eq", column, value }); return this; }
  neq(column: string, value: unknown) { this.filters.push({ kind: "neq", column, value }); return this; }
  limit(value: number) { this.maxRows = value; return this; }

  private matches(row: Row) {
    return this.filters.every((filter) => filter.kind === "eq"
      ? row[filter.column] === filter.value
      : row[filter.column] !== filter.value);
  }

  private async execute(single: boolean, optional: boolean) {
    const rows = this.tables[this.table] ?? (this.tables[this.table] = []);
    if (this.action === "insert") {
      const inserted = { id: `${this.table}-${rows.length + 1}`, ...this.payload };
      rows.push(inserted);
      this.log.push(`db:${this.table}:insert`);
      return { data: single ? inserted : [inserted], error: null };
    }

    const matched = rows.filter((row) => this.matches(row));
    if (this.action === "update") {
      for (const row of matched) Object.assign(row, this.payload);
      this.log.push(`db:${this.table}:update:${String(this.payload?.status ?? this.payload?.payment_status ?? "")}`);
      return { data: null, error: null };
    }

    const selected = this.maxRows === null ? matched : matched.slice(0, this.maxRows);
    if (single) {
      if (selected.length === 0 && optional) return { data: null, error: null };
      if (selected.length !== 1) return { data: null, error: { message: "Fel antal rader" } };
      return { data: selected[0], error: null };
    }
    return { data: selected, error: null };
  }

  single() { return this.execute(true, false); }
  maybeSingle() { return this.execute(true, true); }
  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute(false, false).then(onfulfilled as never, onrejected as never);
  }
}

function application(courseOverrides: Partial<NonNullable<ApplicationWithCourse["course"]>> = {}): ApplicationWithCourse {
  return {
    id: "app-1",
    course_id: "course-1",
    name: "Test Elev",
    email: "ELEV@example.com",
    phone: "0700000000",
    address: "Testgatan 1",
    postal_code: "12345",
    city: "Stockholm",
    experience: "Nybörjare",
    course: {
      id: "course-1",
      title: "Nybörjarkurs",
      stripe_price_id: "price_test",
      is_subscription: true,
      is_active: true,
      ...courseOverrides,
    },
  };
}

function setup(tables: Tables, options: { approvalEmailFails?: boolean } = {}) {
  const log: string[] = [];
  const sendApprovalEmail = vi.fn(async () => {
    log.push("email:approval");
    if (options.approvalEmailFails) throw new Error("Resend nere");
  });
  const sendApplicationStatusEmail = vi.fn(async ({ status }: { status: string }) => {
    log.push(`email:${status}`);
  });
  const sendNewApplicationEmail = vi.fn(async () => { log.push("email:new-application"); });
  const checkoutCreate = vi.fn(async () => {
    log.push("stripe:checkout");
    return { url: "https://checkout.stripe.test/session" };
  });

  const admin = {
    from: (table: string) => new FakeQuery(table, tables, log),
    auth: {
      admin: {
        generateLink: vi.fn(async ({ type }: { type: string }) => ({
          data: {
            user: { id: "student-1" },
            properties: { action_link: `https://auth.test/${type}` },
          },
          error: null,
        })),
      },
    },
  };

  const dependencies = {
    createAdminClient: () => admin,
    getStripe: () => ({ checkout: { sessions: { create: checkoutCreate } } }),
    sendApprovalEmail,
    sendApplicationStatusEmail,
    sendNewApplicationEmail,
    now: () => "2026-08-28T12:00:00.000Z",
    siteUrl: () => "https://korancenter.se",
  } as unknown as ApprovalDependencies;

  return { dependencies, log, sendApprovalEmail, sendApplicationStatusEmail, sendNewApplicationEmail, checkoutCreate };
}

describe("runApprovalFlow", () => {
  it("skapar enrollment och betalningslänk innan ansökan blir godkänd", async () => {
    const tables: Tables = {
      applications: [{ id: "app-1", status: "pending" }],
      profiles: [{ id: "student-1", email: "elev@example.com" }],
      enrollments: [],
    };
    const test = setup(tables);

    const result = await runApprovalFlow({
      application: application(),
      status: "approved",
      reviewerId: "teacher-1",
    }, test.dependencies);

    expect(result).toEqual({ ok: true, payment_status: "pending" });
    expect(tables.enrollments).toMatchObject([{
      student_id: "student-1",
      course_id: "course-1",
      payment_status: "pending",
    }]);
    expect(test.checkoutCreate).toHaveBeenCalledOnce();
    expect(test.sendApprovalEmail).toHaveBeenCalledOnce();
    expect(tables.applications[0].status).toBe("approved");
    expect(test.log.indexOf("email:approval")).toBeLessThan(test.log.indexOf("db:applications:update:approved"));
  });

  it("lämnar ansökan väntande om Stripe Pris-ID saknas", async () => {
    const tables: Tables = {
      applications: [{ id: "app-1", status: "pending" }],
      profiles: [{ id: "student-1", email: "elev@example.com" }],
      enrollments: [],
    };
    const test = setup(tables);

    const result = await runApprovalFlow({
      application: application({ stripe_price_id: null }),
      status: "approved",
      reviewerId: "teacher-1",
    }, test.dependencies);

    expect(result).toEqual({ error: "Kursen \"Nybörjarkurs\" saknar Stripe Pris-ID" });
    expect(tables.applications[0].status).toBe("pending");
    expect(test.sendApprovalEmail).not.toHaveBeenCalled();
  });

  it("lämnar ansökan väntande om godkännandemejlet misslyckas", async () => {
    const tables: Tables = {
      applications: [{ id: "app-1", status: "pending" }],
      profiles: [{ id: "student-1", email: "elev@example.com" }],
      enrollments: [],
    };
    const test = setup(tables, { approvalEmailFails: true });

    const result = await runApprovalFlow({
      application: application(),
      status: "approved",
      reviewerId: "teacher-1",
    }, test.dependencies);

    expect(result).toEqual({ error: "Resend nere" });
    expect(tables.applications[0].status).toBe("pending");
  });

  it("återanvänder en redan betald kursplats utan ny Stripe-session", async () => {
    const tables: Tables = {
      applications: [{ id: "app-1", status: "pending" }],
      profiles: [{ id: "student-1", email: "elev@example.com" }],
      enrollments: [{ id: "enrollment-1", student_id: "student-1", course_id: "course-1", payment_status: "paid" }],
    };
    const test = setup(tables);

    const result = await runApprovalFlow({
      application: application({ stripe_price_id: null }),
      status: "approved",
      reviewerId: "teacher-1",
    }, test.dependencies);

    expect(result).toEqual({ ok: true, payment_status: "paid" });
    expect(test.checkoutCreate).not.toHaveBeenCalled();
    expect(test.sendApprovalEmail).toHaveBeenCalledWith(expect.objectContaining({ checkoutUrl: null }));
    expect(tables.applications[0].status).toBe("approved");
  });

  it("flyttar en hänvisning till en ny väntande ansökan utan dubbletter", async () => {
    const tables: Tables = {
      applications: [{ id: "app-1", status: "pending", course_id: "course-1", email: "elev@example.com" }],
      courses: [{
        id: "course-2",
        title: "Grundkurs",
        is_active: true,
        teacher_id: "teacher-2",
        teacher: { full_name: "Lärare Två", email: "teacher@example.com" },
      }],
    };
    const test = setup(tables);
    const args = {
      application: application(),
      status: "redirected" as const,
      reviewerId: "teacher-1",
      redirectCourseId: "course-2",
    };

    const first = await runApprovalFlow(args, test.dependencies);
    const second = await runApprovalFlow(args, test.dependencies);

    expect(first).toMatchObject({ ok: true, transferred_application_id: "applications-2" });
    expect(second).toMatchObject({ ok: true, transferred_application_id: "applications-2" });
    expect(tables.applications.filter((row) => row.course_id === "course-2")).toHaveLength(1);
    expect(tables.applications.find((row) => row.id === "app-1")).toMatchObject({
      status: "redirected",
      redirect_course_id: "course-2",
    });
    expect(test.sendApplicationStatusEmail).toHaveBeenCalledTimes(2);
    expect(test.sendNewApplicationEmail).toHaveBeenCalledOnce();
  });
});
