/**
 * 1. 分别获取
 *  - 分流配置 - A
 *  - 原始配置 - B
 * 2. 然后将 B 的 DNS 配置合并到 A
 * 3. 保存 A
 */

import data from "./config.local.js" 
import { fetch, YAML, fs, path, $ } from "zx";

for (const datum of data) {
  console.group(datum.name);
  console.log("begin to process");
  const subUrl = getSubUrl(datum.url);
  const [subConfig, rawConfig] = await Promise.allSettled([
    getRemoteConfig(subUrl),
    getRemoteConfig(datum.url),
  ]);
  console.log("fetch done");
  await saveConfig(subConfig, `${datum.name}-sub.yaml`);
  await saveConfig(rawConfig, `${datum.name}-raw.yaml`);
  console.groupEnd();
}

function getSubUrl(subUrl) {
  //const url = new URL("https://api.v1.mk/sub");
  // 使用自建的订阅转换
  const url = new URL("http://localhost:25500/sub");
  // Append additional parameters
  // 参数说明：https://github.com/tindy2013/subconverter/blob/master/README-cn.md#%E8%B0%83%E7%94%A8%E8%AF%B4%E6%98%8E-%E8%BF%9B%E9%98%B6
  url.searchParams.append("target", "clash");
  url.searchParams.append("url", subUrl);
  url.searchParams.append("insert", "false");
  url.searchParams.append(
    "config",
    "https://raw.githubusercontent.com/liaoyinglong/ACL4SSR/release/Clash/config/ACL4SSR_Online_Full.ini",
  );
  url.searchParams.append("emoji", "true");
  url.searchParams.append("list", "false");
  url.searchParams.append("xudp", "false");
  url.searchParams.append("udp", "false");
  url.searchParams.append("tfo", "false");
  url.searchParams.append("expand", "true");
  url.searchParams.append("scv", "false");
  url.searchParams.append("fdn", "false");
  url.searchParams.append("new_name", "true");

  return url.href;
}

async function getRemoteConfig(subUrl) {
  const res = await fetch(subUrl, {
    timeout: 30 * 1000,
  });
  const text = await res.text();
  return text;
}

async function saveConfig(config, filename) {
  // 获得 yyyy-mm-dd 格式的日期
  const time = new Date().toISOString().split("T")[0];
  if (config.status === "fulfilled") {
    const filePath = path.join(import.meta.dirname, "config", time, filename);
    await fs.ensureFile(filePath);
    await fs.writeFile(filePath, config.value);
    console.log(`save ${filename} done`);

    // 上传到路由器
    const remotePath = `/etc/openclash/config/${filename}`;
    await $`scp ${filePath} x-wrt:${remotePath}`;
    await $`scp ${filePath} x-wrt:/etc/openclash/backup/${filename}`;
  } else {
    console.log(`save ${filename} failed`);
    console.error(config.reason);
  }
}
