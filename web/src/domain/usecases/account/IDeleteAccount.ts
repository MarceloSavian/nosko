export interface IDeleteAccount {
  execute(id: string): Promise<void>;
}
