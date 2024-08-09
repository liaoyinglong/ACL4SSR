import { fileURLToPath } from 'bun';
import { fs, path, YAML } from 'zx';
import { config, outDir, saveFile } from './shared.ts';

const log = console.log.bind(null, '[download]: ');
log(`file will be saved to ${outDir}`);
// 保存到本地
export async function fetchConfigs() {
  let allProxies = [];
  const arr = await Promise.all(
    config.map(async (item) => {
      const log2 = log.bind(null, `${item.name} - `);
      log2(`fetching`, item.url);
      const res = await fetch(item.url);
      const str = await res.text();
      await saveFile(`${item.name}-raw.yaml`, str);
      const data = await flatProxyProviders(str);
      await saveFile(`${item.name}-flat.yaml`, YAML.stringify(data));
      allProxies = allProxies.concat(data.proxies);
      return data;
    }),
  );

  log(`save all proxies to all-proxies.yaml total ${allProxies.length}`);
  await saveFile('all-proxies.yaml', YAML.stringify(allProxies));

  return arr;
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
  delete r['rule-providers'];
  delete r['proxy-groups'];
  delete r['proxy-providers'];
  delete r['rules'];
  // 暂时移除，后续看是否有必要开放
  //delete r['dns'];
  return r;
}

// 直接运行的当前文件
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await fetchConfigs();
  }
}
