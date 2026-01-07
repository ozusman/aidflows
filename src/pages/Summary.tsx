import { useI18n } from '@/lib/i18n';
import { WeeklySummary } from '@/components/summary/WeeklySummary';

const Summary = () => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t('weeklySummary')}</h1>
      </div>
      <WeeklySummary />
    </div>
  );
};

export default Summary;
