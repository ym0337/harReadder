const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process'); // 引入child_process模块
const path = require('path');

// 启动Node.js服务器
const serverProcess = spawn('node', ['server.js'], {
  cwd: __dirname, // 设置工作目录为当前目录
  stdio: 'inherit', // 将子进程的输出直接打印到控制台
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 加载Node.js服务器
  mainWindow.loadURL('http://localhost:3011'); // 假设服务器运行在3000端口

  // 打开开发者工具
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    serverProcess.kill(); // 关闭服务器进程
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 处理服务器进程错误
serverProcess.on('error', (err) => {
  console.error('服务器启动失败:', err);
});

// 处理服务器进程退出
serverProcess.on('close', (code) => {
  console.log(`服务器进程已退出，退出码: ${code}`);
});
