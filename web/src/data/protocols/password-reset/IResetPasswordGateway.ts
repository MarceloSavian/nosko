export type ResetPasswordGatewayInput = {
  email: string;
  code: string;
  newPassword: string;
};

export interface IResetPasswordGateway {
  resetPassword(input: ResetPasswordGatewayInput): Promise<void>;
}
