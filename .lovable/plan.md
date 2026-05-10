## Goal
Allow editing a caregiver's name directly in the caregivers table row.

## UX
- Each row gets a new **edit (pencil) icon** placed to the left of the existing delete (trash) icon.
- Pressing the edit icon puts that row into **edit mode**:
  - The name cell becomes an editable `Input` prefilled with the current name.
  - The pencil icon is replaced with a **small primary button with a checkmark icon**.
  - That button shows a **tooltip "Approve"** on hover.
- Pressing the approve button saves the new name and exits edit mode.
- Pressing the trash icon during edit mode cancels edit (or we keep delete disabled while editing — see Technical).
- Only one row editable at a time.
- Pressing `Enter` in the input also approves; `Escape` cancels.

## Technical
- Edit `src/pages/Caregivers.tsx`:
  - Local state `editingId: string | null` and `editingName: string`.
  - Conditional render in the name `TableCell`: `Input` when `editingId === caregiver.id`, otherwise plain text.
  - Action cell: when editing → primary `Button` (size `icon`, `h-8 w-8`) with `Check` icon wrapped in `Tooltip` showing "Approve". When not editing → ghost `Button` with `Pencil` icon. Delete button remains, disabled while this row is being edited.
  - Wrap the table in `TooltipProvider` (or rely on the app-level provider if present).
- Extend `src/hooks/useCaregivers.ts` with an `updateCaregiver(id, name)` function that updates `name` in the `caregivers` table for the current user, then refetches. (Uses existing RLS — same pattern as `deleteCaregiver`.)
- Add i18n keys in `src/lib/i18n.tsx`: `approve` ("Approve" / "אישור"), `edit` ("Edit" / "עריכה") for accessibility labels.
- Validation: trim, non-empty, max 100 chars; toast on error/success reusing existing `t('success')` / `t('error')`.

## Out of scope
- Editing the caregiver type (only the name is editable, per the request).
- Bulk edits or keyboard navigation beyond Enter/Escape.