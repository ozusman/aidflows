import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { CaregiverType } from '@/types/shift';

export const CAREGIVER_TYPE_BADGE_CLASSES: Record<CaregiverType, string> = {
  private_paid: 'bg-caregiver-private text-caregiver-private-foreground hover:bg-caregiver-private/90',
  family_member: 'bg-caregiver-family text-caregiver-family-foreground hover:bg-caregiver-family/90',
  volunteer: 'bg-caregiver-volunteer text-caregiver-volunteer-foreground hover:bg-caregiver-volunteer/90',
};

export function getCaregiverTypeLabel(type: CaregiverType | string, t: (key: any) => string): string {
  const labels: Record<string, string> = {
    private_paid: t('typePrivatePaid'),
    family_member: t('typeFamilyMember'),
    volunteer: t('typeVolunteer'),
  };
  return labels[type] || type;
}

export function CaregiverTypeBadge({ type, label }: { type: CaregiverType | string; label?: string }) {
  const { t } = useI18n();
  const displayLabel = label ?? getCaregiverTypeLabel(type, t);
  const cls = CAREGIVER_TYPE_BADGE_CLASSES[type as CaregiverType] || CAREGIVER_TYPE_BADGE_CLASSES.volunteer;
  return (
    <Badge className={`border-transparent ${cls}`}>
      {displayLabel}
    </Badge>
  );
}
