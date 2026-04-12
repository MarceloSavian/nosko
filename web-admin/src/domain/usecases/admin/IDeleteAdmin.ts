export interface IDeleteAdmin {
  execute(id: string): Promise<void>;
}
