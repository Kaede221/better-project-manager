import * as vscode from "vscode";
import * as path from "path";

import { ProjectTreeProvider } from "./utils/projectTreeProvider";
import { CommandHandlers } from "./utils/commandHandlers";
import { FileWatcher } from "./utils/fileWatcher";

// 记录配置文件信息
let CONFIG_FILE: string = "";
let treeProvider: ProjectTreeProvider | undefined;
let commandHandlers: CommandHandlers | undefined;
let fileWatcher: FileWatcher | undefined;

export function activate(context: vscode.ExtensionContext) {
  // 修改配置文件路径为 VSCode 全局存储目录
  CONFIG_FILE = path.join(
    context.globalStorageUri.fsPath,
    "project-manager.json"
  );

  // 初始化树提供器
  treeProvider = new ProjectTreeProvider(context, CONFIG_FILE);
  vscode.window.registerTreeDataProvider("numberListView", treeProvider);

  // 初始化命令处理器
  commandHandlers = new CommandHandlers(context, CONFIG_FILE, treeProvider);

  // 初始化文件监视器
  fileWatcher = new FileWatcher();
  const watcher = fileWatcher.createConfigWatcher(CONFIG_FILE, () => {
    treeProvider?.refresh();
  });

  // 注册命令
  registerCommands(context, commandHandlers);

  // 将监视器添加到订阅中
  context.subscriptions.push(watcher);
}

/**
 * 注册所有命令
 */
function registerCommands(
  context: vscode.ExtensionContext,
  handlers: CommandHandlers
): void {
  const commands = [
    {
      command: "project-manager.openProject",
      handler: handlers.handleOpenProject.bind(handlers),
    },
    {
      command: "project-manager.renameProject",
      handler: handlers.handleRenameProject.bind(handlers),
    },
    {
      command: "project-manager.addProject",
      handler: handlers.handleAddProject.bind(handlers),
    },
    {
      command: "project-manager.deleteProject",
      handler: handlers.handleDeleteProject.bind(handlers),
    },
    {
      command: "project-manager.changeIcon",
      handler: handlers.handleChangeIcon.bind(handlers),
    },
    {
      command: "project-manager.editConfig",
      handler: handlers.handleEditConfig.bind(handlers),
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
