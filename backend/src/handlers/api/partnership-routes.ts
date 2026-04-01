import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import {
  invitePartnerInputSchema,
  setContributionRuleInputSchema,
  setSharedAccountsInputSchema,
} from '../../domain/models/partnership/Partnership.js';
import type { IPartnershipService } from '../../domain/usecases/partnership/IPartnershipService.js';
import type { ProxyRoute } from '../domain/proxy.js';
import { withAuth } from '../shared/auth.js';
import { logErrorAndFormat } from '../shared/error.js';
import { formatResponse } from '../shared/response.js';

function extractPathParam(event: APIGatewayProxyEventV2, name: string): string {
  return event.pathParameters?.[name] ?? '';
}

export function makeInvitePartnerRoute(service: IPartnershipService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = invitePartnerInputSchema.parse(body);
      return formatResponse(201, await service.invitePartner(customerId, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeListInvitationsRoute(service: IPartnershipService) {
  return async (
    _event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      return formatResponse(200, await service.listInvitations(customerId));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeAcceptInvitationRoute(service: IPartnershipService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const invitationId = extractPathParam(event, 'id');
      return formatResponse(200, await service.acceptInvitation(customerId, invitationId));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeDeclineInvitationRoute(service: IPartnershipService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const invitationId = extractPathParam(event, 'id');
      await service.declineInvitation(customerId, invitationId);
      return formatResponse(204, {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeCancelInvitationRoute(service: IPartnershipService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const invitationId = extractPathParam(event, 'id');
      await service.cancelInvitation(customerId, invitationId);
      return formatResponse(204, {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeGetPartnershipRoute(service: IPartnershipService) {
  return async (
    _event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      return formatResponse(200, await service.getPartnership(customerId));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeDissolvePartnershipRoute(service: IPartnershipService) {
  return async (
    _event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      await service.dissolvePartnership(customerId);
      return formatResponse(204, {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeGetContributionRulesRoute(service: IPartnershipService) {
  return async (
    _event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const rules = await service.getContributionRules(customerId);
      return formatResponse(200, rules ?? {});
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeSetContributionRulesRoute(service: IPartnershipService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = setContributionRuleInputSchema.parse(body);
      return formatResponse(200, await service.setContributionRules(customerId, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeGetSharedAccountsRoute(service: IPartnershipService) {
  return async (
    _event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      return formatResponse(200, await service.getSharedAccounts(customerId));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makeSetSharedAccountsRoute(service: IPartnershipService) {
  return async (
    event: APIGatewayProxyEventV2,
    customerId: string,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = setSharedAccountsInputSchema.parse(body);
      return formatResponse(200, await service.setSharedAccounts(customerId, input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export function makePartnershipHandler(service: IPartnershipService, jwtService: IJwtService) {
  const routes: ProxyRoute = {
    'POST /v1/partnership/invite': withAuth(jwtService, makeInvitePartnerRoute(service)),
    'GET /v1/partnership/invitations': withAuth(jwtService, makeListInvitationsRoute(service)),
    'POST /v1/partnership/invitations/{id}/accept': withAuth(
      jwtService,
      makeAcceptInvitationRoute(service),
    ),
    'POST /v1/partnership/invitations/{id}/decline': withAuth(
      jwtService,
      makeDeclineInvitationRoute(service),
    ),
    'DELETE /v1/partnership/invitations/{id}': withAuth(
      jwtService,
      makeCancelInvitationRoute(service),
    ),
    'GET /v1/partnership': withAuth(jwtService, makeGetPartnershipRoute(service)),
    'DELETE /v1/partnership': withAuth(jwtService, makeDissolvePartnershipRoute(service)),
    'GET /v1/partnership/contribution-rules': withAuth(
      jwtService,
      makeGetContributionRulesRoute(service),
    ),
    'PUT /v1/partnership/contribution-rules': withAuth(
      jwtService,
      makeSetContributionRulesRoute(service),
    ),
    'GET /v1/partnership/shared-accounts': withAuth(
      jwtService,
      makeGetSharedAccountsRoute(service),
    ),
    'PUT /v1/partnership/shared-accounts': withAuth(
      jwtService,
      makeSetSharedAccountsRoute(service),
    ),
  };
  return (event: APIGatewayProxyEventV2) => {
    const route = routes[event.routeKey];
    return route
      ? route(event)
      : Promise.resolve({ statusCode: 404, body: `Request path ${event.routeKey} not found` });
  };
}

// Lambda handler
let _handler: ((event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResult>) | undefined;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
  if (!_handler) {
    const { jwtService } = await import('../factories/auth.js');
    const { partnershipService } = await import('../factories/partnership.js');
    _handler = makePartnershipHandler(partnershipService, jwtService);
  }
  return _handler(event);
};
