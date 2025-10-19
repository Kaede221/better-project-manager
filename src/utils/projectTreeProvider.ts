import * as vscode from "vscode";
import { IconManager } from "../utils/iconManager";
import { loadProjects } from "../utils/common";

/**
 * 项目树提供器
 */
export class ProjectTreeProvider
  implements vscode.TreeDataProvider<ProjectItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    ProjectItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private iconManager: IconManager;

  constructor(
    private context: vscode.ExtensionContext,
    private configFile: string
  ) {
    this.iconManager = new IconManager(context);
  }

  getTreeItem(element: ProjectItem): vscode.TreeItem {
    const iconPath = this.iconManager.getProjectIconPath(
      element,
      this.configFile
    );

    const treeItem = new vscode.TreeItem(
      element.name,
      vscode.TreeItemCollapsibleState.None
    );

    treeItem.description = element.path;
    treeItem.iconPath = {
      light: vscode.Uri.file(iconPath),
      dark: vscode.Uri.file(iconPath),
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
    const projects = loadProjects(this.configFile);
    return Promise.resolve(projects.length ? projects : []);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
}
