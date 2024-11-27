const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// 获取当前目录的子目录 "data" 路径
const dbPath = path.join(__dirname, "data", "harReader.db");

// 打开数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Database created or opened successfully at", dbPath);
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
        console.error("Error creating table network_response:", err);
      } else {
        console.log('Table "network_response" created successfully!');
      }
    }
  );
});

// 插入数据的函数
function insertData(method,path,fullpath,apiName,dictPath,fileName,date,content) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO network_response (method,path,fullpath,apiName,dictPath,fileName,date,content) VALUES (?,?,?,?,?,?,?,?)",
      [method,path,fullpath,apiName,dictPath,fileName,date,content],
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

// 查询数据的函数
function queryData({apiName,date}) {
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
        console.error("Error querying data:", err);
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
// 导出插入数据的函数
module.exports = db;
