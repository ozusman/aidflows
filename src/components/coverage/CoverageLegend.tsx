import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

export function CoverageLegend() {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-caregiver-private" />
        <span>{t("paidCaregiver")}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-caregiver-family" />
        <span>{t("familyCaregiver")}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-caregiver-volunteer" />
        <span>Volunteer</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-orange-100 border-2 border-orange-500" />
        <span>{t("uncovered")}</span>
      </div>
    </div>
  );
}

export function CoverageStatus({ coveragePercent }: { coveragePercent: number }) {
  return coveragePercent === 100 ? (
    <Badge className="bg-green-100 text-green-800 border-green-200">✓ Full Coverage</Badge>
  ) : (
    <Badge className="bg-orange-100 text-orange-700 border border-orange-500">⚠ Gaps Detected</Badge>
  );
}
