# Quiz 提交管家

一个面向教师的本地 Quiz 提交管理工具，用于管理学生名单、收集作业文件、统计提交状态和批量给分。项目默认只在本机运行，不需要区分教师端和学生端。

## 主要功能

- 创建、切换和删除 Quiz
- 手动添加学生，或通过 XLSX 批量导入学生名单
- 按姓名或学号进行部分搜索
- 上传图片、PDF、Word、Excel、PPT、TXT、RTF 等文件
- 单次最多上传 20 个文件，单个文件最大 25 MB，总计最大 100 MB
- 按 `Quiz 名称 / 学号 / 作业文件` 保存附件
- 统计已交、迟交和未交人数
- 按学号或更新时间排列学生明细
- 按提交状态筛选后进行一键给分
- 将当前 Quiz 导出为 ZIP，内含统计表和按学号整理的作业文件夹
- 自定义本机作业保存路径

## 本地网页版

### 环境要求

- Windows 10 或 Windows 11
- Node.js 18 或更高版本

### 启动方法

进入 `outputs/quiz-local`，双击 `启动-Quiz工具.bat`。

浏览器访问：<http://127.0.0.1:4321/>

运行期间请保留命令行窗口；关闭窗口后本地服务会停止。

## 导入学生名单

仅支持 `.xlsx` 文件，格式要求如下：

- A1 必须为“学号”
- B1 必须为“姓名”
- 学号列应设置为文本格式
- 学号不可重复
- 一次最多导入 1000 人

网页中的导入窗口提供了可直接下载的模板。

## 数据保存与隐私

网页版的名单、Quiz、分数、提交状态和附件路径保存在：

`outputs/quiz-local/data/state.json`

实际作业文件保存在网页中选择的根目录下：

`保存根目录 / Quiz名称 / 学号 / 作业文件`

`outputs/quiz-local/data/` 已加入 `.gitignore`，不会提交到 Git 仓库。实际作业目录通常位于项目之外，也不会随源码上传。

本项目的服务仅监听 `127.0.0.1`，不会主动把学生数据或作业上传到互联网。

## 封装桌面程序

桌面版使用 Electron。首次打包需要在 `desktop` 目录安装依赖：

```powershell
cd desktop
npm install
npm run dist
```

生成的 Windows 便携版位于 `outputs/quiz-desktop`。

桌面版运行后，会在程序所在目录创建 `Quiz数据` 文件夹，用于保存名单、分数、提交记录和桌面配置。升级程序时只替换 EXE，不要删除 `Quiz数据`。

只分享 EXE 不会包含现有学生数据；如果同时分享 `Quiz数据` 或作业保存目录，则会包含相应记录或作业文件。

## 项目结构

```text
outputs/quiz-local/   本地网页版及数据服务
desktop/              Electron 桌面封装配置
src/                  托管版本服务代码
db/、drizzle/         托管版本数据结构
scripts/              构建脚本
```

## 开发检查

修改后可以运行：

```powershell
node --check outputs/quiz-local/server.mjs
node --check outputs/quiz-local/public/app.js
```
