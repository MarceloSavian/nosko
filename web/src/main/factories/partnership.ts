import { RemoteAcceptInvitation } from '@/data/usecases/partnership/RemoteAcceptInvitation';
import { RemoteCancelInvitation } from '@/data/usecases/partnership/RemoteCancelInvitation';
import { RemoteDeclineInvitation } from '@/data/usecases/partnership/RemoteDeclineInvitation';
import { RemoteDissolvePartnership } from '@/data/usecases/partnership/RemoteDissolvePartnership';
import { RemoteInvitePartner } from '@/data/usecases/partnership/RemoteInvitePartner';
import { RemoteLoadAccounts } from '@/data/usecases/partnership/RemoteLoadAccounts';
import { RemoteLoadContributionRules } from '@/data/usecases/partnership/RemoteLoadContributionRules';
import { RemoteLoadInvitations } from '@/data/usecases/partnership/RemoteLoadInvitations';
import { RemoteLoadPartnership } from '@/data/usecases/partnership/RemoteLoadPartnership';
import { RemoteLoadSharedAccounts } from '@/data/usecases/partnership/RemoteLoadSharedAccounts';
import { RemoteSetContributionRules } from '@/data/usecases/partnership/RemoteSetContributionRules';
import { RemoteSetSharedAccounts } from '@/data/usecases/partnership/RemoteSetSharedAccounts';
import { HttpClient } from '@/infra/http/HttpClient';
import { PartnershipGateway } from '@/infra/http/partnership/PartnershipGateway';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const httpClient = new HttpClient(API_BASE_URL);
const getToken = () => localStorage.getItem('nosko_access_token');

const partnershipGateway = new PartnershipGateway(httpClient, getToken);

export const invitePartner = new RemoteInvitePartner(partnershipGateway);
export const loadInvitations = new RemoteLoadInvitations(partnershipGateway);
export const acceptInvitation = new RemoteAcceptInvitation(partnershipGateway);
export const declineInvitation = new RemoteDeclineInvitation(partnershipGateway);
export const cancelInvitation = new RemoteCancelInvitation(partnershipGateway);
export const loadPartnership = new RemoteLoadPartnership(partnershipGateway);
export const dissolvePartnership = new RemoteDissolvePartnership(partnershipGateway);
export const loadContributionRules = new RemoteLoadContributionRules(partnershipGateway);
export const setContributionRules = new RemoteSetContributionRules(partnershipGateway);
export const loadSharedAccounts = new RemoteLoadSharedAccounts(partnershipGateway);
export const setSharedAccounts = new RemoteSetSharedAccounts(partnershipGateway);
export const loadAccounts = new RemoteLoadAccounts(partnershipGateway);
