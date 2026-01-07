import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CalendarDays, ClipboardList, PlusCircle, BarChart3, Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import aidflowLogo from '@/assets/aidflow-logo.svg';

const navigation = [
  { key: 'navShifts', href: '/', icon: ClipboardList },
  { key: 'navDailyCoverage', href: '/coverage', icon: CalendarDays },
  { key: 'navWeeklySummary', href: '/summary', icon: BarChart3 },
] as const;

export function Header() {
  const { t, isRTL } = useI18n();
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={aidflowLogo} alt={t('appName')} className="h-8" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {t(item.key as any)}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link to="/new-shift" className="hidden sm:block">
              <Button size="sm" className="gap-2">
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">{t('navNewShift')}</span>
              </Button>
            </Link>
            <LanguageToggle />
            
            {/* Sign Out Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              title={t('signOut')}
              className="hidden sm:flex"
            >
              <LogOut className="w-4 h-4" />
            </Button>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {t(item.key as any)}
                  </Link>
                );
              })}
              <Link
                to="/new-shift"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 mt-2 rounded-md text-base font-medium bg-primary text-primary-foreground"
              >
                <PlusCircle className="w-5 h-5" />
                {t('navNewShift')}
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-3 px-4 py-3 mt-2 rounded-md text-base font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-5 h-5" />
                {t('signOut')}
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
