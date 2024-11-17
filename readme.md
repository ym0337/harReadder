## 把浏览器保存的 .har 文件转换成 .json 文件再转为本地接口数据

### nodejs 版本 v18.17.0, v18.17.1

### 目录

```
项目根目录/ # (建议英文路径)
├── har-reader-server/  # 后端代码 https://github.com/ym0337/harReadder.git
└── har-reader-web/ # 前端代码 https://github.com/ym0337/har-reader-web.git
```

- 1.把前后端代码都放在同一个文件夹下，后端代码改名为 `har-reader-server`(主要是方便前端打包自动部署路径)
- 2.进入 `har-reader-web` 目录，安装依赖 `npm install`
- 3.在 `har-reader-web` 目录下，运行 `npm run build:web` 打包前端代码到 `har-reader-server`目录下的`build_web/`文件夹下
- 4.在 `har-reader-server` 目录下，安装依赖 `npm install`
- 5.在 `har-reader-server` 目录下，运行 `npm run server` 会自动打开网页