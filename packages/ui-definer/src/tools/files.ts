import fs from 'node:fs';
import path from 'path';

export const getFiles = (dir: string) => {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        reject(err);
        return;
      }

      const list = files?.map((v) => path.join(dir, v));
      resolve(list);
    });
  });
};
