import * as vscode from "vscode";
import { IconManager } from "../utils/iconManager";
import { loadProjects, getFolderConfig } from "../utils/common";
import type { TreeItem, ProjectItem, FolderItem } from "../types/project";

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

    // 监听配置变化，更新树视图
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(() => {
        this._onDidChangeTreeData.fire(undefined);
      })
    );
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    // 处理文件夹项
    if ("type" in element && element.type === "folder") {
      const treeItem = new vscode.TreeItem(
        element.name,
        vscode.TreeItemCollapsibleState.Collapsed
      );
      treeItem.contextValue = "folderItem";
      
      // 设置文件夹图标
      if (element.icon) {
        const iconPath = this.iconManager.getFolderIconPath(
          element.icon,
          this.configFile
        );
        if (iconPath) {
          treeItem.iconPath = {
            light: vscode.Uri.file(iconPath),
            dark: vscode.Uri.file(iconPath),
          };
        } else {
          // 图标文件不存在，使用默认图标
          treeItem.iconPath = new vscode.ThemeIcon("folder");
        }
      } else {
        // 没有自定义图标，使用默认文件夹图标
        treeItem.iconPath = new vscode.ThemeIcon("folder");
      }
      
      return treeItem;
    }

    // 处理项目项
    // 修改项目项的图标设置部分
    const project = element as ProjectItem;
    const treeItem = new vscode.TreeItem(
      project.name,
      vscode.TreeItemCollapsibleState.None
    );
    treeItem.id = project.id;

    // 根据配置决定是否显示项目路径
    const showPath = vscode.workspace
      .getConfiguration("betterProjectManager")
      .get("showProjectPath", true);
    if (showPath) {
      treeItem.description = project.path;
    }

    // 修改图标设置 - 如果有自定义图标则使用，否则使用VSCode的code图标
    if (project.icon) {
      const iconPath = this.iconManager.getProjectIconPath(
        project,
        this.configFile
      );
      if (iconPath) {
        treeItem.iconPath = {
          light: vscode.Uri.file(iconPath),
          dark: vscode.Uri.file(iconPath),
        };
      } else {
        // 否则 可能存在以外的问题 例如图标文件不存在
        vscode.window.showErrorMessage(
          `无法找到项目 ${project.name} 的图标文件`
        );
      }
    } else {
      // 判断配置 是否显示默认项目图标
      const showDefaultIcon = vscode.workspace
        .getConfiguration("betterProjectManager")
        .get("showDefaultProjectIcon", true);

      if (showDefaultIcon) {
        treeItem.iconPath = new vscode.ThemeIcon("code");
      }
    }

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
      // 返回文件夹内的项目（按名称升序排序）
      const sorted = [...element.projects].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      return Promise.resolve(sorted);
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

    // 创建文件夹项，并加载文件夹配置（包括图标）
    const folders: FolderItem[] = [];
    folderMap.forEach((folderProjects, folderName) => {
      // 获取文件夹配置以获取图标信息
      const folderConfig = getFolderConfig(folderName, this.configFile);
      folders.push({
        name: folderName,
        type: "folder",
        icon: folderConfig?.icon,
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
