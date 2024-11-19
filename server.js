const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const cors = require("cors"); // 引入 cors

const { DICTIONNARY_PATH, RESPONSE_PATH } = require("./config/const.js");

const harRoutes = require("./routes/har.js");

const app = express();
const PORT = 3011;

// 解析 JSON 请求体
app.use(express.json());
// 使用 CORS 中间件
app.use(cors());
// 路由
app.use("/har", harRoutes);

// 全局捕获异常
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("服务器错误");
});

// 指定静态文件目录为 build
app.use(express.static(path.join(__dirname, "build_web")));

// 必须放到最后一个路由，否则会影响到正常的路由
app.get("/Main", (req, res) => {
  res.sendFile(path.join(__dirname, "build_web", "index.html"));
});

let config;

try {
  config = JSON.parse(
    fs.readFileSync(path.join(DICTIONNARY_PATH, "接口关系.json"), "utf-8")
  );
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

  if (lowerMethod === "get") {
    app.get(path, (req, res) => {
      readFileAndRespond(`${RESPONSE_PATH}/${apiName}`, res);
    });
  } else if (lowerMethod === "post") {
    app.post(path, (req, res) => {
      readFileAndRespond(`${RESPONSE_PATH}/${apiName}`, res);
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动，访问 http://localhost:${PORT}`);
  // 使用 child_process 打开浏览器
  const start = process.platform === "win32" ? "start" : "open";
  exec(`${start} http://localhost:${PORT}`);
});
