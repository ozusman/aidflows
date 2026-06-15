import { ReactNode } from 'react';
import { Header } from './Header';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isRTL } = useI18n();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={cn("min-h-dvh bg-background", isRTL && "font-hebrew")}>
      <Header />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
