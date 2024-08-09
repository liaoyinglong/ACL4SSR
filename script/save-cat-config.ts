import { fileURLToPath } from 'bun';
import config from './config.local';
import { YAML, fs, path } from 'zx';
import { uploadAll } from './upload-to-wrt';
import { validateRules } from './valite-rules';
import { configMap, server, serverUrl } from './server';

const log = console.log.bind(null);

const day = new Date().toISOString().split('T')[0];

const outDir = path.join(__dirname, 'config', day);
log(`file will be saved to ${outDir}`);

interface ConfigItem {
  name: string;
  url: string;
}

async function saveRawToLocal() {
  await Promise.all(
    (config as ConfigItem[]).map(async (item) => {
      if (!item.name.includes('cat')) {
        return;
      }
      // 这是修改版本
      item.name = item.name.replace('cat', 'cat-x');

      const log = console.log.bind(null, `[${item.name}]: `);
      log(`fetching`, item.url);
      const res = await fetch(item.url);
      const str = await res.text();
      await saveFile(`${item.name}-raw.yaml`, str);
      const data = YAML.parse(str);

      const insertToFirst = (v: string) => {
        data['rules'].unshift(v);
      };

      {
        // 增加 openai 规则
        data['rule-providers']['openai'] = {
          type: 'http',
          behavior: 'domain',
          url: 'https://cdn.jsdelivr.net/gh/liaoyinglong/ACL4SSR@release/Clash/Ruleset/OpenAi.list',
          path: './ruleset/openai.yaml',
          interval: 86400,
        };
        insertToFirst(`RULE-SET,openai,PROXY-NATIVE-IP`);
      }

      {
        // 增加  steam 规则
        data['rule-providers']['steam'] = {
          type: 'http',
          behavior: 'domain',
          url: 'https://cdn.jsdelivr.net/gh/liaoyinglong/ACL4SSR@release/Clash/Ruleset/Steam.list',
          path: './ruleset/steam.yaml',
          interval: 86400,
        };
        insertToFirst(`RULE-SET,steam,HK`);
      }

      await saveFile(`${item.name}.yaml`, YAML.stringify(data));
    }),
  );
  await uploadAll('cat-x-2.yaml');
}

async function saveFile(name: string, str: string) {
  const filePath = path.join(outDir, name);
  await fs.ensureFile(filePath);
  await fs.writeFile(filePath, str);
}

// 直接运行的当前文件
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await saveRawToLocal();
  }
}
