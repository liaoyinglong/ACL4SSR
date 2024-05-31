import { fileURLToPath } from 'bun';
import { $, path, fs, globby, YAML } from 'zx';

export async function validateRules() {
  const time = new Date().toISOString().split('T')[0];
  const dir = path.join(import.meta.dirname, 'config', time);
  const files = globby.globbySync('**/*-sub.yaml', {
    cwd: dir,
    absolute: true,
  });
  const file = files[0];

  const obj = YAML.parse(await fs.readFile(file, 'utf-8'));
  const rules = obj.rules;

  const urls = new Set<string>();
  const duplicate = new Set<string>();
  console.log(`开始解析 ${rules.length} 条规则`);
  console.log(`file: ${file}`);

  rules.forEach((rule) => {
    const [config, url, group] = rule.split(',');
    if (urls.has(url)) {
      duplicate.add(`${url} : ${group}`);
    }
    if (url) {
      urls.add(url);
    }
  });

  if (duplicate.size) {
    console.error(`error: 重复的规则 ${duplicate.size} 条`);
    duplicate.forEach((v) => console.log(v));
  } else {
    console.log(`没有重复的规则`);
  }

  return !duplicate.size;
}

// 直接运行的当前文件
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await validateRules();
  }
}
