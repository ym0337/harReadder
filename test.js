const fs = require('fs');

// 需要追加写入的文件名
const filename = './example.txt';
// 需要写入的内容
const content = '这是追加写入的内容。\n';

// 使用 fs.appendFile() 方法追加写入内容
fs.appendFile(filename, content, (err) => {
    if (err) {
        console.error('追加写入失败:', err);
    } else {
        console.log('追加写入成功！');
    }
});
