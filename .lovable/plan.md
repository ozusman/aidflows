## Add `hourly_rate` to Caregivers

### 1. Database migration
Add column to `caregivers`:
```sql
ALTER TABLE public.caregivers
  ADD COLUMN hourly_rate NUMERIC NOT NULL DEFAULT 0;
```
No RLS/grant changes needed (table already configured).

Note: `src/integrations/supabase/types.ts` is auto-generated and regenerates after the migration runs — no manual edit required (and manual edits would be overwritten).

### 2. `src/hooks/useCaregivers.ts`
- Extend `Caregiver` interface with `hourly_rate: number`.
- `saveCaregiver(name, caregiverType, hourlyRate)` — include `hourly_rate` in upsert payload.
- `updateCaregiver(id, name, caregiverType?, hourlyRate?)` — include `hourly_rate` in update payload when provided.
- `fetchCaregivers` already does `select('*')`, so reads pick up the new column automatically.

### 3. `src/pages/Caregivers.tsx` — Add form
- New state: `newRate` (number, default 0).
- Add an `Input type="number" min={0} step="0.01"` with `Label` "Hourly rate (€/hr)".
- Place it in the add form grid, below the Caregiver Type select. Adjust grid template so the Add button stays aligned (switch the current `sm:grid-cols-[1fr_1fr_auto]` to a 2-row layout or `sm:grid-cols-2` with the button on its own row) — using only existing tailwind tokens.
- Pass `newRate` to `saveCaregiver`; reset to 0 after save.

### 4. `src/pages/Caregivers.tsx` — Edit row
- New state: `editingRate` (number).
- `startEdit` accepts and sets the current rate.
- In the editing row, render a number `Input` (min 0, step 0.01) in the rate cell.
- `approveEdit` passes `editingRate` to `updateCaregiver`.

### 5. `src/pages/Caregivers.tsx` — Table column
- Add `<TableHead>` "Hourly rate (€/hr)" between Type and the actions column.
- Cell rendering:
  - If `caregiver.caregiver_type === 'family_member'` and `hourly_rate === 0` → render `—` (muted text via existing `text-muted-foreground` token).
  - Otherwise → `€{hourly_rate}/hr`.

### 6. i18n
Reuse literal strings ("Hourly rate (€/hr)", "—") inline as specified by the request — no i18n key additions in this step to keep scope minimal. (Flag: if you'd prefer translation keys added to `src/lib/i18n.tsx`, say so and I'll include them.)

### Files touched
- New migration (via migration tool)
- `src/hooks/useCaregivers.ts`
- `src/pages/Caregivers.tsx`

No other pages, components, or types files are modified.
