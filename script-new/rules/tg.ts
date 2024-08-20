import type { Rule } from './type.ts';
import { fs, path, YAML } from 'zx';

export const tg: Rule = {
  name: 'tg',

  async rules() {
    const res = await fetch(
      //'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt',
      'https://raw.githubusercontent.com/Loyalsoldier/clash-rules/release/telegramcidr.txt',
    );
    const text = await res.text();
    const data = YAML.parse(text) as {
      payload: string[];
    };

    return defaultRules.concat(
      data.payload.map((v) => {
        //  "91.105.192.0/23",
        //  "2a0a:f280::/32"
        const isIPV6 = v.includes('::');
        return isIPV6
          ? `IP-CIDR6,${v},${tg.name},no-resolve`
          : `IP-CIDR,${v},${tg.name},no-resolve`;
      }),
    );
  },
};

const defaultRules = [
  'DOMAIN-SUFFIX,t.me',
  'DOMAIN-SUFFIX,tdesktop.com',
  'DOMAIN-SUFFIX,telegra.ph',
  'DOMAIN-SUFFIX,telegram.me',
  'DOMAIN-SUFFIX,telegram.org',
  'DOMAIN-SUFFIX,telesco.pe',
].map((v) => {
  return `${v},${tg.name}`;
});
