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
      content TEXT
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
  ],
  save_files: ["filename", "key", "path", "size", "createdAt"],
};

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

// 更新数据的函数
function updateData(
  id,
  method,
  path,
  fullpath,
  apiName,
  dictPath,
  fileName,
  date,
  content
) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE network_response SET 
        method = ?, 
        path = ?, 
        fullpath = ?, 
        apiName = ?, 
        dictPath = ?, 
        fileName = ?, 
        date = ?, 
        content = ? 
      WHERE id = ?`,
      [method, path, fullpath, apiName, dictPath, fileName, date, content, id],
      (err) => {
        if (err) {
          console.error("Error updating data:", err);
          reject(err);
        } else {
          console.log("Data updated successfully!");
          resolve(true);
        }
      }
    );
  });
}

// 删除数据的函数
function deleteData(id) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM network_response WHERE id = ?", [id], (err) => {
      if (err) {
        console.error("Error deleting data:", err);
        reject(err);
      } else {
        console.log("Data deleted successfully!");
        resolve(true);
      }
    });
  });
}

// 查询数据的函数
function queryData({ tableName = "", id = "" }) {
  return new Promise((resolve, reject) => {
    let query = "SELECT * FROM network_response order by createdate desc, id desc";
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
db.updateData = updateData; // 导出更新数据的函数
db.deleteData = deleteData; // 导出删除数据的函数
db.queryData = queryData;

// 导出数据库对象
module.exports = db;
