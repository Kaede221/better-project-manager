/**
 * 项目项
 */
declare interface ProjectItem {
  name: string;
  path: string;
  icon?: string;
  folder?: string;
}

/**
 * 文件夹项
 */
declare interface FolderItem {
  name: string;
  type: "folder";
  projects: ProjectItem[];
}

/**
 * 树项（可以是项目或文件夹）
 */
declare type TreeItem = ProjectItem | FolderItem;
