import { SwaggerJson } from '@/types';
import { Logger } from '@cyberutopian/logger';
import { default as Axios } from 'axios';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
//@ts-ignore
import converter from 'swagger2openapi';

export const getSwagger = async (url?: string, token?: string) => {
  Logger.info(chalk.yellowBright(`url: ${url}`));
  if (!url) {
    return {};
  }

  // 确保 url 是字符串类型
  if (typeof url !== 'string') {
    throw new Error(`Invalid url type: ${typeof url}, expected string`);
  }

  let input;
  if (url.startsWith('http')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const { data } = await Axios.post(url, {
      "scope": {
        "type": "ALL",
        "excludedByTags": []
      },
      "options": {
        "includeApifoxExtensionProperties": false,
        "addFoldersToTags": false
      },
      "oasVersion": "3.0",
      "exportFormat": "JSON"
    }, {
      responseType: 'json',
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Apifox-Api-Version": "2024-03-28"
      },
    });

    input = data;
  } else {
    const data = readFileSync(url).toString();
    input = data;
  }

  if (typeof input === 'object') {
    return input;
  } else if (url.endsWith('json')) {
    return JSON.parse(input);
  }
  return yaml.load(input);
};

export const swaggerToOpenApi = (input: SwaggerJson) => {
  const options: any = {};
  options.patch = true;
  options.warnOnly = true;
  return new Promise<SwaggerJson>((resolve, reject) => {
    converter.convertObj(input, options, function (err: Error, result: any) {
      if (err) {
        reject(err);
        return;
      }
      resolve(result.openapi);
    });
  });
};
