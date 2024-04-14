import { fileURLToPath } from 'bun';
import config from './config.local';
import { YAML, fs, path } from 'zx';

const log = console.log.bind(null);

interface ConfigItem {
  name: string;
  url: string;
}

async function saveRawToLocal() {
  const day = new Date().toISOString().split('T')[0];

  const outDir = path.join(__dirname, 'config', day);
  log(`file will be saved to ${outDir}`);

  const all = {
    proxies: [] as any[],
  };

  await Promise.all(
    (config as ConfigItem[]).map(async (item) => {
      const log = console.log.bind(null, `[${item.name}]: `);
      log(`fetching`, item.url);
      const res = await fetch(item.url);
      const str = await res.text();
      {
        log(`fetch done, save raw to local`);
        const filePath = path.join(outDir, `${item.name}-raw.yaml`);
        await fs.ensureFile(filePath);
        await fs.writeFile(filePath, str);
        log(`write raw done`);
      }

      log(`begin to flat proxy-providers`);
      const flatted = await flatProxyProviders(str);
      {
        const str = YAML.stringify(flatted);
        const filePath = path.join(outDir, `${item.name}-flat.yaml`);
        await fs.ensureFile(filePath);
        await fs.writeFile(filePath, str);
        log(`write flat done`);
      }
      log('add to all proxies');
      all.proxies = [...all.proxies, ...flatted.proxies];
    }),
  );

  {
    log('save combined proxies');
    const str = YAML.stringify(all);
    const filePath = path.join(outDir, 'combined.yaml');
    await fs.ensureFile(filePath);
    await fs.writeFile(filePath, str);
    log('write combined done');
  }

  {
    log('');
  }
}

/**
 * subconverter 不支持 proxy-providers
 * 这里我们自己拍平
 * @param {string} rawConfig
 */
async function flatProxyProviders(rawConfig: string) {
  const r = YAML.parse(rawConfig);
  const proxyProviders = r['proxy-providers'];
  if (proxyProviders) {
    for (const v of Object.values<any>(proxyProviders)) {
      if (v.url) {
        const res = await fetch(v.url);
        const text = await res.text();

        const r2 = YAML.parse(text);
        r.proxies = [...(r.proxies || []), ...r2.proxies];
      }
    }

    // 根据 name + server + port 去重
    const keys = new Set();
    r.proxies = r.proxies.filter((v) => {
      const key = v.name + v.server + v.port;
      if (keys.has(key)) {
        console.log(
          `重复的 proxy: name: ${v.name}, server: ${v.server}, port: ${v.port}`,
        );
        return false;
      }
      keys.add(key);
      return true;
    });
  }
  // 重置部分配置
  delete r['proxy-groups'];
  delete r['rule-providers'];
  delete r['proxy-providers'];
  delete r['rules'];
  // 暂时移除，后续看是否有必要开放
  delete r['dns'];
  return r;
}

// 直接运行的当前文件
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await saveRawToLocal();
  }
}
