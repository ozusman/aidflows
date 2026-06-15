## Goal
Make the Amount column always reflect the caregiver's current hourly rate, so stale `payment_amount` values (like the 01/06/2026 row showing €15) don't appear wrong.

## Formula (both views)
`Amount = totalHours × caregiver.hourly_rate + travelCost + parkingCost`

For `caregiver_type === 'family_member'`, Amount = 0 (no labor cost), matching existing UX.

## Changes

### 1. `src/components/shifts/ShiftsList.tsx`
- Re-add `useCaregivers` import and build a `Map<name, hourly_rate>`.
- Amount cell becomes: `totalHours × (rate ?? 0) + travelCost + parkingCost`.
- Expenses column unchanged (`travelCost + parkingCost`).

### 2. `src/components/summary/WeeklySummary.tsx`
- Re-add `useCaregivers` and rate map.
- Update `computeAmount(shift)`:
  - `family_member` → 0
  - else → `totalHours × rate + travelCost + parkingCost`
- Totals row and CSV export already call `computeAmount`, so they update automatically.

### 3. `src/components/shifts/ShiftForm.tsx`
- No changes. It already auto-calculates `paymentAmount` on save from the selected caregiver's rate — that value just becomes a snapshot we no longer rely on for display.

## Out of scope
- No DB migration, no backfill of `payment_amount`.
- No design/token/font changes, no new packages.
- DailyCoverage, EditShift, types unchanged.
