import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { lovable } from '@/integrations/lovable';
import aidflowLogo from '@/assets/aidflow-logo.svg';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export default function Auth() {
  const { t, isRTL } = useI18n();
  const { user, isLoading: authLoading, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSentTo, setResetEmailSentTo] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const validateForm = () => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return false;
    }
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError(t('invalidCredentials'));
      } else {
        logger.error('Sign in error:', error);
        setError(t('unknownError'));
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    const { error } = await signUp(email, password);
    setIsLoading(false);
    
    if (error) {
      if (error.message.includes('already registered')) {
        setError(t('emailAlreadyRegistered'));
      } else {
        logger.error('Sign up error:', error);
        setError(t('unknownError'));
      }
    } else {
      setSuccess(t('accountCreated'));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    
    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);
    
    if (error) {
      logger.error('Reset password error:', error);
      setError(t('unknownError'));
    } else {
      setResetEmailSentTo(email);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      logger.error('Google sign in error:', result.error);
      setError(t('unknownError'));
      setIsLoading(false);
      return;
    }
    if (result.redirected) return;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (resetEmailSentTo) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('resetEmailSent')}</CardTitle>
            <CardDescription>
              {t('resetEmailSentTo')} <span dir="ltr" className="font-medium">{resetEmailSentTo}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                setResetEmailSentTo(null);
                setShowForgotPassword(false);
                setError(null);
                setSuccess(null);
              }}
            >
              {t('backToSignIn')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('resetPassword')}</CardTitle>
            <CardDescription>{t('resetPasswordInstructions')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">{t('email')}</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
              
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              
              {success && (
                <p className="text-sm text-green-600">{success}</p>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t('resetPassword')
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="link" 
                className="w-full" 
                onClick={() => {
                  setShowForgotPassword(false);
                  setError(null);
                  setSuccess(null);
                }}
              >
                {t('backToSignIn')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-dvh bg-background p-4 relative">
      <div className="absolute top-4 end-4">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img src={aidflowLogo} alt={t('appName')} className="h-10" />
          </div>
          <CardDescription>{t('welcomeMessage')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" dir={isRTL ? 'rtl' : 'ltr'}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">{t('signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('signUp')}</TabsTrigger>
            </TabsList>

            <Button
              type="button"
              variant="outline"
              className="w-full mb-4 gap-2"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('continueWithGoogle')}
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t('orContinueWith')}</span>
              </div>
            </div>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t('email')}</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">{t('password')}</Label>
                    <Button 
                      type="button" 
                      variant="link" 
                      className="px-0 h-auto font-normal text-sm"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError(null);
                        setSuccess(null);
                      }}
                    >
                      {t('forgotPassword')}
                    </Button>
                  </div>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t('signIn')
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('email')}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('password')}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                
                {success && (
                  <p className="text-sm text-green-600">{success}</p>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t('signUp')
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
