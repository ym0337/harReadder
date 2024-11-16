const fs = require("fs");
const path = require("path");
const { URL } = require('url');

const dictPath = path.join(__dirname, "dictionnary");
const responsePath = path.join(__dirname, "response");

const dicConfig = {
  code: 200,
  message: "对照关系",
  data: [],
};

// 读取 HAR 文件
fs.readFile("./har/new-tab-page.har", "utf8", (err, data) => {
  if (err) {
    return console.error("读取文件失败:", err);
  }

  try {
    // 解析 HAR 数据
    const harData = JSON.parse(data);
    processHarEntries(harData.log.entries);

    // 写入接口关系到文件
    writeDicConfig();
  } catch (parseError) {
    console.error("解析 JSON 失败:", parseError);
  }
});

function processHarEntries(entries) {
  let count = 0;
  entries.forEach((entry) => {
    // console.log(entry.request.url);
    const url = new URL(entry.request.url);
    // console.log(url.protocol);
    const ext = isValidJson(entry.response.content.text) ? ".json" : '.txt';
    const apiName = `接口_${count}${ext}`;

    dicConfig.data.push({
      method: entry.request.method,
      path: url.pathname,
      fullpath: url.href,
      apiName: apiName,
    });

    // 创建文件并写入内容
    writeResponseFile(apiName, entry.response.content.text);
    count++;
  });
}

function writeResponseFile(apiName, content) {
  try {
    fs.writeFileSync(`${responsePath}/${apiName}`, content, "utf8");
  } catch (err) {
    console.error(`写入 ${apiName} 文件失败:`, err);
  }
}

function writeDicConfig() {
  try {
    fs.writeFileSync(`${dictPath}/接口关系.json`, JSON.stringify(dicConfig), "utf8");
    console.log(`${dictPath}/接口关系.json 创建成功`);
  } catch (err) {
    console.error(`${dictPath}/接口关系.json 错误`, err);
  }
}

function isValidJson(data) {
  if (typeof data === "string") {
    try {
      JSON.parse(data);
      return true; // 字符串可以成功解析为 JSON
    } catch {
      return false; // 字符串不能解析为 JSON
    }
  }
  return false; // 不是字符串类型
}
