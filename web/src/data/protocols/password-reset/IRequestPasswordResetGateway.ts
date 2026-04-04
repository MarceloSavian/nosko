export type RequestPasswordResetGatewayInput = {
  email: string;
};

export interface IRequestPasswordResetGateway {
  requestReset(input: RequestPasswordResetGatewayInput): Promise<void>;
}
