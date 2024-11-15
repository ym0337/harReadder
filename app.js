const fs = require("fs");
const path = require("path");

const dictPath = path.join(__dirname,"dictionnary");

const dicConfig = {
  code: 200,
  message: "对照关系",
  data: [],
};

// 读取 HAR 文件
fs.readFile("./har/www.bilibili.com.har", "utf8", (err, data) => {
  if (err) {
    console.error("读取文件失败:", err);
    return;
  }

  try {
    // 解析 HAR 数据
    const harData = JSON.parse(data);

    // 输出 HAR 数据
    // console.log(harData);

    // 你可以在这里处理 HAR 文件中的内容
    // 比如输出某些请求的信息
    let count = 0;
    harData.log.entries.forEach((entry) => {
      // console.log("Request URL:", entry.request.url);
      // console.log("Request URL:", entry.request.url.split("//")[1]);
      // console.log("Response:", entry.response.content);
      const apiName =  `接口_${count}.json`;
      dicConfig.data.push({
        url: entry.request.url.split("//")[1],
        apiName: apiName,
      });
      // 创建文件并写入内容
      fs.writeFileSync(`${__dirname}/response/${apiName}`, entry.response.content.text, "utf8");
      count++;
    });
    fs.writeFile(`${dictPath}/接口关系.json`, JSON.stringify(dicConfig), "utf8", (err) => {
      if (err) {
        console.error(`${dictPath}/接口.json 错误`, err);
      } else {
        console.log(`${dictPath}/接口.json 创建成功`);
      }
    });
  } catch (parseError) {
    console.error("解析 JSON 失败:", parseError);
  }
});
