import chalk from 'chalk';
let prefix = 'shuyi';

const color = {
  info: chalk.bgBlue,
  success: chalk.bgGreen,
  warn: chalk.bgYellow,
  error: chalk.bgRed,
};

/** console日志 **/
const log = (type: 'warn' | 'success' | 'error' | 'info', msg: string, ...others: any) => {
  console.log(`${color[type](`[${prefix} ${type}]`)} ${msg}${others.length > 0 ? '\n' : ''}`, ...others);
};
export const Logger = {
  info: (msg: string, ...others: any) => {
    log('info', msg, ...others);
  },
  warn: (msg: string, ...others: any) => {
    log('warn', msg, ...others);
  },
  success: (msg: string, ...others: any) => {
    log('success', msg, ...others);
  },
  error: (msg: string, ...others: any) => {
    log('error', msg, ...others);
  },
};

export const setPrefix = (value: string) => (prefix = value);
