import type { Partnership } from '@/domain/models/partnership/Partnership';

export interface ILoadPartnership {
  execute(): Promise<Partnership | null>;
}
