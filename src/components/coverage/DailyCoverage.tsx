import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useShifts } from "@/hooks/useShifts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, subDays, format } from "date-fns";
import { buildLayout, buildRenderedShifts } from "./coverageLayout";
import { CoverageTimeline, HourAxis } from "./CoverageTimeline";
import { CoverageLegend, CoverageStatus } from "./CoverageLegend";

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

  const layout = useMemo(
    () => buildLayout(buildRenderedShifts(shifts, prevDayShifts)),
    [shifts, prevDayShifts],
  );

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
                aria-label={t("selectDate")}
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
          <CardTitle className="text-base font-medium flex items-center justify-between gap-4">
            <span>{t("dailyCoverage")}</span>
            <CoverageStatus coveragePercent={coveragePercent} />
            <span className="text-lg font-semibold">{coveragePercent}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <HourAxis />
            <CoverageTimeline layout={layout} gapLabel="Gap" uncoveredLabel={t("uncovered")} />
            <CoverageLegend />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
