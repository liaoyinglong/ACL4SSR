import type { Rule } from './type.ts';

export const game: Rule = {
  name: 'game',
  rules: [
    // 拳头
    'DOMAIN-SUFFIX,riotcdn.net',
    'DOMAIN-SUFFIX,riotgames.com',
    'DOMAIN-SUFFIX,riotgames.com.cdn.cloudflare.net',
    'DOMAIN-KEYWORD,riotcdn',
    'DOMAIN-KEYWORD,riotgames',
  ],
};
