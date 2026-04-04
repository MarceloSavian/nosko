export type VerifyEmailGatewayInput = {
  email: string;
  code: string;
};

export interface IVerifyEmailGateway {
  verifyEmail(input: VerifyEmailGatewayInput): Promise<void>;
}
