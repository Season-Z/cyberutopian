import { readFile } from 'fs/promises';
import { glob } from 'glob';
import fs from 'node:fs';
import path, { join } from 'node:path';
import * as XLSX from 'xlsx';
import { existFile, fileName, getConfig } from './utils';

export const exportTranslations = async () => {
  const dir = await getConfig();

  const files = await glob('**/*.json', { cwd: dir });
  const translations: Array<{ key: string; [x: string]: any }> = [];

  for (const file of files) {
    const locale = file.split('/')[0];
    const content = JSON.parse(await readFile(join(dir, file), 'utf-8'));

    const flattenedTranslations = flattenObject(content);

    Object.entries(flattenedTranslations).forEach(([key, value]) => {
      const existingRow = translations.find((row) => row.key === key);
      if (existingRow) {
        existingRow[locale] = value;
      } else {
        translations.push({
          key,
          [locale]: value,
        });
      }
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(translations);
  XLSX.utils.book_append_sheet(wb, ws, 'Translations');

  if (existFile()) {
    await fs.unlinkSync(path.resolve(process.cwd(), fileName));
  }

  XLSX.writeFile(wb, fileName, { type: 'base64' });
};

function flattenObject(obj: Record<string, any>, prefix = '') {
  return Object.keys(obj).reduce((acc: Record<string, any>, key) => {
    const pre = prefix.length ? `${prefix}.` : '';
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], `${pre}${key}`));
    } else {
      acc[`${pre}${key}`] = obj[key];
    }
    return acc;
  }, {});
}
