import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function ResetPassword() {
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ready, setReady] = useState(true);
  const [invalidLink, setInvalidLink] = useState(false);
  const [isPreparingSession, setIsPreparingSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
        setIsPreparingSession(false);
      }
    });

    const init = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const hash = window.location.hash;
      const errorDesc = url.searchParams.get('error_description') || new URLSearchParams(hash.slice(1)).get('error_description');

      if (errorDesc) {
        if (!cancelled) {
          setError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
          setInvalidLink(true);
          setReady(true);
        }
        return;
      }

      if (code) {
        setIsPreparingSession(true);
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) {
          if (error) {
            setError(error.message);
            setInvalidLink(true);
          }
          setIsPreparingSession(false);
        }
        return;
      }

      if (hash.includes('access_token') || hash.includes('type=recovery')) {
        setIsPreparingSession(true);
        setTimeout(() => {
          if (cancelled) return;
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (cancelled) return;
            setIsPreparingSession(false);
            if (!s) setInvalidLink(true);
          });
        }, 300);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled) {
        if (session) setReady(true);
      }
    };

    init();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const result = passwordSchema.safeParse({ password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (isPreparingSession) return;

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      logger.error('Update password error:', error);
      setError(t('unknownError'));
    } else {
      setSuccess(t('passwordUpdated'));
      setTimeout(() => navigate('/'), 1500);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-dvh bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('setNewPassword')}</CardTitle>
          <CardDescription>{t('setNewPasswordInstructions')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : invalidLink ? (
            <div className="space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="button" className="w-full" onClick={() => navigate('/auth')}>
                {t('backToSignIn')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t('newPassword')}</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || isPreparingSession}
                    className={isRTL ? 'pl-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`absolute top-1/2 h-8 w-8 -translate-y-1/2 ${isRTL ? 'left-1' : 'right-1'}`}
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    aria-pressed={showPassword}
                    disabled={isLoading || isPreparingSession}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading || isPreparingSession}
                    className={isRTL ? 'pl-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`absolute top-1/2 h-8 w-8 -translate-y-1/2 ${isRTL ? 'left-1' : 'right-1'}`}
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                    aria-pressed={showConfirmPassword}
                    disabled={isLoading || isPreparingSession}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              <Button type="submit" className="w-full" disabled={isLoading || isPreparingSession}>
                {isLoading || isPreparingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : t('updatePassword')}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                {t('backToSignIn')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
