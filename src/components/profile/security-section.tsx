'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function SecuritySection() {
  const t = useTranslations('profile');
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast({ title: t('passwordError'), description: t('passwordMismatch'), variant: 'destructive' });
      return;
    }
    if (!firebaseUser) return;

    setSubmitting(true);
    try {
      const cred = EmailAuthProvider.credential(firebaseUser.email!, currentPw);
      await reauthenticateWithCredential(firebaseUser, cred);
      await updatePassword(firebaseUser, newPw);
      toast({ title: t('passwordUpdated'), description: t('passwordUpdatedDesc') });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch {
      toast({ title: t('passwordError'), description: t('passwordErrorDesc'), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!firebaseUser) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('securityTitle')}</CardTitle>
        <CardDescription>{t('securityDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentPw">{t('currentPassword')}</Label>
            <Input id="currentPw" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="newPw">{t('newPassword')}</Label>
            <Input id="newPw" type={show ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6} />
          </div>
          <div>
            <Label htmlFor="confirmPw">{t('confirmPassword')}</Label>
            <div className="relative">
              <Input id="confirmPw" type={show ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required minLength={6} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('updatePassword')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
