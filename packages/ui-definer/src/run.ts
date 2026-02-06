import { OptionValues } from 'commander';
import uiDefiner from './core';

const run = async (options: OptionValues) => {
  if (!options) {
    process.exit(-1);
  }

  if (options.ui) {
    uiDefiner(options.ui);
  }
};

export default run;
