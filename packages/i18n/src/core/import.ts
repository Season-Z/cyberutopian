import { mkdir, writeFile } from 'fs/promises';
import fs from 'node:fs';
import { join } from 'path';
import * as XLSX from 'xlsx';
import { getConfig, getInputFile } from './utils';

export const importTranslations = async () => {
  const input = await getInputFile();

  const workbook = XLSX.readFile(input);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);

  // @ts-ignore
  const locales = Object.keys(data[0]).filter((key) => key !== 'key');
  const translations: Record<string, Record<string, any>> = {};

  locales.forEach((locale) => {
    translations[locale] = {};
  });

  data.forEach((row: any) => {
    locales.forEach((locale) => {
      if (row[locale]) {
        setNestedValue(translations[locale], row.key.split('.'), row[locale]);
      }
    });
  });

  const dir = await getConfig();

  for (const locale of locales) {
    const filePath = join(dir, locale);

    if (!fs.existsSync(filePath)) {
      await mkdir(filePath, { recursive: true });
    }

    await writeFile(filePath, JSON.stringify(translations[locale], null, 2), 'utf-8');
  }
};

function setNestedValue(obj: Record<string, any>, path: string[], value: any) {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  current[path[path.length - 1]] = value;
}
