const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// 获取当前目录的子目录 "data" 路径
const dbPath = path.join(__dirname, "data", "harReader.db");

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
  console.log("创建network_response表: db.js");
  db.run(
    `CREATE TABLE IF NOT EXISTS network_response (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      fullpath TEXT NOT NULL,
      apiName TEXT NOT NULL,
      dictPath TEXT NOT NULL,
      fileName TEXT NOT NULL,
      date TEXT NOT NULL,
      content TEXT NOT NULL
    )`,
    (err) => {
      if (err) {
        console.error("创建 network_response 表失败:", err);
      } else {
        console.log('创建 network_response 表成功');
      }
    }
  );
});

// 插入数据的函数
function insertData(method, path, fullpath, apiName, dictPath, fileName, date, content) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO network_response (method, path, fullpath, apiName, dictPath, fileName, date, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [method, path, fullpath, apiName, dictPath, fileName, date, content],
      (err) => {
        if (err) {
          console.error("Error inserting data:", err);
          reject(err);
        } else {
          console.log("Data inserted successfully!");
          resolve(true);
        }
      }
    );
  });
}

// 更新数据的函数
function updateData(id, method, path, fullpath, apiName, dictPath, fileName, date, content) {
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
    db.run(
      "DELETE FROM network_response WHERE id = ?",
      [id],
      (err) => {
        if (err) {
          console.error("Error deleting data:", err);
          reject(err);
        } else {
          console.log("Data deleted successfully!");
          resolve(true);
        }
      }
    );
  });
}

// 查询数据的函数
function queryData({ apiName, date }) {
  return new Promise((resolve, reject) => {
    let query = "SELECT * FROM network_response";
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
db.updateData = updateData;  // 导出更新数据的函数
db.deleteData = deleteData;  // 导出删除数据的函数
db.queryData = queryData;

// 导出数据库对象
module.exports = db;
