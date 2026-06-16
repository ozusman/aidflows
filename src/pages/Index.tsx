import { useI18n } from '@/lib/i18n';
import { ShiftsList } from '@/components/shifts/ShiftsList';

const Index = () => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground pl-4">{t('navShifts')}</h1>
      </div>
      <ShiftsList />
    </div>
  );
};

export default Index;
