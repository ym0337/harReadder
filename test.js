// const fs = require('fs');

// // 需要追加写入的文件名
// const filename = './example.txt';
// // 需要写入的内容
// const content = '这是追加写入的内容。\n';

// // 使用 fs.appendFile() 方法追加写入内容
// fs.appendFile(filename, content, (err) => {
//     if (err) {
//         console.error('追加写入失败:', err);
//     } else {
//         console.log('追加写入成功！');
//     }
// });

const urls = [
  "http://localhost:3011/har/files?no=1",
  "http://localhost:3011/har/files?no=2",
  "http://localhost:3011/har/files?no=3",
  "http://localhost:3011/har/files?no=4",
  "http://localhost:3011/har/files?no=5",
  "http://localhost:3011/har/files?no=6",
  "http://localhost:3011/har/files?no=7",
  "http://localhost:3011/har/files?no=8",
];

const http = require("http");

let curCount = 0;
function getAction(url) {
  const options = {
    heades: {
      Authorization: "Bearer your_token_here",
    },
  };
  http
    .get(url, options, (resp) => {
      let data = "";
      // 当接收到数据块时，将其添加到"data"变量中
      resp.on("data", (chunk) => {
        data += chunk;
      });

      // 当响应结束时，打印出完整的响应数据
      resp.on("end", () => {
        curCount++;
        console.log(`已完成 ${curCount}: ${url},`, JSON.parse(data));
        if (curCount < urls.length) {
          getAction(urls[curCount]);
        }
      });
    })
    .on("error", (err) => {
      console.log("Error: " + err.message);
    });
}

// 调用接口
getAction(urls[curCount]);
