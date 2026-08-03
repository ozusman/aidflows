# Coverage visual parity pass (Figma node 66:2817)

Visual-polish only. No logic, no schema, no new packages, no new CSS variables — only existing `ui/` components and tokens already defined.

## What the reference shows vs. what's built

| Detail | Figma reference | Current build |
| --- | --- | --- |
| Shift block | Solid pastel fill with a thin dark vertical accent bar on the leading edge | Flat fill, no accent bar |
| Gap block | Soft peach fill, no heavy outline, centered `⚠ Gap` in orange | 2px solid orange border ring |
| Row height | Taller rows with clear vertical breathing room between days | `h-12` rows, tighter |
| Gaps between blocks | Blocks butt together; separation comes from the accent bar | `gap-0.5` visible seams |
| Overlap block | Half-height, bottom-anchored, solid fill, own accent bar; the primary block behind it carries the diagonal stripes | Matches structurally; stripe angle/density and border read differently |
| Stripes | Dense, steep diagonal hatch across the whole overlapped primary block | Sparser 45° hatch at 40% opacity |
| Hour axis | Small tick marks every hour, labels only at 00:00 / 08:00 / 16:00 / 24:00 | Matches |
| Day labels | Left column, muted, aligned to row center | Matches |
| Legend | Small rounded swatches, four items, gap swatch shown as peach fill | Gap swatch has a 2px orange border |

## Changes

**`src/components/coverage/CoverageTimeline.tsx`**
- Add a leading accent bar to every caregiver block and every overlap block (a thin inset element using the block's own foreground token, so it stays per-type colored).
- Increase row height and remove the inter-block `gap-0.5` so blocks sit flush like the reference.
- Gap blocks: drop the 2px border, keep the peach fill and orange label with the warning glyph.
- Retune `StripeFill` to a steeper, denser hatch closer to the reference, and let it cover the full overlapped block rather than reading as a light wash.
- Overlap block: keep half-height bottom anchoring; swap the background-colored border for the accent-bar treatment.

**`src/components/coverage/CoverageLegend.tsx`**
- Gap swatch matches the new borderless gap block styling; keep all four items and their labels.

**`src/components/coverage/WeeklyCoverage.tsx` / `DailyCoverage.tsx`**
- Row spacing and card padding adjusted only as needed so the taller rows sit correctly. No structural or data changes.

## Not in scope
- Export button stays UI-only (previously flagged follow-up).
- No changes to sweep-line layout, midnight split, coverage math, or filters.
