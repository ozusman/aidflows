import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useShifts } from "@/hooks/useShifts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { addDays, subDays, format, startOfWeek } from "date-fns";
import { buildLayout, buildRenderedShifts } from "./coverageLayout";
import { CoverageTimeline, HourAxis } from "./CoverageTimeline";
import { CoverageLegend, CoverageStatus } from "./CoverageLegend";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeeklyCoverage() {
  const { t, isRTL } = useI18n();
  const { shifts, getShiftsByDate, getUniqueCaregivers } = useShifts();
  const [weekStart, setWeekStart] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd"),
  );
  const [caregiverFilter, setCaregiverFilter] = useState("all");

  const caregivers = useMemo(() => getUniqueCaregivers(), [getUniqueCaregivers]);

  const days = useMemo(() => {
    const start = new Date(weekStart);
    return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
  }, [weekStart]);

  const rows = useMemo(() => {
    const matches = (name: string) => caregiverFilter === "all" || name === caregiverFilter;
    return days.map((date, index) => {
      const dayShifts = getShiftsByDate(date).filter((s) => matches(s.caregiverName));
      const prevShifts = getShiftsByDate(format(subDays(new Date(date), 1), "yyyy-MM-dd")).filter(
        (s) => matches(s.caregiverName),
      );
      return {
        date,
        label: DAY_LABELS[index],
        layout: buildLayout(buildRenderedShifts(dayShifts, prevShifts)),
      };
    });
    // shifts included so rows recompute when data changes
  }, [days, getShiftsByDate, caregiverFilter, shifts]);

  const coveragePercent = Math.round(
    (rows.reduce((sum, r) => sum + r.layout.coveredMinutes, 0) / (7 * 24 * 60)) * 100,
  );

  const navigateWeek = (direction: "prev" | "next") => {
    const start = new Date(weekStart);
    setWeekStart(format(direction === "prev" ? subDays(start, 7) : addDays(start, 7), "yyyy-MM-dd"));
  };

  const rangeLabel = `${format(new Date(days[0]), "dd/MM")} - ${format(new Date(days[6]), "dd/MM/yyyy")}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")} aria-label={t("previous")}>
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            <div className="w-[170px]">
              <Input
                type="date"
                value={weekStart}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setWeekStart(
                    format(startOfWeek(new Date(e.target.value), { weekStartsOn: 0 }), "yyyy-MM-dd"),
                  );
                }}
                className="text-center"
                aria-label={t("selectWeek")}
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateWeek("next")} aria-label={t("next")}>
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            <span className="text-sm text-muted-foreground" dir="ltr">
              {rangeLabel}
            </span>

            <Select value={caregiverFilter} onValueChange={setCaregiverFilter}>
              <SelectTrigger className="w-[200px]" aria-label={t("selectCaregiver")}>
                <SelectValue placeholder={t("allCaregivers")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCaregivers")}</SelectItem>
                {caregivers.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2" disabled>
              <Download className="w-4 h-4" />
              {t("export")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center justify-between gap-4">
            <span>{t("weeklyCoverage")}</span>
            <CoverageStatus coveragePercent={coveragePercent} />
            <span className="text-lg font-semibold">{coveragePercent}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 shrink-0" />
              <div className="flex-1">
                <HourAxis />
              </div>
            </div>
            {rows.map((row) => (
              <div key={row.date} className="flex items-center gap-3">
                <div className="w-10 shrink-0 text-sm text-muted-foreground">{row.label}</div>
                <div className="flex-1">
                  <CoverageTimeline layout={row.layout} gapLabel="Gap" uncoveredLabel={t("uncovered")} />
                </div>
              </div>
            ))}
            <CoverageLegend />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
