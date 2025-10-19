import * as vscode from "vscode";
import { IconManager } from "./iconManager";
import { loadProjects } from "./common";

/**
 * 项目树提供器
 */
export class ProjectTreeProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    TreeItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private iconManager: IconManager;

  constructor(
    private context: vscode.ExtensionContext,
    private configFile: string
  ) {
    this.iconManager = new IconManager(context);
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    // 处理文件夹项
    if ("type" in element && element.type === "folder") {
      const treeItem = new vscode.TreeItem(
        element.name,
        vscode.TreeItemCollapsibleState.Collapsed
      );
      treeItem.contextValue = "folderItem";
      return treeItem;
    }

    // 处理项目项
    const project = element as ProjectItem;
    const iconPath = this.iconManager.getProjectIconPath(
      project,
      this.configFile
    );

    const treeItem = new vscode.TreeItem(
      project.name,
      vscode.TreeItemCollapsibleState.None
    );

    treeItem.description = project.path;
    treeItem.iconPath = {
      light: vscode.Uri.file(iconPath),
      dark: vscode.Uri.file(iconPath),
    };
    treeItem.command = {
      command: "project-manager.openProject",
      title: "打开项目",
      arguments: [project],
    };
    treeItem.contextValue = "projectItem";

    return treeItem;
  }

  getChildren(element?: TreeItem): Thenable<TreeItem[]> {
    if (element && "type" in element && element.type === "folder") {
      // 返回文件夹内的项目
      return Promise.resolve(element.projects);
    }

    // 返回顶级项目和文件夹
    const projects = loadProjects(this.configFile);

    // 按文件夹分组项目
    const folderMap = new Map<string, ProjectItem[]>();
    const rootProjects: ProjectItem[] = [];

    projects.forEach((project) => {
      if (project.folder) {
        if (!folderMap.has(project.folder)) {
          folderMap.set(project.folder, []);
        }
        folderMap.get(project.folder)?.push(project);
      } else {
        rootProjects.push(project);
      }
    });

    // 创建文件夹项
    const folders: FolderItem[] = [];
    folderMap.forEach((folderProjects, folderName) => {
      folders.push({
        name: folderName,
        type: "folder",
        projects: folderProjects,
      });
    });

    // 按名称排序
    folders.sort((a, b) => a.name.localeCompare(b.name));
    rootProjects.sort((a, b) => a.name.localeCompare(b.name));

    // 合并文件夹和根项目
    return Promise.resolve([...folders, ...rootProjects]);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
}
