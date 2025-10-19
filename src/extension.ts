// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";

interface ProjectItem {
  name: string;
  path: string;
  icon: string;
}

let CONFIG_FILE: string;

function loadProjects(): ProjectItem[] {
  try {
    const fs = require("fs");
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {}
  return [];
}

function saveProjects(projects: ProjectItem[]) {
  const fs = require("fs");
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(projects, null, 2), "utf8");
}

class ProjectTreeProvider implements vscode.TreeDataProvider<ProjectItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    ProjectItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private context: vscode.ExtensionContext) {}

  getTreeItem(element: ProjectItem): vscode.TreeItem {
    const iconPath = path.join(
      vscode.extensions.getExtension(this.context.extension.id)!.extensionPath,
      "resources",
      element.icon
    );
    // 修改为全局目录
    const globalIconPath = path.join(
      CONFIG_FILE ? path.dirname(CONFIG_FILE) : "",
      element.icon
    );
    const treeItem = new vscode.TreeItem(
      element.name,
      vscode.TreeItemCollapsibleState.None
    );
    treeItem.description = element.path;
    treeItem.iconPath = {
      light: vscode.Uri.file(globalIconPath),
      dark: vscode.Uri.file(globalIconPath),
    };
    treeItem.command = {
      command: "project-manager.openProject",
      title: "打开项目",
      arguments: [element],
    };
    treeItem.contextValue = "projectItem";
    return treeItem;
  }

  getChildren(): Thenable<ProjectItem[]> {
    const projects = loadProjects();
    return Promise.resolve(projects.length ? projects : []);
  }

  refresh() {
    this._onDidChangeTreeData.fire(undefined);
  }
}

export function activate(context: vscode.ExtensionContext) {
  // 修改配置文件路径为 VSCode 全局存储目录
  CONFIG_FILE = path.join(
    context.globalStorageUri.fsPath,
    "project-manager.json"
  );

  const provider = new ProjectTreeProvider(context);
  vscode.window.registerTreeDataProvider("numberListView", provider);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "project-manager.openProject",
      async (item: ProjectItem) => {
        const uri = vscode.Uri.file(item.path);
        vscode.commands.executeCommand("vscode.openFolder", uri, true);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "project-manager.renameProject",
      async (item: ProjectItem) => {
        const projects = loadProjects();
        const idx = projects.findIndex((p) => p.path === item.path);
        if (idx === -1) {
          return;
        }
        const newName = await vscode.window.showInputBox({
          prompt: "输入新的项目名称",
          value: item.name,
        });
        if (newName && newName.trim() && newName !== item.name) {
          projects[idx].name = newName.trim();
          saveProjects(projects);
          provider.refresh();
        }
      }
    )
  );

  // 添加项目命令
  context.subscriptions.push(
    vscode.commands.registerCommand("project-manager.addProject", async () => {
      const name = await vscode.window.showInputBox({
        prompt: "输入项目名称",
      });
      if (!name || !name.trim()) {
        return;
      }

      const folderUri = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: "选择项目文件夹",
      });
      if (!folderUri || folderUri.length === 0) {
        return;
      }

      const iconUri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { SVG: ["svg"] },
        openLabel: "选择项目图标（SVG）",
      });
      if (!iconUri || iconUri.length === 0) {
        return;
      }

      // 将SVG图标复制到全局目录
      const fs = require("fs");
      const iconSrc = iconUri[0].fsPath;
      const iconName = path.basename(iconSrc);
      const globalDir = path.dirname(CONFIG_FILE);
      const iconDest = path.join(globalDir, iconName);
      if (!fs.existsSync(globalDir)) {
        fs.mkdirSync(globalDir, { recursive: true });
      }
      fs.copyFileSync(iconSrc, iconDest);

      const projects = loadProjects();
      projects.push({
        name: name.trim(),
        path: folderUri[0].fsPath,
        icon: iconName,
      });
      saveProjects(projects);
      provider.refresh();
    })
  );

  // 注册删除项目命令
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "project-manager.deleteProject",
      async (item: ProjectItem) => {
        const projects = loadProjects();
        const idx = projects.findIndex((p) => p.path === item.path);
        if (idx === -1) {
          return;
        }
        const confirm = await vscode.window.showWarningMessage(
          `确定要删除项目 "${item.name}" 吗？`,
          { modal: true },
          "删除"
        );
        if (confirm === "删除") {
          projects.splice(idx, 1);
          saveProjects(projects);
          provider.refresh();
        }
      }
    )
  );

  // 注册修改项目图标命令
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "project-manager.changeIcon",
      async (item: ProjectItem) => {
        const iconUri = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          filters: { SVG: ["svg"] },
          openLabel: "选择新的项目图标（SVG）",
        });
        if (!iconUri || iconUri.length === 0) {
          return;
        }
        const fs = require("fs");
        const iconSrc = iconUri[0].fsPath;
        const iconName = path.basename(iconSrc);
        const globalDir = path.dirname(CONFIG_FILE);
        const iconDest = path.join(globalDir, iconName);
        if (!fs.existsSync(globalDir)) {
          fs.mkdirSync(globalDir, { recursive: true });
        }
        fs.copyFileSync(iconSrc, iconDest);

        const projects = loadProjects();
        const idx = projects.findIndex((p) => p.path === item.path);
        if (idx === -1) {
          return;
        }
        projects[idx].icon = iconName;
        saveProjects(projects);
        provider.refresh();
      }
    )
  );
}

export function deactivate() {}
