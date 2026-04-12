export interface IDeleteCustomer {
  execute(id: string): Promise<void>;
}
