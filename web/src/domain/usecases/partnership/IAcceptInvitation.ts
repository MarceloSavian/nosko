import type { Partnership } from '@/domain/models/partnership/Partnership';

export interface IAcceptInvitation {
  execute(id: string): Promise<Partnership>;
}
