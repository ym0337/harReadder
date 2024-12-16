const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// 创建文件夹
const folderPath = path.join(__dirname, "data");
fs.stat(folderPath, (err, stats) => {
  if (err) {
    fs.mkdirSync(folderPath);
  }
});

// 获取当前目录的子目录 "data" 路径
const dbPath = path.join(folderPath, "harReader.db");
// console.log("数据库路径:", dbPath);

// 打开数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("打开数据库失败:", err);
  } else {
    console.log("打开数据库成功", dbPath);
  }
});

// 确保数据库表存在
db.serialize(() => {
  // 网络响应表
  db.run(
    `CREATE TABLE IF NOT EXISTS network_response (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      fullpath TEXT NOT NULL,
      originfile TEXT NOT NULL,
      createdate TEXT NOT NULL,
      key TEXT NOT NULL,
      content TEXT,
      queryString TEXT,
      postData TEXT
    )`,
    (err) => {
      if (err) {
        console.error("创建 network_response 表失败:", err);
      } else {
        console.log("创建 network_response 表成功");
      }
    }
  );

  // 文件保存表
  db.run(
    `CREATE TABLE IF NOT EXISTS save_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      key TEXT NOT NULL,
      path TEXT NOT NULL,
      size INTEGER,
      createdAt TEXT NOT NULL)`,
    (err) => {
      if (err) {
        console.error("创建 save_files 表失败:", err);
      } else {
        console.log("创建 save_files 表成功");
      }
    }
  );

  // 自定义接口表
  db.run(
    `CREATE TABLE IF NOT EXISTS my_api_resquest (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      createdate TEXT NOT NULL,
      active TEXT NOT NULL,
      content TEXT,
      queryString TEXT,
      postData TEXT,
      mark TEXT
      )`,
    (err) => {
      if (err) {
        console.error("创建 my_api_resquest 表失败:", err);
      } else {
        console.log("创建 my_api_resquest 表成功");
      }
    }
  );

  // 服务配置表
  db.run(
    `CREATE TABLE IF NOT EXISTS server_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config TEXT NOT NULL
      )`,
    (err) => {
      if (err) {
        console.error("创建 server_config 表失败:", err);
      } else {
        console.log("创建 server_config 表成功");
        // 写入默认数据,默认不匹配参数传输查询
        db.run(
          `INSERT INTO server_config (config) VALUES ('{"allowParameterTransmission": true}')`,
          (err) => {
            if (err) {
              console.error("写入server_config默认配置失败:", err);
            } else {
              console.log("写入server_config默认配置成功");
            }
          }
        );
      }
    }
  );
});

const tableSql = {
  network_response: [
    "method",
    "path",
    "fullpath",
    "originfile",
    "createdate",
    "key",
    "content",
    "queryString",
    "postData",
  ],
  save_files: ["filename", "key", "path", "size", "createdAt"],
  my_api_resquest: [
    "method",
    "path",
    "active",
    "queryString",
    "postData",
    "content",
    "createdate",
    "mark"
  ],
};

// 插入sql
function insertData({ tableName = "", sqlData = [] }) {
  if (!tableName) {
    return Promise.reject("tableName不能为空");
  }
  const columns = tableSql[tableName];
  // 构建动态的插入 SQL 语句
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO ${tableName} (${columns.join(
    ","
  )}) VALUES (${placeholders})`;
  const stmt = db.prepare(sql);
  return new Promise((resolve, reject) => {
    // 开启事务
    db.run("BEGIN TRANSACTION", (err) => {
      if (err) {
        return reject("开启事务失败");
      }
      sqlData.forEach((item) => {
        // 通过 columns 按顺序提取数据并赋予占位符
        const values = columns.map((column) => item[column] || "");
        stmt.run(values);
      });
      stmt.finalize((err) => {
        if (err) {
          // console.error("数据批量插入失败:", err);
          return db.run("ROLLBACK", () => {
            reject(
              JSON.stringify({
                success: false,
                message: "准备语句关闭失败，事务已回滚: " + err,
              })
            );
          });
        }
        db.run("COMMIT", (err) => {
          if (err) {
            return reject(
              JSON.stringify({
                success: false,
                message: "提交事务失败: " + err,
              })
            );
          }
          resolve(
            JSON.stringify({
              success: true,
              message: "数据批量插入成功",
              count: sqlData.length, // 返回插入数量
            })
          );
        });
      });
    });
  });
}

// 更新sql
function updateData({ tableName = "", sqlData = [], condition = {id:''} }) {
  if (!tableName) {
    return Promise.reject("tableName不能为空");
  }
  const columns = tableSql[tableName];
  // 构建动态的插入 SQL 语句
  const sql = `UPDATE ${tableName} SET ${columns.map( col => col + ' = ? ').join(",")} WHERE id = ${condition.id}`;
  console.log(sql);
  const stmt = db.prepare(sql);
  return new Promise((resolve, reject) => {
    // 开启事务
    db.run("BEGIN TRANSACTION", (err) => {
      if (err) {
        return reject("开启事务失败");
      }
      sqlData.forEach((item) => {
        // 通过 columns 按顺序提取数据并赋予占位符
        const values = columns.map((column) => item[column] || "");
        stmt.run(values);
      });
      stmt.finalize((err) => {
        if (err) {
          // console.error("数据批量插入失败:", err);
          return db.run("ROLLBACK", () => {
            reject(
              JSON.stringify({
                success: false,
                message: "准备语句关闭失败，事务已回滚: " + err,
              })
            );
          });
        }
        db.run("COMMIT", (err) => {
          if (err) {
            return reject(
              JSON.stringify({
                success: false,
                message: "提交事务失败: " + err,
              })
            );
          }
          resolve(
            JSON.stringify({
              success: true,
              message: "数据批量插入成功",
              count: sqlData.length, // 返回插入数量
            })
          );
        });
      });
    });
  });
}

// 查询数据的函数
function queryData({ tableName = "", id = "" }) {
  return new Promise((resolve, reject) => {
    let query =
      "SELECT * FROM network_response order by createdate desc, id desc";
    let params = [];

    // 构建查询条件
    const conditions = [];
    if (apiName) {
      conditions.push("apiName = ?");
      params.push(apiName);
    }
    if (date) {
      conditions.push("date = ?");
      params.push(date);
    }

    // 如果有条件，就添加到查询中
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error("查询数据失败:", err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 关闭数据库连接
// db.close((err) => {
//   if (err) {
//     console.error("Error closing database:", err);
//   } else {
//     console.log("Database closed successfully!");
//   }
// });

db.insertData = insertData;
db.queryData = queryData;
db.updateData = updateData;

// 导出数据库对象
module.exports = db;
