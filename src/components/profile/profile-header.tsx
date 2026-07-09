'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const CLOUD_NAME = 'dfezx49y4';
const UPLOAD_PRESET = 'asurrini';

export function ProfileHeader() {
  const t = useTranslations('profile');
  const { user, updateProfile, firebaseUser } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t('uploadError'), description: t('fileTooLarge'), variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      await updateProfile({ photoURL: data.secure_url });
      toast({ title: t('photoUpdated') });
    } catch {
      toast({ title: t('uploadError'), variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : '';

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-2 border-primary/20">
          <AvatarImage src={user?.photoURL || undefined} alt={user?.fullName || user?.email} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : getInitials(user?.fullName)}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Camera className="h-4 w-4" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-bold">{user?.fullName || t('user')}</h1>
        <p className="text-muted-foreground">{user?.email}</p>
        {memberSince && (
          <p className="text-sm text-muted-foreground mt-1">
            {t('memberSince')} {memberSince}
          </p>
        )}
        {firebaseUser?.emailVerified && (
          <p className="text-xs text-green-600 mt-1 flex items-center justify-center sm:justify-start gap-1">
            ✓ {t('emailVerified')}
          </p>
        )}
      </div>
    </div>
  );
}
