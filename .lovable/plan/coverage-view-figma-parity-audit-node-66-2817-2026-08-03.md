# Coverage view: Figma parity audit (node 66-2817)

Goal: compare the built Coverage page against the original Figma design and close the visual gaps. Visual polish only — no logic, data, or behavior changes.

## Step 1 — Connect Figma (you)

I can't read the Figma link without a live desktop session. To enable it:

1. Install the Lovable Desktop app: https://lovable.dev/download
2. Open Figma Desktop, open the AidFlow file
3. Switch to Dev Mode (Shift+D)
4. In the inspect panel, click "Enable desktop MCP server"
5. In Lovable: Settings -> Connectors -> Local MCP servers -> connect it
6. Select node 66-2817 in Figma and tell me to go

The connector is read-only; nothing is written back to Figma.

Fallback if setup stalls: paste a screenshot of node 66-2817 and I'll work from that instead.

## Step 2 — Audit

Once connected I read node 66-2817 and diff it against the live Coverage page, capturing screenshots of both Day and Week views. I compare:

- Card and section spacing, padding, radii
- Hour axis: tick style, label positions, type size and color
- Timeline row height, block radii, gaps between blocks
- Overlap block treatment: height, bottom offset, stripe pattern angle/density/opacity
- Gap/uncovered block fill, border, and label
- Legend: swatch size, spacing, label wording and order
- Coverage badge: fill, text color, border, placement
- Day/Week tab styling, date nav controls, caregiver filter
- Typography scale and weights throughout

I report the diff as a short list before touching anything, so you can pick what to apply.

## Step 3 — Apply

Only the approved deltas, restricted to the Coverage files:

- `src/components/coverage/CoverageTimeline.tsx`
- `src/components/coverage/CoverageLegend.tsx`
- `src/components/coverage/DailyCoverage.tsx`
- `src/components/coverage/WeeklyCoverage.tsx`
- `src/pages/Coverage.tsx`

## Constraints

- Existing `src/components/ui/` components only
- Existing Tailwind tokens only — no new CSS variables, no hardcoded hex
- No new packages
- No opacity modifiers on text colors
- `coverageLayout.ts` is layout math and stays untouched
- Known out-of-scope item that stays out of scope: the Week view Export button is still UI-only

## Notes on likely mismatches

Two things I already know may differ from the design and would need your call:

- Uncovered gap uses Tailwind `orange-100` / `orange-500` / `orange-700`, not the `#fbeee4` / `#c2410c` pair from the earlier color pass
- Legend label reads "Paid Supervision" (from i18n), while recent design references say "Paid Caregiver"
