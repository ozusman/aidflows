import { Shift } from "@/types/shift";

export type SegType = "caregiver" | "gap";

export interface RenderedShift {
  startMin: number; // within [0, 1440]
  endMin: number; // within [0, 1440]
  shift: Shift;
  notchLeft?: boolean;
  notchRight?: boolean;
}

export interface PrimarySegment {
  startMinute: number;
  endMinute: number;
  type: SegType;
  rendered?: RenderedShift;
  notchLeft?: boolean;
  notchRight?: boolean;
}

export interface OverlaySegment {
  startMinute: number;
  endMinute: number;
  rendered: RenderedShift;
  lane: number;
}

export interface DayLayout {
  primary: PrimarySegment[];
  overlay: OverlaySegment[];
  coveredMinutes: number;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function caregiverClasses(s: Shift): string {
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

/** Stripe ink color per caregiver type (darker "dot" tone of the same hue). */
export function caregiverStripeClasses(s: Shift): string {
  switch (s.caregiverType) {
    case "family_member":
      return "text-caregiver-family-dot";
    case "volunteer":
      return "text-caregiver-volunteer-dot";
    case "private_paid":
    default:
      return "text-caregiver-private-dot";
  }
}

/** Translucent label pill tinted with the caregiver type color. */
export function caregiverPillClasses(s: Shift): string {
  switch (s.caregiverType) {
    case "family_member":
      return "bg-caregiver-family/60";
    case "volunteer":
      return "bg-caregiver-volunteer/60";
    case "private_paid":
    default:
      return "bg-caregiver-private/60";
  }
}

export function shiftLabel(s: Shift): string {
  return `${s.caregiverName} · ${s.startTime}–${s.endTime}`;
}

/**
 * Convert raw shifts (for the selected day) plus previous-day midnight-crossing
 * shifts into rendered pieces clipped to the [0, 1440] window of the selected day.
 */
export function buildRenderedShifts(dayShifts: Shift[], prevDayShifts: Shift[]): RenderedShift[] {
  const out: RenderedShift[] = [];

  for (const s of dayShifts) {
    const startMin = timeToMinutes(s.startTime);
    const endMin = timeToMinutes(s.endTime);
    if (endMin <= startMin) {
      out.push({ startMin, endMin: 1440, shift: s, notchRight: true });
    } else {
      out.push({ startMin, endMin, shift: s });
    }
  }

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
 * Sweep-line layout: one primary track plus overlay segments (lane 0, 1, ...)
 * that only render during overlap intervals.
 */
export function buildLayout(rendered: RenderedShift[]): DayLayout {
  if (rendered.length === 0) {
    return {
      primary: [{ startMinute: 0, endMinute: 1440, type: "gap" }],
      overlay: [],
      coveredMinutes: 0,
    };
  }

  const sorted = [...rendered].sort(
    (a, b) => a.startMin - b.startMin || b.endMin - b.startMin - (a.endMin - a.startMin),
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
      primaryRaw.push({ startMinute: a, endMinute: b, type: "caregiver", rendered: active[0] });
      for (let j = 1; j < active.length; j++) {
        overlayRaw.push({ startMinute: a, endMinute: b, rendered: active[j], lane: j - 1 });
      }
    }
  }

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
  for (const seg of primary) {
    if (seg.rendered?.notchLeft && seg.startMinute === 0) seg.notchLeft = true;
    if (seg.rendered?.notchRight && seg.endMinute === 1440) seg.notchRight = true;
  }

  const overlay: OverlaySegment[] = [];
  for (const seg of overlayRaw) {
    const last = overlay[overlay.length - 1];
    if (
      last &&
      last.endMinute === seg.startMinute &&
      last.rendered.shift.id === seg.rendered.shift.id &&
      last.lane === seg.lane
    ) {
      last.endMinute = seg.endMinute;
    } else {
      overlay.push({ ...seg });
    }
  }

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
