import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { CustomerSchema } from '@/domain/models/profile/Profile';
import { type UpdateProfileInput, updateProfileInputSchema } from '@/domain/models/profile/Profile';
import type { IDeleteAccount } from '@/domain/usecases/profile/IDeleteAccount';
import type { ILoadProfile } from '@/domain/usecases/profile/ILoadProfile';
import type { IUpdateProfile } from '@/domain/usecases/profile/IUpdateProfile';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { Select } from '@/presentation/components/Select';
import { TextInput } from '@/presentation/components/TextInput';
import { useAuth } from '@/presentation/contexts/AuthContext';

type Props = {
  loadProfile: ILoadProfile;
  updateProfile: IUpdateProfile;
  deleteAccount: IDeleteAccount;
};

export function UserProfilePage({ loadProfile, updateProfile, deleteAccount }: Props) {
  const [profile, setProfile] = useState<CustomerSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { logout } = useAuth();
  const { t } = useLingui();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileInputSchema),
  });

  const fetchProfile = useCallback(async () => {
    try {
      const data = await loadProfile.execute();
      setProfile(data);
      reset({ name: data.name ?? '', language: data.language as 'en-US' | 'pt-BR' });
    } catch {
      setServerError(t`Failed to load profile.`);
    } finally {
      setLoading(false);
    }
  }, [loadProfile, reset, t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onSubmit = async (data: UpdateProfileInput) => {
    setServerError('');
    setSuccessMessage('');
    try {
      const updated = await updateProfile.execute(data);
      setProfile(updated);
      setEditing(false);
      setSuccessMessage(t`Profile updated successfully.`);
    } catch {
      setServerError(t`Failed to update profile.`);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount.execute();
      logout();
    } catch {
      setServerError(t`Failed to delete account.`);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Icon name="progress_activity" className="text-4xl text-primary animate-spin" />
      </div>
    );
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
      })
    : '';

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="font-headline text-3xl font-bold text-primary tracking-tight mb-8">
        <Trans>User Profile</Trans>
      </h1>

      {serverError && (
        <div className="mb-6 p-4 bg-error/10 rounded-xl text-error text-sm font-medium">
          {serverError}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-tertiary/10 rounded-xl text-tertiary text-sm font-medium">
          {successMessage}
        </div>
      )}

      <Card variant="dark" padding="lg" className="mb-8">
        <span className="px-3 py-1 bg-secondary/20 text-secondary text-[10px] font-bold uppercase tracking-widest rounded-full inline-block mb-6">
          <Trans>Member Since {memberSince}</Trans>
        </span>
        <h2 className="font-headline text-4xl font-bold text-white mb-2">
          {profile?.name ?? profile?.email}
        </h2>
        <p className="text-sm text-on-primary-container">{profile?.email}</p>
      </Card>

      <Card variant="default" padding="lg" className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline text-xl font-bold text-primary">
            <Trans>Profile Settings</Trans>
          </h3>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Icon name="edit" className="text-base mr-1" />
              <Trans>Edit</Trans>
            </Button>
          )}
        </div>

        {editing ? (
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextInput
              id="name"
              type="text"
              label={t`Name`}
              placeholder={t`Your name`}
              icon={<Icon name="person" className="text-lg" />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Select
              id="language"
              label={t`Language`}
              icon={<Icon name="language" className="text-lg" />}
              error={errors.language?.message}
              {...register('language')}
            >
              <option value="en-US">English (US)</option>
              <option value="pt-BR">Português (BR)</option>
            </Select>

            <div className="flex space-x-3">
              <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
                {isSubmitting ? <Trans>Saving...</Trans> : <Trans>Save Changes</Trans>}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => {
                  setEditing(false);
                  reset({
                    name: profile?.name ?? '',
                    language: profile?.language as 'en-US' | 'pt-BR',
                  });
                }}
              >
                <Trans>Cancel</Trans>
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-surface-container">
              <Icon name="person" className="text-xl text-on-surface-variant" />
              <div>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">
                  <Trans>Name</Trans>
                </p>
                <p className="text-sm font-bold text-primary">{profile?.name ?? '—'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-surface-container">
              <Icon name="mail" className="text-xl text-on-surface-variant" />
              <div>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">
                  <Trans>Email</Trans>
                </p>
                <p className="text-sm font-bold text-primary">{profile?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-surface-container">
              <Icon name="language" className="text-xl text-on-surface-variant" />
              <div>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">
                  <Trans>Language</Trans>
                </p>
                <p className="text-sm font-bold text-primary">
                  {profile?.language === 'pt-BR' ? 'Português (BR)' : 'English (US)'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card variant="default" padding="lg">
        <h3 className="font-headline text-xl font-bold text-error mb-4">
          <Trans>Danger Zone</Trans>
        </h3>
        <p className="text-sm text-on-surface-variant mb-4">
          <Trans>
            Permanently delete your account and all associated data. This action cannot be undone.
          </Trans>
        </p>

        {showDeleteConfirm ? (
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="md"
              className="bg-error/10 text-error hover:bg-error/20"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Trans>Deleting...</Trans> : <Trans>Yes, Delete My Account</Trans>}
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              <Trans>Cancel</Trans>
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="md"
            className="text-error hover:bg-error/10"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Icon name="delete_forever" className="text-base mr-1" />
            <Trans>Delete Account</Trans>
          </Button>
        )}
      </Card>
    </div>
  );
}
