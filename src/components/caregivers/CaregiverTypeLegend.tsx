import { useI18n } from '@/lib/i18n';
import { CaregiverType } from '@/types/shift';
import { CaregiverTypeDot } from './CaregiverTypeDot';
import { getCaregiverTypeLabel } from './CaregiverTypeBadge';

const TYPES: CaregiverType[] = ['private_paid', 'family_member', 'volunteer'];

export function CaregiverTypeLegend() {
  const { t } = useI18n();
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground"
      aria-label={t('caregiverType')}
    >
      {TYPES.map((type) => (
        <span key={type} className="inline-flex items-center gap-2">
          <CaregiverTypeDot type={type} />
          <span>{getCaregiverTypeLabel(type, t)}</span>
        </span>
      ))}
    </div>
  );
}
