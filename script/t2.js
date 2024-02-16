export function getSubUrl(subUrl) {
  const url = new URL("https://api.v1.mk/sub");
  // Append additional parameters
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
