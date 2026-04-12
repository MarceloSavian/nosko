export interface IDeleteInstitution {
  execute(id: string): Promise<void>;
}
