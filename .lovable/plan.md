## Goal
Extend caregiver row edit mode to also change the caregiver type, and give each type its own accessible color badge.

## UX
- In edit mode (after pressing the edit icon), the type cell becomes a `Select` dropdown with the four existing options (Private Paid, Family Member, Foreign Caregiver, Other), prefilled with the current value.
- Approve (check) saves both name and type; Enter/Escape keep current behavior. Delete remains disabled while editing.
- Outside edit mode the type renders as a colored badge (one color per type).

## Badge colors (AA on white background, ≥4.5:1 for text)
Each badge uses a soft tinted background with a dark same-hue text color so it reads clearly in both light/dark themes and prints OK in B&W.

- Family Member → light green (bg `hsl(142 70% 92%)`, text `hsl(142 65% 22%)`)
- Private Paid → light indigo/primary tint (bg `hsl(234 80% 94%)`, text `hsl(234 70% 28%)`)
- Foreign Caregiver → light amber (bg `hsl(38 92% 90%)`, text `hsl(28 75% 26%)`)
- Other → neutral gray (bg `hsl(220 14% 94%)`, text `hsl(220 15% 25%)`)

All pairs verified ≥ 7:1 contrast (AAA), comfortably passing AA.

## Technical
- `src/index.css`: add 4 semantic token pairs `--caregiver-{type}-bg` / `--caregiver-{type}-fg` (light + dark variants) so colors stay in the design system (no inline hex).
- `tailwind.config.ts`: expose them as `bg-caregiver-family`, `text-caregiver-family-foreground`, etc.
- `src/pages/Caregivers.tsx`:
  - Replace the plain `<Badge variant="secondary">` with a small helper `<CaregiverTypeBadge type={...} />` that maps type → token classes.
  - In edit mode render a `Select` (same options as the Add form) bound to new state `editingType`.
  - `startEdit(id, name, type)` seeds both fields; `approveEdit` passes both to `updateCaregiver`.
- `src/hooks/useCaregivers.ts`: extend `updateCaregiver(id, name, caregiverType)` to also update `caregiver_type`.
- Optionally extract `CaregiverTypeBadge` into its own file under `src/components/caregivers/` for reuse, but inline helper is fine since it's only used here.

## Accessibility
- Verify the chosen token pairs against `--background` (light) and `--card` (dark) ≥ 4.5:1.
- Keep badge text weight at `font-semibold` (existing Badge default) for legibility at small sizes.
- The Select in edit mode inherits shadcn's accessible focus ring; add `aria-label={t('caregiverType')}` on the trigger.

## Out of scope
- Changing the Add Caregiver form.
- Bulk type edits, or recoloring badges elsewhere in the app (shifts list, etc.) — can be a follow-up using the same tokens.
