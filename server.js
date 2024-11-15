const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// 解析 JSON 请求体
app.use(express.json());

// 读取配置文件
const configPath = path.join(__dirname, "dictionnary", "接口关系.json");
const apiPath = path.join(__dirname, "response");
let config;

try {
  config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
} catch (error) {
  console.error("读取配置文件失败:", error);
  process.exit(1); // 读取配置失败，退出程序
}

// 读取文件并返回 JSON
const readFileAndRespond = (filePath, res) => {
  const ext = path.extname(filePath);
  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "读取文件失败" });
    }
    try {
      if (ext === ".json") {
        res.json(JSON.parse(data)); // 返回 JSON 文件的内容
      } else if (ext === ".txt") {
        res.type("text/plain").send(data); // 返回纯文本文件的内容
      } else {
        res.status(400).json({ error: "不支持的文件类型" });
      }
    } catch (error) {
      res.status(500).json({ error: "解析 JSON 失败" });
    }
  });
};

// 根据配置生成接口
config.data.forEach((apiconfig) => {
  const { method, path, apiName } = apiconfig;
  const lowerMethod = method.toLowerCase();
  const apiUrl = `/${path}`;

  if (lowerMethod === "get") {
    app.get(apiUrl, (req, res) => {
      readFileAndRespond(`${apiPath}/${apiName}`, res);
    });
  } else if (lowerMethod === "post") {
    app.post(apiUrl, (req, res) => {
      readFileAndRespond(`${apiPath}/${apiName}`, res);
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
