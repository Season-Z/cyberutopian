#!/usr/bin/env node
// @ts-ignore
import { BuildScriptConfig, CLI_ARGS_OBJ } from './config/base';
import { doDev } from './core/dev-server';
import { doBuild } from './core/do-build';
import { subBundle } from './core/sub-bundle';
import { toolBuild } from './core/tool-build';

export function run() {
  if (CLI_ARGS_OBJ.subBundle) {
    return subBundle();
  }
  if (CLI_ARGS_OBJ.tool) {
    return toolBuild();
  }
  if (CLI_ARGS_OBJ.build) {
    return doBuild();
  }
  if (CLI_ARGS_OBJ.dev) {
    return doDev();
  }
}

export { getTsDefaultObj } from './utils';
export type { BuildScriptConfig };
