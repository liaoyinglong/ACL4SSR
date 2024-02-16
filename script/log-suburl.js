import urls from "./config.local.json" assert { type: "json" };
import { getSubUrl } from "./t2.js";

urls.forEach((item) => {
  console.log(getSubUrl(item));
  console.log("\n");
});
