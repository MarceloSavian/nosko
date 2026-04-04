export interface IDeclineInvitation {
  execute(id: string): Promise<void>;
}
