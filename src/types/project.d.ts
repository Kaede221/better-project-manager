/**
 * 项目项
 */
export interface ProjectItem {
  id: string;
  name: string;
  path: string;
  icon?: string;
  folder?: string;
}

/**
 * 文件夹项
 */
export interface FolderItem {
  name: string;
  type: "folder";
  projects: ProjectItem[];
}

/**
 * 树项（可以是项目或文件夹）
 */
export type TreeItem = ProjectItem | FolderItem;
