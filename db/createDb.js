const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 获取当前目录的子目录 "data" 路径
const dbPath = path.join(__dirname, 'data', 'mydb.db');

// 创建数据库并指定路径
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database created or opened successfully at', dbPath);
  }
});

// 创建一个 "users" 表
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER NOT NULL
)`, (err) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Table "users" created successfully!');
  }
});

// 插入单条数据
// const stmt = db.prepare('INSERT INTO users (name, age) VALUES (?, ?)');

// // 插入一行数据
// stmt.run('Alice', 30);
// stmt.run('Bob', 25);
// stmt.run('Charlie', 35);

// stmt.finalize(); // 完成插入操作


// 插入多条数据
const insertData = db.prepare('INSERT INTO users (name, age) VALUES (?, ?)');

insertData.run('David', 40);
insertData.run('Eva', 28);
insertData.finalize();
