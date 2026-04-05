export interface IDeleteTransaction {
  execute(id: string): Promise<void>;
}
