# Project Manager

一个用于管理多个项目的 VS Code 扩展。通过这个扩展，你可以轻松地添加、组织和快速访问你的项目。

## 功能特性

- **项目管理**：添加、重命名、删除项目
- **快速访问**：一键打开项目文件夹
- **自定义图标**：为项目设置自定义 SVG 图标
- **持久化存储**：项目信息保存在 VS Code 全局存储中
- **实时同步**：配置文件更改时自动刷新视图

## 安装

1. 在 VS Code 中，打开扩展面板 (Ctrl+Shift+X)
2. 搜索 "Project Manager"
3. 点击安装

或者从 VS Code Marketplace 下载并安装。

## 使用方法

安装扩展后，你可以在活动栏中找到项目管理器图标。

### 添加项目

1. 点击 "+" 图标或使用命令面板中的 "Project Manager: Add Project"
2. 输入项目名称
3. 选择项目文件夹
4. （可选）选择 SVG 图标文件

### 打开项目

- 在项目列表中点击项目名称，或右键选择 "Open Project"

### 管理项目

- **重命名项目**：右键点击项目，选择 "Rename Project"
- **更改图标**：右键点击项目，选择 "Change Icon"
- **删除项目**：右键点击项目，选择 "Delete Project"
- **编辑配置**：使用命令面板中的 "Project Manager: Edit Config" 直接编辑配置文件

## 配置

项目信息存储在 VS Code 全局存储目录中的 `project-manager.json` 文件中。该文件采用 JSON 格式，包含项目名称、路径和图标信息。

## 开发

### 先决条件

- Node.js (推荐使用 LTS 版本)
- VS Code Extension Development Kit

### 构建和运行

1. 克隆仓库
2. 安装依赖：`npm install`
3. 按 `F5` 启动调试实例

### 构建

运行 `npm run compile` 编译 TypeScript 代码。

### 测试

运行 `npm test` 执行测试。

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

[请添加许可证信息]

## 发布说明

### 1.0.0

初始版本
- 项目管理基本功能
- 自定义图标支持