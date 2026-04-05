import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PartnerInvitation, Partnership } from '@/domain/models/partnership/Partnership';
import type { IAcceptInvitation } from '@/domain/usecases/partnership/IAcceptInvitation';
import type { ICancelInvitation } from '@/domain/usecases/partnership/ICancelInvitation';
import type { IDeclineInvitation } from '@/domain/usecases/partnership/IDeclineInvitation';
import type { IDissolvePartnership } from '@/domain/usecases/partnership/IDissolvePartnership';
import type { IInvitePartner } from '@/domain/usecases/partnership/IInvitePartner';
import type { ILoadInvitations } from '@/domain/usecases/partnership/ILoadInvitations';
import type { ILoadPartnership } from '@/domain/usecases/partnership/ILoadPartnership';
import { renderWithI18n } from '@/test/i18n';
import { InvitePartnerPage } from './InvitePartnerPage';

const pendingSentInvitation: PartnerInvitation = {
  id: 'inv-sent',
  inviterId: 'user-1',
  inviteeEmail: 'sent@example.com',
  status: 'PENDING',
  acceptedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
};

const pendingReceivedInvitation: PartnerInvitation = {
  id: 'inv-received',
  inviterId: '',
  inviteeEmail: 'received@example.com',
  status: 'PENDING',
  acceptedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
};

const partnership: Partnership = {
  id: 'p-1',
  invitationId: 'inv-1',
  customerAId: 'user-1',
  customerBId: 'user-2',
  createdAt: '2026-01-01T00:00:00Z',
};

type UseCases = {
  invitePartner: IInvitePartner;
  loadInvitations: ILoadInvitations;
  acceptInvitation: IAcceptInvitation;
  declineInvitation: IDeclineInvitation;
  cancelInvitation: ICancelInvitation;
  loadPartnership: ILoadPartnership;
  dissolvePartnership: IDissolvePartnership;
};

function renderWithRouter(useCases: UseCases) {
  const rootRoute = createRootRoute();
  const inviteRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/partner-setup/invite',
    component: () => (
      <InvitePartnerPage
        invitePartnerUseCase={useCases.invitePartner}
        loadInvitationsUseCase={useCases.loadInvitations}
        acceptInvitationUseCase={useCases.acceptInvitation}
        declineInvitationUseCase={useCases.declineInvitation}
        cancelInvitationUseCase={useCases.cancelInvitation}
        loadPartnershipUseCase={useCases.loadPartnership}
        dissolvePartnershipUseCase={useCases.dissolvePartnership}
      />
    ),
  });
  const profileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/profile',
    component: () => <div>Profile Page</div>,
  });
  const selectAccountsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/partner-setup/select-accounts',
    component: () => <div>Select Accounts Page</div>,
  });
  const routeTree = rootRoute.addChildren([inviteRoute, profileRoute, selectAccountsRoute]);
  const memoryHistory = createMemoryHistory({ initialEntries: ['/partner-setup/invite'] });
  const router = createRouter({ routeTree, history: memoryHistory });
  renderWithI18n(
    // biome-ignore lint/suspicious/noExplicitAny: test router type mismatch with register
    <RouterProvider router={router as any} />,
  );
  return { router };
}

function makeUseCases(overrides?: Partial<UseCases>): UseCases {
  return {
    invitePartner: { execute: vi.fn() },
    loadInvitations: { execute: vi.fn().mockResolvedValue([]) },
    acceptInvitation: { execute: vi.fn() },
    declineInvitation: { execute: vi.fn() },
    cancelInvitation: { execute: vi.fn() },
    loadPartnership: { execute: vi.fn().mockResolvedValue(null) },
    dissolvePartnership: { execute: vi.fn() },
    ...overrides,
  };
}

describe('InvitePartnerPage', () => {
  describe('render', () => {
    const makeSut = () => {
      const useCases = makeUseCases();
      renderWithRouter(useCases);
      return { useCases };
    };

    it('should display the page heading', async () => {
      makeSut();

      expect(await screen.findByText(/Invite your/)).toBeInTheDocument();
    });

    it('should display the invite form when no partnership exists', async () => {
      makeSut();

      expect(await screen.findByLabelText("Partner's Email Address")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send Invitation/i })).toBeInTheDocument();
    });

    it('should display step indicator', async () => {
      makeSut();

      expect(await screen.findByText(/Step 01/)).toBeInTheDocument();
    });
  });

  describe('with active partnership', () => {
    const makeSut = () => {
      const useCases = makeUseCases({
        loadPartnership: { execute: vi.fn().mockResolvedValue(partnership) },
      });
      renderWithRouter(useCases);
      return { useCases };
    };

    it('should display active partnership card', async () => {
      makeSut();

      expect(await screen.findByText('Active Partnership')).toBeInTheDocument();
    });

    it('should display dissolve button', async () => {
      makeSut();

      expect(await screen.findByText('Dissolve Partnership')).toBeInTheDocument();
    });

    it('should not display invite form', async () => {
      makeSut();

      await screen.findByText('Active Partnership');
      expect(screen.queryByLabelText("Partner's Email Address")).not.toBeInTheDocument();
    });

    it('should display Next button to navigate to select accounts', async () => {
      makeSut();

      expect(await screen.findByText('Next')).toBeInTheDocument();
    });

    it('should call dissolvePartnership when dissolve button is clicked', async () => {
      const { useCases } = makeSut();
      const user = userEvent.setup();
      vi.spyOn(useCases.dissolvePartnership, 'execute').mockResolvedValueOnce(undefined);

      const dissolveButton = await screen.findByText('Dissolve Partnership');
      await user.click(dissolveButton);

      await waitFor(() => {
        expect(useCases.dissolvePartnership.execute).toHaveBeenCalledOnce();
      });
    });
  });

  describe('invitations', () => {
    it('should display sent invitations', async () => {
      const useCases = makeUseCases({
        loadInvitations: { execute: vi.fn().mockResolvedValue([pendingSentInvitation]) },
      });
      renderWithRouter(useCases);

      expect(await screen.findByText('Sent Invitations')).toBeInTheDocument();
      expect(screen.getByText('sent@example.com')).toBeInTheDocument();
      expect(screen.getByText('Awaiting response')).toBeInTheDocument();
    });

    it('should display received invitations', async () => {
      const useCases = makeUseCases({
        loadInvitations: { execute: vi.fn().mockResolvedValue([pendingReceivedInvitation]) },
      });
      renderWithRouter(useCases);

      expect(await screen.findByText('Received Invitations')).toBeInTheDocument();
      expect(screen.getByText('received@example.com')).toBeInTheDocument();
    });

    it('should display accept and decline buttons for received invitations', async () => {
      const useCases = makeUseCases({
        loadInvitations: { execute: vi.fn().mockResolvedValue([pendingReceivedInvitation]) },
      });
      renderWithRouter(useCases);

      expect(await screen.findByText('Accept')).toBeInTheDocument();
      expect(screen.getByText('Decline')).toBeInTheDocument();
    });

    it('should call acceptInvitation when accept is clicked', async () => {
      const useCases = makeUseCases({
        loadInvitations: { execute: vi.fn().mockResolvedValue([pendingReceivedInvitation]) },
      });
      vi.spyOn(useCases.acceptInvitation, 'execute').mockResolvedValueOnce(partnership);
      renderWithRouter(useCases);
      const user = userEvent.setup();

      const acceptButton = await screen.findByText('Accept');
      await user.click(acceptButton);

      await waitFor(() => {
        expect(useCases.acceptInvitation.execute).toHaveBeenCalledWith('inv-received');
      });
    });

    it('should call declineInvitation when decline is clicked', async () => {
      const useCases = makeUseCases({
        loadInvitations: { execute: vi.fn().mockResolvedValue([pendingReceivedInvitation]) },
      });
      vi.spyOn(useCases.declineInvitation, 'execute').mockResolvedValueOnce(undefined);
      renderWithRouter(useCases);
      const user = userEvent.setup();

      const declineButton = await screen.findByText('Decline');
      await user.click(declineButton);

      await waitFor(() => {
        expect(useCases.declineInvitation.execute).toHaveBeenCalledWith('inv-received');
      });
    });

    it('should call cancelInvitation when cancel is clicked on sent invitation', async () => {
      const useCases = makeUseCases({
        loadInvitations: { execute: vi.fn().mockResolvedValue([pendingSentInvitation]) },
      });
      vi.spyOn(useCases.cancelInvitation, 'execute').mockResolvedValueOnce(undefined);
      renderWithRouter(useCases);
      const user = userEvent.setup();

      const cancelButton = await screen.findByText('Cancel');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(useCases.cancelInvitation.execute).toHaveBeenCalledWith('inv-sent');
      });
    });
  });

  describe('send invitation', () => {
    const makeSut = () => {
      const useCases = makeUseCases();
      renderWithRouter(useCases);
      return { useCases };
    };

    it('should call invitePartner with form data on submit', async () => {
      const { useCases } = makeSut();
      const invitation: PartnerInvitation = {
        id: 'inv-new',
        inviterId: 'user-1',
        inviteeEmail: 'new@example.com',
        status: 'PENDING',
        acceptedAt: null,
        createdAt: '2026-01-01T00:00:00Z',
      };
      vi.spyOn(useCases.invitePartner, 'execute').mockResolvedValueOnce(invitation);
      const user = userEvent.setup();

      await screen.findByLabelText("Partner's Email Address");
      await user.type(screen.getByLabelText("Partner's Email Address"), 'new@example.com');
      await user.click(screen.getByRole('button', { name: /Send Invitation/i }));

      await waitFor(() => {
        expect(useCases.invitePartner.execute).toHaveBeenCalledWith({
          email: 'new@example.com',
        });
      });
    });

    it('should show validation error for invalid email', async () => {
      const { useCases } = makeSut();
      const user = userEvent.setup();

      await screen.findByLabelText("Partner's Email Address");
      await user.type(screen.getByLabelText("Partner's Email Address"), 'invalid');
      await user.click(screen.getByRole('button', { name: /Send Invitation/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
      });
      expect(useCases.invitePartner.execute).not.toHaveBeenCalled();
    });

    it('should show error message when invitation fails', async () => {
      const { useCases } = makeSut();
      vi.spyOn(useCases.invitePartner, 'execute').mockRejectedValueOnce(new Error('fail'));
      const user = userEvent.setup();

      await screen.findByLabelText("Partner's Email Address");
      await user.type(screen.getByLabelText("Partner's Email Address"), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /Send Invitation/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to send invitation')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should display error when loading data fails', async () => {
      const useCases = makeUseCases({
        loadInvitations: { execute: vi.fn().mockRejectedValue(new Error('fail')) },
      });
      renderWithRouter(useCases);

      expect(await screen.findByText('Failed to load partnership data')).toBeInTheDocument();
    });

    it('should display error when dissolve fails', async () => {
      const useCases = makeUseCases({
        loadPartnership: { execute: vi.fn().mockResolvedValue(partnership) },
      });
      vi.spyOn(useCases.dissolvePartnership, 'execute').mockRejectedValueOnce(new Error('fail'));
      renderWithRouter(useCases);
      const user = userEvent.setup();

      const dissolveButton = await screen.findByText('Dissolve Partnership');
      await user.click(dissolveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to dissolve partnership')).toBeInTheDocument();
      });
    });

    it('should display error when accept fails', async () => {
      const useCases = makeUseCases({
        loadInvitations: { execute: vi.fn().mockResolvedValue([pendingReceivedInvitation]) },
      });
      vi.spyOn(useCases.acceptInvitation, 'execute').mockRejectedValueOnce(new Error('fail'));
      renderWithRouter(useCases);
      const user = userEvent.setup();

      const acceptButton = await screen.findByText('Accept');
      await user.click(acceptButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to accept invitation')).toBeInTheDocument();
      });
    });

    it('should display error when decline fails', async () => {
      const useCases = makeUseCases({
        loadInvitations: { execute: vi.fn().mockResolvedValue([pendingReceivedInvitation]) },
      });
      vi.spyOn(useCases.declineInvitation, 'execute').mockRejectedValueOnce(new Error('fail'));
      renderWithRouter(useCases);
      const user = userEvent.setup();

      const declineButton = await screen.findByText('Decline');
      await user.click(declineButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to decline invitation')).toBeInTheDocument();
      });
    });

    it('should display error when cancel fails', async () => {
      const useCases = makeUseCases({
        loadInvitations: { execute: vi.fn().mockResolvedValue([pendingSentInvitation]) },
      });
      vi.spyOn(useCases.cancelInvitation, 'execute').mockRejectedValueOnce(new Error('fail'));
      renderWithRouter(useCases);
      const user = userEvent.setup();

      const cancelButton = await screen.findByText('Cancel');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to cancel invitation')).toBeInTheDocument();
      });
    });
  });
});
