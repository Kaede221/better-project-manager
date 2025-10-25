import * as vscode from "vscode";
import type { ProjectItem, TreeItem } from "../types/project";
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

  async handleDrop(
    target: TreeItem | undefined,
    sources: vscode.DataTransfer,
    token: vscode.CancellationToken,
    dropTargetLocation?: "before" | "after" | "on"
  ): Promise<void> {
    const data = sources.get(
      "application/vnd.code.tree.betterProjectManagerSidebar"
    );
    if (!data) {
      return;
    }
    const draggedIds: string[] = JSON.parse(await data.asString());

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
    let isTargetFolder = false;
    let targetFolderName: string | undefined = undefined;
    let targetProjectId: string | undefined = undefined;

    // 兼容 target 类型
    if (target) {
      if ("type" in target && (target as any).type === "folder") {
        isTargetFolder = true;
        targetFolderName = (target as any).name;
      } else if ("id" in target) {
        targetProjectId = (target as ProjectItem).id;
        // 放到目标项目的当前位置（before/after/on），需要 dropTargetLocation 判断
      }
    }

    // 目标为文件夹，把项目移动到该文件夹
    if (isTargetFolder) {
      // 移动到目标文件夹（始终添加到文件夹末尾）
      draggedProject.folder = targetFolderName;
      projects = projects.filter((p) => p.id !== draggedId);
      // 找出该文件夹最后一个项目插入点
      let lastIdx = projects.length;
      for (let i = 0; i < projects.length; ++i) {
        if (projects[i].folder === targetFolderName) {
          lastIdx = i + 1;
        }
      }
      projects.splice(lastIdx, 0, draggedProject);
    } else if (!target) {
      // 拖到空白，移动到根末尾
      draggedProject.folder = undefined;
      projects = projects.filter((p) => p.id !== draggedId);
      // 根项目段末尾
      let lastIdx = projects.length;
      for (let i = 0; i < projects.length; ++i) {
        if (projects[i].folder) {
          continue;
        }
        lastIdx = i + 1;
      }
      projects.splice(lastIdx, 0, draggedProject);
    } else if (targetProjectId) {
      // 拖动到“项目”上：将拖拽的项目移动到目标项目所属的文件夹下
      // 若目标项目在根目录，则移动到根目录
      if (targetProjectId === draggedId) {
        // 自身不处理
        return;
      }
      const targetProject = projects.find((p) => p.id === targetProjectId);
      if (!targetProject) {
        return;
      }

      const targetFolder = targetProject.folder; // 可能为 undefined（根目录）
      // 先从原位置移除
      projects = projects.filter((p) => p.id !== draggedId);
      // 设置新归属文件夹
      draggedProject.folder = targetFolder;

      if (targetFolder) {
        // 插入到该文件夹末尾
        let lastIdx = projects.length;
        for (let i = 0; i < projects.length; ++i) {
          if (projects[i].folder === targetFolder) {
            lastIdx = i + 1;
          }
        }
        projects.splice(lastIdx, 0, draggedProject);
      } else {
        // 插入到根目录末尾
        let lastIdx = projects.length;
        for (let i = 0; i < projects.length; ++i) {
          if (projects[i].folder) {
            continue;
          }
          lastIdx = i + 1;
        }
        projects.splice(lastIdx, 0, draggedProject);
      }
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
