import { path } from 'zx';

export const fromRoot = (p: string) => {
  return path.join(import.meta.dirname, '../', p);
};
