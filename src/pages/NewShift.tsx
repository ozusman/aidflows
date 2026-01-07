import { useI18n } from '@/lib/i18n';
import { ShiftForm } from '@/components/shifts/ShiftForm';

const NewShift = () => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t('shiftEntry')}</h1>
      </div>
      <ShiftForm />
    </div>
  );
};

export default NewShift;
