import { normal } from './normal';

export const generateProject = async (name: string, dir: string) => {
  await normal(name, dir);
};
