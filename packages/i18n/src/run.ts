import { Logger } from '@cyberutopian/logger';
import { OptionValues } from 'commander';
import { exportTranslations } from './core/export';
import { importTranslations } from './core/import';

const run = async (options: OptionValues) => {
  try {
    if (options.Export) {
      await exportTranslations();
    }
    if (options.Import) {
      await importTranslations();
    }
  } catch (error) {
    // @ts-ignore
    Logger.error(error);
    process.exit(-1);
  }
};

export default run;
