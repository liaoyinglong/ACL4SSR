import { $, path, fs, globby, YAML } from 'zx';
import { fromRoot } from './shared';
import readline from 'node:readline';
import { Readable } from 'stream';
import os from 'os';

const files = await globby('**/*.list', {
  cwd: fromRoot('Clash'),
  absolute: true,
});

for (const filePath of files) {
  const file = Bun.file(filePath);
  console.log(`start process: ${filePath}`);

  let str = await file.text();
  let outStr = '';
  const set = new Set<string>();
  const arr = str.split('\n');

  arr.forEach((line, i, arr) => {
    if (set.has(line)) {
      return;
    }

    // 异步处理每一行内容
    if (line.trim()) {
      set.add(line);
    }

    const isLast = i === arr.length - 1;
    outStr += line;
    if (isLast) {
      // 最后一场不需要加换行
      return;
    }
    outStr += os.EOL;
  });

  await Bun.write(file, outStr);
}
