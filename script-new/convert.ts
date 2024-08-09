import { fileURLToPath } from 'bun';
import { fs, path, YAML } from 'zx';
import { config, outDir, saveFile } from './shared.ts';
import { ai } from './rules/ai.ts';
import { crypto } from './rules/crypto.ts';
import { game } from './rules/game.ts';

const log = console.log.bind(null, '[convert]: ');

interface Item {
  name: string;
}

export async function convert() {
  const allProxies: Item[] = YAML.parse(
    await fs.readFile(path.join(outDir, 'all-proxies.yaml'), 'utf-8'),
  );

  const groupedProxies = Object.groupBy(allProxies, (v) => {
    if (v.name.includes('HK') || v.name.includes('香港')) {
      return 'HK';
    }
    if (v.name.includes('Taiwan')) {
      return 'TW';
    }
    if (
      v.name.includes('Japan') ||
      v.name.includes('日本') ||
      v.name.includes('JP')
    ) {
      return 'JP';
    }
    if (
      v.name.includes('UnitedStates') ||
      v.name.includes('美国') ||
      v.name.includes('us')
    ) {
      return 'US';
    }
    if (v.name.includes('Australia')) {
      return 'AU';
    }
    if (v.name.includes('Germany')) {
      return 'DE';
    }
    if (v.name.includes('Singapore')) {
      return 'SG';
    }
    if (v.name.includes('Netherlands')) {
      return 'NL';
    }
    if (v.name.includes('UnitedKingdom')) {
      return 'UK';
    }
    return 'Other';
  });

  const proxyGroups = [
    {
      ...urlTestConfig,
      name: 'AUTO',
      proxies: Object.keys(groupedProxies),
    },
    {
      name: 'PROXY',
      type: 'select',
      proxies: Object.keys(groupedProxies),
    },
  ];

  for (const [key, value] of Object.entries(groupedProxies)) {
    log(`add ${key} proxy group`);
    proxyGroups.push({
      ...urlTestConfig,
      name: key,
      proxies: value.map((v) => v.name),
    });
  }

  const finalConfig = YAML.parse(
    await fs.readFile(path.join(__dirname, 'base.yaml'), 'utf-8'),
  );
  finalConfig.proxies = allProxies;
  finalConfig['proxy-groups'] = proxyGroups;

  //  const ssRaw = YAML.parse(
  //    await fs.readFile(path.join(outDir, 'ss-raw.yaml'), 'utf-8'),
  //  );
  //  if (ssRaw.dns) {
  //    finalConfig.dns = ssRaw.dns;
  //  }

  const rules = [];

  [ai, crypto, game].forEach((v) => {
    log(`add ${v.name} rules`);
    proxyGroups.push({
      ...urlTestConfig,
      name: v.name,
      proxies: Object.keys(groupedProxies).concat('AUTO', 'DIRECT'),
    });
    rules.push(...v.rules.map((rule) => `${rule},${v.name}`));
  });

  // 写入兜底规则
  rules.push(
    ...[
      //如果目标 IP 属于局域网 (LAN),则直接连接，不使用代理。
      `GEOIP,LAN,DIRECT`,
      //如果目标 IP 位于中国大陆，则直接连接，不使用代理。
      `GEOIP,CN,DIRECT`,
      //这是一个兜底规则。如果前面的所有规则都不匹配，则使用名为 "AUTO" 的代理组或策略。
      `MATCH,AUTO`,
    ],
  );
  finalConfig.rules = rules;
  log(`total rules: ${rules.length}`);
  await saveFile('final-config.yaml', YAML.stringify(finalConfig));
  log(`write final-config.yaml`);
}

const urlTestConfig = {
  type: 'url-test',
  url: 'http://www.gstatic.com/generate_204',
  interval: 300,
  tolerance: 50,
  lazy: true,
};

// 直接运行的当前文件
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await convert();
  }
}
