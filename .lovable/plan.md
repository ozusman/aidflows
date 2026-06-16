## Goal
Consolidate caregiver types to three — **Paid Supervision**, **Family Member**, **Volunteer** — and introduce a consistent, accessible visual system (badges on Caregivers page, dot indicators + legend on Shifts list and Weekly Summary).

No changes to business logic, calculations, payment behavior, editing flows, or table structure beyond the value renames.

---

## 1. Database value migration

`caregiver_type` is free-text on both tables, so no enum/check migration is needed — just value updates.

```sql
-- Rename "other" → "volunteer"
UPDATE public.caregivers SET caregiver_type = 'volunteer' WHERE caregiver_type = 'other';
UPDATE public.shifts     SET caregiver_type = 'volunteer' WHERE caregiver_type = 'other';

-- Remove "foreign_caregiver" by folding it into "private_paid" (Paid Supervision),
-- since foreign caregivers are paid and family_member is the only zero-cost type.
UPDATE public.caregivers SET caregiver_type = 'private_paid' WHERE caregiver_type = 'foreign_caregiver';
UPDATE public.shifts     SET caregiver_type = 'private_paid' WHERE caregiver_type = 'foreign_caregiver';
```

If you'd rather map existing `foreign_caregiver` rows to `volunteer` (or leave them as-is until reviewed), say the word before I run this.

## 2. Types & i18n

- `src/types/shift.ts` — `CaregiverType = 'private_paid' | 'family_member' | 'volunteer'`. Drop `'other'` and `'foreign_caregiver'`.
- `src/lib/i18n.tsx` — rename key `typeOther` → `typeVolunteer` (EN `Volunteer`, HE `מתנדב`). Remove `typeForeignCaregiver`.
- Remove the **Foreign Caregiver** option from the Select dropdowns in `Caregivers.tsx` (add form + inline edit) and from any `ShiftForm`/`EditShift` selectors that list it.
- Replace `other` with `volunteer` in `Caregivers.tsx`, `ShiftsList.tsx`, `CaregiverTypeBadge.tsx`, `ShiftForm.tsx`, `EditShift.tsx`, and any other reference.

## 3. Semantic caregiver tokens (three roles per type)

In `src/index.css`, define HSL tokens with three separate roles per type. Each role is used only for its purpose:
- `--caregiver-{type}-dot` → only the dot indicator
- `--caregiver-{type}-bg`  → only badge surface
- `--caregiver-{type}-fg`  → only badge text (must pass WCAG AA on its bg)

| Type | dot | badge bg | badge fg |
|---|---|---|---|
| Paid Supervision (`private_paid`) | `#F6DA9D` | `#F9E7BF` | `#643A17` |
| Family Member (`family_member`)   | `#9AEA06` | `#D2F88C` | `#0B5D32` |
| Volunteer (`volunteer`)           | `#DAB8FF` | `#E9D4FF` | `#59168B` |

Expose tokens in `tailwind.config.ts` as `caregiver.{type}.{dot|bg|fg}`. Provide matching dark-mode values (darker bg, lighter fg, AA-compliant). Remove obsolete `--caregiver-other-*` and `--caregiver-foreign-*` tokens.

Rules:
- Dot color is never used as text.
- Badge text never uses opacity modifiers.
- No hard-coded hex in components — tokens only.

## 4. `CaregiverTypeBadge` (Caregivers page)

Update the class map to use the new `-bg` / `-fg` tokens for the three types. Keep the full badge column on the Caregivers page unchanged in behavior.

## 5. New component: `CaregiverTypeDot`

`src/components/caregivers/CaregiverTypeDot.tsx`
- 8px circle, `bg-caregiver-{type}-dot`.
- 1px subtle border for B&W print legibility.
- Non-interactive, no tooltip.
- `aria-label` = translated caregiver type label.
- Inline-block, aligned to first text baseline, never wraps away from the name.

Rendered before the caregiver name (layout `[dot] [name]`, logical `me-2` spacing for RTL) in:
- `src/components/shifts/ShiftsList.tsx`
- `src/components/summary/WeeklySummary.tsx`

## 6. New component: `CaregiverTypeLegend`

`src/components/caregivers/CaregiverTypeLegend.tsx`
- Horizontal compact row, wraps on mobile, minimal visual weight (small muted text).
- Three entries: Paid Supervision, Family Member, Volunteer — dot + translated label.
- Non-interactive.

Inserted directly above the table card in:
- The page that renders `ShiftsList` (Shifts page).
- `src/pages/Summary.tsx` (above `WeeklySummary`).

## 7. Accessibility

- All badge text meets WCAG AA on its badge bg.
- No opacity on text colors.
- Dot is an indicator only — meaning is also conveyed by the legend and by existing caregiver-type text, so nothing is color-only.
- Print: dot has a 1px border; badges keep readable fg/bg.

## Out of scope

No changes to: payment/hours calculations, shift or caregiver editing logic, primary color, fonts, navigation, Daily Coverage view, packages, or DB structure beyond the value updates.

## Technical summary

- 1 data migration (UPDATE-only on two tables, four statements).
- Token refactor in `src/index.css` + `tailwind.config.ts`.
- 2 new components (`CaregiverTypeDot`, `CaregiverTypeLegend`).
- Edits to: `types/shift.ts`, `lib/i18n.tsx`, `CaregiverTypeBadge.tsx`, `Caregivers.tsx`, `ShiftsList.tsx`, `WeeklySummary.tsx`, `ShiftForm.tsx`, `EditShift.tsx`, and the pages mounting the legend.
