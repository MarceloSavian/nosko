export interface ICancelInvitation {
  execute(id: string): Promise<void>;
}
