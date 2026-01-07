import { useI18n } from '@/lib/i18n';
import { DailyCoverage } from '@/components/coverage/DailyCoverage';

const Coverage = () => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t('dailyCoverage')}</h1>
      </div>
      <DailyCoverage />
    </div>
  );
};

export default Coverage;
