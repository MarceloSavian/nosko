import { bankAccountSchema } from '../../domain/models/account/Account.js';
import {
  contributionRuleSchema,
  invitePartnerInputSchema,
  partnerInvitationSchema,
  partnershipSchema,
  setContributionRuleInputSchema,
  setSharedAccountsInputSchema,
} from '../../domain/models/partnership/Partnership.js';
import type { RouteMeta } from '../../openapi/route-descriptor.js';

export const partnershipRouteMetas: RouteMeta[] = [
  {
    method: 'post',
    path: '/v1/partnership/invite',
    summary: 'Invite a partner by email',
    tags: ['Partnership'],
    auth: true,
    request: { body: invitePartnerInputSchema },
    responses: {
      201: { description: 'Invitation sent', schema: partnerInvitationSchema },
      400: { description: 'Validation error' },
    },
  },
  {
    method: 'get',
    path: '/v1/partnership/invitations',
    summary: 'List partner invitations',
    tags: ['Partnership'],
    auth: true,
    responses: {
      200: { description: 'List of invitations', schema: partnerInvitationSchema.array() },
    },
  },
  {
    method: 'post',
    path: '/v1/partnership/invitations/{id}/accept',
    summary: 'Accept a partner invitation',
    tags: ['Partnership'],
    auth: true,
    responses: {
      200: { description: 'Invitation accepted', schema: partnershipSchema },
      404: { description: 'Invitation not found' },
    },
  },
  {
    method: 'post',
    path: '/v1/partnership/invitations/{id}/decline',
    summary: 'Decline a partner invitation',
    tags: ['Partnership'],
    auth: true,
    responses: {
      204: { description: 'Invitation declined' },
      404: { description: 'Invitation not found' },
    },
  },
  {
    method: 'delete',
    path: '/v1/partnership/invitations/{id}',
    summary: 'Cancel a sent invitation',
    tags: ['Partnership'],
    auth: true,
    responses: {
      204: { description: 'Invitation cancelled' },
      404: { description: 'Invitation not found' },
    },
  },
  {
    method: 'get',
    path: '/v1/partnership',
    summary: 'Get current partnership',
    tags: ['Partnership'],
    auth: true,
    responses: {
      200: { description: 'Partnership details', schema: partnershipSchema },
    },
  },
  {
    method: 'delete',
    path: '/v1/partnership',
    summary: 'Dissolve current partnership',
    tags: ['Partnership'],
    auth: true,
    responses: {
      204: { description: 'Partnership dissolved' },
    },
  },
  {
    method: 'get',
    path: '/v1/partnership/contribution-rules',
    summary: 'Get contribution rules',
    tags: ['Partnership'],
    auth: true,
    responses: {
      200: { description: 'Contribution rules', schema: contributionRuleSchema },
    },
  },
  {
    method: 'put',
    path: '/v1/partnership/contribution-rules',
    summary: 'Set contribution rules',
    tags: ['Partnership'],
    auth: true,
    request: { body: setContributionRuleInputSchema },
    responses: {
      200: { description: 'Rules updated', schema: contributionRuleSchema },
      400: { description: 'Validation error' },
    },
  },
  {
    method: 'get',
    path: '/v1/partnership/shared-accounts',
    summary: 'Get shared bank accounts',
    tags: ['Partnership'],
    auth: true,
    responses: {
      200: { description: 'Shared accounts', schema: bankAccountSchema.array() },
    },
  },
  {
    method: 'put',
    path: '/v1/partnership/shared-accounts',
    summary: 'Set shared bank accounts',
    tags: ['Partnership'],
    auth: true,
    request: { body: setSharedAccountsInputSchema },
    responses: {
      200: { description: 'Shared accounts updated', schema: bankAccountSchema.array() },
      400: { description: 'Validation error' },
    },
  },
];
