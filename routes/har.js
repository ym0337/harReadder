const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { generateUniqueCode, isValidJson } = require("../utils/utils.js");
// const { exec } = require("child_process"); // 引入 child_process 模块
const { UPLOADFILE_PATH } = require("../config/const.js");
const db = require("../SQLite/db.js");
const { PORT } = require("../config/const.js");

// 设置上传文件的保存路径
if (!fs.existsSync(UPLOADFILE_PATH)) {
  fs.mkdirSync(UPLOADFILE_PATH);
}

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADFILE_PATH); // 文件保存路径
  },
  filename: (req, file, cb) => {
    // 对文件名进行编码，防止中文文件名乱码
    const originalName = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    ); // 处理中文编码
    const safeName = originalName.replace(/[\s]+/g, "_"); // 可选：替换文件名中的空格为下划线
    const uniqueCode = generateUniqueCode(16); // 生成唯一码
    const safeNameWithCode = `${uniqueCode}-_-${safeName}`; // 组合文件名
    cb(null, safeNameWithCode);
  },
});

const upload = multer({ storage: storage });

// 创建登录接口
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  res.status(200).json({
    code: 200,
    message: "登录成功",
    data: {
      username,
      password,
    },
  });
});

// 创建上传接口
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "没有选择文件" });
  }
  try {
    // 你可以在这里返回文件名和其他信息
    const dbres = await db.insertData({
      tableName: "save_files",
      sqlData: [
        {
          filename: Buffer.from(req.file.originalname, "latin1").toString(
            "utf8"
          ), // 处理中文编码,乱码
          path: req.file.path, // 返回文件路径
          key: req.file.filename, // 唯一码
          size: req.file.size || 0, // 文件大小
          createdAt: new Date().toLocaleString(), // 上传时间
        },
      ],
    });
    return res.status(200).json({
      message: "文件上传成功",
      filename: req.file.filename.split("-_-")[1] || req.file.filename, // 返回文件名
      path: req.file.path, // 返回文件路径
    });
  } catch (error) {
    return res.status(400).json({ message: error || "文件上传失败" });
  }
});

// 返回接口json数据
router.get("/api/info", (req, res) => {
  const { pageNo = 1, pageSize = 10, method, path, originfile } = req.query;
  // console.log(pageNo,pageSize,method,path)
  let params = [];
  // 构建查询条件
  const conditions = [];
  if (method) {
    conditions.push("method = ?");
    params.push(method);
  }
  if (path) {
    conditions.push("path LIKE ? COLLATE NOCASE");
    params.push(`%${path}%`);
  }
  if (originfile) {
    conditions.push("originfile LIKE ? COLLATE NOCASE");
    params.push(`%${originfile}%`);
  }
  let whereSql = "";
  if (conditions.length > 0) {
    whereSql = "WHERE " + conditions.join(" AND ");
  }
  const offsetSize = (pageNo - 1) * pageSize;
  const sql = `SELECT id, method, path, fullpath, originfile, createdate, queryString, postData FROM network_response 
    ${whereSql} 
    order by createdate desc, id desc 
    LIMIT ${pageSize} OFFSET ${offsetSize};`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err || "获取数据失败" });
    }
    const _methodOptions = [];
    rows = rows.map((row, index) => {
      row.no = offsetSize + index + 1;
      row.localFullPath = `http://localhost:${PORT}${row.path}${row.queryString}`;
      _methodOptions.push(row.method);
      return row;
    });

    // 查询总数
    db.get(
      `SELECT COUNT(*) as total FROM network_response ${whereSql} ;`,
      params,
      (err, total) => {
        if (err) {
          console.error("获取总数失败:", err);
          return res.status(500).json({ error: err || "获取总数失败" });
        }
        res.status(200).json({
          code: 200,
          message: "获取数据成功",
          total: total.total,
          data: rows,
          methodOptions: [...new Set(_methodOptions)],
        });
      }
    );
  });
});

router.get("/api/detail/:id", async (req, res) => {
  const id = req.params.id;
  db.all(
    "SELECT content FROM network_response WHERE id = ? order by createdate desc, id desc",
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err || "获取数据失败" });
      }
      const isJson = isValidJson(rows[0].content);
      if (!isJson) {
        return res.status(200).send(rows[0].content);
      } else {
        res.status(200).json(JSON.parse(rows[0].content));
      }
    }
  );
});

router.get("/myApi/detail/:id", async (req, res) => {
  const id = req.params.id;
  db.all(
    "SELECT content FROM my_api_resquest WHERE id = ? order by createdate desc, id desc",
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err || "获取数据失败" });
      }
      const isJson = isValidJson(rows[0].content);
      if (!isJson) {
        return res.status(200).send(rows[0].content);
      } else {
        res.status(200).json(JSON.parse(rows[0].content));
      }
    }
  );
});

// 创建接口返回 uploadFile 文件夹中的文件信息
router.get("/files", (req, res) => {
  db.all(
    "SELECT * FROM save_files order by createdAt desc, id desc",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err || "获取数据失败" });
      }
      rows = rows.map((row, index) => {
        row.no = index + 1;
        return row;
      });
      res.status(200).json(rows);
    }
  );
});

// 创建删除文件的接口
router.delete("/files/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOADFILE_PATH, filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.status(404).json({ error: "文件不存在" });
      }
      return res.status(500).json({ error: "删除文件失败" });
    }
    // 删除用户数据
    db.run("DELETE FROM save_files WHERE key = ?", [filename], function (err) {
      if (err) {
        console.error("删除数据失败:", err);
        return res.status(500).json({ error: err || "删除文件失败" });
      } else {
        console.log(`Deleted ${this.changes} row(s)`);
        res.status(200).json({
          message: `文件删除成功 ${this.changes}`,
          filename: filename.split("-_-")[1],
        });
      }
    });
  });
});

// 删除生成的接口路径
router.delete("/apisbykey/:key", (req, res) => {
  const key = req.params.key;
  db.run("DELETE FROM network_response WHERE key = ?", [key], function (err) {
    if (err) {
      console.error("删除数据失败:", err);
      return res.status(500).json({ error: err || "删除数据失败" });
    } else {
      console.log(`Deleted ${this.changes} row(s)`);
      res.status(200).json({
        message: `成功删除${this.changes}条数据`,
        key: key,
      });
    }
  });
});

// 更新系统配置，是否匹配传参
router.post("/config/allowParameterTransmission", (req, res) => {
  const allow = req.body.allow || false;
  if (typeof allow !== "boolean") {
    return res.status(400).json({ error: "allow参数必须为布尔值" });
  }
  db.run(
    "UPDATE server_config SET config = ? WHERE id = (SELECT id FROM server_config ORDER BY id DESC LIMIT 1)",
    [JSON.stringify({ allowParameterTransmission: allow })],
    function (err) {
      if (err) {
        console.error("Error updating data:", err);
        return res.status(500).json({ error: "更新配置失败", success: false });
      } else {
        res
          .status(200)
          .json({ message: "更新配置成功", success: true, data: allow });
      }
    }
  );
});

// 更新系统配置，是否匹配传参
router.get("/config/server", (req, res) => {
  db.all(
    "SELECT config FROM server_config ORDER BY id DESC LIMIT 1",
    [],
    function (err, rows) {
      if (err) {
        console.error("获取服务配置失败:", err);
        return res
          .status(500)
          .json({ error: "获取服务配置失败", success: false });
      } else {
        const config = JSON.parse(rows[0].config);
        res.status(200).json({
          message: "获取服务配置成功",
          success: true,
          config: { allow: config.allowParameterTransmission },
        });
      }
    }
  );
});

// 创建执行脚本的接口
router.post("/run-script", async (req, res) => {
  const { filePath, key, filename } = req.body;
  console.log(filePath);
  // 读取 HAR 文件
  fs.readFile(filePath, "utf8", async (err, data) => {
    if (err) {
      console.error("读取文件失败:", err);
      return res.status(500).json({ message: "读取文件失败: " + err });
    }
    try {
      // 解析 HAR 数据
      const harData = JSON.parse(data);
      const dbres = await processHarEntries({
        entries: harData.log.entries,
        key,
        filename,
      });
      const changes = JSON.parse(dbres);
      res.status(200).json({
        message: `${filename} 执行成功，新增 ${changes.count} 条数据`,
      });
    } catch (parseError) {
      console.error("解析 JSON 失败:", parseError);
      res.status(500).json({ message: "解析 JSON 失败:" + parseError });
    }
  });
});

async function processHarEntries({ entries, key, filename }) {
  const dbdata = [];
  // 插入多条数据
  entries.forEach((entry) => {
    const url = new URL(entry.request.url);
    // if(entry.request.method === 'GET'){
    //   console.log(url.search)
    // }
    dbdata.push({
      method: entry.request.method,
      path: url.pathname,
      fullpath: url.href,
      originfile: filename,
      createdate: new Date().toLocaleString(),
      content: entry.response.content.text,
      key: key,
      queryString: url.search || "", // sqlite没有数组类型，所以用字符串代替
      postData: entry.request?.postData?.text || "",
    });
  });
  const dbres = await db.insertData({
    tableName: "network_response",
    sqlData: dbdata,
  });
  console.log("dbres", dbres);
  return dbres;
}

// 新增自定义接口
router.post("/myApi/add", async (req, res) => {
  const { method, path, active, postData, content, mark="" } = req.body;
  let queryString = "",
    newPath = path;
  // 使用正则表达式将键名加上双引号
  if (method === "GET" && path.includes("?")) {
    const pathArr = path.split("?");
    newPath = pathArr[0];
    queryString = pathArr[1];
  }
  let newContent = content;
  let newPostData = postData;
  const jsonContent = content.replace(/(\w+):/g, '"$1":');
  const jsonPostData = postData.replace(/(\w+):/g, '"$1":');
  // 解析为对象
  try {
    // 解析 JSON 字符串
    const obj = JSON.parse(jsonContent);
    // console.log(obj);
    newContent = JSON.stringify(obj);
  } catch (error) {
    console.error("content 解析 JSON 失败:", error);
  }
  try {
    // 解析 JSON 字符串
    const obj = JSON.parse(jsonPostData);
    // console.log(obj);
    newPostData = JSON.stringify(obj);
  } catch (error) {
    console.error("postData 解析 JSON 失败:", error);
  }
  const dbdata = {
    method,
    path: newPath,
    active: active === true ? "1" : "0",
    content: newContent,
    queryString: queryString ? `?${queryString}` : "",
    postData: newPostData,
    createdate: new Date().toLocaleString(),
    mark,
  };
  const dbres = await db.insertData({
    tableName: "my_api_resquest",
    sqlData: [dbdata],
  });
  console.log("dbres", dbres);
  res.status(200).json({
    message: "新增接口成功",
    data: dbdata,
  });
});

// 获取自定义接口列表
router.get("/myApi/list", async (req, res) => {
  const { pageNo = 1, pageSize = 10, method, path, active } = req.query;
  let params = [];
  // 构建查询条件
  const conditions = [];
  if (method) {
    conditions.push("method = ?");
    params.push(method);
  }
  if (path) {
    conditions.push("path LIKE ? COLLATE NOCASE");
    params.push(`%${path}%`);
  }
  // if (active !== undefined) {
  //   conditions.push("active = ?");
  //   params.push(active === "true");
  // }
  let whereSql = "";
  if (conditions.length > 0) {
    whereSql = "WHERE " + conditions.join(" AND ");
  }
  const offsetSize = (pageNo - 1) * pageSize;
  const sql = `SELECT id, method, path, active, content, queryString, postData, createdate, mark FROM my_api_resquest 
    ${whereSql} 
    order by createdate desc, id desc 
    LIMIT ${pageSize} OFFSET ${offsetSize};`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err || "获取数据失败" });
    }
    const _methodOptions = [];
    rows = rows.map((row, index) => {
      row.no = offsetSize + index + 1;
      row.path = row.path + (row.queryString ? row.queryString : "");
      row.active = row.active === "1" ? "激活" : "禁用";
      _methodOptions.push(row.method);
      return row;
    });

    // 查询总数
    db.get(
      `SELECT COUNT(*) as total FROM my_api_resquest ${whereSql} ;`,
      params,
      (err, total) => {
        if (err) {
          console.error("获取总数失败:", err);
          return res.status(500).json({ error: err || "获取总数失败" });
        }
        res.status(200).json({
          code: 200,
          message: "获取数据成功",
          total: total.total,
          data: rows,
          methodOptions: [...new Set(_methodOptions)],
        });
      }
    );
  });
});

// 删除自定义接口
router.delete("/myApi/delete/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM my_api_resquest WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("删除自定义接口失败:", err);
      return res.status(500).json({ error: err || "删除自定义接口失败" });
    } else {
      console.log(`删除自定义接口成功 ${this.changes} row(s)`);
      res.status(200).json({
        message: `删除自定义接口成功: ${this.changes} 个`,
        success: true,
      });
    }
  });
});

// 更新自定义接口
router.put("/myApi/update", async (req, res) => {
  const { id, method, path, active, postData, content, mark } = req.body;
  let queryString = "",
    newPath = path;
  // 使用正则表达式将键名加上双引号
  if (method === "GET" && path.includes("?")) {
    const pathArr = path.split("?");
    newPath = pathArr[0];
    queryString = pathArr[1];
  }
  let newContent = content;
  let newPostData = postData;
  const jsonContent = content.replace(/(\w+):/g, '"$1":');
  const jsonPostData = postData.replace(/(\w+):/g, '"$1":');
  // 解析为对象
  try {
    // 解析 JSON 字符串
    const obj = JSON.parse(jsonContent);
    // console.log(obj);
    newContent = JSON.stringify(obj);
  } catch (error) {
    console.error("content 解析 JSON 失败:", error);
  }
  try {
    // 解析 JSON 字符串
    const obj = JSON.parse(jsonPostData);
    // console.log(obj);
    newPostData = JSON.stringify(obj);
  } catch (error) {
    console.error("postData 解析 JSON 失败:", error);
  }
  const dbdata = {
    method,
    path: newPath,
    active: active === true ? "1" : "0",
    content: newContent,
    queryString: queryString ? `?${queryString}` : "",
    postData: newPostData,
    mark,
  };
  const dbres = await db.updateData({
    tableName: "my_api_resquest",
    sqlData: [dbdata],
    condition: { id },
  });
  console.log("dbres", dbres);
  res.status(200).json({
    message: "更新接口成功",
    data: dbdata,
  });
});

module.exports = router;
