## Goal

Make the Amount column always show a freshly computed total in **both** the shifts list and the weekly summary table:

```
amount = totalHours × caregiver.hourly_rate + travelCost + parkingCost
```

Today both views read `shift.paymentAmount`, which can drift from the caregiver's current `hourly_rate`.

## Changes

### 1. `src/components/shifts/ShiftsList.tsx`
- Import `useCaregivers`.
- Build a `Map<caregiverName, hourly_rate>` from `caregivers`.
- Per row: `amount = shift.totalHours * (rate ?? 0) + (shift.travelCost || 0) + (shift.parkingCost || 0)`.
- Render that in the Amount cell instead of `shift.paymentAmount + travel + parking`.

### 2. `src/components/summary/WeeklySummary.tsx`
- Import `useCaregivers`, build the same rate map.
- Helper `computeAmount(shift)` returning hours × rate + travel + parking, with `family_member` still rendered as `-` (matches current UX).
- Use `computeAmount` in the Amount table cell.
- Use `computeAmount` in the `totals` reducer for `payment` (replacing `shift.paymentAmount`), so the "Total Payment" card matches the rows.
- `exportCSV`: use `computeAmount(s).toFixed(2)` for the Payment column.
- Expenses total stays as-is (travel + parking).

## Out of scope

- No DB schema changes, no edits to stored `payment_amount`.
- `ShiftForm` / `EditShift` save-time calculation unchanged.
- `DailyCoverage` unchanged (no amount column there).

## Edge cases

- Caregiver missing from `caregivers` table → rate treated as 0, amount = travel + parking.
- `family_member` typically has rate 0 → list view shows just travel + parking; weekly summary row still shows `-` per current convention, but the totals card includes their travel/parking? No — payment total uses computeAmount which for family with rate 0 = travel+parking; to keep the existing "exclude family from payment" behavior, `computeAmount` in the totals reducer will skip family members (return 0), matching today's logic.
