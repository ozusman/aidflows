import { useEffect, useRef, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DayLayout,
  caregiverClasses,
  caregiverStripeClasses,
  caregiverPillClasses,
  shiftLabel,
} from "./coverageLayout";

const DAY_MINUTES = 24 * 60;

/** Renders a label that only shows a tooltip when it is actually truncated. */
function TruncatedLabel({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setTruncated(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  const span = (
    <span ref={ref} className={cn("truncate px-1", className)}>
      {text}
    </span>
  );

  if (!truncated) return span;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{span}</TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

/** Diagonal stripe fill used on overlapping blocks (tinted by the block's type color). */
function StripeFill({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 opacity-60", className)}
      style={{
        backgroundImage:
          "repeating-linear-gradient(110deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 8px)",
      }}
    />
  );
}


export function HourGrid({ children }: { children?: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
        <span
          key={h}
          className="absolute top-0 bottom-0 w-px bg-border"
          style={{ left: `${(h / 24) * 100}%` }}
        />
      ))}
      {children}
    </div>
  );
}

export function HourAxis() {
  return (
    <div className="relative h-4 text-xs text-muted-foreground" dir="ltr">
      {Array.from({ length: 25 }, (_, h) => h).map((h) => {
        const labeled = h % 8 === 0;
        return (
          <span
            key={h}
            className="absolute top-0"
            style={{
              left: `${(h / 24) * 100}%`,
              transform: h === 0 ? "none" : h === 24 ? "translateX(-100%)" : "translateX(-50%)",
            }}
          >
            {labeled ? (
              <span>{`${String(h).padStart(2, "0")}:00`}</span>
            ) : (
              <span className="block h-2 w-px bg-border" />
            )}
          </span>
        );
      })}
    </div>
  );
}

interface CoverageTimelineProps {
  layout: DayLayout;
  gapLabel: string;
  uncoveredLabel: string;
}

export function CoverageTimeline({ layout, gapLabel, uncoveredLabel }: CoverageTimelineProps) {
  const maxLane = layout.overlay.reduce((m, o) => Math.max(m, o.lane), -1);
  // A day with no shifts at all renders as a plain neutral track (no gap styling).
  const hasShifts =
    layout.primary.some((b) => b.type === "caregiver") || layout.overlay.length > 0;

  if (!hasShifts) {
    return <div className="relative h-12 rounded-[4px] bg-background" dir="ltr" />;
  }

  return (
    <div className="relative h-12 rounded-[4px] bg-background mb-1" dir="ltr">
      {/* Primary track */}
      <div className="absolute inset-0 flex gap-[2px]">
        {layout.primary.map((block, index) => {
          const widthPercent = ((block.endMinute - block.startMinute) / DAY_MINUTES) * 100;
          const hasOverlayHere = layout.overlay.some(
            (o) => o.startMinute < block.endMinute && o.endMinute > block.startMinute,
          );
          const label = block.rendered ? shiftLabel(block.rendered.shift) : "";
          return (
            <div
              key={`p-${index}`}
              className={cn(
                "relative h-full flex text-xs font-medium rounded-[4px] overflow-hidden justify-center",
                hasOverlayHere ? "items-start pt-1" : "items-center",
                block.type === "caregiver" && block.rendered && caregiverClasses(block.rendered.shift),
                block.type === "gap" && "bg-coverage-gap text-coverage-gap-foreground items-center",
              )}
              style={{ width: `${widthPercent}%` }}
            >
              {hasOverlayHere && block.type === "caregiver" && block.rendered && (
                <StripeFill className={caregiverStripeClasses(block.rendered.shift)} />
              )}
              {block.rendered && (
                <TruncatedLabel
                  text={label}
                  className={cn(
                    "relative",
                    hasOverlayHere && [
                      "rounded-[4px] mx-[2px]",
                      caregiverPillClasses(block.rendered.shift),
                    ],
                  )}
                />
              )}
              {block.type === "gap" && (
                <TruncatedLabel text={`⚠ ${gapLabel || uncoveredLabel}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Overlap blocks: half-height, anchored to the bottom edge */}
      {layout.overlay.map((block, index) => {
        const leftPercent = (block.startMinute / DAY_MINUTES) * 100;
        const widthPercent = ((block.endMinute - block.startMinute) / DAY_MINUTES) * 100;
        const label = shiftLabel(block.rendered.shift);
        // Deeper lanes shrink slightly so 3+ overlaps stay inside the row.
        const laneOffset = Math.min(block.lane, maxLane) * 3;
        return (
          <div
            key={`o-${index}`}
            className={cn(
              "absolute h-1/2 rounded-[4px] shadow-overlap flex items-center justify-center text-[11px] font-medium overflow-hidden mb-0",
              caregiverClasses(block.rendered.shift),
            )}
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              bottom: `${laneOffset}px`,
            }}
          >
            <TruncatedLabel text={label} className="relative" />
          </div>
        );
      })}
    </div>
  );
}
