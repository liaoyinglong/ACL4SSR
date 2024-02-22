import { $, path, fs } from "zx";

const time = new Date().toISOString().split("T")[0];

export async function uploadToWrt(filePath) {
  // 获取到最后一级文件名
  const filename = path.basename(filePath);

  // 上传到路由器
  const remotePath = `/etc/openclash/config/${filename}`;
  await $`scp ${filePath} x-wrt:${remotePath}`;
  await $`scp ${filePath} x-wrt:/etc/openclash/backup/${filename}`;

  const commands = [
    // 设置 openclash 的配置文件路径
    `uci set openclash.config.config_path=${remotePath}`,
    // 提交配置
    `uci commit openclash`,
    // 重启 openclash
    `/etc/init.d/openclash restart`,
  ].join(" && ");

  await $`ssh x-wrt ${commands}`;
}

uploadToWrt(
  path.join(
    import.meta.dirname,
    "config",
    //
    time,
    //
    "ss-sub.yaml"
  )
);
// console.log(import.meta.dirname);
