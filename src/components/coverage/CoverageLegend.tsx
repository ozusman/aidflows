import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

export function CoverageLegend() {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-x-7 gap-y-2 text-[11px]">
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-[4px] border border-border bg-caregiver-private" />
        <span>{t("paidCaregiver")}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-[4px] border border-border bg-caregiver-family" />
        <span>{t("familyCaregiver")}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-[4px] border border-border bg-caregiver-volunteer" />
        <span>Volunteer</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-[4px] border border-border bg-coverage-gap" />
        <span>{t("uncovered")}</span>
      </div>
    </div>
  );
}

export function CoverageStatus({ coveragePercent }: { coveragePercent: number }) {
  return coveragePercent === 100 ? (
    <Badge className="bg-green-100 text-green-800 border-green-200">✓ Full Coverage</Badge>
  ) : (
    <Badge className="rounded-full border-0 bg-coverage-gap text-coverage-gap-foreground">⚠ Gaps Detected</Badge>
  );
}
