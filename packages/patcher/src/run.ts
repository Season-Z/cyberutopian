import { initPatch } from './core/init';
import { validateBk } from './utils/validate';

export const run = async (options: any) => {
  await validateBk();

  if (options.init) {
    return initPatch();
  }
};
