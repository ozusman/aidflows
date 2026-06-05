import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

export const CAREGIVER_TYPE_BADGE_CLASSES: Record<string, string> = {
  private_paid: 'bg-caregiver-private text-caregiver-private-foreground hover:bg-caregiver-private/90',
  family_member: 'bg-caregiver-family text-caregiver-family-foreground hover:bg-caregiver-family/90',
  foreign_caregiver: 'bg-caregiver-foreign text-caregiver-foreign-foreground hover:bg-caregiver-foreign/90',
  other: 'bg-caregiver-other text-caregiver-other-foreground hover:bg-caregiver-other/90',
};

export function getCaregiverTypeLabel(type: string, t: (key: any) => string): string {
  const labels: Record<string, string> = {
    private_paid: t('typePrivatePaid'),
    family_member: t('typeFamilyMember'),
    foreign_caregiver: t('typeForeignCaregiver'),
    other: t('typeOther'),
  };
  return labels[type] || type;
}

export function CaregiverTypeBadge({ type, label }: { type: string; label?: string }) {
  const { t } = useI18n();
  const displayLabel = label ?? getCaregiverTypeLabel(type, t);
  return (
    <Badge
      className={`border-transparent ${CAREGIVER_TYPE_BADGE_CLASSES[type] || CAREGIVER_TYPE_BADGE_CLASSES.other}`}
    >
      {displayLabel}
    </Badge>
  );
}
