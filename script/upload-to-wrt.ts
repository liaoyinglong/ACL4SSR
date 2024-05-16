import { fileURLToPath } from 'bun';
import { $, path, fs, globby } from 'zx';

const time = new Date().toISOString().split('T')[0];

export async function uploadAll() {
  const dir = path.join(import.meta.dirname, 'config', time);

  const files = globby.globbySync('**/*.yaml', {
    cwd: dir,
    absolute: true,
  });
  //const active = path.join(dir, 'combined-sub.yaml');
  const active = path.join(dir, 'ss-sub.yaml');

  for (const file of files) {
    if (file.includes('-flat.yaml')) {
      continue;
    }
    await uploadToWrt(file, file === active);
  }
}

async function uploadToWrt(filePath, shouldActive = false) {
  // 获取到最后一级文件名
  const filename = path.basename(filePath);

  // 上传到路由器
  const remotePath = `/etc/openclash/config/${filename}`;
  await $`scp ${filePath} x-wrt:${remotePath}`;
  await $`scp ${filePath} x-wrt:/etc/openclash/backup/${filename}`;

  if (shouldActive) {
    console.group('begin active ' + filePath);

    const commands = [
      // 设置 openclash 的配置文件路径
      `uci set openclash.config.config_path=${remotePath}`,
      // 提交配置
      `uci commit openclash`,
      // 重启 openclash
      `/etc/init.d/openclash restart`,
    ].join(' && ');

    await $`ssh x-wrt ${commands}`;

    console.groupEnd();
  }
}

// 直接运行的当前文件
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await uploadAll();
  }
}
