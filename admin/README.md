# Hugo 博客管理后台

轻量级本地图形化管理后台，用于管理 Hugo 博客的文章、项目和关于页面。

## 功能特性

- 📝 **文章管理** - 创建、编辑、删除文章
- 🚀 **项目页面** - 管理项目展示页面
- 👤 **关于页面** - 管理个人介绍页面
- 👁️ **实时预览** - Markdown 编辑器带预览功能
- 💾 **即时保存** - 一键保存到本地文件

## 快速开始

### 1. 安装依赖

```bash
cd admin
npm install
```

### 2. 启动服务

```bash
npm start
```

### 3. 访问管理后台

打开浏览器访问: `http://localhost:3000/admin`

## 使用说明

### 文章管理

1. 点击「新建文章」创建新文章
2. 填写标题、日期、标签等信息
3. 在编辑器中使用 Markdown 编写内容
4. 点击「预览」查看渲染效果
5. 点击「保存」保存文章

### 项目页面 / 关于页面

1. 在侧边栏切换到对应页面
2. 直接编辑内容
3. 点击「保存」

## Git 工作流建议

1. **创建新分支**（推荐）
   ```bash
   git checkout -b feature/new-post
   ```

2. **使用管理后台创建/编辑内容**

3. **预览效果**
   ```bash
   cd ..
   hugo server
   # 访问 http://localhost:1313 查看效果
   ```

4. **提交更改**
   ```bash
   git add content/
   git commit -m "Add new post: 文章标题"
   git push origin feature/new-post
   ```

5. **合并到主分支**
   ```bash
   git checkout main
   git merge feature/new-post
   git push origin main
   ```

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 HTML + CSS + JavaScript
- **Markdown 解析**: front-matter

## 注意事项

⚠️ 此管理后台设计为**本地运行**，请勿部署到公网！

- 删除操作不可恢复（但有 Git 版本控制）
- 建议在使用前创建 Git 分支进行测试
- 确保 `content/` 目录有读写权限

## 目录结构

```
admin/
├── server.js          # Express 服务器
├── package.json       # 依赖配置
├── README.md          # 使用说明
└── public/
    ├── index.html     # 管理界面
    ├── css/
    │   └── style.css  # 样式文件
    └── js/
        └── app.js     # 前端逻辑
```
