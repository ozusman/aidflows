import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_shifts",
  title: "List shifts",
  description:
    "List the signed-in user's caregiver shifts, optionally filtered by date range, caregiver name, or payment status. Returns date, times, hours, caregiver, location, costs and payment status.",
  inputSchema: {
    from_date: z
      .string()
      .optional()
      .describe("Only include shifts on or after this ISO date (YYYY-MM-DD)."),
    to_date: z
      .string()
      .optional()
      .describe("Only include shifts on or before this ISO date (YYYY-MM-DD)."),
    caregiver_name: z
      .string()
      .optional()
      .describe("Filter to shifts whose caregiver name contains this text."),
    payment_status: z
      .enum(["paid", "unpaid"])
      .optional()
      .describe("Filter by payment status."),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of shifts to return (default 50, max 200)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);

    let query = supabaseForUser(ctx)
      .from("shifts")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit);

    if (input.from_date) query = query.gte("date", input.from_date);
    if (input.to_date) query = query.lte("date", input.to_date);
    if (input.caregiver_name)
      query = query.ilike("caregiver_name", `%${input.caregiver_name}%`);
    if (input.payment_status)
      query = query.eq("payment_status", input.payment_status);

    const { data, error } = await query;
    if (error) return failure(error.message);
    return ok({ count: data?.length ?? 0, shifts: data ?? [] });
  },
});
