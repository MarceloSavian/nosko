import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  InvitationStatus,
  type InvitePartnerInput,
  invitePartnerInputSchema,
  type PartnerInvitation,
  type Partnership,
} from '@/domain/models/partnership/Partnership';
import type { IAcceptInvitation } from '@/domain/usecases/partnership/IAcceptInvitation';
import type { ICancelInvitation } from '@/domain/usecases/partnership/ICancelInvitation';
import type { IDeclineInvitation } from '@/domain/usecases/partnership/IDeclineInvitation';
import type { IDissolvePartnership } from '@/domain/usecases/partnership/IDissolvePartnership';
import type { IInvitePartner } from '@/domain/usecases/partnership/IInvitePartner';
import type { ILoadInvitations } from '@/domain/usecases/partnership/ILoadInvitations';
import type { ILoadPartnership } from '@/domain/usecases/partnership/ILoadPartnership';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { IconBox } from '@/presentation/components/IconBox';
import { InfoBanner } from '@/presentation/components/InfoBanner';
import { TextInput } from '@/presentation/components/TextInput';

type Props = {
  invitePartnerUseCase: IInvitePartner;
  loadInvitationsUseCase: ILoadInvitations;
  acceptInvitationUseCase: IAcceptInvitation;
  declineInvitationUseCase: IDeclineInvitation;
  cancelInvitationUseCase: ICancelInvitation;
  loadPartnershipUseCase: ILoadPartnership;
  dissolvePartnershipUseCase: IDissolvePartnership;
};

export function InvitePartnerPage({
  invitePartnerUseCase,
  loadInvitationsUseCase,
  acceptInvitationUseCase,
  declineInvitationUseCase,
  cancelInvitationUseCase,
  loadPartnershipUseCase,
  dissolvePartnershipUseCase,
}: Props) {
  const { t } = useLingui();
  const [invitations, setInvitations] = useState<PartnerInvitation[]>([]);
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InvitePartnerInput>({
    resolver: zodResolver(invitePartnerInputSchema),
  });

  const loadData = useCallback(async () => {
    try {
      const [invitationsData, partnershipData] = await Promise.all([
        loadInvitationsUseCase.execute(),
        loadPartnershipUseCase.execute(),
      ]);
      setInvitations(invitationsData);
      setPartnership(partnershipData);
    } catch {
      setServerError(t`Failed to load partnership data`);
    } finally {
      setLoading(false);
    }
  }, [loadInvitationsUseCase, loadPartnershipUseCase, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSubmit = async (data: InvitePartnerInput) => {
    setServerError('');
    try {
      await invitePartnerUseCase.execute(data);
      reset();
      await loadData();
    } catch {
      setServerError(t`Failed to send invitation`);
    }
  };

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      await acceptInvitationUseCase.execute(id);
      await loadData();
    } catch {
      setServerError(t`Failed to accept invitation`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionLoading(id);
    try {
      await declineInvitationUseCase.execute(id);
      await loadData();
    } catch {
      setServerError(t`Failed to decline invitation`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      await cancelInvitationUseCase.execute(id);
      await loadData();
    } catch {
      setServerError(t`Failed to cancel invitation`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDissolve = async () => {
    setActionLoading('dissolve');
    try {
      await dissolvePartnershipUseCase.execute();
      await loadData();
    } catch {
      setServerError(t`Failed to dissolve partnership`);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingSent = invitations.filter(
    (inv) => inv.status === InvitationStatus.PENDING && inv.inviterId,
  );
  const pendingReceived = invitations.filter(
    (inv) => inv.status === InvitationStatus.PENDING && !inv.inviterId,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <Icon name="hourglass_empty" className="text-4xl text-outline animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-full p-8">
      <div className="w-full max-w-md">
        <Link
          to="/profile"
          className="inline-flex items-center space-x-1 text-sm text-on-surface-variant hover:text-primary transition-colors mb-8"
        >
          <Icon name="chevron_left" className="text-base" />
          <span>
            <Trans>Back</Trans>
          </span>
        </Link>

        <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-6">
          <Trans>Partner Integration &bull; Step 01</Trans>
        </p>

        <h1 className="font-headline text-4xl font-bold text-primary leading-tight mb-2">
          <Trans>
            Invite your <span className="text-secondary italic">Financial Partner</span>
          </Trans>
        </h1>
        <p className="text-on-surface-variant leading-relaxed mb-8">
          <Trans>
            Unified wealth management starts with shared visibility. Enter your partner&apos;s email
            to sync your Unity Ledger.
          </Trans>
        </p>

        {serverError && (
          <div className="mb-6 p-4 bg-error/10 rounded-xl text-error text-sm font-medium">
            {serverError}
          </div>
        )}

        {partnership && (
          <Card variant="default" padding="lg" className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <IconBox icon="favorite" size="md" tone="secondary" shape="circle" />
              <div className="flex-1">
                <p className="font-bold text-sm text-primary">
                  <Trans>Active Partnership</Trans>
                </p>
                <p className="text-xs text-on-surface-variant">
                  <Trans>You are currently in a partnership</Trans>
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDissolve}
              disabled={actionLoading === 'dissolve'}
            >
              <span className="text-error">
                {actionLoading === 'dissolve' ? (
                  <Trans>Dissolving...</Trans>
                ) : (
                  <Trans>Dissolve Partnership</Trans>
                )}
              </span>
            </Button>
          </Card>
        )}

        {!partnership && (
          <form className="space-y-6 mb-8" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextInput
              id="partner-email"
              type="email"
              label={t`Partner's Email Address`}
              placeholder={t`partner@nosko.com`}
              autoComplete="email"
              icon={<Icon name="mail" className="text-lg" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <p className="text-xs text-on-surface-variant flex items-center space-x-2">
              <Icon name="lock" className="text-sm text-outline" />
              <span>
                <Trans>Secure invitation link will be sent instantly.</Trans>
              </span>
            </p>

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              fullWidth
              className="space-x-2"
              disabled={isSubmitting}
            >
              <span>
                {isSubmitting ? <Trans>Sending...</Trans> : <Trans>Send Invitation</Trans>}
              </span>
              <Icon name="arrow_forward" className="text-lg" />
            </Button>
          </form>
        )}

        {pendingReceived.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
              <Trans>Received Invitations</Trans>
            </p>
            <div className="space-y-3">
              {pendingReceived.map((inv) => (
                <Card key={inv.id} variant="default" padding="md">
                  <div className="flex items-center space-x-4">
                    <IconBox icon="mail" size="sm" tone="secondary" shape="circle" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-primary">{inv.inviteeEmail}</p>
                      <p className="text-xs text-on-surface-variant">
                        <Trans>Pending invitation</Trans>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAccept(inv.id)}
                        disabled={actionLoading === inv.id}
                      >
                        <Trans>Accept</Trans>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDecline(inv.id)}
                        disabled={actionLoading === inv.id}
                      >
                        <Trans>Decline</Trans>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {pendingSent.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
              <Trans>Sent Invitations</Trans>
            </p>
            <div className="space-y-3">
              {pendingSent.map((inv) => (
                <Card key={inv.id} variant="default" padding="md">
                  <div className="flex items-center space-x-4">
                    <IconBox icon="send" size="sm" tone="surface" shape="circle" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-primary">{inv.inviteeEmail}</p>
                      <p className="text-xs text-on-surface-variant">
                        <Trans>Awaiting response</Trans>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel(inv.id)}
                      disabled={actionLoading === inv.id}
                    >
                      <span className="text-error">
                        <Trans>Cancel</Trans>
                      </span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {partnership && (
          <div className="flex justify-end mt-6">
            <Link to="/partner-setup/select-accounts">
              <Button type="button" variant="secondary" size="md" className="space-x-2">
                <span>
                  <Trans>Next</Trans>
                </span>
                <Icon name="arrow_forward" className="text-base" />
              </Button>
            </Link>
          </div>
        )}

        <InfoBanner
          icon="favorite"
          iconFilled
          title={<Trans>Unity Connection</Trans>}
          description={
            <Trans>
              Collaborative planning is the core of Nosko. Once accepted, you&apos;ll gain access to
              shared visibility across accounts and joint wealth targets.
            </Trans>
          }
          className="mt-8"
        />

        <p className="mt-12 text-center text-[10px] uppercase tracking-widest text-outline">
          <Trans>Protected via Nosko Unity Protocol</Trans>
        </p>
      </div>
    </div>
  );
}
