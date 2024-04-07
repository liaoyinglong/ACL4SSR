import urls from "./config.local.js" 
import { getSubUrl } from "./t2.js";

urls.forEach((item) => {
  console.log(getSubUrl(item));
  console.log("\n");
});
