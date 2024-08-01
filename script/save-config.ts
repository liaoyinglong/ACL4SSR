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
  const all = {
    proxies: [] as any[],
  };

  const toSubConfigs = await Promise.all(
    (config as ConfigItem[]).map(async (item) => {
      const log = console.log.bind(null, `[${item.name}]: `);
      log(`fetching`, item.url);
      const res = await fetch(item.url);
      const str = await res.text();
      await saveFile(`${item.name}-raw.yaml`, str);

      log(`begin to flat proxy-providers`);
      const flatted = await flatProxyProviders(str);

      log('add to all proxies');
      all.proxies = [...all.proxies, ...flatted.proxies];
      if (flatted.dns && !(all as any).dns) {
        (all as any).dns = flatted.dns;
      }

      return {
        ...item,
        yamlObj: flatted,
      };
    }),
  );

  toSubConfigs.push({
    url: '',
    name: 'combined',
    yamlObj: all,
  });

  for (const item of toSubConfigs) {
    const yamlStr = YAML.stringify(item.yamlObj);
    await saveFile(`${item.name}-flat.yaml`, yamlStr);

    log(`start fetch ${item.name} config`);
    configMap.set(item.name, yamlStr);

    const subUrl = getSubUrl(`${serverUrl}/config/${item.name}`, true);

    const res = await fetch(subUrl);
    const resText = await res.text();
    const resObj = YAML.parse(resText);
    // 重置某些字段为 订阅文件中的配置
    resObj.dns = item.yamlObj.dns;

    const finalStr = YAML.stringify(resObj);
    await saveFile(`${item.name}-sub.yaml`, finalStr);
    log(`write ${item.name} config done`);
  }

  if (await validateRules()) {
  }
  log('upload all to wrt');
  server.stop();
  await uploadAll();
}

async function saveFile(name: string, str: string) {
  const filePath = path.join(outDir, name);
  await fs.ensureFile(filePath);
  await fs.writeFile(filePath, str);
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
  //delete r['dns'];
  return r;
}

function getSubUrl(subUrl: string, local = false) {
  //const url = new URL("https://api.v1.mk/sub");
  // 使用自建的订阅转换
  const url = new URL('http://127.0.0.1:25500/sub');
  // Append additional parameters
  // 参数说明：https://github.com/tindy2013/subconverter/blob/master/README-cn.md#%E8%B0%83%E7%94%A8%E8%AF%B4%E6%98%8E-%E8%BF%9B%E9%98%B6
  url.searchParams.append('target', 'clash');
  url.searchParams.append('url', subUrl);
  url.searchParams.append(
    'config',
    local
      ? `${serverUrl}/Clash/config/ACL4SSR_Online_Full.ini`
      : 'https://raw.githubusercontent.com/liaoyinglong/ACL4SSR/release/Clash/config/ACL4SSR_Online_Full.ini',
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
