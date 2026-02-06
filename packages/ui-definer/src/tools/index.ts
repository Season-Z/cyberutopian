import axios from 'axios';
import * as fs from 'fs';
import ora from 'ora';
import * as path from 'path';

const packageJson = require('../../package.json');

export function firstUpper(str: string) {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L: string) => L.toUpperCase());
}

// spinning
export const spinner = (text: string = '操作中...') =>
  ora({
    text: `cyber: ${text}`,
    color: 'yellow',
    spinner: {
      interval: 80, // Optional
      frames: ['-', '\\', '|', '/', '-'],
    },
  });

export const getFileData = (path: string) => {
  return new Promise((resolve, reject) => {
    const rs = fs.createReadStream(path, { encoding: 'utf8' });

    rs.on('data', (chunk) => {
      resolve(chunk.toString());
    });

    rs.on('error', (err) => {
      reject(err.message);
    });
  });
};

export const writeFileData = (path: string, data: string) => {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(path);

    ws.write(data);

    ws.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(true);
    });
  });
};

// 获取配置文件
export const getConfigFile = () => {
  const configPath = path.resolve(process.cwd(), 'patcher.config.json');
  return require(configPath);
};

export const absolutePath = (pa: string) => {
  return path.resolve(process.cwd(), pa);
};

// 生成文件
export const createFileWithDirs = (filePath: string, content: string) => {
  return new Promise((resolve, reject) => {
    const directory = path.dirname(filePath);

    // 递归创建上级文件夹
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // 创建文件
    fs.writeFile(filePath, content, {}, (err) => {
      if (err) {
        reject();
      } else {
        resolve(true);
      }
    });
  });
};

export function getPackageRegistry() {
  return packageJson.publishConfig.registry;
}

/** 获取最新的版本 */
export async function latestVersion(packageName: string, isBeta?: boolean) {
  const response = await axios.get(`http://registry.npmjs.org/${packageName}`, {
    timeout: 1000 * 10,
  });
  const versionsList = Object.keys(response.data.versions);
  for (let i = versionsList.length - 1; i >= 0; i--) {
    if (isBeta) {
      return versionsList[i];
    }
    if (versionsList[i].indexOf('beta') === -1) {
      return versionsList[i];
    }
  }
}

export * from './files';
