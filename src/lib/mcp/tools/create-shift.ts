import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

function hoursBetween(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes <= 0) minutes += 24 * 60;
  return Number((minutes / 60).toFixed(2));
}

export default defineTool({
  name: "create_shift",
  title: "Create shift",
  description:
    "Create a new caregiver shift for the signed-in user. Payment amount is computed from the caregiver's hourly rate unless explicitly provided.",
  inputSchema: {
    date: z.string().describe("Shift date, ISO (YYYY-MM-DD)."),
    start_time: z.string().describe("Start time, HH:mm."),
    end_time: z.string().describe("End time, HH:mm. May be earlier than start for overnight shifts."),
    caregiver_name: z.string().describe("Caregiver name."),
    caregiver_type: z
      .enum(["private_paid", "family_member", "volunteer"])
      .describe("Caregiver type. Only private_paid shifts are billable."),
    location_type: z.enum(["hospital", "home", "institution"]).describe("Location type."),
    location_name: z.string().describe("Location name, e.g. hospital or ward name."),
    payment_amount: z
      .number()
      .optional()
      .describe("Override the computed labor payment amount."),
    payment_method: z
      .enum(["bank_transfer", "paybox", "bit", "cash"])
      .optional()
      .describe("Payment method (default bank_transfer)."),
    payment_status: z
      .enum(["paid", "unpaid"])
      .optional()
      .describe("Payment status (default unpaid)."),
    travel_cost: z.number().optional().describe("Expenses amount (default 0)."),
    notes: z.string().optional().describe("Free-text notes about the shift."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const totalHours = hoursBetween(input.start_time, input.end_time);
    const billable = input.caregiver_type === "private_paid";

    let paymentAmount = input.payment_amount ?? 0;
    if (input.payment_amount === undefined && billable) {
      const { data: caregiver } = await supabase
        .from("caregivers")
        .select("hourly_rate")
        .eq("name", input.caregiver_name)
        .maybeSingle();
      paymentAmount = Number(((caregiver?.hourly_rate ?? 0) * totalHours).toFixed(2));
    }
    if (!billable) paymentAmount = 0;

    const { data, error } = await supabase
      .from("shifts")
      .insert({
        id: crypto.randomUUID(),
        user_id: userId,
        date: input.date,
        start_time: input.start_time,
        end_time: input.end_time,
        total_hours: totalHours,
        caregiver_name: input.caregiver_name,
        caregiver_type: input.caregiver_type,
        location_type: input.location_type,
        location_name: input.location_name,
        payment_amount: paymentAmount,
        payment_method: input.payment_method ?? "bank_transfer",
        payment_status: billable ? input.payment_status ?? "unpaid" : "unpaid",
        travel_cost: billable ? input.travel_cost ?? 0 : 0,
        parking_cost: 0,
        notes: input.notes ?? null,
      })
      .select();

    if (error) return failure(error.message);
    return ok({ shift: data?.[0] });
  },
});
