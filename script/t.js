let subUrl = process.env.URL || process.env.url;
//subUrl = ``;
if (!subUrl) {
  console.log("URL is empty");
  process.exit(1);
}

const { getSubUrl } = require("./t2");
console.log(getSubUrl(subUrl));
