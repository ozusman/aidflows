import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listShifts from "./tools/list-shifts";
import listCaregivers from "./tools/list-caregivers";
import shiftSummary from "./tools/shift-summary";
import setPaymentStatus from "./tools/set-payment-status";
import createShift from "./tools/create-shift";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "aidflow-mcp",
  title: "AidFlow",
  version: "0.1.0",
  instructions:
    "Tools for AidFlow, a caregiver shift tracker. Use list_shifts and list_caregivers to read the signed-in user's data, shift_summary for totals over a date range, create_shift to log a new shift, and set_payment_status to mark a shift paid or unpaid. All data is scoped to the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listShifts, listCaregivers, shiftSummary, createShift, setPaymentStatus],
});
