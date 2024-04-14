import { fileURLToPath } from 'bun';
import config from './config.local';
import { YAML, fs, path } from 'zx';
import { uploadAll } from './upload-to-wrt';

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

  const combinedConfig = YAML.stringify(all);

  {
    log('save combined proxies');
    const filePath = path.join(outDir, 'combined.yaml');
    await fs.ensureFile(filePath);
    await fs.writeFile(filePath, combinedConfig);
    log('write combined done');
  }

  {
    log('start host combined config');
    const server = Bun.serve({
      fetch(req) {
        return new Response(combinedConfig);
      },
      port: 8787,
    });
    log('start fetch final config');
    const subUrl = getSubUrl('http://localhost:8787');
    const res = await fetch(subUrl);
    const text = await res.text();
    log('fetch done, save final to local');
    const filePath = path.join(outDir, 'final.yaml');
    await fs.ensureFile(filePath);
    await fs.writeFile(filePath, text);
    log('write final done');
    server.stop();
  }

  log('upload all to wrt');
  await uploadAll();
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

function getSubUrl(subUrl: string) {
  //const url = new URL("https://api.v1.mk/sub");
  // 使用自建的订阅转换
  const url = new URL('http://127.0.0.1:25500/sub');
  // Append additional parameters
  // 参数说明：https://github.com/tindy2013/subconverter/blob/master/README-cn.md#%E8%B0%83%E7%94%A8%E8%AF%B4%E6%98%8E-%E8%BF%9B%E9%98%B6
  url.searchParams.append('target', 'clash');
  url.searchParams.append('url', subUrl);
  url.searchParams.append(
    'config',
    'https://raw.githubusercontent.com/liaoyinglong/ACL4SSR/release/Clash/config/ACL4SSR_Online_Full.ini',
  );

  return url.href;
}

// 直接运行的当前文件
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await saveRawToLocal();
  }
}
