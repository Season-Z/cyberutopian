import { spawn, SpawnOptions } from 'node:child_process';

const execute = async (command: string, args: string[], options: SpawnOptions) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });

    process.on('close', (code) => {
      if (code !== 0) {
        console.log(`Command failed with code ${code}`);
      }
      resolve(true);
    });
    process.on('error', (err) => {
      reject(err);
    });
  });
};

export default execute;
