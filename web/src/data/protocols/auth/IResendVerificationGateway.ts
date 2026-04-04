export type ResendVerificationGatewayInput = {
  email: string;
};

export interface IResendVerificationGateway {
  resendVerification(input: ResendVerificationGatewayInput): Promise<void>;
}
