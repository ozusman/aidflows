import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "shift_summary",
  title: "Summarize shifts",
  description:
    "Summarize the signed-in user's shifts over a date range: total hours, total payment, total expenses (travel + parking), and per-caregiver breakdown.",
  inputSchema: {
    from_date: z.string().describe("Start of the range, ISO date (YYYY-MM-DD)."),
    to_date: z.string().describe("End of the range, ISO date (YYYY-MM-DD)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from_date, to_date }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();

    const { data, error } = await supabaseForUser(ctx)
      .from("shifts")
      .select(
        "date, caregiver_name, caregiver_type, total_hours, payment_amount, travel_cost, parking_cost, payment_status",
      )
      .gte("date", from_date)
      .lte("date", to_date);

    if (error) return failure(error.message);
    const rows = data ?? [];

    const byCaregiver: Record<
      string,
      { shifts: number; hours: number; payment: number; expenses: number }
    > = {};
    let hours = 0;
    let payment = 0;
    let expenses = 0;
    let unpaid = 0;

    for (const row of rows) {
      const rowExpenses = (row.travel_cost ?? 0) + (row.parking_cost ?? 0);
      hours += row.total_hours ?? 0;
      payment += row.payment_amount ?? 0;
      expenses += rowExpenses;
      if (row.payment_status === "unpaid") unpaid += 1;

      const entry = (byCaregiver[row.caregiver_name] ??= {
        shifts: 0,
        hours: 0,
        payment: 0,
        expenses: 0,
      });
      entry.shifts += 1;
      entry.hours += row.total_hours ?? 0;
      entry.payment += row.payment_amount ?? 0;
      entry.expenses += rowExpenses;
    }

    return ok({
      from_date,
      to_date,
      total_shifts: rows.length,
      unpaid_shifts: unpaid,
      total_hours: Number(hours.toFixed(2)),
      total_payment: Number(payment.toFixed(2)),
      total_expenses: Number(expenses.toFixed(2)),
      grand_total: Number((payment + expenses).toFixed(2)),
      by_caregiver: byCaregiver,
    });
  },
});
