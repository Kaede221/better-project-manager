import * as vscode from "vscode";
import * as path from "path";

import { CommandHandlers } from "./handlers";
import { ProjectTreeProvider } from "./providers";

import { FileWatcher } from "./utils/fileWatcher";

// 记录文件监视器, 方便后端关闭的时候清理资源
let fileWatcher: FileWatcher | undefined;

// 激活
export function activate(context: vscode.ExtensionContext) {
  // 修改配置文件路径为 VSCode 全局存储目录
  const configFile = path.join(
    context.globalStorageUri.fsPath,
    "project-manager.json"
  );

  // 初始化树提供器
  const treeProvider = new ProjectTreeProvider(context, configFile);
  vscode.window.registerTreeDataProvider(
    "betterProjectManagerSidebar",
    treeProvider
  );

  // 初始化命令处理器
  const commandHandlers = new CommandHandlers(
    context,
    configFile,
    treeProvider
  );

  // 初始化文件监视器
  fileWatcher = new FileWatcher();
  const watcher = fileWatcher.createConfigWatcher(configFile, () => {
    treeProvider?.refresh();
  });

  // 统一注册命令
  registerCommands(context, commandHandlers);

  // 将监视器添加到订阅中
  context.subscriptions.push(watcher);
}

/**
 * NOTE 注册所有命令
 */
function registerCommands(
  context: vscode.ExtensionContext,
  handlers: CommandHandlers
): void {
  const commands = [
    {
      // NOTE 打开项目
      command: "project-manager.openProject",
      handler: handlers.handleOpenProject.bind(handlers),
    },
    {
      // NOTE 在当前窗口打开项目
      command: "project-manager.openProjectInCurrentWindow",
      handler: handlers.handleOpenProjectInCurrentWindow.bind(handlers),
    },
    {
      // NOTE 在新窗口打开项目
      command: "project-manager.openProjectInNewWindow",
      handler: handlers.handleOpenProjectInNewWindow.bind(handlers),
    },
    {
      // NOTE 重命名项目
      command: "project-manager.renameProject",
      handler: handlers.handleRenameProject.bind(handlers),
    },
    {
      // NOTE 添加新的项目
      command: "project-manager.addProject",
      handler: handlers.handleAddProject.bind(handlers),
    },
    {
      // NOTE 删除项目
      command: "project-manager.deleteProject",
      handler: handlers.handleDeleteProject.bind(handlers),
    },
    {
      // NOTE 修改项目图标
      command: "project-manager.changeIcon",
      handler: handlers.handleChangeIcon.bind(handlers),
    },
    {
      command: "project-manager.removeProjectIcon",
      handler: handlers.handleRemoveProjectIcon.bind(handlers),
    },
    {
      // NOTE 修改配置文件
      command: "project-manager.editConfig",
      handler: handlers.handleEditConfig.bind(handlers),
    },
    {
      // NOTE 移动项目到文件夹
      command: "project-manager.moveProjectToFolder",
      handler: handlers.handleMoveProjectToFolder.bind(handlers),
    },
    {
      // NOTE 重命名文件夹
      command: "project-manager.renameFolder",
      handler: handlers.handleRenameFolder.bind(handlers),
    },
    {
      // NOTE 删除文件夹
      command: "project-manager.deleteFolder",
      handler: handlers.handleDeleteFolder.bind(handlers),
    },
    {
      // NOTE 保存当前文件夹作为新的项目
      command: "project-manager.saveCurrentFolderAsProject",
      handler: handlers.handleSaveCurrentFolderAsProject.bind(handlers),
    },
  ];

  commands.forEach(({ command, handler }) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, handler)
    );
  });
}

export function deactivate() {
  // 清理资源
  if (fileWatcher) {
    fileWatcher.dispose();
  }
}
