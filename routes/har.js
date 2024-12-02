const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { exec } = require("child_process"); // 引入 child_process 模块
const {
  UPLOADFILE_PATH,
  DICTIONNARY_PATH,
  RESPONSE_PATH,
} = require("../config/const.js");
const { generateUniqueCode } = require("../utils/utils.js");
const db = require("../SQLite/db.js");

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

router.get("/config", (req, res) => {
  fs.readFile(
    path.join(DICTIONNARY_PATH, "接口_config.json"),
    "utf-8",
    (err, data) => {
      if (err) {
        return res.status(500).json({ error: "读取文件夹失败" });
      }
      res.status(200).json(JSON.parse(data));
    }
  );
});

// 创建上传接口
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "没有选择文件" });
  }
  if (req.file) {
    // 你可以在这里返回文件名和其他信息
    const dbres = await db.insertData({
      tableName: "save_files",
      sqlData: [
        {
          filename: req.file.originalname, // 返回文件名
          path: req.file.path, // 返回文件路径
          key: req.file.filename, // 唯一码
          createdAt: new Date().toLocaleString(), // 上传时间
        },
      ],
    });
    return res.status(200).json({
      message: "文件上传成功",
      filename: req.file.filename.split("-_-")[1] || req.file.filename, // 返回文件名
      path: req.file.path, // 返回文件路径
    });
  }
  return res.status(400).json({ message: "文件上传失败" });
});

// 返回接口json数据
router.get("/api/info", (req, res) => {
  db.all("SELECT * FROM network_response", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err || "获取数据失败" });
    }
    res.status(200).json({
      code: 200,
      message: "获取数据成功",
      data: rows,
      methodOptions: [],
    });
  });
});

router.get("/api/detail/:id", async (req, res) => {
  const id = req.params.id;
  db.all("SELECT content FROM network_response WHERE id = ?", [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err || "获取数据失败" });
    }
    res.status(200).json(JSON.parse(rows[0].content));
  });
});

// 创建接口返回 uploadFile 文件夹中的文件信息
router.get("/files", (req, res) => {
  db.all("SELECT * FROM save_files", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err || "获取数据失败" });
    }
    res.status(200).json(rows);
  });
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
          message: "文件删除成功",
          filename: filename.split("-_-")[1],
        });
      }
    });
  });
});

// 创建执行脚本的接口
router.post("/run-script", (req, res) => {
  const { filePath } = req.body;
  exec(`node app_sqlite.js --path=${filePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`node app.js执行错误: ${error}`);
      return res.status(500).json({ error: `执行错误: ${error.message}` });
    }

    if (stderr) {
      console.error(`node app.js标准错误: ${stderr}`);
      return res.status(500).json({ error: `node app.js标准错误: ${stderr}` });
    }
    console.log(`node app.js执行完成: ${stdout}`);
    const output = JSON.parse(stdout);
    if (output.success) {
      res.status(200).json({ message: "执行成功" });
    } else {
      res.status(500).json({ error: "执行失败" });
    }
  });
});

module.exports = router;
