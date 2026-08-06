import { useLayoutEffect, useRef, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DayLayout,
  caregiverClasses,
  caregiverMarkerClasses,
  caregiverStripeClasses,
  caregiverPillClasses,
  shiftLabel,
} from "./coverageLayout";

const DAY_MINUTES = 24 * 60;

/** Renders a label that only shows a tooltip when it is actually truncated. */
function TruncatedLabel({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    setTruncated(el.scrollWidth > el.clientWidth + 1);
  };

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [text]);

  return (
    <Tooltip open={truncated ? undefined : false}>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "flex w-full min-w-0 max-w-full items-center justify-center overflow-hidden pl-[7px] pr-1",
            className,
          )}
          onPointerEnter={measure}
        >
          <span
            ref={ref}
            className={cn(
              "block w-full min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-center",
              truncated && "cursor-pointer select-none",
            )}
          >
            {text}
          </span>
        </span>
      </TooltipTrigger>
      {truncated && <TooltipContent>{text}</TooltipContent>}
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
    <div className="relative h-12 rounded-[4px] bg-background" dir="ltr">
      {/* Primary track */}
      <div className="absolute inset-0 flex items-center gap-[2px]">
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
                // 4px internal padding on all sides; base shift is 46px inside an overlap group.
                "relative p-1 flex text-xs font-medium rounded-[4px] overflow-hidden justify-center shadow-shift min-w-0",
                hasOverlayHere ? "h-[46px] items-start" : "h-full items-center",
                block.type === "caregiver" && block.rendered && caregiverClasses(block.rendered.shift),
                block.type === "gap" && "bg-coverage-gap text-coverage-gap-foreground items-center",
              )}
              style={{ width: `${widthPercent}%` }}
            >
              {hasOverlayHere && block.type === "caregiver" && block.rendered && (
                <StripeFill className={caregiverStripeClasses(block.rendered.shift)} />
              )}
              {block.type === "caregiver" && block.rendered && (
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-y-1 left-1 w-[3px] rounded-full",
                    caregiverMarkerClasses(block.rendered.shift),
                  )}
                />
              )}
              {block.rendered && (
                <TruncatedLabel
                  text={label}
                  className={cn(
                    "relative",
                    hasOverlayHere && ["rounded-[4px]", caregiverPillClasses(block.rendered.shift)],
                  )}
                />
              )}
              {block.type === "gap" && <TruncatedLabel text={`⚠ ${gapLabel || uncoveredLabel}`} className="relative" />}
            </div>
          );
        })}
      </div>

      {/* Overlap group: 1px vertical inset inside the 48px row */}
      <div className="pointer-events-none absolute inset-x-0 inset-y-px">
        {layout.overlay.map((block, index) => {
          const leftPercent = (block.startMinute / DAY_MINUTES) * 100;
          const widthPercent = ((block.endMinute - block.startMinute) / DAY_MINUTES) * 100;
          const label = shiftLabel(block.rendered.shift);
          // Lane 0 sits 2px above the group's bottom so the shadow stays inside the base shift.
          const laneOffset = Math.min(block.lane, maxLane) * 3;
          return (
            <div
              key={`o-${index}`}
              className={cn(
                "pointer-events-auto absolute h-6 p-1 rounded-[4px] shadow-overlap flex items-center justify-center text-[11px] font-medium",
                caregiverClasses(block.rendered.shift),
              )}
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                bottom: `${2 + laneOffset}px`,
              }}
            >
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-y-1 left-1 w-[3px] rounded-full",
                  caregiverMarkerClasses(block.rendered.shift),
                )}
              />
              <TruncatedLabel text={label} className="relative" />
            </div>
          );
        })}
      </div>

    </div>
  );
}
