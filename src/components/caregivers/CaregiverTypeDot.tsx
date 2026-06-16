import { CaregiverType } from '@/types/shift';
import { useI18n } from '@/lib/i18n';
import { getCaregiverTypeLabel } from './CaregiverTypeBadge';
import { cn } from '@/lib/utils';

const DOT_CLASSES: Record<CaregiverType, string> = {
  private_paid: 'bg-caregiver-private-dot',
  family_member: 'bg-caregiver-family-dot',
  volunteer: 'bg-caregiver-volunteer-dot',
};

interface CaregiverTypeDotProps {
  type: CaregiverType | string;
  className?: string;
}

export function CaregiverTypeDot({ type, className }: CaregiverTypeDotProps) {
  const { t } = useI18n();
  const dotClass = DOT_CLASSES[type as CaregiverType] || DOT_CLASSES.volunteer;
  const label = getCaregiverTypeLabel(type, t);
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        'inline-block w-2 h-2 rounded-full border border-foreground/20 shrink-0 align-middle',
        dotClass,
        className,
      )}
    />
  );
}
