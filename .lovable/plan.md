## Goal
Stop `saveCaregiver` from silently resetting a caregiver's `hourly_rate` to 0 when called without a rate (e.g., from shift forms).

## Change
In `src/hooks/useCaregivers.ts`, update `saveCaregiver`:
- Change the `hourlyRate` parameter from `hourlyRate: number = 0` to `hourlyRate?: number`.
- Build the upsert object dynamically: only include `hourly_rate` if `hourlyRate !== undefined`.
- Keep everything else in `useCaregivers.ts` unchanged.

## Scope
- Only `src/hooks/useCaregivers.ts` is modified.
- No changes to `ShiftForm.tsx`, `EditShift.tsx`, `updateCaregiver`, `deleteCaregiver`, or any other file.
- No database schema changes.

## Outcome
When a shift form auto-saves a caregiver by name and type without passing a rate, the existing `hourly_rate` in the database is preserved instead of being overwritten to 0.