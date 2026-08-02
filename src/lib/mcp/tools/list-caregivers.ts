import { defineTool } from "@lovable.dev/mcp-js";
import { failure, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_caregivers",
  title: "List caregivers",
  description:
    "List the signed-in user's caregivers with their type (private_paid, family_member, volunteer) and hourly rate.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("caregivers")
      .select("id, name, caregiver_type, hourly_rate, updated_at")
      .order("name", { ascending: true });
    if (error) return failure(error.message);
    return ok({ count: data?.length ?? 0, caregivers: data ?? [] });
  },
});
