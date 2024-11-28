const fs = require("fs");
const { URL } = require("url");
const { DICTIONNARY_PATH, RESPONSE_PATH } = require("./config/const.js");
const { isValidJson } = require("./utils/utils.js");
const db = require("./SQLite/db.js");

!fs.existsSync(DICTIONNARY_PATH) && fs.mkdirSync(DICTIONNARY_PATH);
!fs.existsSync(RESPONSE_PATH) && fs.mkdirSync(RESPONSE_PATH);

let harFilePath = ''
try {
  // console.log('子进程启动成功', process.argv[2].replace('--path=', ''));
  harFilePath = process.argv[2].replace("--path=", "");
} catch (error) {
  // 关闭进程0: 表示程序成功退出。 非 0 值（如 1、2 等）: 表示程序以错误状态退出。
  process.exit(1);
}

const dicConfig = {
  fileName: harFilePath.split("-_-")[1],
  code: 200,
  message: "对照关系",
  methodOptions: [],
  data: [],
};

write_config();

process.on("uncaughtException", function (err) {
  console.error("发生未捕获的异常:", err);
  process.exit(1); // 退出程序
});

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
    // writeDicConfig();
  } catch (parseError) {
    console.error("解析 JSON 失败:", parseError);
  }
});
async function processHarEntries(entries) {
  const dbdata = [];
  // 插入多条数据
  entries.forEach((entry) => {
    const url = new URL(entry.request.url);
    dbdata.push({
      method: entry.request.method,
      path: url.pathname,
      fullpath: url.href,
      content: entry.response.content.text,
    });
    // 创建文件并写入内容
    // writeResponseFile(apiName, entry.response.content.text);
  });
  const dbres = await db.insertData(dbdata);
  // 数据插入完，console.log输出会 回调 exce 方法
  console.log(dbres);
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
    dicConfig.methodOptions = [...new Set(dicConfig.methodOptions)];
    fs.writeFileSync(
      `${DICTIONNARY_PATH}/接口关系.json`,
      JSON.stringify(dicConfig),
      "utf8"
    );
    // exec 必须有回调函数，否则不会执行
    console.log(
      JSON.stringify({
        api_status: 200,
        message: "接口关系文件已生成",
        path: `${DICTIONNARY_PATH}/接口关系.json`,
      })
    );
  } catch (err) {
    console.error(`${DICTIONNARY_PATH}/接口关系.json 错误`, err);
  }
}

function write_config() {
  try {
    fs.writeFileSync(
      `${DICTIONNARY_PATH}/接口_config.json`,
      JSON.stringify({
        fileName: harFilePath.split("-_-")[1],
        date: new Date().toLocaleString(),
      }),
      "utf8"
    );
  } catch (err) {
    console.error(`${DICTIONNARY_PATH}/接口_config.json 错误`, err);
  }
}