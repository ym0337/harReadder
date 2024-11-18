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
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "没有选择文件" });
  }
  if (req.file) {
    // 你可以在这里返回文件名和其他信息
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
  fs.readFile(
    path.join(DICTIONNARY_PATH, "接口关系.json"),
    "utf-8",
    (err, data) => {
      if (err) {
        return res.status(500).json({ error: "读取文件夹失败" });
      }
      res.status(200).json(JSON.parse(data));
    }
  );
});

router.get("/api/detail/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(RESPONSE_PATH, filename);
  if (!filename) {
    return res.status(500).json({ error: "没有对应接口json文件" });
  }
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
});

// 创建接口返回 uploadFile 文件夹中的文件信息
router.get("/files", (req, res) => {
  fs.readdir(UPLOADFILE_PATH, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "读取文件夹失败" });
    }

    const fileInfoPromises = files.map((file, index) => {
      const filePath = path.join(UPLOADFILE_PATH, file);
      return new Promise((resolve) => {
        fs.stat(filePath, (err, stats) => {
          if (err) {
            return resolve({ filename: file, error: "获取文件信息失败" });
          }

          // 格式化创建时间
          const createdAt = new Date(stats.birthtime).toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false, // 24小时制
          });
          const file_split = file.split("-_-");
          resolve({
            id: index + 1, // 序号
            key: file, // 唯一码
            filename: file_split[1], // 文件名
            createdAt: createdAt, // new Date().toLocaleString()
            path: filePath, // 文件路径
          });
        });
      });
    });

    Promise.all(fileInfoPromises).then((fileInfo) => {
      res.status(200).json(fileInfo);
    });
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
    res.status(200).json({ message: "文件删除成功", filename: filename.split("-_-")[1] });
  });
});

// 创建执行脚本的接口
router.post("/run-script", (req, res) => {
  const { filePath } = req.body;
  exec(`node app.js --path=${filePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`执行错误: ${error}`);
      return res.status(500).json({ error: `执行错误: ${error.message}` });
    }

    if (stderr) {
      console.error(`标准错误: ${stderr}`);
      return res.status(500).json({ error: `标准错误: ${stderr}` });
    }
    console.log(`标准输出: ${stdout}`);
    const output = JSON.parse(stdout);
    if ((output.api_status = 200)) {
      const ext = path.extname(output.path);
      fs.readFile(output.path, "utf-8", (err, data) => {
        if (err) {
          return res.status(500).json({ error: "读取文件失败" });
        }
        try {
          res.status(200).json(JSON.parse(data)); // 返回 JSON 文件的内容
        } catch (error) {
          res.status(500).json({ error: "解析 JSON 失败" });
        }
      });
    } else {
      res.status(500).json({ error: "执行失败" });
    }
  });
});

module.exports = router;
