## Plan

You're right: the Shifts table still renders the `Unpaid` badge for every row, including family members and volunteers. The Weekly Summary table currently has no Status column in code, but I’ll verify the rendered issue by making the same unpaid-caregiver rule reusable so both tables stay consistent if a status cell exists or is added.

### 1. Define the unpaid-caregiver rule once
- Treat these caregiver types as non-payment/non-status rows:
  - `family_member`
  - `volunteer`
- Only `private_paid` rows should show a payment status badge or open receipt/payment actions.

### 2. Fix the Shifts table
- In `src/components/shifts/ShiftsList.tsx`:
  - Replace the unconditional status badge with `—` for family members and volunteers.
  - Keep the receipt icon/count only for paid supervision rows.
  - Prevent clicking/changing payment status for family members and volunteers.

### 3. Fix Weekly Summary consistency
- In `src/components/summary/WeeklySummary.tsx`:
  - Confirm there is no status column in the current code.
  - If any payment/status display is present in the table, render `—` for family members and volunteers.
  - Keep existing amount behavior: `0.00` for family members unless you want volunteers to also be forced to zero.

### 4. Fix the provider error cleanly
- The current `ShiftsProvider` wraps auth routes too high in `src/App.tsx`, outside `BrowserRouter` and outside the protected app route structure.
- Move `ShiftsProvider` inside the authenticated app area so all pages using `useShifts()` are definitely under the provider, and auth/reset pages are not.

### 5. Verify
- Check the table render path after the change:
  - Family member row status = `—`
  - Volunteer row status = `—`
  - Paid supervision row status still shows Paid/Unpaid badge
  - New/edit shift pages remain usable without the provider error

### Files to edit
- `src/components/shifts/ShiftsList.tsx`
- `src/components/summary/WeeklySummary.tsx` only if needed for visible payment/status consistency
- `src/App.tsx`