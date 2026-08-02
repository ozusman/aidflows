import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "set_payment_status",
  title: "Set shift payment status",
  description:
    "Mark one of the signed-in user's shifts as paid or unpaid, optionally setting the payment date.",
  inputSchema: {
    shift_id: z.string().describe("The shift id, as returned by list_shifts."),
    payment_status: z.enum(["paid", "unpaid"]).describe("New payment status."),
    payment_date: z
      .string()
      .optional()
      .describe("ISO date (YYYY-MM-DD) the payment was made. Only used when marking as paid."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  handler: async ({ shift_id, payment_status, payment_date }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();

    const update: Record<string, unknown> = { payment_status };
    if (payment_status === "paid") {
      if (payment_date) update.payment_date = payment_date;
    } else {
      update.payment_date = null;
    }

    const { data, error } = await supabaseForUser(ctx)
      .from("shifts")
      .update(update)
      .eq("id", shift_id)
      .select();

    if (error) return failure(error.message);
    if (!data?.length) return failure("No shift found with that id.");
    return ok({ shift: data[0] });
  },
});
