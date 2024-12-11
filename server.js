const express = require("express");
const fs = require("fs");
const path = require("path");
// const { exec } = require("child_process");
const cors = require("cors"); // 引入 cors
const { isValidJson } = require("./utils/utils.js");
const db = require("./SQLite/db.js");

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

// 必须放到最后一个路由，否则会影响到正常的路由(结果发现并不会，但是注释还是放着)
app.get("/Main", (req, res) => {
  res.sendFile(path.join(__dirname, "build_web", "index.html"));
});

// 穷举所有请求路径;
app.get("*", (req, res) => {
  if (!req.path) {
    res.status(500).json({ message: `没有 ${req.path} 路径的接口` });
  }
  returnJson(req.path, res);
});

app.post("*", (req, res) => {
  if (!req.path) {
    res.status(500).json({ message: `没有 ${req.path} 路径的接口` });
  }
  returnJson(req.path, res);
});

app.put("*", (req, res) => {
  if (!req.path) {
    res.status(500).json({ message: `没有 ${req.path} 路径的接口` });
  }
  returnJson(req.path, res);
});

app.delete("*", (req, res) => {
  if (!req.path) {
    res.status(500).json({ message: `没有 ${req.path} 路径的接口` });
  }
  returnJson(req.path, res);
});

app.patch("*", (req, res) => {
  if (!req.path) {
    res.status(500).json({ message: `没有 ${req.path} 路径的接口` });
  }
  returnJson(req.path, res);
});

app.head("*", (req, res) => {
  if (!req.path) {
    res.status(500).json({ message: `没有 ${req.path} 路径的接口` });
  }
  returnJson(req.path, res);
});

app.options("*", (req, res) => {
  if (!req.path) {
    res.status(500).json({ message: `没有 ${req.path} 路径的接口` });
  }
  returnJson(req.path, res);
});

function returnJson(reqPath, res) {
  db.all(
    "SELECT content FROM network_response WHERE path = ? order by id desc limit 1", // limit 1：此子句限制了查询结果的返回条数为 1。这意味着查询只会返回排序后的第一条记录，也就是 id 值最大的那一条记录。
    [reqPath],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err || "获取数据失败" });
      }
      const isJson = isValidJson(rows[0].content)
      if (!isJson) {
        res.status(200).send(rows[0].content);
      } else {
        res.status(200).json(JSON.parse(rows[0].content));
      }
    }
  );
}

// let config;

// try {
//   const configFile = fs.readFileSync(
//     path.join(DICTIONNARY_PATH, "接口关系.json"),
//     "utf-8"
//   );
//   // 解析 JSON 配置文件
//   config = isValidJson(configFile) ? JSON.parse(configFile) : { data: [] };
// } catch (error) {
//   console.error("读取配置文件失败:", error);
//   process.exit(1); // 读取配置失败，退出程序
// }

// 读取文件并返回 JSON
// const readFileAndRespond = (filePath, res) => {
//   const ext = path.extname(filePath);
//   fs.readFile(filePath, "utf-8", (err, data) => {
//     if (err) {
//       return res.status(500).json({ error: "读取文件失败" });
//     }
//     try {
//       if (ext === ".json") {
//         res.json(JSON.parse(data)); // 返回 JSON 文件的内容
//       } else if (ext === ".txt") {
//         res.type("text/plain").send(data); // 返回纯文本文件的内容
//       } else {
//         res.status(400).json({ error: "不支持的文件类型" });
//       }
//     } catch (error) {
//       res.status(500).json({ error: "解析 JSON 失败" });
//     }
//   });
// };

// 根据配置生成接口
// config.data.forEach((apiconfig) => {
//   const { method, path, apiName } = apiconfig;
//   const lowerMethod = method.toLowerCase();
//   try {
//     if (!lowerMethod) {
//       console.log('\x1b[31m%s\x1b[0m', `method 有问题: ${lowerMethod}`);
//       return;
//     }
//     app[lowerMethod](path, (req, res) => {
//       readFileAndRespond(`${RESPONSE_PATH}/${apiName}`, res);
//     });
//   } catch (error) {
//     console.log('\x1b[31m%s\x1b[0m', `根据配置生成接口失败:${error}`);
//   }

// console.log(`注册接口: ${method} ${path} => ${apiName}`);
// if (lowerMethod === "get") {
//   app.get(path, (req, res) => {
//     readFileAndRespond(`${RESPONSE_PATH}/${apiName}`, res);
//   });
// } else if (lowerMethod === "post") {
//   app.post(path, (req, res) => {
//     readFileAndRespond(`${RESPONSE_PATH}/${apiName}`, res);
//   });
// }
// });

app.get("*", (req, res) => {
  console.log(`请求路径: ${req.path},没有找到，可能需要重启server.js`);
  res.status(404).send(
    `请求路径: ${req.path} 没有找到; \n 
      1.可能没有执行对应的har文件; \n
      2.可能需要重启server.js 或执行 npm run server`
  );
});

// 启动服务器
app.listen(PORT, () => {
  console.log(
    "\x1b[35m%s\x1b[0m",
    `服务器已启动，前端页面访问 http://localhost:${PORT}`
  );
  // 使用 child_process 打开浏览器
  // const start = process.platform === "win32" ? "start" : "open";
  // exec(`${start} http://localhost:${PORT}`); // 打开浏览器
});

/**
console.log('\x1b[31m%s\x1b[0m', '这是红色文字'); // 红色文字
console.log('\x1b[32m%s\x1b[0m', '这是绿色文字'); // 绿色文字
console.log('\x1b[33m%s\x1b[0m', '这是黄色文字'); // 黄色文字
console.log('\x1b[34m%s\x1b[0m', '这是蓝色文字'); // 蓝色文字
console.log('\x1b[35m%s\x1b[0m', '这是紫色文字'); // 紫色文字
console.log('\x1b[36m%s\x1b[0m', '这是青色文字'); // 青色文字
console.log('\x1b[37m%s\x1b[0m', '这是白色文字'); // 白色文字
*/
