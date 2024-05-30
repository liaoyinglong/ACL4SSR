import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import path from 'node:path';
import { fs } from 'zx';
const removeGithubUrl = (url: string, p: string = '') => {
  return url.replaceAll(
    'https://raw.githubusercontent.com/liaoyinglong/ACL4SSR/release',
    p,
  );
};

const fromRoot = (p: string) => {
  return path.join(import.meta.dirname, '../', p);
};

const app = new Hono();

const server = Bun.serve({
  fetch: app.fetch,
  port: 8787,
});
const serverUrl = `http://localhost:${server.port}`;
console.log(`server listen on ${serverUrl}`);

app.get(`/Clash*`, async (c) => {
  const p = fromRoot(c.req.path);
  console.log('🚀 ~ app.get ~ p:', p);
  const str = await fs.readFile(p, 'utf-8');
  const str2 = removeGithubUrl(str, `http://localhost:8787`);
  return c.text(str2);
});
const configMap = new Map<string, string>();
app.get(`/config/:name`, async (c) => {
  const name = c.req.param('name');
  const config = configMap.get(name);
  if (!config) {
    throw new HTTPException(404, {
      message: `config ${name} not found, current support: ${[...configMap.keys()]}`,
    });
  }

  return c.text(config, {
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
});

export { server, app, configMap, serverUrl };
