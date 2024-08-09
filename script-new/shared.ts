import { fs, path } from 'zx';
import configRaw from './config.local.js';
interface ConfigItem {
  name: string;
  url: string;
}

export const config = configRaw as ConfigItem[];

export const day = new Date().toISOString().split('T')[0];

export const outDir = path.join(__dirname, 'config', day);

export async function saveFile(name: string, str: string) {
  const filePath = path.join(outDir, name);
  await fs.ensureFile(filePath);
  await fs.writeFile(filePath, str);
}
