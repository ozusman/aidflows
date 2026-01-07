import { useI18n, Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

export function LanguageToggle() {
  const { language, setLanguage, t } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === 'he' ? 'en' : 'he');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="min-w-[80px] text-sm font-medium"
    >
      {language === 'he' ? 'English' : 'עברית'}
    </Button>
  );
}
