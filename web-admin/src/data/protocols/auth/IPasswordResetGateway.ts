export type RequestPasswordResetGatewayInput = {
  email: string;
};

export type ResetPasswordGatewayInput = {
  email: string;
  code: string;
  newPassword: string;
};

export interface IPasswordResetGateway {
  requestReset(input: RequestPasswordResetGatewayInput): Promise<void>;
  resetPassword(input: ResetPasswordGatewayInput): Promise<void>;
}
