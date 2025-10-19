import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

/**
 * 图标管理器
 */
export class IconManager {
  private defaultIconPath: string;

  constructor(private context: vscode.ExtensionContext) {
    // 默认图标路径
    this.defaultIconPath = path.join(
      vscode.extensions.getExtension(this.context.extension.id)!.extensionPath,
      "resources",
      "icon-default-project.svg"
    );
  }

  /**
   * 获取项目图标路径
   * @param project 项目项
   * @param configFile 配置文件路径
   * @returns 图标路径
   */
  getProjectIconPath(project: ProjectItem, configFile: string): string {
    // 项目自定义图标路径（全局目录）
    const globalIconPath = project.icon
      ? path.join(configFile ? path.dirname(configFile) : "", project.icon)
      : "";

    // 判断自定义图标是否存在
    return project.icon && fs.existsSync(globalIconPath)
      ? globalIconPath
      : this.defaultIconPath;
  }

  /**
   * 复制图标到全局目录
   * @param iconSrc 源图标路径
   * @param configFile 配置文件路径
   * @returns 图标文件名
   */
  copyIconToGlobal(iconSrc: string, configFile: string): string {
    const iconName = path.basename(iconSrc);
    const globalDir = path.dirname(configFile);
    const iconDest = path.join(globalDir, iconName);

    if (!fs.existsSync(globalDir)) {
      fs.mkdirSync(globalDir, { recursive: true });
    }

    fs.copyFileSync(iconSrc, iconDest);
    return iconName;
  }

  /**
   * 检查图标文件是否存在
   * @param iconPath 图标路径
   * @returns 是否存在
   */
  iconExists(iconPath: string): boolean {
    return fs.existsSync(iconPath);
  }
}
