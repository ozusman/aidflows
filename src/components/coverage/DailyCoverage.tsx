import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useShifts } from "@/hooks/useShifts";
import { Shift } from "@/types/shift";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, subDays, format } from "date-fns";
import { cn } from "@/lib/utils";

type SegType = "caregiver" | "gap";

interface RenderedShift {
  startMin: number; // within [0, 1440]
  endMin: number;   // within [0, 1440]
  shift: Shift;
  notchLeft?: boolean;  // shift continues from previous day
  notchRight?: boolean; // shift continues into next day
}

interface PrimarySegment {
  startMinute: number;
  endMinute: number;
  type: SegType;
  rendered?: RenderedShift;
  notchLeft?: boolean;
  notchRight?: boolean;
}

interface OverlaySegment {
  startMinute: number;
  endMinute: number;
  rendered: RenderedShift;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function caregiverClasses(s: Shift): string {
  switch (s.caregiverType) {
    case "family_member":
      return "bg-caregiver-family text-caregiver-family-foreground";
    case "volunteer":
      return "bg-caregiver-volunteer text-caregiver-volunteer-foreground";
    case "private_paid":
    default:
      return "bg-caregiver-private text-caregiver-private-foreground";
  }
}

function shiftLabel(s: Shift): string {
  return `${s.caregiverName} · ${s.startTime}–${s.endTime}`;
}

/**
 * Convert raw shifts (for the selected day) plus previous-day midnight-crossing
 * shifts into rendered pieces clipped to the [0, 1440] window of the selected day.
 */
function buildRenderedShifts(dayShifts: Shift[], prevDayShifts: Shift[]): RenderedShift[] {
  const out: RenderedShift[] = [];

  for (const s of dayShifts) {
    const startMin = timeToMinutes(s.startTime);
    const endMin = timeToMinutes(s.endTime);
    if (endMin <= startMin) {
      // Crosses midnight — render only the start-day portion here.
      out.push({ startMin, endMin: 1440, shift: s, notchRight: true });
    } else {
      out.push({ startMin, endMin, shift: s });
    }
  }

  // Carry-over: previous-day shifts that cross midnight contribute their 00:00→endTime tail.
  for (const s of prevDayShifts) {
    const startMin = timeToMinutes(s.startTime);
    const endMin = timeToMinutes(s.endTime);
    if (endMin <= startMin) {
      out.push({ startMin: 0, endMin, shift: s, notchLeft: true });
    }
  }

  return out;
}

/**
 * Sweep-line layout: builds a single primary track (so non-overlapping shifts
 * look exactly like before) plus a secondary overlay track that only renders
 * during overlap intervals — so concurrent shifts no longer disappear.
 */
function buildLayout(rendered: RenderedShift[]): {
  primary: PrimarySegment[];
  overlay: OverlaySegment[];
  coveredMinutes: number;
} {
  if (rendered.length === 0) {
    return {
      primary: [{ startMinute: 0, endMinute: 1440, type: "gap" }],
      overlay: [],
      coveredMinutes: 0,
    };
  }

  // Deterministic order: earliest start, then longer duration first.
  const sorted = [...rendered].sort(
    (a, b) =>
      a.startMin - b.startMin ||
      b.endMin - b.startMin - (a.endMin - a.startMin),
  );

  const boundsSet = new Set<number>([0, 1440]);
  for (const r of sorted) {
    boundsSet.add(r.startMin);
    boundsSet.add(r.endMin);
  }
  const bounds = [...boundsSet].sort((a, b) => a - b);

  const primaryRaw: PrimarySegment[] = [];
  const overlayRaw: OverlaySegment[] = [];

  for (let i = 0; i < bounds.length - 1; i++) {
    const a = bounds[i];
    const b = bounds[i + 1];
    if (a === b) continue;
    const active = sorted.filter((r) => r.startMin < b && r.endMin > a);
    if (active.length === 0) {
      primaryRaw.push({ startMinute: a, endMinute: b, type: "gap" });
    } else {
      const p = active[0];
      primaryRaw.push({
        startMinute: a,
        endMinute: b,
        type: shiftType(p.shift),
        rendered: p,
      });
      for (let j = 1; j < active.length; j++) {
        const s = active[j];
        overlayRaw.push({
          startMinute: a,
          endMinute: b,
          type: shiftType(s.shift),
          rendered: s,
        });
      }
    }
  }

  // Merge adjacent primary segments with the same shift / same gap.
  const primary: PrimarySegment[] = [];
  for (const seg of primaryRaw) {
    const last = primary[primary.length - 1];
    const sameKey =
      last &&
      last.endMinute === seg.startMinute &&
      last.type === seg.type &&
      last.rendered?.shift.id === seg.rendered?.shift.id;
    if (sameKey) {
      last.endMinute = seg.endMinute;
    } else {
      primary.push({ ...seg });
    }
  }
  // Attach notch info based on the underlying rendered piece touching the day's edges.
  for (const seg of primary) {
    if (seg.rendered?.notchLeft && seg.startMinute === 0) seg.notchLeft = true;
    if (seg.rendered?.notchRight && seg.endMinute === 1440) seg.notchRight = true;
  }

  // Merge adjacent overlay segments belonging to the same shift.
  const overlay: OverlaySegment[] = [];
  for (const seg of overlayRaw) {
    const last = overlay[overlay.length - 1];
    if (last && last.endMinute === seg.startMinute && last.rendered.shift.id === seg.rendered.shift.id) {
      last.endMinute = seg.endMinute;
    } else {
      overlay.push({ ...seg });
    }
  }

  // Coverage = union of all rendered intervals (primary track already represents
  // the union because overlay shifts only occur during primary-covered time, but
  // an overlay shift CAN fill a primary gap when it extends past the primary's end).
  const intervals: [number, number][] = [];
  for (const seg of primary) {
    if (seg.type !== "gap") intervals.push([seg.startMinute, seg.endMinute]);
  }
  for (const seg of overlay) intervals.push([seg.startMinute, seg.endMinute]);
  intervals.sort((x, y) => x[0] - y[0]);
  let coveredMinutes = 0;
  let curEnd = -1;
  for (const [s, e] of intervals) {
    if (s >= curEnd) {
      coveredMinutes += e - s;
      curEnd = e;
    } else if (e > curEnd) {
      coveredMinutes += e - curEnd;
      curEnd = e;
    }
  }

  return { primary, overlay, coveredMinutes };
}

export function DailyCoverage() {
  const { t, isRTL } = useI18n();
  const { getShiftsByDate } = useShifts();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const shifts = getShiftsByDate(selectedDate);
  const prevDateStr = useMemo(
    () => format(subDays(new Date(selectedDate), 1), "yyyy-MM-dd"),
    [selectedDate],
  );
  const prevDayShifts = getShiftsByDate(prevDateStr);

  const layout = useMemo(() => {
    const rendered = buildRenderedShifts(shifts, prevDayShifts);
    return buildLayout(rendered);
  }, [shifts, prevDayShifts]);

  const coveragePercent = Math.round((layout.coveredMinutes / (24 * 60)) * 100);

  const navigateDate = (direction: "prev" | "next") => {
    const date = new Date(selectedDate);
    const newDate = direction === "prev" ? subDays(date, 1) : addDays(date, 1);
    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")} aria-label={t("previous")}>
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            <div className="flex-1 max-w-[200px]">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-center"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")} aria-label={t("next")}>
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <span>{t("dailyCoverage")}</span>
            {coveragePercent === 100 ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">✓ Full Coverage</Badge>
            ) : (
              <Badge className="bg-orange-100 text-orange-700 border border-orange-300">⚠ Gap Detected</Badge>
            )}
            <span className="text-lg font-semibold">{coveragePercent}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Timeline */}
          <div className="space-y-4">
            {/* Hour markers */}
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>

            {/* Timeline bar */}
            <div className="relative h-12 rounded-md bg-muted overflow-hidden" dir="ltr">
              {/* Primary track */}
              <div className="absolute inset-0 flex">
                {layout.primary.map((block, index) => {
                  const widthPercent = ((block.endMinute - block.startMinute) / (24 * 60)) * 100;
                  return (
                    <div
                      key={`p-${index}`}
                      className={cn(
                        "relative h-full flex items-center justify-center text-xs font-medium transition-colors",
                        block.type === "paid" && "bg-primary text-primary-foreground",
                        block.type === "family" && "bg-muted-foreground/30 text-foreground",
                        block.type === "gap" && "bg-orange-100 border border-orange-300 text-orange-700",
                      )}
                      style={{ width: `${widthPercent}%` }}
                      title={block.rendered?.shift.caregiverName || t("uncovered")}
                    >
                      {widthPercent > 8 && block.rendered && (
                        <span className="truncate px-1">{block.rendered.shift.caregiverName}</span>
                      )}
                      {widthPercent > 5 && block.type === "gap" && <span className="truncate px-1">Gap</span>}
                    </div>
                  );
                })}
              </div>

              {/* Overlay track for concurrent shifts (stacked thin bar) */}
              {layout.overlay.length > 0 && (
                <div className="absolute left-0 right-0 bottom-0 h-1/2 pointer-events-none">
                  {layout.overlay.map((block, index) => {
                    const leftPercent = (block.startMinute / (24 * 60)) * 100;
                    const widthPercent = ((block.endMinute - block.startMinute) / (24 * 60)) * 100;
                    return (
                      <div
                        key={`o-${index}`}
                        className={cn(
                          "absolute top-0 h-full border-t-2 border-background pointer-events-auto",
                          block.type === "paid" && "bg-primary",
                          block.type === "family" && "bg-muted-foreground/60",
                        )}
                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                        title={block.rendered.shift.caregiverName}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary"></div>
                <span>{t("paidCaregiver")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted-foreground/30"></div>
                <span>{t("familyCaregiver")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
                <span>{t("uncovered")}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
