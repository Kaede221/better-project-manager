import * as vscode from "vscode";
import type { ProjectItem, TreeItem, FolderItem } from "../types/project";
import { loadProjects, saveProjects } from "../utils/common";

/**
 * 项目树 DnD 控制器
 */
export class ProjectTreeDragAndDropController
  implements vscode.TreeDragAndDropController<TreeItem>
{
  public readonly dropMimeTypes = [
    "application/vnd.code.tree.betterProjectManagerSidebar",
  ];
  public readonly dragMimeTypes = [
    "application/vnd.code.tree.betterProjectManagerSidebar",
  ];
  public readonly id = "ProjectTreeDragAndDropController";

  constructor(private configFile: string, private onDataChange: () => void) {}

  /**
   * 查找项目在指定文件夹（或根目录）中的最后插入位置
   * @param projects 项目列表
   * @param folderName 文件夹名称，undefined 表示根目录
   * @returns 插入位置索引
   */
  private findLastInsertIndex(
    projects: ProjectItem[],
    folderName: string | undefined
  ): number {
    let lastIdx = projects.length;
    for (let i = 0; i < projects.length; ++i) {
      if (folderName === undefined) {
        // 根目录：查找没有 folder 属性的项目
        if (!projects[i].folder) {
          lastIdx = i + 1;
        }
      } else {
        // 指定文件夹：查找属于该文件夹的项目
        if (projects[i].folder === folderName) {
          lastIdx = i + 1;
        }
      }
    }
    return lastIdx;
  }

  /**
   * 将项目移动到指定文件夹
   * @param projects 项目列表
   * @param draggedProject 被拖拽的项目
   * @param targetFolder 目标文件夹名称，undefined 表示根目录
   * @returns 更新后的项目列表
   */
  private moveProjectToFolder(
    projects: ProjectItem[],
    draggedProject: ProjectItem,
    targetFolder: string | undefined
  ): ProjectItem[] {
    // 设置新的文件夹归属
    draggedProject.folder = targetFolder;
    
    // 从原位置移除
    const filteredProjects = projects.filter((p) => p.id !== draggedProject.id);
    
    // 找到插入位置并插入
    const insertIdx = this.findLastInsertIndex(filteredProjects, targetFolder);
    filteredProjects.splice(insertIdx, 0, draggedProject);
    
    return filteredProjects;
  }

  /**
   * 判断目标是否为文件夹
   */
  private isFolder(target: TreeItem): target is FolderItem {
    return "type" in target && target.type === "folder";
  }

  async handleDrop(
    target: TreeItem | undefined,
    sources: vscode.DataTransfer,
    _token: vscode.CancellationToken,
    _dropTargetLocation?: "before" | "after" | "on"
  ): Promise<void> {
    const data = sources.get(
      "application/vnd.code.tree.betterProjectManagerSidebar"
    );
    if (!data) {
      return;
    }
    
    let draggedIds: string[];
    try {
      draggedIds = JSON.parse(await data.asString());
    } catch {
      return;
    }

    // 读取现有项目
    let projects: ProjectItem[] = loadProjects(this.configFile);

    // 多选仅处理首个
    const draggedId = draggedIds[0];
    if (!draggedId) {
      return;
    }
    
    // 找到拖拽项目
    const draggedProject = projects.find((p) => p.id === draggedId);
    if (!draggedProject) {
      return;
    }

    // 目标处理
    if (target && this.isFolder(target)) {
      // 目标为文件夹，把项目移动到该文件夹
      projects = this.moveProjectToFolder(projects, draggedProject, target.name);
    } else if (!target) {
      // 拖到空白，移动到根目录
      projects = this.moveProjectToFolder(projects, draggedProject, undefined);
    } else if ("id" in target) {
      // 拖动到项目上：将拖拽的项目移动到目标项目所属的文件夹下
      const targetProject = target as ProjectItem;
      
      if (targetProject.id === draggedId) {
        // 自身不处理
        return;
      }
      
      // 移动到目标项目所在的文件夹
      projects = this.moveProjectToFolder(
        projects,
        draggedProject,
        targetProject.folder
      );
    }

    // 保存到配置文件
    saveProjects(projects, this.configFile);
    // 通知刷新
    this.onDataChange();
  }

  handleDrag(
    source: readonly TreeItem[],
    dataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    // 只允许拖动 ProjectItem
    const ids = source
      .filter((item) => "id" in item)
      .map((item) => (item as ProjectItem).id);
    dataTransfer.set(
      "application/vnd.code.tree.betterProjectManagerSidebar",
      new vscode.DataTransferItem(JSON.stringify(ids))
    );
  }

  dispose(): void {} // 必须实现
}
