import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DailyCoverage } from '@/components/coverage/DailyCoverage';
import { WeeklyCoverage } from '@/components/coverage/WeeklyCoverage';

const Coverage = () => {
  const { t } = useI18n();
  const [view, setView] = useState('day');

  return (
    <div className="space-y-6">
      <h1 className="sr-only">{t('dailyCoverage')}</h1>
      <Tabs value={view} onValueChange={setView} className="space-y-6">
        <TabsList>
          <TabsTrigger value="day" className="px-8">Day</TabsTrigger>
          <TabsTrigger value="week" className="px-8">Week</TabsTrigger>
        </TabsList>
        <TabsContent value="day" className="mt-0">
          <DailyCoverage />
        </TabsContent>
        <TabsContent value="week" className="mt-0">
          <WeeklyCoverage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Coverage;
