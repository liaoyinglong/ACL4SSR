/**
 * 1. 分别获取
 *  - 分流配置 - A
 *  - 原始配置 - B
 * 2. 然后将 B 的 DNS 配置合并到 A
 * 3. 保存 A
 */
import { Hono } from 'hono';
import { serve } from '@hono/node-server';

import data from './config.local.js';
import { fetch, YAML, fs, path, $ } from 'zx';

for (const datum of data) {
  console.group(datum.name);
  console.log('begin to process');
  const rawConfig = await getRemoteConfig(datum.url);
  const isYaml = rawConfig.includes('external-controller');
  let subConfig;
  if (isYaml) {
    // 原始配置中有 proxy-providers 则要拍平
    subConfig = await getHostedSubConfig(rawConfig);
  } else {
    const subUrl = getSubUrl(datum.url);
    subConfig = await getRemoteConfig(subUrl);
  }
  console.log('fetch done');
  await saveConfig(rawConfig, `${datum.name}-raw.yaml`);
  await saveConfig(subConfig, `${datum.name}-sub.yaml`);
  console.groupEnd();
}

/**
 * @param {string} rawConfig
 * @returns
 */
async function getHostedSubConfig(rawConfig) {
  const { str: flatted, obj } = await flatProxyProviders(rawConfig);
  const { server, url } = hostFlattedConfig(flatted);
  const subUrl = getSubUrl(url);
  const subStr = await getRemoteConfig(subUrl);

  const subConfig = YAML.parse(subStr);
  subConfig.proxies2 = subConfig.proxies;
  subConfig.proxies = obj.proxies;

  server.close();
  return YAML.stringify(subConfig);
}

/**
 *
 * @param {string} config
 */
function hostFlattedConfig(config) {
  const app = new Hono();
  
  app.get('/', (c) => {
    return c.text(config);
  });

  const server = serve({
    fetch: app.fetch,
    port: 8787,
  });

  return {
    server,
    // 防止 subconverter 缓存
    url: `http://localhost:8787?time=${Date.now()}`,
  };
}

/**
 * subconverter 不支持 proxy-providers
 * 这里我们自己拍平
 * @param {string} rawConfig
 */
async function flatProxyProviders(rawConfig) {
  const r = YAML.parse(rawConfig);
  const proxyProviders = r['proxy-providers'];
  if (proxyProviders) {
    console.log('拍平 proxy-providers');
    for (const v of Object.values(proxyProviders)) {
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
    // 重置部分配置
    delete r['proxy-groups'];
    delete r['rule-providers'];
    delete r['proxy-providers'];
    delete r['rules'];

    const str = YAML.stringify(r);

    return { str, obj: r };
  }
  return { str: rawConfig, obj: r };
}

function getSubUrl(subUrl) {
  //const url = new URL("https://api.v1.mk/sub");
  // 使用自建的订阅转换
  const url = new URL('http://localhost:25500/sub');
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

async function getRemoteConfig(subUrl, flat) {
  const res = await fetch(subUrl, {
    timeout: 30 * 1000,
  });

  const text = await res.text();

  return text;
}

/**
 *
 * @param {string} config
 * @param {string} filename
 */
async function saveConfig(config, filename) {
  // 获得 yyyy-mm-dd 格式的日期
  const time = new Date().toISOString().split('T')[0];
  const filePath = path.join(import.meta.dirname, 'config', time, filename);
  await fs.ensureFile(filePath);
  await fs.writeFile(filePath, config);
  console.log(`save ${filename} done`);

  // 上传到路由器
  const remotePath = `/etc/openclash/config/${filename}`;
  await $`scp ${filePath} x-wrt:${remotePath}`;
  await $`scp ${filePath} x-wrt:/etc/openclash/backup/${filename}`;
}
