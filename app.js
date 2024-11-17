const fs = require("fs");
const path = require("path");
const { URL } = require('url');

const { DICTIONNARY_PATH, RESPONSE_PATH } = require("./config/const.js");
const { isValidJson } = require("./utils/utils.js");

!fs.existsSync(DICTIONNARY_PATH) && fs.mkdirSync(DICTIONNARY_PATH);
!fs.existsSync(RESPONSE_PATH) && fs.mkdirSync(RESPONSE_PATH);

const dicConfig = {
  code: 200,
  message: "对照关系",
  data: [],
};
let harFilePath = '';
// console.log('子进程启动成功', process.argv[2].replace('--path=', ''));
try {
  harFilePath = process.argv[2].replace('--path=', '')
} catch (error) {
  // 关闭进程0: 表示程序成功退出。 非 0 值（如 1、2 等）: 表示程序以错误状态退出。
  process.exit(1);
}
// 读取 HAR 文件
fs.readFile(harFilePath, "utf8", (err, data) => {
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
      id: count + 1,
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
    fs.writeFileSync(`${RESPONSE_PATH}/${apiName}`, content, "utf8");
  } catch (err) {
    console.error(`写入 ${apiName} 文件失败:`, err);
  }
}

function writeDicConfig() {
  try {
    fs.writeFileSync(`${DICTIONNARY_PATH}/接口关系.json`, JSON.stringify(dicConfig), "utf8");
    console.log(JSON.stringify({
      status: 200,
      message: "接口关系文件已生成",
      path: `${DICTIONNARY_PATH}/接口关系.json`,
    }));
  } catch (err) {
    console.error(`${DICTIONNARY_PATH}/接口关系.json 错误`, err);
  }
}

