const express = require("express");
const fs = require("fs");
const path = require("path");
// const { exec } = require("child_process");
const cors = require("cors"); // 引入 cors
const {
  isValidJson,
  isEqualAsObject,
  queryStringToObject,
  isObject,
} = require("./utils/utils.js");
const db = require("./SQLite/db.js");
// 端口
const { PORT } = require("./config/const.js");

const harRoutes = require("./routes/har.js");

const app = express();

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
  // console.log(req.query);
  returnJson({ req, res, method: "GET" });
});

app.post("*", (req, res) => {
  if (!req.path) {
    res.status(500).json({ message: `没有 ${req.path} 路径的接口` });
  }
  // console.log(req.body);
  returnJson({ req, res, method: "POST" });
});

app.put("*", (req, res) => {
  if (!req.path) {
    res.status(500).json({ message: `没有 ${req.path} 路径的接口` });
  }
  returnJson({ req, res, method: "PUT" });
});

app.delete("*", (req, res) => {
  if (!req.path) {
    res.status(500).json({ message: `没有 ${req.path} 路径的接口` });
  }
  returnJson({ req, res, method: "DELETE" });
});

app.patch("*", (req, res) => {
  if (!req.path) {
    res.status(500).json({ message: `没有 ${req.path} 路径的接口` });
  }
  returnJson({ req, res, method: "PATCH" });
});

app.head("*", (req, res) => {
  if (!req.path) {
    res.status(500).json({ message: `没有 ${req.path} 路径的接口` });
  }
  returnJson({ req, res, method: "HEAD" });
});

app.options("*", (req, res) => {
  if (!req.path) {
    res.status(500).json({ message: `没有 ${req.path} 路径的接口` });
  }
  returnJson({ req, res, method: "OPTIONS" });
});

async function returnJson({ req, res, method }) {
  // server_config表中获取配置，判断是否需要匹配传参
  const serverConfig = await new Promise((resolve, reject) => {
    db.get("SELECT * FROM server_config order by id desc LIMIT 1", (err, row) => {
      if (err) {
        console.error(err);
        // 默认不匹配传参
        reject({allowParameterTransmission: false});
      } else {
        // console.log(row);
        resolve(JSON.parse(row.config) || row);
      }
    });
  });
  console.log(serverConfig)
  const reqPath = req.path;
  console.log(`${method} 请求路径: ${reqPath}`);
  // 只有 GET 和 POST 请求并且传参为对象时才会匹配查询条件
  const canDiff = method === "GET" || method === "POST";
  const params2 = method === "GET" ? req.query : method === "POST" ? req.body : null;
  if (!serverConfig.allowParameterTransmission || !canDiff || !isObject(params2)) {
    console.log(`没有查询条件，返回最新数据`);
    db.all(
      "SELECT content FROM network_response WHERE path = ? order by id desc limit 1", // limit 1：此子句限制了查询结果的返回条数为 1。这意味着查询只会返回排序后的第一条记录，也就是 id 值最大的那一条记录。
      [reqPath],
      (err, rows) => {
        if (err) {
          res.status(500).json({ error: err || "获取数据失败" });
        }
        try {
          const isJson = isValidJson(rows[0].content);
          if (!isJson) {
            res.status(200).send(rows[0].content);
          } else {
            res.status(200).json(JSON.parse(rows[0].content));
          }
        } catch (error) {
          res.status(500).json({ error: error || "获取数据失败" });
        }
      }
    );
  } else {
    console.log("需要配置传参");
    db.all(
      "SELECT method, content, queryString, postData FROM network_response WHERE path = ? order by id desc", // limit 1：此子句限制了查询结果的返回条数为 1。这意味着查询只会返回排序后的第一条记录，也就是 id 值最大的那一条记录。
      [reqPath],
      (err, rows) => {
        if (err) {
          res.status(500).json({ error: err || "获取数据失败" });
        }
        const result = rows.find((row) => {
          const params1 =
            method === "GET"
              ? queryStringToObject(row.queryString)
              : JSON.parse(row.postData);

          if(params1.t && params2.t){
            // 认为是时间戳,需要忽略掉
            delete params1.t;
            delete params2.t;
          }
          return isEqualAsObject(params1, params2);
        });
        try {
          const isJson = isValidJson(result.content);
          if (!isJson) {
            res.status(200).send(result.content);
          } else {
            res.status(200).json(JSON.parse(result.content));
          }
        } catch (error) {
          res.status(500).json({ error: error || "获取数据失败" });
        }
      }
    );
  }
}

// app.get("*", (req, res) => {
//   console.log(`请求路径: ${req.path},没有找到，可能需要重启server.js`);
//   res.status(404).send(
//     `请求路径: ${req.path} 没有找到; \n
//       1.可能没有执行对应的har文件; \n
//       2.可能需要重启server.js 或执行 npm run server`
//   );
// });

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
