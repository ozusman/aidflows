# Coverage timeline: overlap shadow + track background

Two Figma details are confirmed missing in `src/components/coverage/CoverageTimeline.tsx`.

## What is wrong today

1. **Overlap block shadow** — the block uses the generic `shadow-md` utility, which in this project resolves to a very soft `0px 1px 4.5px rgba(0,0,0,0.11)`. The Figma spec is a two-part shadow: a blurred drop shadow plus a hard 1px offset edge in `#545A56`. That hard edge is what visually separates the overlap block from the primary block, so right now overlaps look flat.

2. **Row background** — the track renders with `bg-muted` (`hsl(213 23% 89%)`, roughly `#E1E5EA`), a blue-tinted grey. Figma calls for neutral `#f5f5f5`.

## What will change

- Give the overlap block the exact Figma shadow.
- Switch the empty-day track and the timeline track to the neutral `#f5f5f5` grey.

Nothing else about the timeline changes: stripe fills, tinted label pills, gap styling, block radii and the 2px gaps all stay as they are.

## Technical details

- `#f5f5f5` is exactly `hsl(0 0% 96%)`, which is the already-defined `--background` token. Both track wrappers switch from `bg-muted` to `bg-background`. No new colour value is introduced.
- The overlap shadow is not expressible with an existing utility, so it needs one shadow definition:
  - add `--shadow-overlap: 1px 1px 3px 0 hsl(0 0% 0% / 0.33), 1px 1px 0 0 hsl(140 3% 34%);` to `:root` in `src/index.css` (`hsl(140 3% 34%)` is `#545A56`), plus a dark-mode value in `.dark`;
  - map it in `tailwind.config.ts` as `boxShadow.overlap`;
  - replace `shadow-md` with `shadow-overlap` on the overlap block.
- Files touched: `src/index.css`, `tailwind.config.ts`, `src/components/coverage/CoverageTimeline.tsx`.

This adds one CSS variable. It is the only way to express the specified two-part shadow without inlining hardcoded rgba in the component; if you would rather keep the variable list frozen, the alternative is an inline `style={{ boxShadow: ... }}` on that one block.
